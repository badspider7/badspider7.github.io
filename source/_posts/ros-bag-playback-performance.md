---
title: 20ms 一帧、10MB/s 数据：一个 ROS 回放工具的性能账
date: 2026-10-18 22:40:00
categories: [前端]
tags: [性能优化, Electron, ECharts, Worker]
---

这个回放工具最开始不是给“大数据”设计的。

它要读 ROS Bag，把激光、导航、图片、日志、曲线按同一个时间轴对齐；用户拖动播放头，地图、点云、图表、图片都要更新到“当前时刻”。一开始数据量不大，怎么都能跑。后来接入的设备越来越多，问题就出来了。

实际环境里的两类设备，一类 1 秒约 2MB 数据，另一类 1 秒 10MB 以上；服务端每 500ms 下发一批，一批是 1 秒的数据；播放头 20ms 走一次，多个 topic 同时更新。

最早一版跑起来，CPU 直接拉满，图表卡到拖不动。后来一点点拆，才把这条链路理顺。

<!-- more -->

## 背景：回放到底难在哪

它不是把一段视频从头播到尾。

它要解决的是“多源异步数据的时间对齐”：

- 激光、导航、图片、日志的采样率不一样；
- 数据到达有延迟、乱序、丢帧；
- 用户会暂停、拖动、倍速；
- 多个窗口要看到同一个时刻；
- 数据量还很大。

第一版的做法很直白：

```text
WebSocket 收数据
  → 主线程 JSON.parse
  → 按 topic 分组
  → 每个 tick 遍历所有点，找当前时间
  → ECharts setOption 全量重绘
  → 图片用 <img src="data:image/png;base64,...">
```

四个问题：

1. JSON.parse 在主线程：一批几 MB，解析的时候 UI 直接停住；
2. 每个 tick 线性找点：topic 里几千上万个点，20ms 找一次，CPU 全花在遍历上；
3. ECharts 全量重绘：每帧 setOption，动画、坐标轴、tooltip 全部重算；
4. 图片 base64：解码在主线程，大图直接卡。

## 第一步：把收流和解析挪到 Worker

WebSocket 和 JSON.parse 放进 Worker：

```js
// wsWorker.js
ws.addEventListener("message", ({ data }) => {
  const parsed = JSON.parse(data);
  self.postMessage({ type: "stream", data: parsed });
});
```

主线程确实不卡了。但很快遇到第二个问题：`postMessage` 会结构化克隆整个对象。

10MB/s 的数据，从 Worker 传到主线程就是 10MB/s 的复制；图片是 base64，体积还要多 33%。Worker 只是把“解析”挪走了，没有把“传输”变便宜。

后来改成传 `ArrayBuffer`，用 Transferable：

```js
self.postMessage({ type: "stream", buffer }, [buffer]);
```

图片也不再传 base64，而是在 Worker 里 `createImageBitmap`，传 `ImageBitmap` 或 `OffscreenCanvas`。这一步的收益比“换一个更快的 JSON 库”大得多。

## 第二步：时间索引 + 二分

图表的数据是按时间排好序的。播放头每次移动，不需要从头遍历，只需要找“小于等于当前时间的最近一个点”。

我们写了一个 `findClosestIndex`：

```js
function findClosestIndex(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left < right) {
    const mid = (left + right) >> 1;
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid;
  }

  return left > 0 &&
    Math.abs(arr[left - 1] - target) < Math.abs(arr[left] - target)
    ? left - 1
    : left;
}
```

有人问过：为什么不直接 `index + 1`？

因为数据不是等间隔 20ms 一条。时间戳的颗粒度比 20ms 更细，多个 topic 的采样率也不一样；还有丢帧、乱序、seek、倍速。

`+1` 在“匀速、无丢帧、每个 tick 刚好一条”的理想情况下能用，一旦 seek 或数据有缺口，就会错位。二分是 O(log n)，单 topic 几千个点，log n 很小，成本可以接受。

真正贵的不是二分，是排序、克隆和绘制。

## 第三步：只画竖线，不重绘整图

图表每 20ms 更新一次，但数据 500ms 才来一批。如果每个 tick 都 `setOption`，等于用 50fps 重绘一份 2fps 的数据，纯浪费。

我们改成：

- 数据来了才更新 series；
- 每个 tick 只更新 `markLine`（竖线）；
- `animation: false`；
- 用 `rAF` 调度，窗口不可见时暂停；
- 图表更新节流到 30fps，数据没变就不重绘。

ECharts 的 `setOption` 默认是合并的，但大数组还是会触发内部计算。我们只传变化的部分，不整份 option 重建。

## 第四步：图片走 Canvas，队列丢旧帧

图片是最容易爆内存的。

一开始用 `<img>` + base64，每张图都新建一个 `Image`，解码在主线程，队列越堆越长，最后直接卡死。

后来改成 Canvas：

```js
class ImageRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.image = new Image();
    this.queue = [];
    this.maxQueueSize = 5;
  }

  add(imageData) {
    if (this.queue.length >= this.maxQueueSize) {
      this.queue.shift(); // 丢最旧的一帧
    }
    this.queue.push(imageData);
  }
}
```

队列最多 5 帧，超过就丢最旧的。回放不是录像，用户不需要看到每一帧，只要“当前时刻的图”是对的。

如果再进一步，应该用 `createImageBitmap` + `OffscreenCanvas`，把解码也挪出主线程。我们当时只做了一半，图片多的时候还是会有峰值。

## 第五步：内存要按窗口算

10MB/s，一分钟就是 600MB。把整个 Bag 读进内存，迟早爆。

我们的策略是：

- 只保留当前播放窗口附近的数据；
- 旧的切片落盘/丢弃；
- 图表只保留可视区和降采样后的点；
- 图片队列最多 5 帧；
- 大文件分片加载，不 `readFile` 一把梭。

“百万级时序点”说的是单窗口、降采样后的渲染量，不是把整个 Bag 的百万点全塞进内存。这两个概念很容易混。

## 构建也拖了后腿

老项目是 CRA + Webpack 4 + Electron 23，开发编译 3 分钟，打包 10 多分钟。每次改一个样式，等编译的时间够泡一杯咖啡。

后来迁到 pnpm Monorepo + Rspack + Electron 40：

- 开发编译 3 min → 20s；
- 打包 10+ min → 2 min；
- React 16 没动，先解决构建和运行时，避免一次改太多。

构建提速对“性能优化”是有帮助的：你改一版要等 3 分钟，就很难做细粒度的实验；变成 20 秒之后，才愿意反复试。

## 现在还会卡的地方

- 图片峰值：多路大图同时来，Canvas 还是会掉帧；
- 点云：目前是 Canvas/2D，数据再大要上 WebGL；
- Worker 回传：还没有完全做到零拷贝，SharedArrayBuffer 需要 COOP/COEP；
- 内存：长时间回放还是靠分片，不能无限拖。

但至少现在，20ms 的播放头能稳定走，图表不会因为数据量大就拖不动，用户能拖到故障发生的那一秒。

性能优化没有什么银弹，基本就是：把不该在主线程做的事挪走，把不该每帧做的事降频，把不该留在内存里的东西丢掉。
