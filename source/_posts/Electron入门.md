---
title: Electron入门
date: 2023-06-07 23:37:11
tags: Electron
categories: 前端
index_img: /img/electron.jpeg
banner_img: /img/electron.jpeg
---
//ready:app 初始化完成

dom-ready:一个窗口中的文本加载完成

did-finish-load:导航完成时触发

window-all-closed:所有窗口都被关闭时触发

before-quit:在关闭窗口之前出发

will-quit:在窗口关闭并且应用退出时触发

quit:当所有窗口被关闭时触发

closed：当窗口关闭时触发，此时应删除窗口引用



```js
const { app, BrowserWindow } = require('electron')

//当app启动之后，执行窗口创建等操作
app.whenReady().then(() => {
    const mainWin = new BrowserWindow({
        width: 600,
        height:400
    })

    //在当前窗口页面加载指定内容
    mainWin.loadFile('index.html')

    //监听当前窗口的关闭
    mainWin.on('close', () => {
        console.log('close')
    })
})

//当所有窗口都关闭的时候
app.on('window-all-closed', () => {
    console.log('all window is closed')
    app.quit()
})
```

### 主进程和渲染进程通信

利用   **IPCMain和IPCRenderer** ，其中分为以下几种：

一. 主进程给所有渲染进程发消息



```js
//主进程
IPCMain.send('message','some message');

//渲染进程
IPCRenderer.on('message',(event,data)=>{
	console.log('get mesaage:',data)
})
```

二. 渲染进程给主进程发消息(双向)

通过将 [`ipcRenderer.invoke`](https://www.electronjs.org/zh/docs/latest/api/ipc-renderer#ipcrendererinvokechannel-args) 与 [`ipcMain.handle`](https://www.electronjs.org/zh/docs/latest/api/ipc-main#ipcmainhandlechannel-listener) 搭配使用来完成。

```js
//preload
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile')
})
```

```js
//主进程
IPCMain.handle('dialog:openFile',HandleOpenFile)

//渲染进程
const filePath = await window.electronAPI.openFile()
```



三. 渲染进程给主进程发消息(单向)

通过**IPCRenderer.send** API 给主进程发送消息,主进程通过 **IPCMain.on**来接收渲染进程发送的消息

```js
//主进程中
IPCMain.on('message',(event,data)=>{
    //渲染进程
	const webContents = event.sender
    //主页面
   const win = BrowserWindow.fromWebContents(webContents)
    win.setTitle(title)
})
```

```js
//preload
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (title) => ipcRenderer.send('message', title)
})
```

```js
//render.js
window.electronAPI.sendMessage(title)
```

四. 主进程给渲染进程

将消息从主进程发送到渲染器进程时，需要指定是哪一个渲染器接收消息。 消息需要通过其 [`WebContents`](https://www.electronjs.org/zh/docs/latest/api/web-contents) 实例发送到渲染器进程。 此 WebContents 实例包含一个 [`send`](https://www.electronjs.org/zh/docs/latest/api/web-contents#contentssendchannel-args) 方法，其使用方式与 `ipcRenderer.send` 相同。

使用 `webContents.send` API 将 IPC 消息从主进程发送到目标渲染器

```js
//render.js
window.electronAPI.handleCounter((event, value) => {
  const oldValue = Number(counter.innerText)
  const newValue = oldValue + value
  counter.innerText = newValue
  event.sender.send('counter-value', newValue)
})

//preload
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  handleCounter: (callback) => ipcRenderer.on('update-counter', callback)
})


//MainProcess
mainWindow.webContents.send('update-counter', 1)
```

五. 渲染进程给渲染进程

没有直接的方法可以使用 `ipcMain` 和 `ipcRenderer` 模块在 Electron 中的渲染器进程之间发送消息。 为此，您有两种选择：

- 将主进程作为渲染器之间的消息代理。 这需要将消息从一个渲染器发送到主进程，然后主进程将消息转发到另一个渲染器。

