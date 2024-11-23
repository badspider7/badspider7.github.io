---
title: Git
date: 2021-04-11 14:45:09
tags: Git
categories: 后端
index_img: /img/git-index.jpeg
banner_img: /img/git-banner.jpg
---
###  1.提交步骤

1. ``git init``初始化git仓库
2. ``git status`` 查看文件状态
3. ``git add 文件列表``  追踪文件
4. ``git commit -m`` 提交信息 向仓库提交代码
5. ``git log`` 查看提交记录



#### 1.1 恢复记录

``git reset --hard commitID`` 将gi仓库中指定的更新记录恢复出来，并且覆盖暂存区和工作目录 

### 2.撤销

* 用暂存区中的文件覆盖工作目录中的文件： ``git checkout 文件``
* 将文件从暂存区中删除： ``git rm --cached 文件``
* 将git仓库中指定的更新记录恢复出来，并且覆盖暂存区和工作目录：``git rest --hard commitID``

> 撤销的意思就是 用之前保存在暂存区的文件去覆盖目前工作区的文件

### 3.git 分支

为了便于理解，大家暂时可以认为分支就是当前工作目录中代码的一份副本

使用分支，可以让我们从开发主线上分离出来，以免影响开发主线 

#### 3.1 主分支（master): 第一次向git仓库中提交更新记录时直动产生的一个分支

#### 3.2 开发分支(develop): 作为开发的分支，基于master分支创建的

#### 3.3 功能分支（feature）: 作为开发具体功能的分支，基于开发分支创建

<span style=" text-decoration:underline; text-decoration-color:red;text-decoration-style: wavy">功能开发->开发分支->主分支 </span>


### 4.分支命令

* ``git branch`` 查看分支
* ``git branch 分支名称`` 创建分支
* `git checkout 分支名称` 切换分支
* `git merge 来源分支`  合并分支
* `git branch -d 分支名称` 删除分支（分支被合并后才允许被删除)(-D 强制删除)

#### 4.1 暂时保存更改

在git中，可以暂时提取分支上所有的改动并存储，让开发人员得到一个干净的工作副本，临时转向其他工作

使用场景：分支临时切换

* 存储临时改动： `git stash`
* 恢复改动：`git stash pop`

#### 4.2把代码push到GitHub里面

可以使用`git push 仓库地址 分支名称`就可以了

> 因为仓库地址的名称太长了不方便，我们就采用别名来命名仓库

`git remote add othername`

**这样子就可以使用othername来使用这个仓库了**

当你上次提交代码到仓库的时候使用了

`git push -u othername master`时，

下次提交代码就只要使用`git push`就可以了

#### 5.克隆代码到本地

克隆远端数据仓库到本地 `git clone 仓库地址`

##### 5.1拉取（pull）最新的仓库到本地

拉取远程仓库中的最新版本到本地`git pull 远程仓库地址 分支名称`

==git clone 命令是在本地没有远程仓库进行的，是完全克隆远程仓库的，基本上是第一次才会使用，而 git pull 命令是在本地之前存在过远程仓库进行的，是拉取最新的仓库==

#### 6.跨团队合作

1. 程序员 C fork 仓库
2. 程序员 C 将仓库克隆在本地进行修改
3. 程序员 C 将仓库推送到远程
4. 程序员 C 发起 pull reqest
5. 原仓库作者审核
6. 原仓库作者合并代码

#### ssh 免登录

1. 生成密钥：`ssh-keygen`
2. 秘钥存储目录：C:\Users\用户\.ssh
3. 公匙名称： id_rsa.pub
4. 私钥名称： id_rsa