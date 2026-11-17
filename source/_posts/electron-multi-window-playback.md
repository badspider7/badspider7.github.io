---
title: Electron 多窗口通信：从窗口间发消息到回放状态同步
date: 2026-09-27 21:15:00
updated: 2026-11-10
categories: [Electron]
tags: [Electron, IPC, 多窗口, 状态同步, 回放]
index_img: https://img.badspider.top/posts/electron-multi-window-cover-v4.png
---

在 Electron 应用里，多窗口可以把图表、事件列表和回放控制放到不同页面中，同时查看同一份数据。

例如，主窗口加载记录并控制回放，曲线可以放大成独立窗口，事件窗口跟随播放时间定位，编辑窗口保存内容后通知列表刷新。用户在子窗口里的操作，也需要反过来影响主窗口。

这些需求看起来都叫“窗口通信”，实际要解决的问题不同：有的只是通知，有的必须等返回值，有的需要持续同步状态，还有的涉及大量数据分发。

这篇使用简化的示例，按主窗口到子窗口、子窗口到主窗口、子窗口到子窗口三条链路展开，再讨论状态和回放时间如何同步。接口名和模块名仅用于说明通信方式，基础实现与改进方案会分别说明。

<!-- more -->

## 1. 主进程和主窗口是两回事

Electron 的主进程创建 `BrowserWindow`、管理窗口生命周期、访问原生能力；业务上的主窗口和子窗口都是渲染端。不同窗口不共享同一个 `window`、React state 或普通 JavaScript 单例。

示例方案由窗口池创建独立的 `BrowserWindow`。这里的主、子是业务角色，不依赖 `parent` 属性；即使设置了原生父子窗口关系，也不会自动建立数据共享。

```text
主窗口页面 ── preload ──┐
曲线窗口   ── preload ──┤
日志窗口   ── preload ──┼── 主进程：窗口注册、消息路由、共享状态、流订阅
编辑窗口   ── preload ──┤
列表窗口   ── preload ──┘
```

页面通过 `window.myAPI` 调用 preload 暴露的方法，再由 preload 使用 Electron IPC。示例里的 `ee.emit()` 是当前渲染环境内的事件通知，不能直接穿过窗口边界。

先把示例里的接口对应起来：

| 需求 | 示例接口或通道 | 要解决的问题 |
| --- | --- | --- |
| 给某个窗口发通知 | `sendToWindow` / `window-message` | 找到目标并投递 |
| 向另一个窗口取数据 | `getResponseDataFromWindow` | 转发请求、关联响应、处理超时 |
| 从子窗口控制回放 | `playback:control` 或窗口请求 | 把命令交给主窗口回放组件 |
| 同步公共状态 | `getGlobalData` / `setGlobalData` | 初始快照和后续更新 |
| 向多个窗口分发数据 | `subscribe` / `stream-data` | 订阅管理和数据扇出 |

