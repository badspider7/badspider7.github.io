---
title: 小艾的CSS笔记下
date: 2020-08-27 10:26:13
tags: css
categories: 前端
index_img: /img/top6.jpg
banner_img: /img/3.jpg
---
##  三种布局方式：
- 标准流
- 浮动
- 定位

###  浮动
浮动可以改变元素默认的排列方式，最典型的应用就是可以让多个块级元素一行内排列，**多个块级元素纵向排列找标准流。多个块级元素横向排列找浮动**
选择器 {float：属性值}
属性值：
- none 不浮动
- left 左浮动
- right 右浮动
脱离标准普通流的控制移动到指定位置（俗称脱标）
浮动的盒子不再保留原先的位置

### 定位
将盒子定在某一个位置，所以定位也在摆盒子
定位=定位模式+边偏移
**定位模式**
属性position 值：
static 静态定位          relative 相对定位  absolute绝对定位     fixed 固定定位
**边偏移**
边偏移就是定位盒子移动到最终位置  ，有top  right left bottom


**静态定位**
元素默认的定位方式，为定位的意思，没有边偏移
选择器 {position ：static}

**相对定位**
相对定位就是在元素移动位置的时候，是相对于他原来的位置来说的
选择器 {position：relative}
原来的位置还是保留的，下面的盒子不会升上去

**绝对定位**
绝对定位是元素在移动位置的时候，是相对于它祖先元素来说的
选择器 {position ：absolute}
1.如果没有祖元素或者祖元素没有定位，则以浏览器为标准
2.如果父元素有定位，则以父级为参考点移动位置
3.不在占有原来的位置
（ 子绝父相）

**固定定位**
固定定位可以固定于浏览器可视区域的位置，页面在滚动的时候位置不会改变
1.以浏览器的可视窗口为参考页面
2.和父元素没有关系

**粘性定位**
粘性定位可以被认为是相对定位和固定定位的混合，sticky粘性的
选择器 {position ：sticky；top：10px}

1.以浏览器的可视窗口为参考点
2.必须添加 top right left bottom其中一个
3.占有原来的位置

定位的叠放次序：
z-index(z轴）
选择器{z-index:1;}
数值越打盒子越靠上
只有定位的盒子才有的属性


绝对定位的盒子居中：
1.left走  50% 父容器的一半
2.margin  负值  往左走一半  margin-left：


浮动的元素只会压住下面的盒子不会压住下面的文字
绝对定位或者固定定位会压住下面的所有东西


- 鼠标样式
```
li {cursor:pointer}
```
default  默认的
pointer  小手
move     移动
text     文字
not-allowed  禁止的

- 轮廓线
outline  ：none
- 文本域防止拖拉 
textarea {resize ：none}

- 垂直对齐
vertical-align： bottom  /middle/top/  baseline（默认的）

- 溢出文字用省略号代替
1.单行文本溢出
先强制一行内显示
white-space：normal； 如果文字显示不开，自动换行   nowrap 如果显示不开，强制一行显示
超出部分隐藏起来
overflow：hidden；
超出部分用省略号代替
text-overflow：ellipsis；
2.多行文本溢出用省略号代替
overflow：hidden；
text-overflow：ellipsis；
弹性伸缩盒子模型显示
display：-webkit-box；
限制在一个块元素显示的文本的行数
-webkit-line-clamp：2
设置或检索伸缩盒子对象的子元素的排列方式
-webkit-box-orient：vertical；
