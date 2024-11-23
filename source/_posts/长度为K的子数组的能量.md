---
title: 【每日算法】长度为k的子数组的能量
date: 2024-11-06 9:47:01
tags: 每日一题
categories: 算法
index_img: /img/post/leetcode.jpg
banner_img: 
---



[长度为k的子数组的能量I](https://leetcode.cn/problems/find-the-power-of-k-size-subarrays-i/description/?envType=daily-question&envId=2024-11-06)

tag:`数组` `滑动窗口`

给你一个长度为 `n` 的整数数组 `nums` 和一个正整数 `k` 。

一个数组的 **能量值** 定义为：

- 如果 **所有** 元素都是依次 **连续** 且 **上升** 的，那么能量值为 **最大** 的元素。
- 否则为 -1 。

你需要求出 `nums` 中所有长度为 `k` 的 

子数组

 的能量值。



请你返回一个长度为 `n - k + 1` 的整数数组 `results` ，其中 `results[i]` 是子数组 `nums[i..(i + k - 1)]` 的能量值。



#### 示例一

**输入：**nums = [1,2,3,4,3,2,5], k = 3

**输出：**[3,4,-1,-1,-1]

**解释：**

`nums` 中总共有 5 个长度为 3 的子数组：

- `[1, 2, 3]` 中最大元素为 3 。
- `[2, 3, 4]` 中最大元素为 4 。
- `[3, 4, 3]` 中元素 **不是** 连续的。
- `[4, 3, 2]` 中元素 **不是** 上升的。
- `[3, 2, 5]` 中元素 **不是** 连续的。



#### 题解：

```js
const ans = Array(nums.length - k + 1).fill(-1);
    let cnt = 0;
    for (let i = 0; i < nums.length; i++) {
        cnt = i === 0 || nums[i] === nums[i - 1] + 1 ? cnt + 1 : 1;
        if (cnt >= k) {
            ans[i - k + 1] = nums[i];
        }
    }
	return ans;
}
```

#### 思路：

要特别注意是**连续的**这个意思，就是一定是 num[i] === num[i] +1 ，这个才叫连续

其实就是判断一个定长的窗口中是否是连续的，如果是就返回最大值

要找连续上升的段。如果段长至少是 *k*，那么这段中的所有长为 *k* 的子数组都是符合要求的，子数组的最后一个元素是最大的。

#### 最开始的写法

```js
/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number[]}
 */
/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number[]}
 */
var resultsArray = function (nums, k) {
    let p1 = 0, p2 = k - 1
    let n = nums.length
    const result = []
    while (p2 <= n - 1) {
        let tempArr = nums.slice(p1, p2 + 1)
        const res = getMax(tempArr)
        result.push(res)
        p1++
        p2++
    }

    return result
};

const getMax = function (arr) {
    let isSort = true
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] != arr[i + 1]-1) {
            isSort = false
            break
        }
    }

    if (isSort) return arr[arr.length-1]
    return -1
}
```

这样子写的话过不了第二种[长度为k的子数组的能量||](https://leetcode.cn/problems/find-the-power-of-k-size-subarrays-ii/description/)的最后几个测试

#### 复杂度

时间复杂度：O(n)

空间复杂度：O(1)