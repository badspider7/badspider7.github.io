---
title: Gulp
date: 2021-04-11 14:35:55
tags: Gulp
categories: 后端
index_img: /img/gulp-index.jpg
banner_img: /img/gulp-banner.png
---
## 1.第三方模块Gulp

基于node平台开发的前端构建工具

将机械化操作编写成任务，想要执行机械化操作时执行一个命令行命令任务就能自动执行了

#### 1.1Gulp能做什么

* 项目上线，HTML，css，js文件压缩
* 语法转换(es6,less,scss)
* 公共文件抽离
* 修改文件浏览器自动刷新

#### 1.2.Gulp中提供的方法

* gulp.src():获取任务要处理的文件
* gulp.dest()：输出文件
* gulp.task():建立gulp任务
* gulp.watch():监控文件的变化

```javascript
const gulp = require('gulp')
//使用gulp.task()方法建立任务
gulp.task('first',()=>{
    //获取要处理的文件
    gulp.src('./src/css/base.css')
    //将处理后的文件输出到dist目录
    .pipe(gulp.dest('./dist/css'))
})
```

#### 1.3Gulp插件

* gulp-htmlmin：html文件压缩
* gulp-csso：压缩css
* gulp-babel：JavaScript语法转化
* gulp-less：less语法转化
* gulp-uglify：压缩混淆JavaScript
* gulp-file-include：公共文件包含
* browsersync：浏览器实时同步

>  gulp-htmlmin  (只会压缩html中的代码，并不会压缩css中的代码)
>
>  使用步骤
>
>  1.下载   2.引用   3.调用

#### 1.4构建任务

```javascript
//复制文件夹
gulp.task('copy',()=>{
    gulp.src('./src/images/*')
    	.pipe(gulp.dest(dist/images));
    gulp.src('./src/lib/*')
    	.pipe(gulp.dest('dist/lib'))
})


//构建任务
gulp.task('default',['htmlmin','cssmin','copy']);
//这样子就可以一下子执行多个任务了
```

## 2.package.json文件

#### 2.1node_modules文件夹的问题

1. 文件夹以及文件过多过碎，当我们将项目整体拷贝给别人的时候，传输速度会很慢很慢
2. 复制的模块依赖关系需要被记录，确保模块的版本和当前保持一致，否则会导致当前项目运行报错

#### 2.2package.json文件的作用

项目描述文件，记录了当前项目信息，例如项目名称，版本，作者，github地址，当前项目依赖了哪些第三方模块等。

使用`npm init -y`命令生成

**第一个的解决方法**

当我们把文件传输给别人的时候，是不需要传输node_modules 文件的,packages.json 这个文件里面会保存有你下载的模块的名称和版本，只需要 `npm install`就可以下载原来所需的所有模块了

#### 2.3项目依赖

* 在项目的开发阶段和线上运营阶段，都需要依赖的第三方包，称为项目依赖
* 使用npm install 包名命令下载的文件会默认被添加多package.json 文件的dependencies字段中

```javascript
{
	"dependencies":{
		"jquery":"^3.3.1"
	}
}
```

#### 2.4开发依赖

* 在项目的开发阶段需要依赖，线上运营阶段不需要依赖的第三方包，称为开发依赖
* 使用 npm install 包名 --save-dev 命令将包添加到 package.json 文件的 devDependencies字段中

> 使用 --save-dev 命令可以把开发依赖和项目依赖区分开来

#### 2.5 项目依赖和开发依赖的下载

当你使用 `npm install`的时候，是下载的全部包

当你使用`npm install --production`的时候，下载的是项目依赖

#### 2.6 package-lock.json文件的作用

当我们在下载第三方模块的时候，npm会同时产生另一个文件 package-lock.json

* 锁定包的版本，确保再次下载时不会因为包版本不同而产生问题
* 加快下载速度，因为该文件中已经记录了项目所依赖第三方包的树状结构和包的下载地址，重新安装时只需下载即可，不需要做额外的工作

## 3.Node.js中模块加载机制

#### 3.1 模块查找规则-当模块拥有路径但没有后缀

`require('./find.js')`

`require('./find')`

1. require方法根据模块路径查找模块，如果是完整路径，直接引入模块

2. 如果模块后缀省略，先找同名js文件再找同名js文件夹
3. 如果找到了同名文件夹，找文件夹中的index.js
4. 如果文件夹中没有index.js就会去当前文件夹中的package.js文件中查找main选项的入口文件
5. 如果找指定的入口文件不存在或者没有指定入口文件就会报错，模块没有被找到

#### 3.2模块查找规则-当模块没有路径且没有后缀时

`require('find')`

1. Node.js 会假设它是系统模块
2. Node.js 会去node_modules文件夹中
3. 首先看是否有该名字的js文件
4. 再看是否有该名字的文件夹
5. 如果是文件夹看里面是否有index.js
6. 如果没有index.js 查看该文件夹中的package.json中的main选项确定模块入口文件
7. 否则找不到报错