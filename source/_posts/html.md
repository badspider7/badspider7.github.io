---
title: day 02 学习HTML（下）
date: 2020-08-18 16:18:19
tags: HTML
categories: 前端
index_img: /img/html2.jpg
banner_img: /img/g.jpg
---
{% note danger %}
下面是我学HTML的一些笔记，零零碎碎的，你们可以看看这个[w3school](https://www.w3school.com.cn/)
{% endnote %}

## 表格标签
~~~
<table>
	<tr>
		<td>单元格的文字</td>(<th>表头单元格）
		……….
	</tr>
		……………
<table>
~~~

###  (1)表格相关属性（这些属性要写到table中去才可以）
位置： align    -------->       left,center,right 
 边框： border  ------>         1或者""
cellpadding(内容距离边框的距离）
cellspacing (单元格之间的距离）
width,height
### (2)表格结构
`<thead>` 表格的头部区域 ,内部一定要包含`<tr>`
`<tbody>` 表格的主体区域
以上两个标签都是在`<table>`中

## 合并单元格
- 跨行合并：rowspan="合并单元格的个数"
- 跨列合并：colspan="合并单元格的个数"
~~~
<td rowspan="2"></td>
~~~
目标单元格：
跨行：写在最上侧为目标单元格
跨列：写在最左侧为目标单元格
## 列表标签
- 无序列表（重点）
```
<ul>
    <li>xxxxx</li>
    <li>xxxxx</li>
<ul>  
<!-- <ul>中只能出现<li>，但是<li>里面可以放任何东西  -->
```
- 有序列表
```
<dl>
	<dt>大哥</dt>
	<dd>小弟</dd>
	<dd>小弟</dd>
<dl>
```
## 表单标签
分为：表单域，表单控件（表单元素），提示信息
- `<form>` 把表单元素信息提交给服务器
```
<form action ="URL地址" method="提交方式" name="name1">
</form>
```
- `<input>`用于收集用户信息
```
<input type='属性值'/>    单标签
type值的不同指定不同的控件
```
- name:
```<input type="radio"  name="xx">单选按钮和复选框的名字必须相同``` 
- value:在方框中加入文字
- checked="checked" :当页面打开的时候默认打勾
- maxlength  ：可输入的最多字符

##  `<label>`标签
~~~
<label for ="sex"> 男</label>
<input type ="text" id="sex"> 
~~~

## 下拉表单元素
~~~html
<select>
	<option>xxxxxx</option>
	<option>xxxxxx</option>
	<option>xxxxxx</option>
</sele>
~~~
## textarea 文本域
大量的书写文字，多行文本的输入