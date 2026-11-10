---
title: 从 Webpack 4 到 Rspack：一次不体面的迁移
date: 2026-11-02 20:50:00
categories: [工程化]
tags: [Rspack, Webpack, Monorepo, Electron]
---

这篇文章我原本想叫《从 Webpack 3 到 Rspack》，因为记忆里一直是 3。

写之前翻了一下仓库：迁移前的 `package.json` 里是 `react-scripts: 2.0.4`，锁文件里是 `webpack@4.19.1`；Electron 也不是 30，是 `23.2.1`。

所以标题改成 4。不是严谨，是怕被同事看到打脸。

<!-- more -->

## 背景

这是一个 Electron 桌面端项目，代码量不小：主窗口、多个子窗口、Blockly、图表、点云、图片、离线 Agent，前后端都在一个仓库里。

[Rspack](https://rspack.dev/) 是字节跳动开源的一个基于 Rust 的 bundler，配置和 Webpack 比较接近。这篇不展开它的原理，只记录我们这次迁移的过程。

迁移前的技术栈大概是：

```text
React 16.6.1
react-scripts 2.0.4（Webpack 4.19.1）
Electron 23.2.1
react-app-rewired + config-overrides.js
```

问题很具体：

- 开发编译 3 分钟，打包 10 多分钟；
- Electron 版本老，部分新 API 用不了；
- 所有代码在一个 `package.json` 里，renderer 和 main 的依赖互相污染；
- 想升 Electron，但构建配置和它绑在一起，不敢动。

所以这次迁移的目标不是“用上 Rspack”，是**把反馈循环压下来，同时给 Electron 升级腾出空间**。

<!-- 配图建议 1：`git log --oneline --date=short --pretty='%h %ad %s' --grep='rspack\|monorepo\|electron' -i` 的终端截图 -->

## 时间线：不是一把梭

这次迁移前后拖了几个月，顺序是：

```text
2025-10   Rspack 替换 CRA
2025-11   Monorepo 拆包
2026-02   Electron 23 → 40
2026-03   CI 换 Electron 国内镜像
2026-04   修 Rspack externals
```

先 Rspack，再 Monorepo，最后才升 Electron。

原因很简单：Rspack 先跑通，至少开发能启动；Monorepo 是结构整理；Electron 升级是运行时风险，放到最后，出问题容易定位。

如果三件事一起上，任何一个页面白屏，都很难判断是构建、路径还是 Electron 的锅。

<!-- 配图建议 2：上面几次提交的 `git show --stat` 截图，重点是 Rspack / Monorepo / Electron 三个节点 -->

## Rspack 这一步，实际改了什么

Rspack 那个提交的统计是：

```text
14 files changed, 10659 insertions(+), 16682 deletions(-)
```

大部分是 lock 文件：删掉 `yarn.lock`（1.6 万行），加 `pnpm-lock.yaml`（1 万行）。真正的代码改动不多，但配置是重写的：

- 删掉 `config-overrides.js`（82 行）；
- 新增 `rspack.config.js`（160 行）；
- `package.json` 的 scripts 从 `react-app-rewired` 换成 `rspack dev/build`；
- 新增 `@rspack/core`、`@rspack/cli`、`babel-loader`、`css-loader`、`less-loader` 等依赖；
- 保留 React 16.6.1，没动。

老项目用 CRA + `react-app-rewired` 做了不少“体外循环”：

```js
config = injectBabelPlugin(["transform-decorators-legacy"], config);
config = injectBabelPlugin(
  ["import", { libraryName: "antd", libraryDirectory: "es", style: true }],
  config
);
config = rewireLess.withLoaderOptions({
  javascriptEnabled: true,
  modifyVars: { "primary-color": "#FF6232" },
})(config, env);
```

这些东西迁到 Rspack 之后，要一条条重新配：装饰器、antd 按需加载、Less 全局变量、`process.env` 注入、路径别名。少一条，开发环境可能能跑，打包后就白屏。

<!-- 配图建议 3：`config-overrides.js` 和 `rspack.config.js` 的并排截图，标出 decorators / antd import / less modifyVars 三段 -->

### 踩得最久的几个点

**1. `process.env` 不是自动的**

CRA 会帮你注入 `process.env.REACT_APP_*`，Rspack 不会。老代码里到处是 `process.env.WS_URL`、`process.env.PUBLIC_URL`，打包后变成 `undefined`，而且开发环境不一定复现。

最后是显式 `DefinePlugin`，把 `.env` 里的 key 一个个塞进去。

**2. Less 的全局变量**

以前 `react-app-rewire-less` 的 `modifyVars` 直接生效，Rspack 里要放到 `less-loader` 的 `lessOptions.modifyVars`，而且 `javascriptEnabled` 要单独开。

`@primary-color`、`@icon-url` 这些变量少一个，页面不至于挂，但样式会悄悄变。

**3. devServer 的中文路径**

老项目里有很多中文目录/文件名。Rspack 的 dev server 默认开目录列表，遇到中文路径会报 URI 解码错误。配置里最后加了：

```js
static: {
  directory: path.join(__dirname, "public"),
  serveIndex: false,
  watch: {
    ignored: ["**/runtime/**", "**/backends/**", "**/build/**", "**/release/**"],
  },
}
```

`serveIndex: false` 是试出来的，不是文档里一眼能看到的。

**4. `externals`**

Electron 主进程和原生模块不能打进 renderer。`externals` 的格式在 Rspack 里改过几次，直到 2026-04 还有一个专门修 `externals` 格式的提交。

这种问题很烦：开发环境正常，打包后某个功能才报 `Cannot find module`。

## Monorepo 是第二步，不是第一步

Monorepo 那次重构有 **898 个 rename**，基本是把老结构整体搬家：

```text
electron/        → src/main/
preload.js       → src/preload/index.js
src/             → src/renderer/
```

同时新增了 `src/main/package.json`、`src/preload/package.json`、`src/renderer/package.json`，根目录用 pnpm workspace 管。

为什么不是先拆 Monorepo？

因为拆包会改大量路径、别名、构建入口、Electron 打包配置。如果同时还在换构建工具，出问题根本分不清是“路径错了”还是“Rspack 配置错了”。

先让 Rspack 在单仓里跑通，再搬家，变量少一半。

<!-- 配图建议 4：`git show --summary` 的 rename 列表截图，或者迁移后的 `src/main` / `src/preload` / `src/renderer` 目录树 -->

## Electron 是几个月后的事

文章开头说过，Electron 不是 30，是 23.2.1。

后来升到 40.0.0，同时把 `electron-builder` 从 24.6.3 升到 26.7.0，加了 React DevTools 扩展。代码改动其实不大：

```text
src/main/main.js                          31 +-
src/main/utils/windowPools.js              1 +
src/renderer/playBack/playback.js         2 +-
```

但运行时行为变了不少：`remote` 没了，`contextIsolation` 更严格，部分窗口/IPC 写法要跟着改。

这也是为什么我建议**不要把 Electron 升级和构建迁移绑在一起**。构建错了，页面起不来；Electron 错了，可能整个窗口都起不来，排查成本完全不一样。

## React 为什么没升

这是问得最多的。

不是忘了，也不是“以后再说”，是算过账：**React 16.6.1 → 18 是另一个项目，不适合塞进构建迁移。**

当时的实际情况：

- 51 个 `extends Component` / `PureComponent`；
- 3 处 `ReactDOM.render`；
- 4 处 `componentWillReceiveProps`；
- 606 个 JS 文件（还不算样式和资源）；
- `antd` 3.26.20；
- `react-router-dom` 5；
- `react-beautiful-dnd` 8；
- `react-intl-universal` 2。

React 18 的 `createRoot`、生命周期变更、StrictMode 双调用、`findDOMNode` 移除，不是改个入口就完事。antd 3 到 4/5、react-router 5 到 6，都是大版本，组件库的 API 和样式都会动。

我们当时的判断是：先把构建和 Electron 稳住，React 单独排期。如果硬塞在一起，任何一个页面白屏，都很难判断是 Rspack、Electron 还是 React 的锅。

现在仓库里仍然是 React 16.6.1。这不是什么值得骄傲的状态，但至少是一个明确的、没有被“顺手升一下”掩盖的决定。

## 不体面的地方

- Rspack 配置 160 行，很多是“试出来”的，不是一开始就设计好的；
- devServer 为了中文路径关了目录列表；
- `externals` 到 2026 年 4 月还在修；
- lock 文件从 yarn 换到 pnpm，CI 缓存、镜像、Electron 下载都重新配过；
- React 16 的债还在，只是没有和这次迁移混在一起。

收益也明确：开发编译从 3 分钟降到 20 秒左右，打包从 10 多分钟降到 2 分钟。这个数字不是 benchmark，是每天改代码的体感。

但如果你问我“这次迁移体面吗”，不体面。它更像是在一架正在飞的飞机上换发动机：先换一个，试飞；再换另一个，再试飞。唯一做对的事，是没有一次全换。

<!-- 配图建议 5：迁移前后 `pnpm dev` / `pnpm package` 的终端耗时对比截图；如果没有留存，可以补一张现在跑构建的截图，并注明“当前机器” -->

## 配图清单

我截不了图，给你标了 5 个位置，命令都在上面：

1. `git log --grep` 的提交时间线；
2. Rspack / Monorepo / Electron 三次提交的 `git show --stat`；
3. `config-overrides.js` vs `rspack.config.js` 的关键段；
4. Monorepo 的 rename 列表，或者迁移后的目录树；
5. 迁移前后的构建耗时（有旧截图最好，没有就注明当前机器）。

如果只能放两张，我建议放 **提交时间线** 和 **config 对比**。这两张最能说明“不是一把梭”，也最不容易被当成编的。
