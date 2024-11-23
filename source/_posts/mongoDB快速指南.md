---
title: mongoDB快速指南
date: 2021-12-12 14:59:07
tags: mongoDB
categories: 前端
index_img: /img/小雪.png
banner_img: /img/雨水.png
---

### 1.基础概念

什么是集合，文档，字段？
集合就是相当于 关系型数据库中的 **表(table)**

文档就是 相当于 关系型数据库中的 **行(row)**

字段就是  相当于 关系型数据库中的 **列(column)**

主键就是  ==_id==

一个数据库中可以有多个集合，也就是多个表，比如 一个文章数据库中可以有 User,article,Post,Course等等

一个文档的_id是唯一的，也就是一个主键

一个文档中的字段也不能重复 ，就是  name ，age 这些

| _id                      | name      | age  |
| ------------------------ | --------- | ---- |
| 61b561e2fc16177e89714a68 | badspider | 12   |
| 61b561e2fc16177e89714a44 | redspider | 18   |
| 61b561e2fc16177e89714a21 | spiderman | 21   |

### 2.连接数据库

```js
const mongoose = require('mongoose')

mongoose.connect(`mongodb://localhost/${数据库的名字}`)
.then(res=>console.log(res),err=>console.log(err))
```

### 3.创建集合的规则

```js
const UserSchema = new mongoose.Schema({
	name:"String",
    age: "Number",
    adress:"String"
})
```

这个就是你的集合的规则，用来限制你这张表的数据

### 4.使用规则创建集合

```js
const User = mongoose.model('User',UserSchema)
```

### 5.创建集合对象实例

```js
 第一种办法
User.create({name:"badspider",age:12,adress:"china"}).then(res=>console.log(res),err=>console.log(err))

第二种办法
const User = new User({name:"badspider",age:12,adress:"china"}).then(res=>console.log(res),err=>console.log(err))

 第三种办法
const User = new User({name:"badspider",age:12,adress:"china"},(err,res)=>{
    console.log(err)
    console.log(res)                                                                 
})
  保存数据,将course文档(行)插入到文档
User.save
```

### 6.从文件夹导入数据到数据库

> mongoimport -d 数据库名称 -c 集合名称 --file 要导入数据的文件

### 7.查询数据

#### 7.1 find()

通过==find()**得到的数据返回的一个数组

**查询User这个集合下的所有的数据**

```js
User.find().then(res=>console.log(res))  
```

**根据条件查询数据**

```js
User.find({name:"badspiedr"}).then(res=>console.log(res))  
```

#### 7.2 findOne()

通过 ==findOne()** 查找单个数据,返回的是单个对象

```js
User.findOne({age:"23"}).then(res=>console.log(res))  
```

#### 7.3 匹配大于小于

查询年龄在 20 -- 40 之间的文档

```js
User.find({age:{$gt:20,$lt:40}}).then(res=>console.log(res))  
```

#### 7.4 匹配包含

```js
User.find({hobbies:{$in:['吃饭']}}).then(res=>console.log(res))  
```

#### 7.5 选择要查询的字段

一定会包含 _id  ,要是不想要查询某字段的话，需要在前面加上 **-** ，`-_id`表示不需要查询

```js
User.find().select('name age -_id').then(res=>console.log(res))  
```

#### 7.6 将数据进行 升序 排列

```js
User.find().sort('age').then(res=>console.log(res))
```

#### 7.7 将数据进行 降序 排列

```js
User.find().sort('-age').then(res=>console.log(res))
```

### 8.删除数据

#### 8.1 删除单个数据

删除单个文档，返回的值是删除的文档

```js
User.findOneAndDelete({_id:"61b54d87a4d771ff4c1ad2f9"}).then(res=>console.log(res))
```

#### 8.4 删除多个数据

```js
User.deleteMany({}).then(res=>console.log(res))
```

### 9. 更新文档

#### 9.1 更新单个

```js
User.updateOne({查询条件},{要修改的值}).then(res=>console.log(res))
```

#### 9.2 更新多个

```js
User.updateMany({查询条件},{要修改的值}).then(res=>console.log(res))
```

### 10.mongoose 验证

在创建集合的时候，可以设置当前字段的验证规则，验证失败则输入插入就失败

```js
requrie: true 必传字段
 const postSchem = new mongoose.Schema({
     title: {
         type: String,
         required: [true,'请传入文字标题'],
         minlength: 2,
         maxlength: 5
     },
     author: {
         type: String,
         required: true,
          自定义验证规则
         validate: {
              返回布尔值
             validator: v => {
                 return v&&v.length> 7
             },
         },
          自定义错误信息
         message: '传入的值不符合验证规则'
     }
 })

```

### 11.集合关联

*通常 不同集合的数据之间是有关系的，例如文章信息和用户信息存储在不同的集合中，但文章是某个用户发表的，要查询文章的所有信息包括发表用户，就需要用到集合关联*

- 使用 id 对集合进行关联

- 使用populate方法进行关联集合查询

```js
const UserSchema = new mongoose.Schema({
    name: {
        type: String
    }
})
const PostSchema = new mongoose.Schema({
    title: String,
    author: {
         要关联的集合的_id
        type: mongoose.Schema.Types.ObjectId,
         要关联的集合
        ref:'User'
    }
})
const User = mongoose.model('User', UserSchema)
const Post = mongoose.model('Post', PostSchema)

 User.create({ name: "badspider" }).then(res => console.log(res))
 Post.create({title:'nodejs',author:'61b561b05904f504522d9d74'}).then(res => console.log(res))

 联合查询
 1.Post.find().then(res => console.log(res))
 返回的数据
 [
     {
       _id: new ObjectId("61b561e2fc16177e89714a68"),
       title: 'nodejs',
       author: new ObjectId("61b561b05904f504522d9d74"),
       __v: 0
     }
   ]

 2.Post.find().populate('author').then(res=>console.log(res))
 返回的数据
 [
     {
       _id: new ObjectId("61b561e2fc16177e89714a68"),  
       title: 'nodejs',
       author: {
         _id: new ObjectId("61b561b05904f504522d9d74"),
         name: 'badspider',
         __v: 0
       },
       __v: 0
     }
   ]
```

