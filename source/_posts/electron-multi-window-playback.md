---
title: Electron 多窗口回放：别让每个窗口自己数时间
date: 2026-09-27 21:15:00
categories: [Electron]
tags: [Electron, IPC, 多窗口, 回放]
---

去年做 ROS 数据回放工具的时候，有一个 bug 我记了很久。

主窗口的时间轴走到 12.3 秒，放大出来的图表子窗口还停在 12.1 秒；再点一下暂停，两个窗口又对不上了。单看每个窗口都“在动”，放在一起就是错位。

这个工具的主窗口负责地图、播放控制和时间轴，子窗口负责放大的曲线、图片或点云。用户经常一边看主窗口，一边把某个图表拖到副屏。两个窗口只要差 100ms，故障点就可能对不上。

<!-- more -->

## 背景：为什么要多窗口

一开始所有东西都在一个窗口里。后来发现不行：

- 曲线要看细节，主窗口空间不够；
- 地图、点云、图片需要并排对比；
- 用户有双屏，希望把图表拖出去。

于是有了“主窗口 + 多个子窗口”的结构。主窗口控制播放，子窗口展示不同的数据视图。

问题也从这里开始：每个窗口都需要知道“当前播放到哪”，如果各自维护时钟，迟早会漂。

## 原因：每个窗口一个 setInterval

最早每个窗口都自己起一个 20ms 定时器：

```js
setInterval(() => {
  currentTime += 20;
  render(currentTime);
}, 20);
```

看起来没问题，实际上：

- 两个定时器的启动时间不一样；
- 主窗口渲染重，子窗口渲染轻，回调被延迟的程度不一样；
- 窗口切到后台，Chromium 会降频；
- 暂停/seek 时，两个窗口的处理顺序不一致。

跑几分钟，差距就出来了。

## 方案：主窗口是唯一时钟源

后来改成：**主窗口维护播放状态，子窗口只负责渲染。**

主窗口的状态大概长这样：

```ts
type PlaybackState = {
  mediaTime: number;   // 当前播放到哪
  startedAt: number;   // performance.now()
  speed: number;       // 0.5 / 1 / 2 / 4 / 8
  playing: boolean;
  seq: number;
};
```

每次 tick 计算：

```ts
const now = performance.now();
const t = state.mediaTime + (now - state.startedAt) * state.speed;
```

用 `performance.now()` 而不是 `Date.now()`，因为前者是单调的，不会被系统时间调整影响。

暂停/seek 时重置基准：

```ts
function seek(next: number) {
  state.mediaTime = next;
  state.startedAt = performance.now();
  state.seq += 1;
  broadcast({ type: "seek", t: next, seq: state.seq });
}
```

子窗口不跑定时器，只接收 `{t, seq}`，然后用自己的 `requestAnimationFrame` 渲染。

## IPC 分两类

Electron 的 IPC 大概有两种用法：

- **请求-响应**：`ipcRenderer.invoke` / `ipcMain.handle`，适合“播放/暂停/seek/拿当前状态”；
- **单向广播**：`webContents.send`，适合 tick 这种高频小消息。

preload 大概长这样：

```ts
contextBridge.exposeInMainWorld("playback", {
  play: () => ipcRenderer.invoke("playback:play"),
  pause: () => ipcRenderer.invoke("playback:pause"),
  seek: (t: number) => ipcRenderer.invoke("playback:seek", t),
  getState: () => ipcRenderer.invoke("playback:get-state"),
  onTick: (cb: (payload: Tick) => void) => {
    const handler = (_e: IpcRendererEvent, payload: Tick) => cb(payload);
    ipcRenderer.on("playback:tick", handler);
    return () => ipcRenderer.removeListener("playback:tick", handler);
  },
});
```

子窗口挂载时先 `getState()` 拉一次，之后只跟 `onTick`。

