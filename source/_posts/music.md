---
title: 关于在hexo中添加全局音乐
date: 2020-09-03 19:24:31
tags: aplyer
categories: hexo
index_img: /img/top7.jpg
banner_img: /img/top9.jpg
---
<h3>使用音乐平台提供插件</h3>
以网易云为例，网页端点击生成<b>外链播放器</b>即可生成外链代码，如我的某个歌单生成<a href="https://music.163.com/#/outchain/0/2205641361/">外链</a>

可以在自己博客页面中嵌入插件:
```javascript
<iframe 
 frameborder="no" border="0" 
 marginwidth="0" marginheight="0" 
 width=530 height=310 
 src="//music.163.com/outchain/player?type=0&id=2205641361&auto=0&height=430">
</iframe>
```
**效果**：
缺点非常明显，而最不能忍得是网易音乐有些音乐因为版权保护，没办法生成外链

<h3>使用 hexo-tag-aplayer 插件</h3>
搭建好自己的博客之后，想要在博客中添加音乐播放器。需要hexo-tag-aplayer插件。
使用Git Bash进入本地hexo的文件夹。输入以下命令

```javascript
npm install --save hexo-tag-aplayer
```
原先 hexo-tag-aplayer 不支持 MetingJS，使得需要图片url，音乐url等等参数，操作起来都很麻烦，需要去音乐网站扒音乐播放链接或者下载下来存储在七牛云或本地，要了解具体参数和使用可以查看其<a href="https://github.com/MoePlayer/hexo-tag-aplayer/blob/master/docs/README-zh_cn.md">中文文档</a>了解 
然后在 Hexo 配置文件 _config.yml 中添加设置:

```javascript
aplayer:
    meting: true
```
接着就可以 在文章中使用 MetingJS 播放器了,打开网页版本的网页云，点开一首歌，找到最上面的网址栏的id，把id填到下面去那个meting之后

```javascript
{% meting "id" "netease" "song" "theme:#555" "mutex:true" "listmaxheight:340px" "preload:auto" %}
```
歌单模板

```javascript
{% meting "627070825" "netease" "playlist" "theme:#555" "mutex:true" "listmaxheight:340px" "preload:auto" %}
```
有关选项列表如下:
<div class="table-box"><table><thead><tr><th>选项</th><th>默认值</th><th>描述</th></tr></thead><tbody><tr><td>id</td><td><strong>必须值</strong></td><td>歌曲 id / 播放列表 id / 相册 id / 搜索关键字</td></tr><tr><td>server</td><td><strong>必须值</strong></td><td>音乐平台: <code>netease</code>, <code>tencent</code>, <code>kugou</code>, <code>xiami</code>, <code>baidu</code></td></tr><tr><td>type</td><td><strong>必须值</strong></td><td><code>song</code>, <code>playlist</code>, <code>album</code>, <code>search</code>, <code>artist</code></td></tr><tr><td>fixed</td><td><code>false</code></td><td>开启固定模式</td></tr><tr><td>mini</td><td><code>false</code></td><td>开启迷你模式</td></tr><tr><td>loop</td><td><code>all</code></td><td>列表循环模式：<code>all</code>, <code>one</code>,<code>none</code></td></tr><tr><td>order</td><td><code>list</code></td><td>列表播放模式： <code>list</code>, <code>random</code></td></tr><tr><td>volume</td><td>0.7</td><td>播放器音量</td></tr><tr><td>lrctype</td><td>0</td><td>歌词格式类型</td></tr><tr><td>listfolded</td><td><code>false</code></td><td>指定音乐播放列表是否折叠</td></tr><tr><td>storagename</td><td><code>metingjs</code></td><td>LocalStorage 中存储播放器设定的键名</td></tr><tr><td>autoplay</td><td><code>true</code></td><td>自动播放，移动端浏览器暂时不支持此功能</td></tr><tr><td>mutex</td><td><code>true</code></td><td>该选项开启时，如果同页面有其他 aplayer 播放，该播放器会暂停</td></tr><tr><td>listmaxheight</td><td><code>340px</code></td><td>播放列表的最大长度</td></tr><tr><td>preload</td><td><code>auto</code></td><td>音乐文件预载入模式，可选项： <code>none</code>, <code>metadata</code>, <code>auto</code></td></tr><tr><td>theme</td><td><code>#ad7a86</code></td><td>播放器风格色彩设置</td></tr></tbody></table></div>