---
title: node的简单爬虫
date: 2021-12-19 22:29:35
tags: 后端
index_img: /img/spider.jpg
banner_img:
---

> 你们看到这个封面可能以为我是用的**playwright**，其实不是，只是一个简单的小功能

关于爬虫呢，就是可以代替人去做一些本来是人可以做的东西，但是会很繁琐和麻烦。

**!!! 有些数据是不能爬取滴**

我们的互联网就是一张超级大的蜘蛛网，而每一个你想要了解的知识就是一个个食物，爬虫呢就是那只蜘蛛，可以通过每条特定的线路去获取食物，这个特定的线路就是每个url（网址）

我所知道到的爬虫工具有**puppeteer**、**playwright**、**selenium**、**scrapy**

------

爬虫大概有四个步骤

1. 获取目标网页数据
2. 分析目标网页得到想要的数据
3. 下载数据
4. 保存数据



例子：

就拿我的网站https://badspider.top  来做个例子吧

首先要`npm init -y` 初始化一个node项目，然后需要下载一些必须的包

*cnpm i axios download cheerio --save*

```javascript
const axios = require('axios') 		// 发送 http 请求
const cheerio = require('cheerio')   // 解析 HTML 代码
const download = require('download')  // 下载文件

const HOST = 'https://badspider.top'
let arr = []

const req = axios.create({
    method: 'get',
    baseURL:"https://badspider.top/"
})

async function getInfo() {
    const { data } = await req()
    const $ = cheerio.load(data)
    let imgs = $('.index-card .index-img a>img') // 获取到图片的具体dom结构
    imgs.each((index, el) => {
        let imgUrl = el.attribs.src   // 获取到图片的url
        let pics = ''
        // 因为我的有些图片是外链，所以需要判断一下
        if (imgUrl.slice(0, 4) == 'http') {
             pics = `${imgUrl}`
        }
        else {
             pics = `${HOST}/${imgUrl}`
        }
     
        arr.push(pics)
    })
    // 下载图片到文件夹
    await Promise.all(arr.map(url => download(url, 'picture')));
    console.log(arr);
}

getInfo()
```

**最后console.log(arr)出来的数据**

- 总结：

​	学习到了**cheerio**这个库的使用，服务器端的JQuery，可以很方便的操作DOM，同时也小小的体验了一下爬虫的乐趣哈哈哈哈，最开始学网页就是因为python里面的爬虫要学一丢丢的网页知识才学的前端，结果学着学着就喜欢上了前端，觉得在计算机里面有很多有趣的事情可以靠自己去实现，只需要一点点的时间就可以了，还是很nice的，接下来就是看playwright的文档了

#### 小彩蛋：

> windows 下面自带的表情里面居然也有这个🎭哈哈哈哈，playwright的图标，很喜欢这个风格，还有sails.js的风格也蛮不错的





