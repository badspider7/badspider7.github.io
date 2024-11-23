---
title: Vue 路由
date: 2021-05-31 19:15:21
tags: Vue
categories: 前端
index_img: /img/Vue-router.jpeg
banner_img: /img/vueRouter.jpg
---

## 1.路由的基本概念与原理

路由是一个比较广义和抽象的概念，`路由的本质就是对应关系`

在开发中，路由分为：

- 后端路由
- 前端路由

#### 1.1 路由

##### 1.1.1 后端路由

- 概念：根据不同的`用户URL请求` 返回不同的内容
- 本质：`URL请求地址`与`服务器资源`之间的对应关系![屏幕截图 2021-05-25 105809](./vueRouter.jpg)

##### 1.1.2 SPA(Single Page Application)

- 后端渲染（存在性能问题）

- Ajax 前端渲染（前端渲染提高性能，但是不支持浏览器的前进后退操作）

- SPA 单页面应用程序： 整个网站只有一个页面，内容的变化通过 Ajax 局部更新实现，同时支持浏览器地址栏的前进和后退操作

- SPA 实现原理之一：基于 URL 地址的 hash（hash 的变化会导致浏览器记录访问历史的变化，但是 hash 的变化不会触发新的 URL 请求）

- 在实现 SPA 过程中，最核心的技术点就是前端路由

##### 1.1.3 前端路由

- 概念： 根据不同的`用户事件`，显示不同的页面内容
- 本质： `用户事件`与`事件处理函数`之间的对应关系

![屏幕截图 2021-05-25 105736](C:\Users\yellowapple\Desktop\屏幕截图 2021-05-25 105736.png)

##### 1.1.4 实现简易前端路由

- 基于 URL 中的 hash 实现（点击菜单的时候改变 URL 的 hash，根据 hash 的变化控制组件的切换）

```javascript
//监听 window 的 onhashchange 事件，根据获取到的最新的 hash 值，切换要显示的组件的名称
window.onhashchange = function () {
  //通过 location.hash 获取最新的hash 值
};
```

#### 1.2 Vue Router

包含的功能

- 支持 html5 历史模式 或 hash 模式
- 支持嵌套路由
- 支持路由参数
- 支持编程式路由
- 支持命名路由

## 2.Vue-router 的基本使用

#### 2.1 基本使用步骤

1. 引入相关的库文件
2. 添加路由链接
3. 添加路由填充位
4. 定义路由组件
5. 配置路由规则并创建路由实例
6. 把路由挂载到 Vue 根实例中

**引入相关的库文件**

```javascript
//导入 Vue 文件，为全局 window 对象挂载 Vue 构造函数
<script src="./Vue.js"></script>

//导入Vue-router 文件，为全局 window 对象挂载 VueRouter 构造函数
<script src="../vue-router.js"></script>
```

**添加路由链接**

```html
<!-- router-link 是vue中提供的标签，默认会被渲染成a标签 -->
<!-- to 属性默认会被渲染为 href属性-->
<!-- to 属性的值默认会被渲染为 #开头的hash地址-->

<router-link to="/user">User</router-link>
<router-link to="/register">Register</router-link>
```

**添加路由填充位**

```html
<!-- 路由填充位（也叫路由占位符）-->
<!-- 将来通过路由规则匹配到的组件，将会被渲染到 router-view 所在的位置-->

<router-view></router-view>
```

**定义路由组件**

```javascript
var Users = {
  template: `<div>Users</div>`,
};
var Register = {
  template: `<div>Register</div>`,
};
```

**配置路由规则并创建路由实例**

```javascript
//创建路由实例对象
var router = new VueRouter({
  //routes 是路由规则数组
  routes: [
    //每个路由规则都是一个配置对象，其中至少包含path 和 component 两个属性:
    //path 表示当前路由规则匹配的hash地址
    //component 表示当前路由规则对应要展示的组件
    { path: "/user", component: User },
    { path: "/register", component: Register },
  ],
});
```

**把路由挂载到 Vue 根实例中**

```javascript
new Vue({
	el:'app'
    //为了能够让路由规则生效，必须把路由对象挂载到vue实例对象上
    router
})
```

#### 2.2 路由重定向

路由重定向指的是：用户在访问地址 A 的时候，强制用户跳转到地址 c，从而展示特定的组件页面；通过路由规则的 redirect 属性，指定一个新的路由地址，可以很方便的设置路由的重定向

```javascript
var router = new VueRouter({
  routes: [
    //其中 path 表示需要被重定向的原地址， redirect 表示将要被重定向的新地址
    { path: "/", redirect: "/user" },
    { path: "/user", component: User },
    { path: "/register", component: Register },
  ],
});
```

## 3.嵌套路由用法

#### 3.1 嵌套路由功能分析

- 点击父级路由链接显示模板内容
- 模板内容中又有子级路由链接
- 点击子级路由链接显示子级模板内容

## 4.动态路由匹配

通过动态路哟参数的模式进行路由匹配

```javascript
var router = new VueRouter({
  routes: [
    //动态路径参数 以冒号开头
    { path: "/user/:id", component: User },
  ],
});
```

```javascript
const User = {
  //路由组件中通过$route.params 获取路由参数
  template: `<div> User {{$route.params.id}} </div>`,
};
```

#### 4.1 路由组件传递参数

$route 与对应路由形成高度耦合，不够灵活，所以可以使用 props 将组件和路由解耦

**props 的值为布尔类型**

```javascript
const router = new VueRouter({
  routes: [
    //如果props 被设置为 true，route.params 将会被设置为组件
    { path: "/user:id", component: User, props: true },
  ],
});

const User = {
  props: ["id"], //使用props 接收路由参数
  template: `<div>用户id： {{id}} </div>`, //使用路由参数
};
```

**props 的值为对象类型**

```javascript
const router = new VueRouter({
  routes: [
    //如果props 被设置为 true，route.params 将会被设置为组件
    { path: "/user:id", component: User, props: { uname: "lisi", age: 12 } },
  ],
});

const User = {
  props: ["uname", "age"], //使用props 接收路由参数
  template: `<div>uname + '----'+ age </div>`, //使用路由参数
};
```

**props 的值为函数类型**

```javascript
const router = new VueRouter({
    routes: [
        //如果props 被设置为 true，route.params 将会被设置为组件
        {path:'/user:id',component:User,
         props: route => {{uname:'zs',age:20,id: route.params.id}}
    ]
})

const User = {
	props: ['uname','age','id'], //使用props 接收路由参数
    template:`<div>uname + '----'+ age +'-----'+ id </div>`  //使用路由参数
}
```

## 5.Vue-router 编程式导航

#### 5.1 页面导航的两种方式

- 声明式导航： 通过点击链接实现导航的方式，叫做声明式导航

  例如：普通网页的 a 链接

- 编程式导航： 通过调用 JavaScript 形式的 API 实现的导航的方式，叫做编程式导航

  例如：普通网页中的 location.href

#### 5.2 编程式导航基本用法

- this,$router.push('hash 地址')
- this.$router.gon(n)

```javascript
const User = {
  template: `<div><button @click="goRegister">跳转到页面</button></div>`,
  methods: {
    Register: function () {
      this.$router.push("/register");
    },
  },
};
```
