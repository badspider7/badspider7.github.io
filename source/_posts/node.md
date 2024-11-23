---
title: Node
date: 2021-03-29 19:06:07
tags: Node
categories: 后端
index_img: /img/node.jpeg
banner_img: /img/top8.jpg
---

#### 1.能学到啥

- B/S 编程模型
  - Browser - Server
- 模块化编程
- Node 常用 api
- 异步编程
- Express Web 开发框架
- Ecmascript6

#### 1.1 读取文件

fs 是 file-system 的简写，就是文件系统的意思，在 node 中如果想要进行文件操作，就必须引入 fs 这个核心模块

在 fs 这个核心模块中，就提供了所有的文件操作相关的 API 例如： fs.readFile 就是用来读取文件的

```javascript
var fs = require("fs");
fs.readFile("../data/indexx.html", function (error, data) {
  if (error) {
    console.log("读取文件失败");
  } else {
    console.log(data.toString);
  }
});
```

> 第一个参数就是 要读取的文件路径
>
> 第二个参数就是 一个回调函数
>
> ​ 成功
>
> ​ data 数据
>
> ​ error null
>
> ​ 失败
>
> ​ data undefined
>
> ​ error 错误对象

#### 1.2 写入文件

```javascript
var fs = require("fs");
fs.writeFile("../data/ss.md", "我是要写入的内容", function (error) {
  //console.log('文件写入成功')
  if (error) {
    console.log("读取文件失败");
  } else {
    console.log("写入成功了");
  }
});
```

> 第一个参数：文件路径
>
> 第二个参数： 文件内容
>
> 第三个参数： 回调函数 error
>
> ​ 成功
>
> ​ 文件写入成功
>
> ​ error 是 null
>
> ​ 失败
>
> ​ 文件写入失败
>
> ​ error 就是错误对象

#### 2.1 创建 http 服务

```javascript
//1.加载 http 核心模块
var http = require("http");
//2.使用 http.createSever() 方法创建一个 web 服务器
//返回一个 Server 实例
var server = http.createServer();
//3.服务器提供对数据的服务
//  发请求
//  接收请求   处理请求   发送响应

//注册 request 请求事件
// 当客户端请求过来，就会自动触发服务器的 request 请求事件，然后执行第二个参数 ：回调处理
server.on("request", function (request, response) {
  console.log("收到客户端的请求了，请求路径是：" + request.url);

  //response 对象有一个方法： write 可以用来给客户端发送响应数据
  //write 可以使用多次，但是最后一定要使用 end 来结束响应，否则客户端会一直等待
  response.write("hello");
  response.write("sss");
  //告诉客户端，我的话说完了,你可以给用户了
  response.end();
});

//4.绑定端口号，启动服务器
server.listen(3000, function () {
  console.log("服务器启动成功啦，可以通过 http://127.0.0.1:3000/ 来进行访问");
});
```

> request 请求事件处理函数 需要接收两个参数：
>
> ​ Request 请求对象
>
> ​ 请求对象可以用来获取客户端的一些请求消息，例如请求路径
>
> ​ Response 响应对象
>
> ​ 响应对象可以用来给客户端发送响应消息

#### 3.用户自定义模块

**require 是一个方法**

- 它的作用就是用来加载模块的

**在 Node 中，模块有三种**

- 具名的核心模块，例如 fs，http
- 用户自己编写的文件模块

> 相对路径必须加 ./ require(./b.js)

- 在 Node 中，没有全局作用域，只有模块作用域(外部访问不到内部，内部访问不到外部)

_有时候我们加载文件模块的目的不是为了简简单单的执行里面的代码，更重要的是为了使用里面的变量_

**require 方法有两个作用**

1.加载文件模块并执行里面的代码

2.拿到被加载文件模块导出的接口对象

exports 默认是一个==空对象==，在每个文件模块中都提供了一个对象：exports

```javascript
//a.js
var ret = require("./b.js");
//ret ==exports
console.log(ret.foo);

//b.js
var foo = "bbb";

exports.foo = "hello world";
```

#### ip 地址和端口号

ip 地址用来定位计算机

端口号用来定位具体的应用程序（所有需要联网通信的软件都必须具有端口号）

> 所有联网的程序都需要进行网络通信
>
> 计算机中只有一个物理网卡，而且同一个局域网中，网卡的地址必须是唯一的
>
> 网卡是通过唯一的 ip 地址来进行定位的

端口号的范围从 0~~65536 之间

可以同时开启多个服务，但是一定要确保不同服务占用的端口号不一样
