---
title: Vue的虚拟DOM
date: 2023-06-07 21:48:43
tags: Vue
categories: 前端
index_img: /img/render-DOM.png
banner_img: /img/render-DOM.png
---
## Vue的渲染机制

>  Vue 是如何将一份模板转换为真实的 DOM 节点的，又是如何高效地更新这些节点的呢？

## 虚拟DOM

VDOM（其实就是一个对象）是一种编程概念，意为将目标所需的 UI 通过数据结构“虚拟”地表示出来，保存在内存中，然后将真实的 DOM 与之保持同步。

```js
const vnode = {
  type: 'div',
  props: {
    id: 'hello'
  },
  children: [
    /* 更多 vnode */
  ]
}
```

这里所说的 `vnode` 即一个纯 JavaScript 的对象 (一个“虚拟节点”)，它代表着一个 `<div>` 元素。它包含我们创建实际元素所需的所有信息。它还包含更多的子节点，这使它成为虚拟 DOM 树的根节点。

一个运行时渲染器将会遍历整个虚拟 DOM 树，并据此构建真实的 DOM 树。这个过程被称为**挂载** (mount)。

如果我们有两份虚拟 DOM 树，渲染器将会有比较地遍历它们，找出它们之间的区别，并应用这其中的变化到真实的 DOM 上。这个过程被称为**更新** (patch)，又被称为“比对”(diffing) 或“协调”(reconciliation)。

## [渲染管线](https://cn.vuejs.org/guide/extras/rendering-mechanism.html#render-pipeline)

从高层面的视角看，Vue 组件挂载时会发生如下几件事：

1. **编译**：Vue 模板被编译为**渲染函数**（render）：即用来返回虚拟 DOM 树的函数。这一步骤可以通过构建步骤提前完成，也可以通过使用运行时编译器即时完成。
2. **挂载**：运行时渲染器调用渲染函数，遍历返回的虚拟 DOM 树，并基于它创建实际的 DOM 节点。这一步会作为[响应式副作用](https://cn.vuejs.org/guide/extras/reactivity-in-depth.html)执行，因此它会追踪其中所用到的所有响应式依赖。
3. **更新**（diff算法）：当一个依赖发生变化后，副作用会重新运行，这时候会创建一个更新后的虚拟 DOM 树。运行时渲染器遍历这棵新树，将它与旧树进行比较，然后将必要的更新应用到真实 DOM 上去。

![render pipeline](https://cn.vuejs.org/assets/render-pipeline.03805016.png)

## 创建VNode

```js
import {h} from 'vue'

const vnode = h(
  'div', // type
  { id: 'foo', class: 'bar' }, // props
  [
    /* children */
  ]
)
```

`h()` 是 **hyperscript** 的简称——意思是“能生成 HTML (超文本标记语言) 的 JavaScript”。这个名字来源于许多虚拟 DOM 实现默认形成的约定。一个更准确的名称应该是 `createVnode()`，但当你需要多次使用渲染函数时，一个简短的名字会更省力。

```js
// 除了类型必填以外，其他的参数都是可选的
h('div')
h('div', { id: 'foo' })

// attribute 和 property 都能在 prop 中书写
// Vue 会自动将它们分配到正确的位置
h('div', { class: 'bar', innerHTML: 'hello' })

// 像 `.prop` 和 `.attr` 这样的的属性修饰符
// 可以分别通过 `.` 和 `^` 前缀来添加
h('div', { '.name': 'some-name', '^width': '100' })

// 类与样式可以像在模板中一样
// 用数组或对象的形式书写
h('div', { class: [foo, { bar }], style: { color: 'red' } })

// 事件监听器应以 onXxx 的形式书写
h('div', { onClick: () => {} })

// children 可以是一个字符串
h('div', { id: 'foo' }, 'hello')

// 没有 props 时可以省略不写
h('div', 'hello')
h('div', [h('span', 'hello')])

// children 数组可以同时包含 vnodes 与字符串
h('div', ['hello', h('span', 'hello')])
```



## [Vnodes 必须唯一](https://cn.vuejs.org/guide/extras/render-function.html#vnodes-must-be-unique)

组件树中的 vnodes 必须是唯一的。下面是错误示范：

js

```js
function render() {
  const p = h('p', 'hi')
  return h('div', [
    // 啊哦，重复的 vnodes 是无效的
    p,
    p
  ])
}
```

如果你真的非常想在页面上渲染多个重复的元素或者组件，你可以使用一个工厂函数来做这件事。比如下面的这个渲染函数就可以完美渲染出 20 个相同的段落：

js

```js
function render() {
  return h(
    'div',
    Array.from({ length: 20 }).map(() => {
      return h('p', 'hi')
    })
  )
}
```



### [`v-if`](https://cn.vuejs.org/guide/extras/render-function.html#v-if)

模板：

```html
<div>
  <div v-if="ok">yes</div>
  <span v-else>no</span>
</div>
```

等价于使用如下渲染函数语法：

```js
h('div', [ok.value ? h('div', 'yes') : h('span', 'no')])
```

JSX语法：

```jsx
<div>{ok.value ? <div>yes</div> : <span>no</span>}</div>
```



## render函数

> createVNode(),h(),render()三者的联系与区别
>
> 干：h() 就是 createVNode()的简称，但是createVNode()函数的功能比h()函数要多且做了性能优化，渲染节点的速度也更快
>
>
> render —— 渲染虚拟 DOM 变成 真实dom
> @param 参数1 要被渲染的虚拟 DOM，必选
> @param 参数2 要渲染的位置，必选
> @description 虚拟 DOM 创建完成后，需要使用 render 函数，才能在页面中渲染
> render(testDiv, document.body);

用于编程式地创建组件虚拟 DOM 树的函数。

- **类型**

	```ts
	interface ComponentOptions {
	  render?(this: ComponentPublicInstance) => VNodeChild
	}
	
	type VNodeChild = VNodeChildAtom | VNodeArrayChildren
	
	type VNodeChildAtom =
	  | VNode
	  | string
	  | number
	  | boolean
	  | null
	  | undefined
	  | void
	
	type VNodeArrayChildren = (VNodeArrayChildren | VNodeChildAtom)[]
	```

	

	1. 先创建虚拟DOM
	2. 用render函数将  虚拟DOM变成 真实DOM
	3. 插入到body中