这里有个很容易忽略的点：**一定要返回取消订阅函数**。子窗口关闭/刷新时不移除监听，主窗口还在 `send`，就会报 `Object has been destroyed`。

## seq 和关键帧

只传 `t` 不够。网络/渲染/窗口切换都会让消息乱序或延迟，子窗口需要知道“这一帧是不是旧的”。

所以每个 tick 带一个单调递增的 `seq`：

```ts
let lastSeq = 0;

onTick(({ t, seq }) => {
  if (seq <= lastSeq) return; // 旧帧，丢掉
  lastSeq = seq;

  if (seq - lastSeq > 5) {
    // 跳帧太多，不补，直接要一份快照
    requestSnapshot();
    return;
  }

  render(t);
});
```

这里的选择是：**丢帧，不补帧。**

回放不是视频会议，不需要每一帧都渲染。用户要的是“当前时刻正确”，不是“中间每一帧都播过”。如果子窗口卡了，补一堆旧帧只会让它更卡。

暂停、拖动时间轴、切换倍速，都是状态突变。这时候不能只发一个 `t`，子窗口需要知道“把队列清空，直接渲染这个关键帧”：

```ts
broadcast({
  type: "seek",
  t: nextTime,
  seq: ++state.seq,
  keyframe: true,
});
```

子窗口收到 `keyframe` 后：

1. 清空待渲染队列；
2. 取消上一帧的 rAF；
3. 按 `t` 重新取数/取图；
4. 渲染。

图表、地图、图片的处理方式不一样：

- 图表：按 `t` 二分找最近的样本，重画竖线；
- 地图：按 pose 插值，或者直接跳到最近的关键帧；
- 图片：只显示 `<= t` 的最近一张，不补中间帧。

## 高频数据不要走 IPC

有一类东西绝对不能每帧 `send`：点云、图片、大数组。

IPC 会做结构化克隆，10MB 的 `ArrayBuffer` 每帧传一次，主进程和渲染进程都会卡。我们的做法是：

- 高频数据通过 `MessagePort` 传，或者用 `SharedArrayBuffer`（需要 COOP/COEP）；
- IPC 只传 `{t, seq}` 这种小对象；
- 图片只在关键帧传，子窗口本地缓存。

如果必须走 `webContents.send`，也要批量：比如 100ms 发一次数据切片，而不是 20ms 发一整包。

## 踩过的坑

**1. 子窗口后台降频**

Chromium 会降低后台窗口的定时器频率。子窗口不要自己计时，只跟主窗口的 `t`，就没这个问题。

**2. 多个定时器叠加**

主窗口一个 tick，图表组件里又有一个 `setInterval` 刷新，两个频率不一样，看起来就是“竖线在抖”。后来统一收口到主时钟。

**3. 窗口 reload 后状态丢失**

子窗口刷新后 `lastSeq` 归零，会把旧 tick 当成新 tick。挂载时先 `getState()`，把 `seq` 和 `t` 同步一次。

**4. 关闭窗口没清监听**

`webContents.send` 到已销毁的窗口会报错。主窗口维护一个窗口集合，窗口关闭时移除；发送前检查 `isDestroyed()`。

**5. `performance.now()` 的基准**

主窗口和子窗口的 `performance.now()` 起点可能不同，不要拿它做跨窗口比较。跨窗口只传“媒体时间 `t`”，不传“当前时间戳”。

## 结果

改完之后，主窗口和子窗口的竖线基本是同步的，暂停/seek 也不会出现“一个窗口还在动”的情况。

这套方案不复杂，核心就三句话：

- 一个时钟源：主窗口算 `t`，其他窗口只渲染；
- 一个 `seq`：旧帧丢掉，跳帧太多就请求快照；
- 一个关键帧：seek/pause 清队列，直接渲染目标状态。

多窗口通信真正难的不是“怎么发消息”，是“消息到了之后，窗口该不该信”。把这个问题想清楚，代码会少很多。
