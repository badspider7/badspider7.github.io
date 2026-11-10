---
title: 给 Agent 平台接 Opik：先别急着做“评测平台”
date: 2026-09-14 23:05:00
categories: [Agent]
tags: [Opik, 可观测, 评测]
---

上个月有个任务失败了，日志里只有一行 `agent_error`。我翻了半天执行消息，才发现它在第 3 步选错了工具，第 5 步上下文超限，最后模型开始胡说。

这件事之后，我意识到 Agent 平台做到一定规模，一定会遇到三个问题：

1. 任务失败了，到底是模型、工具、上下文，还是权限？
2. 想换模型，怎么知道新模型在这个业务上真的更好？
3. 改了一版 Prompt，怎么判断有没有把别的场景改坏？

这三个问题，靠日志回答不了。日志能告诉你“报错了”，但告诉不了你“Agent 在第 3 步选错了工具，导致第 5 步上下文超限”。

所以我们最近在给平台接 Opik。先说结论：**这是个 PoC，不是已经跑通的生产系统。** 但踩过的坑和设计取舍，可以先记下来。

<!-- more -->

## Opik 是什么

[Opik](https://github.com/comet-ml/opik) 是 Comet 开源的一个 LLM 可观测与评测平台，Apache-2.0，可以自托管。

它主要做几件事：

- 记录 trace/span：一次任务、一次工具调用、一次模型调用；
- 管理 dataset 和 experiment：用同一批数据对比不同模型/Prompt；
- 跑评测：LLM-as-a-judge、规则指标、人工 feedback；
- 线上评测：对生产 trace 按采样率自动打分，结果可以接告警。

文档在 [comet.com/docs/opik](https://www.comet.com/docs/opik/)。我们看中的是“自托管 + trace/评测一体”，不是它某个单点功能。

## 背景：为什么不是只看日志

平台跑起来之后，每个任务都有执行消息和模型用量。日志也能查，但它们是散的：

- 失败日志只有一句错误码；
- 工具调用散在不同服务里；
- 模型用量是一张汇总表，看不出是哪一步花的多；
- 换模型、改 Prompt 之后，没有可对比的基线。

我们需要一个东西，把“任务 → 工具 → 模型”串成一条链，能看、能比较、能回归。

## 先明确：观测对象是平台

一开始我想省事，先给一个 Coding Agent 接个 exporter，看看 trace 长什么样。后来发现方向不对。

单个 Agent 只能回答“这个客户端为什么失败”；平台才能回答“这类任务为什么失败、换模型有没有用、Prompt 改了会不会回归”。

平台本身已经有三类数据：

```text
任务表      status / started_at / completed_at / result / error / failure_reason
消息表      text / tool_use / tool_result / error
用量表      provider / model / input_tokens / output_tokens / cache / cost
```

再加上 Agent 的 instructions、任务的输入和验收标准，基本能还原一次执行。

这比“在每个 Agent 里埋点”靠谱：不用改 Agent CLI，不用改 Server，先做一个只读的 sidecar 就能跑。

## Trace 怎么设计

一条任务映射成一条 Opik trace：

```text
trace: task:<id>
├─ agent.run              整体耗时、状态、失败原因
├─ tool.read_file         工具入参/出参/耗时
├─ tool.create_issue      工具入参/出参/耗时
├─ llm.provider.model     模型用量/成本（任务级聚合）
└─ feedback: task_success
```

消息表里的 `tool_use` 和 `tool_result` 按工具名和顺序配对，能算出每个工具花了多久、有没有返回。用量表按 `(task, provider, model)` 聚合，能给出一条任务用了多少 token、花了多少钱。

这里必须说清楚一个边界：**Agent CLI 在 daemon 里跑，平台拿到的是任务级 usage，不是每次模型调用的 span。**

所以 MVP 里的 `llm.*` span 是聚合的，不是 per-call。要做到 per-call，得在 daemon 的 provider 适配层加 hook，或者让 provider 走 OpenTelemetry。这是二期，不能对外说成“每次调用都能看到”。

## 旁路 bridge：先不改 Agent

MVP 的做法是一个 Python sidecar：

```text
Postgres（只读）
  → 拉取最近 N 天的 completed/failed task
  → 查消息 / 用量
  → 组装 trace/span
  → 写 Opik
  → 本地 SQLite 记录已导出 task，防重复
```

一条任务的导出逻辑大概是：

```python
trace = client.trace(
    name=f"task:{task_id[:8]}",
    input={"title": title, "description": description},
    output={"status": status, "comment": comment},
    metadata={
        "agent": agent_name,
        "model": model,
        "prompt_hash": sha256(instructions)[:16],
        "failure_reason": failure_reason,
    },
    feedback_scores=[
        {"name": "task_success", "value": 1.0 if status == "completed" else 0.0}
    ],
)

for tool in tool_pairs:
    trace.span(name=f"tool.{tool.name}", type="tool", input=..., output=...)

for usage in usage_rows:
    trace.span(
        name=f"llm.{usage.provider}.{usage.model}",
        type="llm",
        metadata={
            "input_tokens": usage.input_tokens,
            "output_tokens": usage.output_tokens,
            "cost_usd": usage.cost_usd,
        },
    )
```

好处是可回放：历史任务可以补，出问题可以重跑，不影响线上。坏处是有延迟：MVP 用轮询，不是实时。实时看板要等二期接事件流。

## 评测：不要一上来就建“平台”

我见过一些团队，第一件事是搭一个“评测平台”：数据集管理、标注、实验、看板、权限……做了两个月，还没回答一个业务问题。

我们的顺序反过来。

### 第一步：先回答“这次失败是谁的问题”

拿最近 20 条失败任务，导出 trace，人工看：

- 是工具报错，还是模型选错工具？
- 是上下文超限，还是 Prompt 没说清楚？
- 是权限问题，还是用户输入本身不合法？

这一步不需要评测集，只需要 trace。

### 第二步：模型 A/B

选 30–50 条真实任务，覆盖成功、失败、边界。固定 Prompt、工具、温度，只换模型，跑两遍。

看的不是“哪个分数高”，而是：

- 任务成功率；
- P95 时延；
- token/任务；
- 单任务成本；
- 人工返工率。

很多时候，贵模型只在少数任务上更好，大部分任务用便宜模型就够。没有这组数据，选型就是拍脑袋。

### 第三步：Prompt 回归

`prompt_hash` 写进 trace。改 Prompt 前后，用同一套回归集跑 experiment，比较成功率、成本、时延。

门禁可以很简单：

```text
成功率下降 > 5% → 阻断
成本上升 > 20% → 人工确认
P95 上升 > 30% → 排查
```

不是所有指标都要自动阻断，但至少要有一个“改坏了能发现”的机制。

## 采样、隐私、成本

Agent 的 trace 里可能有用户输入、文件内容、工具输出，不能无脑全量存。

我们的原则：

- 线上采样 10–20%，失败/慢请求 100%；
- 工具输出截断到 4KB，完整内容留在业务库；
- PII 脱敏，按 workspace 隔离；
- 保留期 30–90 天，过期归档；
- 异步上报，Opik 挂了不能影响业务。

Opik 官方说能扛 40M+ traces/day，但我们的量级远没到。先保证“关键链路可见”，再谈规模。

## 现在的状态

目前只是把 bridge 跑通，能看到单条任务的 trace、工具耗时、模型用量。评测集和模型 A/B 还在补。

还不够好的地方：

- LLM span 是任务级聚合，不是 per-call；
- 工具配对没有稳定的 `call_id`，并发工具多时可能错配；
- 没有做线上告警，只能人看；
- 评测集只有几十条，统计意义有限。

但至少方向是对的：先有问题，再有指标；先有 trace，再有平台。反过来做，很容易做出一个“看起来很专业、但没人用”的观测系统。

如果你也在做 Agent 平台，我的建议是：先挑一个业务 Agent，把它的任务、工具、模型用量导成一条 trace，然后拿这条 trace 去回答一个真实的失败问题。能回答，再扩；回答不了，说明你的 trace 设计有问题。
