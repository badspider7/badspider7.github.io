---
title: 检测相邻递增子数组 II
date: 2024-11-10 23:28:54
tags: 算法
categories: 算法
index_img: /img/post/leetcode.jpg
banner_img:
---

[3350. 检测相邻递增子数组 II](https://leetcode.cn/problems/adjacent-increasing-subarrays-detection-ii/description/)

tag:`动态规划` `二分查找`

给你一个由 n 个整数组成的数组 nums ，请你找出 k 的 最大值，使得存在 两个 相邻 且长度为 k 的 严格递增 子数组。具体来说，需要检查是否存在从下标 a 和 b (a < b) 开始的 两个 子数组，并满足下述全部条件：

这两个子数组 nums[a..a + k - 1] 和 nums[b..b + k - 1] 都是 严格递增 的。
这两个子数组必须是 相邻的，即 b = a + k。
返回 k 的 最大可能 值。

子数组 是数组中的一个连续 非空 的元素序列。

**示例 1：**

```js
输入：nums = [2,5,7,8,9,2,3,4,3,1]

输出：3

解释：

从下标 2 开始的子数组是 [7, 8, 9]，它是严格递增的。
从下标 5 开始的子数组是 [2, 3, 4]，它也是严格递增的。
这两个子数组是相邻的，因此 3 是满足题目条件的 最大 k 值。


```

#### 题解：

```js
/**
 * @param {number[]} nums
 * @return {number}
 */
var maxIncreasingSubarrays = function (nums) {
  let pre = 0,
    cnt = 0,
    ans = 0;

  for (let i = 0; i < nums.length; i++) {
    cnt++;

    if (i === nums.length - 1 || nums[i] >= nums[i + 1]) {
      ans = Math.max(ans, Math.floor(cnt / 2), Math.min(pre, cnt));
      pre = cnt;
      cnt = 0;
    }
  }

  return ans;
};
```

#### 思路：

- 遍历数组，统计递增子数组的长度，当遇到非递增的元素时，更新最大值，并重置递增子数组的长度。
- 遍历过程中，记录当前递增子数组的长度，以及上一个递增子数组的长度。
- 更新最大值时，需要考虑两种情况：
  - 当前递增子数组的长度的一半，即可以拆分成两个递增子数组。
  - 上一个递增子数组的长度和当前递增子数组的长度，即可以合并成一个递增子数组。

#### 复杂度：

- 时间复杂度：O(n)
- 空间复杂度：O(1)
