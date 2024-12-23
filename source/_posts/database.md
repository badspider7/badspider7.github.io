---
title: 数据库原理
date: 2020-11-16 20:54:39
tags: 数据库
categories: 技术
index_img: /img/dog.jpg
banner_img: /img/sql.jpg
---
<h1>1.关系模型的一些术语</h1>
<ul>
    <li>关系 ：一张二维表，二维表的名字就是关系的名字</li>
    <li>属性 ： 二维表当中的列称为属性，列的个数称为元数，如果一个二维表有n列就是n元关系</li>
    <li>元组 ： 二维表当中的行称为元组</li>
    <li>分量 : 元组的每一个属性称为分量</li>
</ul>


<h1>2.关系的码</h1>
<b>2.1--候选码:</b> 如果一个关系的某属性或属性集的值可以唯一确定一个元组，则称该属性或属性集为候选码<br>
<b>2.2--主码：</b> 如果一个关系有多个候选码，可以从中选出一个作为元组的标识，称为主码或者主键<br>
<i><b>(主码是关系模型中的一个很重要的概念，每个关系必须选择一个主码，选定之后不可以随便更改)</b></i><br>
<b>2.3--主属性与非主属性：</b> 包含在任一候选码中的属性称为主属性，不包含在任一候选码的属性称为非主属性<br>
<b>2.4--外码：</b>如果一个关系R1中的主码所对应的属性或属性集X还存在于另一个关系R2中，则称这个属性或属性集X为R2的外码


<h1>3.关系模式的完整性约束</h1>
<b>2.1 实体完整性 ：</b>
每个关系都有主码，且主码对应的所有属性值不为空<br>
<br>2.2 参照完整性 ：</br>
如果关系R2的外码X与关系R1的主码对应，则X的值或等于R1的主码的某一个值<br>
<br>2.3 用户自定义完整性 ：</br>
用户根据自己的需求而定义的数据库约束条件<br>


<h1 style="text-align: center; color: brown;">关系数据库设计理论</h1>
<h3>6.1--规范化理论：关系数据库设计理论也叫规范化理论</h3>
<b>主要包括： 函数依赖 ，范式 ，模式设计
</b><br>
<b>不合理的关系模式存在的问题</b>
<ul>
    <li>删除异常</li>
    <li>数据冗余</li>
    <li>插入异常</li>
    <li>更新异常</li>
</ul>

<h3>6.2--函数依赖概述</h3>
<b>什么是函数依赖？</b>
<b>函数依赖就是关系模式中属性之间的依赖关系</b><br>
函数依赖与属性之间的联系有关：只有当属于X与属性Y之间存在1：1，m：1才存在函数依赖
当属性X与属性Y之间的是m:n时，不存在函数依赖

<b>逻辑蕴含的定义：</b>