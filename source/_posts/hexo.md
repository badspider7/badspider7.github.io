---
title: 关于用hexo和GitHub搭建自己的免费博客
date: 2020-08-12 10:26:13
tags: hexo
categories: blog
index_img: /img/hexo.jpg
banner_img: /img/3.jpg
---
@[TOC]( )
# 前言
##  1.为什么要搭建博客
* 暑假在家没什么事情，就想着自己可以搭建一个有自己个性，好看点的网站，但是技术又不够，刚好看到hexo这个框架，主打的就是依赖少易于安装使用，可以方便的生成静态网页托管在GitHub和Coding上，是搭建博客的首选框架，**平时可以记下自己的笔记，以后遇到同样的问题就不用到处去找了**
##  2.搭建博客的作用
1、发布个人博客网站，不受平台约束，充分发表个人态度。

2、平台改版也不会影响到博客内容的发布

3、不会出现博客内容丢失的情况

4、个人博客网站交互性更强

5、更利于博客网站的优化和推广
#   需要准备的搭建环境
##   1.Node.js
### 1.1下载node.js
- Node.js 的实质是一个JavaScript运行环境,在这里我们使用它来生成我们博客的静态页面------- ==Node.js==[官网](http://nodejs.cn/).
- 根据你的电脑下载对应的版本就可以了
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200810214856831.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0JsYWNrX1NwaWRlckM=,size_16,color_FFFFFF,t_70)
**（注意下载的是msi）**
###   1.2 搭建node.js的环境
- 这里直接就一直点==next==就ok了，不用点别的
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200810215147363.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0JsYWNrX1NwaWRlckM=,size_16,color_FFFFFF,t_70)
- 当你安装完成之后，查看一下是否安装成功
- 用win+R输入cmd打开电脑的终端，输入node -v，查看是否安装成功
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200810215458159.png)
**如果出现版本号就说明安装成功了**

##  2.Git
###  2.1 下载Git
Git的 [官网](https://git-scm.com/) 根据自己的电脑下载对应的版本就可以了
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200810215945900.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0JsYWNrX1NwaWRlckM=,size_16,color_FFFFFF,t_70)
###  2.2 安装Git
- 和上面安装一样，一直==next==就可以了
**当然如果你不安装在c盘的话就自己选一个别的盘安装（最好不要安装在c盘）**
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200810220035692.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0JsYWNrX1NwaWRlckM=,size_16,color_FFFFFF,t_70)
###  2.3判断git安装成功
在桌面鼠标点击右键，有Git GUI Here和Git Bash Here，则安装成功![在这里插入图片描述](https://img-blog.csdnimg.cn/20200810220527448.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0JsYWNrX1NwaWRlckM=,size_16,color_FFFFFF,t_70)



或者你看看新安装的程序里面有没有这三个
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200810220516596.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0JsYWNrX1NwaWRlckM=,size_16,color_FFFFFF,t_70)
##  3.安装淘宝镜像
- 在桌面鼠标右键或者任意一个地方，选择Git Bash Here
- 输入下面的代码，静静等待就可以了

