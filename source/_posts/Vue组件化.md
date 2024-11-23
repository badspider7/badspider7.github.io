---
title: Vue组件化
date: 2021-05-25 15:03:37
tags: Vue
categories: 前端
index_img: /img/Vue.jpg
banner_img: 
---
## 1.组件注册

#### 1.1 全局组件注册语法

```javascript
VUe.component(组件名称,{
    data: 组件数据,
    template: 组件模板内容
})
```

```javascript
//定义一个名为 button-counter的新组件
VUe.component('button-counter',{
    data:function(){
        return {
			count: 0
        }
    },
    template: '<button v-on:click="count++">点击了{{count}}次.</button>'
})
```

#### 1.2 组件的用法

```html
<div id="app">
    <button-counter></button-coumter>
</div>
```

#### 1.3 组件的注意事项

1. data必须是一个函数
	* 分析函数与普通对象的对比
2. 组件模板内容必须是单个根元素
	* 分析演示实际的效果
3. 组件模板内容可以是模板字符串
	* 模板字符串需要浏览器提供支持（ES6语法）

#### 1.4组件命名方式

* 短横线方式

	```javascript
	Vue.component('my-component',{/*.............*/})
	```

* 驼峰方式

	```javascript
	Vue.component('MyCompoonent',{/*.............*/})
	```

	#### 1.5局部组件注册

	```javascript
	var ComponentA = {/*.........*/}
	var ComponentB = {/*.........*/}
	var ComponentC = {/*.........*/}
	
	new Vue({
		el: '#app'
	    component: {
	    'component-a': ComponentA,
	    'component-a': ComponentB,
	    'component-a': ComponentC,
	}
	})
	```

	## 2.组件间数据交互

	#### 2.1 父组件向子组件传值

	* 组件内部通过props接收传递过来的值

	```javascript
	Vue.component('menu-item',{
	    props: ['title'],
	    template: '<div>{{title}}</div>'
	})
	```

#### 2.2 父组件通过属性将值传递给子组件

```html
	<menu-item title="来自父组件的数据"></menu-item>
	<menu-item :title="title"></menu-item>
    ```
#### 2.3 props属性名规则

* 在props中使用驼峰形式，模板中需要使用短横线的形式
* 字符串形式的模板中没有这个限制

#### 2.4 props属性值类型

* 字符串 String
* 数值 Number
* 布尔值 Boolean
* 数组 Array
* 对象 Object

#### 2.5 子组件向父组件传值

> props 传递数据原则： 单向数据流

**子组件通过自定义事件向父组件传递信息**

```html
<button v-on:click='$emit("enlarge-text")'>
    扩大字体
</button>
```

**父组件监听子组件的事件**

```html
<menu-item v-on:enlarge-text='fontSize += 0.1'></menu-item>
```

## 3.组件插槽

#### 3.1 组件插槽的作用

* 父组件向子组件传递内容

**插槽位置**

```javascript
Vue.component('alert-box',{
	template: `
	<div class="demon-alert-box">
	<strong>Error</strong>
	<slot></slot>
`
})
```

**插槽内容**

```javascript
<alert-box>someting is happen</alert-box>
```

#### 3.2 作用域插槽

* 应用场景： 父组件对子组件的内容进行加工和处理