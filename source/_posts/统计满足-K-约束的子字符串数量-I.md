---
title: 统计满足 K 约束的子字符串数量 I
date: 2024-11-11 11:49:55
tags: 每日一题
categories: 算法
index_img: /img/post/leetcode.jpg
banner_img:
---

[3258. 统计满足 K 约束的子字符串数量 I](https://leetcode.cn/problems/count-substrings-that-satisfy-k-constraint-i/?envType=daily-question&envId=2024-11-13)

level: `easy`

tag:`滑动窗口` `字符串`

给你一个 二进制 字符串 s 和一个整数 k。

如果一个 二进制字符串 满足以下任一条件，则认为该字符串满足 k 约束：

字符串中 0 的数量最多为 k。
字符串中 1 的数量最多为 k。

返回一个整数，表示 s 的所有满足 k 约束 的子字符串 的数量。

**示例 1：**

```js
输入：s = "10101", k = 1

输出：12

解释：

s 的所有子字符串中，除了 "1010"、"10101" 和 "0101" 外，其余子字符串都满足 k 约束。
```

#### 题解：

```js
/**
 * @param {string} s
 * @param {number} k
 * @return {number}
 */
var countKConstraintSubstrings = function (s, k) {
  let count = 0;
  let zeroCount = 0,
    oneCount = 0;
  let left = 0;

  for (let right = 0; right < s.length; right++) {
    // 扩展窗口
    if (s[right] === "0") zeroCount++;
    else oneCount++;

    // 当窗口不满足 k 约束时，收缩窗口
    while (zeroCount > k && oneCount > k) {
      if (s[left] === "0") zeroCount--;
      else oneCount--;
      left++;
    }

    // 符合条件的子字符串数量增加
    count += right - left + 1;
  }

  return count;
};
```

#### 思路：

这是一道**不定长滑动窗口**的题目，通过不断遍历右端点，缩小左端点，来统计满足条件的子字符串数量。
**首先** 看题目要求
字符串中 0 的数量最多为 k
字符串中 1 的数量最多为 k
也就是 子串中不能 同时存在超过 k 个 0 和 1
**其次** 可以找到一个规律，当一个最长子串满足条件时，那么它的所有子串都满足条件，也就是 right -left +1 个子串满足
**最后** 通过不断遍历右端点，缩小左端点，来统计满足条件的子字符串数量。

#### 复杂度：

- 时间复杂度：O(n)
- 空间复杂度：O(1)
