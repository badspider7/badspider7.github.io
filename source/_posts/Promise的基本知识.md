---
title: Promise的基本知识
date: 2023-03-27 21:45:51
category: 前端
tags: 基础知识点
index_img: /img/promise.jpeg
---

## Promise

Promise 是 ES6 新出的一个类，因为 js 是单线程的，为了加快性能，提出了异步这个方法,Promise 只接受一个函数，它由两个参数 _resolve,reject_

> Promise 的一些优点： 可以链式调用，解决回调地狱
>
> Promise 里面是同步调用的，then 里面才是微任务
>
> Promise 有三个状态：Pending , resolved(fulfilled),rejected
>
> 一个 promise 对象只能改变一次状态，成功或者失败后都会返回结果数据。

一些异步的操作:

- setTimeOut
- ajax
- 回调函数
- 事件监听
- Promise

普通的 ajax 请求

```js
//创建一个xhr对象
const xhr = new XMLHttpRequset();
xhr.open("GET", "http://localhost:2010");
xhr.send();

//接受响应
xhr.onReadyStateChange = function () {
  if (xhr.readyState == 4) {
    if (xhr.status >= 200 && xhr.status <= 300) {
      console.log(xhr.response);
    } else {
      console.log(xhr.status);
    }
  }
};
```

对 ajax 的 Promise 封装

```js
let p = new Promise((resolve, reject) => {
  //创建一个xhr对象
  const xhr = new XMLHttpRequset();
  xhr.open("GET", "http://localhost:2010");
  xhr.send();

  //接受响应
  xhr.onReadyStateChange = function () {
    if (xhr.readyState == 4) {
      if (xhr.status >= 200 && xhr.status <= 300) {
        //响应成功
        resolve(xhr.response);
      } else {
        //响应失败
        reject(xhr.status);
      }
    }
  };
});

p.then(
  (value) => {
    console.log(value);
  },
  (error) => {
    console.log(error);
  }
);
```

## Promise 的一些 API

> Promise.rejected()

如果返回的是一个普通的对象，就返回一个成功的 Promise 对象

如果返回的是一个 Promise 对象，则根据这个 Promise 返回的结果返回结果

> Promise.all([])

如果所有的都返回成功的话，则会返回成功的结果的一个数组

如果有一个返回失败的话，则会返回那个失败的结果

> Promise.race([])

它的返回结果由最先完成的那个 promise 结果来决定，第一个返回的如果是成功就是是成功的结果，如果是失败就是失败

> Promise.finally()

无论成功还是失败，都会执行的回调函数

> Promise.then(()=>{},()=>{})

如果成功，将会执行这个回调函数的第一个函数

> Promise.catch

如果失败，则会执行这个回调函数

## 中断 Promise 链

能够中断 Promise 的执行的，只有<pending>状态下的 Promise

```js
let p = new Promise((resolve, reject) => {
  resolve("OK");
});

p.then((value) => {
  return new Promise((res, rej) => {
    resolve("1");
  });
})
  .then((val) => {
    console.log("2");
  })
  .then((val) => {
    console.log("3");
  });

//如果想要中断这个回调函数链的话，只有返回一个pending才能中断
p.then((value) => {
  return new Promise((res, rej) => {}); //这样子就可以了
})
  .then((val) => {
    console.log("2");
  })
  .then((val) => {
    console.log("3");
  });
```

## Promise.then 返回的是一个 Promise 对象

Promise.then 返回了一个什么呢？

```js
let p = new Promise((resolve, reject) => {
  resolve("OK");
});

const res = p.then((val) => {
  console.log(val);
});

console.log(res); //Promise  --> resule: [val]
```

Promise.then 返回了一个 Promise 对象

返回的结果由 p.then 返回的结果来决定

1. 如果回调函数的返回结果是 非 promise 类型的 属性，则 then 方法返回的 promise 对象 p1 的状态为成功 fulfilled，同时返回的结果就是 promise 对象 p1 成功的值。需要注意的是，如果你不写 return，我们知道函数内部如果不写 return 默认返回结果是 undefined，又 undefined 也是非 promise 类型，所以 p1 状态还是成功 fulfilled，返回的 promise 成功值为 undefined。
2. 如果回调函数的返回结果是 promise 对象，则 p1 的状态就取决于 return 返回的这个 promise 对象内部的状态，内部为 resolve, 则 p1 状态为 fulfilled，内部为 reject，则 p1 状态为 rejected

## 改变 Promise 状态的三种办法

1.reject()

2.resolve()

3.throw Error('error')

**Promise 指定的多个回调函数也会执行的**

## async 和 await

await 只能在 async 函数中才能使用

async 函数的返回值为 Promise 对象

Promise 对象的结果为 async 函数执行的结果
