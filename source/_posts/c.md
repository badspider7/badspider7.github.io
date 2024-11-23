---
title: c语言求阶乘的两种办法
date: 2020-08-2 10:26:13
tags: c语言
categories: 技术
index_img: /img/ctext.jpg
banner_img: /img/d.jpg
---
## 循环法
循环法还是比较简单的，就先输入你要求的阶乘n，然后一直自减

```c
#include <stdio.h>
main()
{
	long n,sum=1;//10 以上的阶乘就比较大了
	int i;
	printf("请输入你要求的阶乘：");
	scanf("%d",&n);//先输入要求的数
	for(i=n;i>0;i--)//乘到1为止
	{
		sum*=i;
	}
	printf("%d  !=  %d",n,sum);
	return 0;
	}
```
完成后的结果是这样子的
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200203133655288.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0JsYWNrX1NwaWRlckM=,size_16,color_FFFFFF,t_70)
## 递归法
编程语言中，函数Func(Type a,……)直接或间接调用函数本身，则该函数称为递归函数。递归函数不能定义为内联函数。
就像我和你说：“从前有座山，山上有座庙，庙里有个小和尚，老和尚和小和尚说：从前有座山，山上有座庙，庙里有个小和尚，老和尚和小和尚说：巴拉巴拉的”

```c
#include<stdio.h>
int fun(int n)
{
if(n==1||n==0) return 1;//如果参数是0或者1返回1
return n*fun(n-1);//否则返回n和下次递归的积
}

int main()
{
int n;
scanf("%d",&n);
printf("%d\n",fun(n));
return 0;
}

```
完成的结果就是这样子的
![在这里插入图片描述](https://img-blog.csdnimg.cn/20200203134553365.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0JsYWNrX1NwaWRlckM=,size_16,color_FFFFFF,t_70)

***使用递归要注意的就是关于结束的条件，不然程序会崩溃的***
