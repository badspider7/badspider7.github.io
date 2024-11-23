---
title: day 01  学习HTML（上）
date: 2020-08-14 22:56:54
tags: HTML
categories: 前端
index_img: /img/html.jpg
banner_img: /img/g.jpg
---
{% note success %}
今天开始正式学习前端了，python还在进行中，感觉还是喜欢前端一些，当然python也不能落下
{% endnote %}

{% note danger %}
下面是我学HTML的一些笔记，都是很基础的一些，资料可以看看[w3school](https://www.w3school.com.cn/)
{% endnote %}

##  1.前言：
  网站是每一个网页的集合，而网页是构成网站的基本元素，由图片，文字，声音，视频，链接等等，网页也称为**HTML文件**
  html（英语：HyperText Markup Language）是一种超文本标记语言，不是编程语言
 **HTML**文档的后缀名
  - .html
  - .htm

**HTML标签**
- HTML 标签是由尖括号包围的关键词，比如 `<html>`
- HTML 标签通常是成对出现的，比如 `<b>` 和 `</b>`
- 标签对中的第一个标签是开始标签，第二个标签是结束标签
- 开始和结束标签也被称为开放标签和闭合标签
## 2.基本框架
~~~
<html>
	<head>
		<title> 标题</title>
	</head>
	<body>
	主体
	</body>
</html>
~~~
1.所有的标签都必须包含在<>中，成双成对出现，称为双标签，例如：
`<html>(开始标签）</html>(结束标签）`
也会出现特殊的单标签，例如
`<br />`
2.其中又包含这两种关系
包含关系： 
`<head>`
        `<title></title>`
`</head> `


并列关系：
`<head> </head>`
`<body> </body>`

基本结构标签
`<html></html`>HTML标签（ 根标签）
`<head></head>`文档的头部
`<title></title>` 文档的标题
`<body></body>`文档的主体


## 2.HTML标签
~~~
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    
</body>
</html>
~~~
### (1)HTML语法规范
1.`<!DOCTYPE>`doctype 声明是不区分大小写的,在整个页面的最前面的，作用是告诉浏览器用的HTML是哪个版本的
2.lang="en"是网页的语言为英文 （zh-CN 是中文  fr是法语）
3.`<meta chasrset = "UTF-8"/>`是字符编码,是防止乱码的
4.**`<h1>这个是一级标签</h1>`**
<h1>这是一级标签</h1>

 `<h2>这个是二级标签</h2>`
 **<h2>这是二级标签</h2>**

 ..................................
 ..................................
 ..................................
 `<h6>这是最小的一级标签</h6>`
 <h6>这是最小的一级标签</h6>
>一共有6级标签，依据重要性递减，加了标题的文字会变的粗

5.段落和换行标签
`<p>我是一个段落标签</p>`
`<br />` <b>换行标签</b>，<b>/</b> 可写可不写
6.文本格式化标签
加粗------`<strong></strong> 或者 <b></b>`
倾斜------`<em></em> 或者  <i></i>`
删除------`<del></-------> 或者 <s></s>`
下划线------`<ins></ins> 或者 <u></u>`
(每一行前面的语气会比较强烈，建议用前面一个)
7.`<div>`和`<span>`不是标签，是用来装内容的
`<div>这是头部</div>`一行里面只能放一个`<div>`
8.图像标签和路径
`<img src="图像URL"/>`
`<img src="图像URL"  alt="图像显示不出来时候的文字"/>`
`<img src="图像URL"  alt="图像显示不出来时候的文字"  title="提示文本，鼠标放在图片上面时显示的文字"/>`
9.width图像的宽度   height图像的高度    border（css)图像的边框
`<img  src = "img.jpg" width="500" height="100" border= "15"/>`
10.路径
(1)相对路径：图片相对于你的html的位置，如果在同一个位置直接引用它的文件名就可以了
(2)绝对路径：文件的全部路径，网络连接
11.超链接标签 
`<a></a>`
`<a href="跳转目标"  target="跳出目标窗口的方式">文字</a>`
target---->其中_self为默认值，在当前页面打开，_blank新开一个窗口打开
（1）.外部链接`<a href="http://www.baidu.com">百度 </a>`
（2）内部链接`<a href= "index.html">内部</a>`
（3）空链接 `<a href="#"> </a>`
 (4）下载链接 `<a href="img.zip"> </a>`
（5）网页元素的链接`<a href = "http://xxxxx"><img src="img.jpg"></a>`
 (6) 锚点链接 `<a href="#xxx">锚点链接</a> 在你需要跳转的地方前面写上<id = "xxx">`
 12.注释标签
 `<!--这是注释，是不会被执行的-->`  快捷键  {% btn https://qs62rd.coding-pages.com/,CTRL +/, 千万不要点我%}
 13.特殊字符
 有些字符比如 {% btn url, 空格,不要点，点就是error%}空格，`<p>`都是不能和平常一样的，这个时候就需要特殊字符来实现，只需要记住平常的两三个就可以了，到需要用到时候可以去查，见下方链接
<a href="https://tool.lu/htmlentity/" target="_blank">点击跳转到特殊字符页面</a>
 {% note info %}
 **陆续还会更新上的，目前还在学习中🎮**
{% endnote %}