```
cnpm install -g cnpm --registry=https://registry.npm.taobao.org
```
##  4.安装hexo博客
###  1.在你喜欢的盘下面新建一个文件夹
- （你可以起名为myblog）然后进入这个文件夹，右键==Git Bash Here==打开Git终端输入以下代码
```javascript
npm install hexo-cli -g
npm install hexo-deployer-git --save
```
可以用`hexo -v`来检查是否安装成功
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200810221842905.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0JsYWNrX1NwaWRlckM=,size_16,color_FFFFFF,t_70)
### 2.初始化博客
进入该文件夹右键 Git Bash Here，输入以下命令
- 输入  ```hexo  init ```初始化自己的博客
- 然后你就可以看到你的myblog文件夹里面多了好多文件，其中有一个_config.yml文件![在这里插入图片描述](https://img-blog.csdnimg.cn/20200810222427595.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0JsYWNrX1NwaWRlckM=,size_16,color_FFFFFF,t_70)
这个就是你的基本配置文件

#  在本地安装完成了
- 在文件夹右键Git Bash Here执行以下命令，执行完即可点击[http://localhost:4000/](http://localhost:4000/) 查看效果
```javascript
$ hexo generate
$ hexo server
```
- 如果出现了以下信息就说明成功了
```j
INFO Hexo is running at http://0.0.0.0:4000/. Press Ctrl+C to stop.
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200810224147173.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0JsYWNrX1NwaWRlckM=,size_16,color_FFFFFF,t_70)
#  将博客部署到 GitHub上面去
- 到目前为止，我们的本地博客就成功搭建了，但是现在我们只能通过本地连接查看博客，我们要做的是让其他人也能够访问我们的博客，这就需要我们将博客部署到Github Pages上
##  1.注册GitHub账户：
[点击此处](https://github.com/) 访问官网，点击 sign up 注册账户

##  2.创建项目代码库
点击 ==New repository==开始创建
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200810224738547.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0JsYWNrX1NwaWRlckM=,size_16,color_FFFFFF,t_70)
##  3.配置==ssh==密匙
- 只有配置好 SSH 密钥后，我们才可以通过 git 操作实现本地代码库与 Github 代码库同步，在你第一次新建的文件夹里面（如：我的文件夹为：D\blog） Git Bash Here 输入以下命令
```j
$ ssh-keygen -t rsa -C "your email@qq.com"
//引号里面填写你的邮箱地址
```
- 然后就会有
```jEnter passphrase (empty for no passphrase):
//不要输入直接回车就行
Enter same passphrase again
```
- 接下来就会有
```jYour identification has been saved in /c/Users/you/.ssh/id_rsa.
Your public key has been saved in /c/Users/you/.ssh/id_rsa.pub.
The key fingerprint is:
这里是各种字母数字组成的字符串，结尾是你的邮箱
The key's randomart image is:
这里也是各种字母数字符号组成的字符串
```
- 运行以下命令，将公钥的内容复制到系统粘贴板上
```j
$ clip < ~/.ssh/id_rsa.pub
```

##  4.在GitHub中添加你的公匙
###  4.1登陆 GitHub，进入 Settings：
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200810225604719.png)
###  4.2点击 ==SHH and GPG Keys==
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200810225700749.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0JsYWNrX1NwaWRlckM=,size_16,color_FFFFFF,t_70)
###  4.3选择 ==New SSH Key：
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200810225800165.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0JsYWNrX1NwaWRlckM=,size_16,color_FFFFFF,t_70)
###  4.4粘贴密匙：
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200810225739776.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0JsYWNrX1NwaWRlckM=,size_16,color_FFFFFF,t_70)
###  4.5测试
输入以下命令：
```j
$ ssh -T git@github.com
```
- 看到（yes/no）之后输入yes会显示：
```j
Hi xxx!You've successfully ..............
```
就说明设置正确
###  4.6配置Git个人信息
- Git 会根据用户的名字和邮箱来记录提交，GitHub 也是用这些信息来做权限的处理，输入以下命令进行个人信息的设置，把名称和邮箱替换成你自己的，名字可以不是 GitHub 的昵称，但为了方便记忆，建议与 GitHub 一致
```j
$ git config --global user.name "此处填你的用户名"
$ git config --global user.email "此处填你的邮箱"
```
到此为止 SSH Key 配置成功，本机已成功连接到 Github

##  5.将本地的 Hexo 文件更新到 Github 的库中
- 一、登录 Github 打开自己的项目 yourname.github.io
- 二、鼠标移到 Clone or download 按钮，选择 Use SSH
- 三、一键复制地址
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200810230750561.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0JsYWNrX1NwaWRlckM=,size_16,color_FFFFFF,t_70)

- 四、打开你创建的 Hexo 文件夹（如：D:\\myblog），右键打开该文件夹下的 _config.yml 文件，在文件的最下面有==deploy==
**改成如下的样子：**

```j
deploy:
	type: git #注意冒号后面都有一个空
	repository: #刚刚复制的内容
	branch: master
```
##  6.在 Hexo 文件夹下分别执行以下命令

```c
$ hexo g
$ hexo d
```
或者直接执行

```c
$ hexo g -d
```
执行完之后会让你输入你的 Github 的账号和密码，如果此时报以下错误，说明你的 deployer 没有安装成功

```c
ERROR Deployer not found: git
```
需要执行以下命令再安装一次

```c
npm install hexo-deployer-git --save
```
再执行 ```j
hexo g -d```你的博客就会部署到 Github 上了
##  7.访问博客
==你的博客地址：https://你的用户名.github.io==