Electron 的基础组合包括 `send/on`、`invoke/handle` 和 `webContents.send`。其中 `invoke/handle` 处理的是渲染端向主进程的异步请求；如果数据在另一个窗口里，主进程还要继续转发。[Electron IPC 文档](https://www.electronjs.org/docs/latest/tutorial/ipc)

## 2. 主窗口到子窗口：定向通知

最直接的例子是回放时间联动。

回放控制器把当前回放时间发给日志窗口：

```js
window.myAPI.sendToWindow("log", {
  type: "playback.timeUpdate",
  data: {
    currentTime: playTime,
    recordRanges: this._recordRanges,
  },
});
```

`"log"` 是窗口池里的业务标识。preload 把目标和消息送到主进程：

```js
sendToWindow: (windowId, message) => {
  ipcRenderer.send("window-message", { windowId, message });
},
```

主进程的消息处理模块收到后，先按业务标识查窗口池，找不到再按 `BrowserWindow.id` 查找：

```js
ipcMain.on("window-message", (event, { windowId, message }) => {
  let targetWindow = poolManager.windowPools.get(windowId);

  if (!targetWindow) {
    targetWindow = BrowserWindow.getAllWindows().find(
      (win) => win.id.toString() === windowId.toString()
    );
  }

  if (targetWindow && !targetWindow.isDestroyed()) {
    targetWindow.webContents.send("window-message", message);
  }
});
```

日志窗口处理 `playback.timeUpdate`，更新本地播放时间，再从日志缓存中找对应位置。曲线窗口类似：主窗口发送 `updateTimeline`，放大窗口调用 `drawTimeline(timestamp)` 更新竖线。

```text
主窗口页面
  → 主窗口 preload：ipcRenderer.send
  → 主进程：ipcMain.on，查找目标
  → 子窗口 webContents.send
  → 子窗口 preload：ipcRenderer.on
  → 子窗口页面更新视图
```

这种方式适合“时间线移动到这里”“增加一条曲线”等通知。**`send` 返回不代表目标已经处理完成。** 基础实现中目标不存在就不投递，也没有成功回执；必须确认结果时，要使用请求响应机制。

## 3. 子窗口到主窗口：请求与响应

日志窗口点击某一行，希望主窗口跳到对应的记录时间，就需要知道主窗口是否接受了跳转。基础示例这样调用：

```js
await window.myAPI.getResponseDataFromWindow(2, {
  type: "controlPlayback",
  action: "seek",
  timestamp,
});
```

这里用 `2` 举例表示目标窗口 ID，并不是 Electron 规定“主窗口 ID 永远为 2”。实际应使用创建窗口时保存的 ID，或后文介绍的业务标识。

preload 使用 `invoke` 向主进程发请求：

```js
getResponseDataFromWindow: (windowId, requestData) =>
  ipcRenderer.invoke(
    "get-response-data-from-window",
    windowId,
    requestData
  ),
```

回放控制逻辑仍在主窗口页面里，主进程不能自己完成 seek。当前 handler 会创建一个 Promise，生成 `responseId`，监听 `window-response`，再向目标窗口发送：

```js
targetWindow.webContents.send("window-request", {
  responseId,
  data: requestData,
});
```

目标窗口 preload 收到请求后，将回复函数交给业务组件：

```js
onWindowRequest: (callback) => {
  ipcRenderer.on("window-request", (event, request) => {
    callback(request, (responseData) => {
      ipcRenderer.send("window-response", {
        responseId: request.responseId,
        data: responseData,
      });
    });
  });
},
```

回放组件处理 `controlPlayback`、`getPlaybackStatus`、`getCurrentPlaybackTime` 等请求。主进程收到匹配的 `responseId` 后结束等待，再把结果作为最初 `invoke` 的返回值送回子窗口。

```text
日志窗口 invoke
  → 主进程 handle
    → 主窗口 window-request
    ← 主窗口 window-response
  ← 主进程完成 Promise
日志窗口 await 得到结果
```

这里有两层请求：Electron 关联“子窗口到主进程”的调用，示例通过自定义协议用 `responseId` 关联“主进程到目标窗口”的调用。**`invoke` 不会自动等到另一个渲染窗口执行完。**

也可以把回放操作封装为专门的 `controlPlayback()`，对应 `playback:control`，固定转发给回放控制器所在窗口。封装时要完整传递 `action`、`timestamp` 等参数，并约定返回值和超时行为，避免通用接口与专用接口的语义不一致。

这套机制已有响应关联和超时清理，但还有几个改进点：

- 示例中的 `responseId` 用 `Date.now().toString()` 生成，同一毫秒内并发请求可能撞 ID，应改为 UUID 或进程内唯一计数器。
- 基础实现按响应 ID 匹配，没有同时校验回复者，应检查 `event.sender` 是否就是目标窗口的 `webContents`。
- 目标窗口中途关闭时，主要依赖超时结束等待，应监听销毁或导航，及时拒绝请求并清理。
- 基础实现中每个请求挂一个响应监听，请求增多后更适合一个统一监听加 `Map<requestId, pendingRequest>`。
- Promise 正常返回也可能携带 `{ success: false }`，调用方应检查业务结果，再更新本地 UI。

这里的“等响应”和“状态同步”都不要求阻塞渲染线程。`await invoke()` 是异步等待，没必要改用会阻塞调用方的 `sendSync()`；更不应让主进程和页面互相同步等待。[Electron IPC 文档中的同步消息说明](https://www.electronjs.org/docs/latest/tutorial/ipc#using-ipcrenderersendsync)

## 4. 子窗口到子窗口：复用同一个路由

窗口路由不需要为每一对窗口重写。

例如，编辑窗口保存一条记录成功后发送：

```js
window.myAPI.sendToWindow("record-list", {
  type: "RECORD_SAVED",
  recordId: res.data && res.data.id,
});
```

消息经过主进程，投递给窗口池中的 `"record-list"` 窗口。编辑窗口不需要持有列表窗口对象，也不需要绕到主窗口页面再转发。

```text
编辑窗口 → 主进程路由 → 列表窗口
```

如果子窗口 A 要读取子窗口 B 的数据，也可以复用 `getResponseDataFromWindow(B, request)`，请求响应流程不变。

要区分“主进程中转”和“主窗口中转”。前者管理窗口与通信，后者是具体业务页面。每条消息都经过主窗口组件，会让它逐渐变成混杂所有业务的消息中心。

当前路由兼容业务字符串和原生数字 ID，调用方容易混用。可以逐步统一业务标识：

```text
main             → 当前主窗口
log              → 日志窗口
chart-{chartId}  → 指定曲线详情窗口
editor           → 编辑窗口
record-list      → 列表窗口
```

其中 `main` 是建议补充的注册项。由主进程维护它和当前 `BrowserWindow` 的映射，页面就不必猜 `2` 到底是哪一个窗口。

## 5. 状态同步：初始快照、后续更新和所有权

### 新窗口从哪里拿当前状态

这里介绍两种组织方式。

一种是主进程保存公共数据。`window:setGlobalData` 合并更新到 `globalSharedData`，向发送者以外的窗口广播 `global-data-updated`；`window:getGlobalData` 返回当前值。渲染端状态模块获取快照，把更新合并到当前窗口的 `window.global`，再通过本地 `ee` 通知组件。

这里同步的是数据副本，并不是多个进程共同持有一个 JavaScript 对象。当前 `Object.assign` 只做顶层合并，嵌套对象的局部修改和删除语义需要另行约定。

另一种是数据由主窗口组件持有。放大曲线窗口的初始化就是这样：

1. `ChartDomHeader` 打开 `chart-{id}` 窗口。
2. `ChartDetail` 挂载后请求 `getChartInitData_{id}`。
3. 主窗口返回选中的数据主题（topic）、图表选项、曲线配置和当前时间等。
4. 子窗口完成初始化，之后处理 `updateTimeline`、`addLine`、`deleteLine`。

“窗口创建成功”和“页面已准备好接消息”是两个时刻。`openNewWindow()` 返回成功，不等于 React 已挂载或监听器已注册。子窗口主动请求初始数据，可以避免创建后立刻推送却无人接收的问题。

### 初始化也有竞态

基础示例中的 `ChartDetail` 先 `await` 初始数据，再注册 `onMessage`。如果初始化期间主窗口修改了曲线，就存在漏掉变化的窗口。

仅仅改成先订阅再请求也不够：旧快照可能晚于新推送抵达，覆盖掉新状态。

下面是建议方案，**不是基础示例中的实现**：由状态拥有者给完整快照附加递增的 `revision`，接收端只应用更新的版本。

```js
// 前提：同一会话内，快照和推送都携带完整状态，
// revision 由同一个状态拥有者生成。
let lastRevision = -1;
let disposed = false;

function applySnapshot(snapshot) {
  if (disposed || snapshot.revision <= lastRevision) return;
  lastRevision = snapshot.revision;
  renderState(snapshot.state);
}

// 这些 bridge 方法需要新增，订阅返回独立的取消函数。
const unsubscribe = bridge.onState(applySnapshot);

try {
  applySnapshot(await bridge.getSnapshot());
} catch (error) {
  if (!disposed) showLoadError(error);
}

function dispose() {
  disposed = true;
  unsubscribe();
}
```

推送先到时，后返回的旧快照不会覆盖它。这里能跳过中间版本，是因为每次携带完整状态；如果发送的是 `addLine` 这类增量操作，就要在初始化期间暂存事件，按版本重放，遇到缺口重新拉快照。

### 共享字段也要有明确的拥有者

共享状态有一个常见的陷阱：子窗口初始化时，如果把自己默认的 `isLoaded = false` 写回共享数据，就可能覆盖主窗口已经发布的加载状态。

这个问题需要先确定所有权：

| 状态 | 合理的拥有者 | 其他窗口怎么参与 |
| --- | --- | --- |
| 数据加载状态 | 主窗口加载流程或独立数据服务 | 读取状态、提交加载命令 |
| 当前回放时间、播放状态 | 回放控制器 | 请求 play/pause/seek，接收结果 |
| 某张曲线的选中 topic | 对应图表模型 | 提交增删命令，接收更新 |
| 日志搜索词、滚动位置 | 日志窗口 | 本地维护 |

**可以读取某个全局字段，不等于可以随意写回。** 通用 `setGlobalData` 没有表达字段权限，后续可以收敛成明确的业务接口，由拥有者修改状态后再通知其他窗口。

## 6. 回放同步：统一媒体时间

示例方案的时间控制集中在主窗口的 `TimeController`。示例使用 `setInterval` 驱动播放循环，通过窗口消息更新日志位置、曲线时间线，通过数据流通道分发数据和播放状态。

在这个基础方案中，主窗口推进回放，其他视图跟随主窗口给出的时间和状态。跨窗口消息尚未统一携带 `sessionId`、`revision`，也不能仅凭发送频率推断实际的同步误差。

即使窗口收到同一个时间，也不会在同一物理时刻完成绘制。IPC 排队、数据加载、图片解码和页面渲染都会产生延迟。回放应用首先需要保证：各窗口展示的数据对应同一段记录、同一个目标时间，暂停和 seek 后能收敛到一致状态。

如果进一步完善协议，可以分开下面几个概念：

```ts
// 建议的完整回放快照，不是基础示例中的类型。
type PlaybackSnapshot = {
  sessionId: string;   // 加载新记录时重新生成
  generation: number;  // seek 等使旧加载任务失效时递增
  revision: number;    // 本会话每次发布快照时递增
  currentTime: number; // 统一单位，例如毫秒
  isPlaying: boolean;
  speed: number;
};
```

- `sessionId` 防止上一份记录的消息污染当前记录。会话切换由初始化响应或明确的切换事件确认，不能看到陌生会话就接管。
- `generation` 让 seek 前发起的异步取数失效。旧图片晚加载完成时，不能覆盖新目标时间的图片。
- `revision` 区分新旧状态。不能用媒体时间判断版本：向后 seek 时，时间更小的状态反而更新。
- `currentTime` 表达业务目标时间，各视图按它选数据，而不是按消息到达时刻选数据。

例如图片加载完成后，要再次检查发起加载时的会话、generation，以及图片是否仍对应当前目标。只在收到 IPC 时检查版本，挡不住后续异步任务的旧结果。

主窗口计时也可以进一步改为用单调时钟计算经过时间：

```text
媒体时间 = 基准媒体时间 + (当前单调时间 - 基准单调时间) × 倍速
```

暂停、恢复、变速时先结算旧进度，再重设基准；缺数据等待时也要冻结或重设基准。不同窗口的 `performance.now()` 起点可能不同，不应直接相减，跨窗口仍传媒体时间。

示例窗口池当前配置了 `backgroundThrottling: false`。这是调度方面的选择，不能替代状态协议，也不能保证窗口同时出帧。单调时钟同样不能消除绘制延迟。

“丢旧帧”只能针对过期的显示任务。中间数据可能影响累计值和统计结果，不能因为页面只画最新一帧，就把底层数据处理也跳过。

## 7. 数据分发：普通 IPC 与独立通道

基础示例也通过普通 IPC 传数据，可先用这条链路建立订阅机制，再根据性能测量决定是否引入 MessagePort。

数据接收模块可以先检查是否存在打开的窗口，再调用 `sendData(stream)`。主进程的 `setupDataStreamIPC()` 管理订阅：

```text
subscribe-to-stream     → 把发送方 webContents 加入 Set
unsubscribe-from-stream → 从 Set 删除
stream-data             → 向订阅者 webContents.send
窗口 destroyed          → 清理订阅者
```

广播会发给所有订阅者，包括已经订阅的发布者；目前没有按 topic 细分，也没有为每个消费者设置队列上限。订阅以 `webContents` 为单位，同一窗口多个组件共享一个订阅资格，一个组件取消订阅可能影响其他组件。

数据量和窗口数增加后，可以按顺序优化：

1. 由主进程维护窗口和订阅信息，减少热路径中逐包查询窗口列表。
2. 按 topic 或视图需求订阅，避免所有窗口收到完整流。
3. 合并过期的显示更新，对必须完整处理的数据采用有界队列和背压。
4. 测量消息大小、发送频率和主进程占用，再决定是否拆出独立通道。

MessagePort 是一种选择：由主进程分发一对端口后，两个渲染端可以直接通信，减少逐条中转。端口要通过 `postMessage` 转交，普通 `send` / `invoke` 不能转交端口。[Electron MessagePorts 文档](https://www.electronjs.org/docs/latest/tutorial/message-ports)

但 MessagePort 不代表所有数据自动零拷贝。Web MessagePort 转移 `ArrayBuffer` 时，需要显式转移所有权，发送方转移后不能继续使用原缓冲区；也不能把同一份所有权同时转移给多个窗口。多消费者仍要考虑复制、按需加载、共享内存或数据服务。

## 8. 监听清理、窗口复用和消息回环

### 只移除自己注册的监听

如果 preload 多处使用 `removeAllListeners("window-message")`、`removeAllListeners("window-request")`，或在 `onData()` 注册前清掉同通道监听，就会产生监听相互干扰的问题。多个组件共用通道时，一个组件可能把另一个组件的监听一起清掉。

可以改成每次订阅返回独立的取消函数：

```js
// 建议替换方式；回调签名相应调整为只接收 message。
onMessage: (callback) => {
  const listener = (_event, message) => callback(message);
  ipcRenderer.on("window-message", listener);
  return () => ipcRenderer.removeListener("window-message", listener);
},
```

组件卸载时只调用自己的取消函数。这个版本也不把 Electron 原始事件对象传给页面。基础示例部分回调仍传递 `event`，也有通用的 `invoke(channel, ...args)`；后续应收敛为明确的业务方法，在主进程校验发送窗口、目标和字段。[Electron 安全文档](https://www.electronjs.org/docs/latest/tutorial/security)

渲染侧移除监听和主进程避免向已销毁对象发送，是独立的清理工作。`Object has been destroyed` 要靠发送前检查和窗口注册表清理等处理，不能简单归因于页面没取消订阅。

### 复用窗口也要重新确认上下文

`WindowPoolManager` 会预热窗口，打开已有业务窗口时也可能只聚焦它。窗口存在，不代表它已经展示当前记录。

切换记录 或复用详情窗口时，需要更新上下文、清理旧任务、确认监听就绪，再同步快照。可以增加 `ready` 握手，也可以由子窗口主动请求初始化，不能只延迟几十毫秒猜页面何时加载完成。

### 收到同步消息后避免再次广播同一操作

主窗口和放大曲线窗口都可以增删曲线。如果收到 `addLine` 后又走一遍“更新并广播”的入口，会形成回环。

基础示例已区分部分来自消息的处理路径，例如 `handleAddLineFromMessage`。继续演进时，应区分用户命令和状态更新；需要重试或多方转发的命令可以带 `commandId` 去重。

## 9. 对比 VS Code 和 Foxglove

### VS Code：建立连接后，让数据绕开主进程

VS Code 团队在进程沙箱迁移文章中介绍过：渲染端通过 preload 暴露的能力调用特权操作；与共享进程通信时，由主进程帮助转交 MessagePort，建立连接后直接通信，避免主进程承担全部消息流量。这是文章记录的架构背景，不能据此断言它今天每类窗口都采用相同链路。[VS Code 进程沙箱迁移说明](https://code.visualstudio.com/blogs/2022/11/28/vscode-sandbox)

对多窗口应用的启发是，主进程负责窗口创建、权限和路由，持续的数据分发可以交给专门服务。如果把记录解码、索引和缓存从主窗口拆出去，主窗口也会成为消费者，数据服务可以独立于视图运行。

这是数据量进一步增长时的演进方向，是否迁移应由性能测量决定。

### Foxglove：先定义数据时间和 seek 行为

Foxglove 的面板回放机制可以作为时间同步的参考。官方文档说明：消息按 log time 顺序交给面板；混用时间字段时需要统一参考时间；seek 时会查找各订阅 topic 在目标位置之前最近的消息，让低频数据也能恢复合理状态。[Foxglove 回放文档](https://docs.foxglove.dev/docs/visualization/playback)

对示例方案而言，发出同一个 `timestamp` 只是第一步，还要约定：

- 时间字段代表记录时间还是采样时间，单位和参考起点是否一致。
- 目标时刻没有图片时，是取此前最近一帧、显示空白，还是提示过期。
- 低频状态量在 seek 后如何恢复，哪些累计视图需要重建历史。

这些取决于数据模型，不能只靠 IPC 层解决。这里比较的是 Foxglove 公开的面板回放语义，并不据此推断其跨原生窗口的内部通信实现。

| 维度 | 示例方案基础实现 | 可借鉴的方向 |
| --- | --- | --- |
| 窗口消息 | 主进程按业务标识或原生 ID 转发 | 统一业务标识和发送权限 |
| 请求响应 | 自定义响应 ID、监听和超时 | 唯一 ID、回复者校验、统一待处理表 |
| 共享状态 | 主进程公共对象与广播，部分状态在主窗口 | 明确所有权，统一快照和事件版本 |
| 数据通道 | 普通 IPC 向订阅窗口广播 | 参考 VS Code：按需建立独立数据连接 |
| 回放联动 | 主窗口时间驱动日志和曲线 | 参考 Foxglove：统一时间语义和 seek 恢复规则 |

## 10. 模块职责与验证场景

| 模块 | 主要职责 |
| --- | --- |
| preload 桥接层 | `window.myAPI`、订阅和请求响应桥接 |
| 主进程消息路由 | 定向转发、跨窗口请求、公共状态、数据订阅 |
| 窗口管理器 | 窗口标识、预热、复用和关闭 |
| 渲染端状态模块 | 当前窗口的公共数据副本与本地事件 |
| 回放控制器 | 回放控制、状态查询、向其他窗口推送时间 |
| 图表详情视图 | 子窗口初始化、曲线增删和时间线联动 |
| 图表入口组件 | 打开放大窗口、提供初始数据 |
| 日志视图 | 接收回放时间、点击日志请求 seek |
| 数据接收模块 | 数据处理和向订阅窗口分发 |

维护时除了正常打开窗口，还应验证：初始化期间修改曲线、连续 seek 后旧请求晚返回、请求中关闭目标窗口、切换记录、刷新子窗口，以及多个组件同时订阅后只卸载其中一个。它们分别检验初始化竞态、旧数据隔离、请求清理和监听所有权，比只看两个窗口是否“都在动”更能暴露问题。
