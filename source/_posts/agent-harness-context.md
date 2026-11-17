---
title: 不同Agent中 的上下文处理方案
date: 2026-10-14 23:05:00
categories: [Agent]
tags: [agent, context engine]
index_img: https://img.badspider.top/posts/23e7aaa44678d944241c4cd7.png
---

写 coding-agent 的时候，有个问题绕不开：Agent 一直读文件、跑命令、改代码，这些东西到底要带多少给下一次模型请求？

一开始最容易想到的做法，就是把聊天记录全部传进去。用户说了什么、模型回答了什么、工具返回了什么，都存下来，下次接着发。短任务没什么问题，但让它连续查几个模块、跑几轮测试，历史里很快就堆满了代码和日志。

其中很多内容只在当时有用。比如第一次跑测试留下的几千行报错，代码已经修了，后面却还在每次请求里反复携带。等到窗口快满了，再让模型总结一下，又可能把“这个文件不能动”这样的要求一起压没了。

所以这篇想聊聊几个具体实现：DeepSeek Harness 怎么拆这套能力，Codex 怎么接模型侧的 compaction，Claude Code 怎么控制加载进来的内容，以及我自己的 coding-agent。

<!-- more -->

## 先看每次请求里到底装了什么

这里说的 harness，可以理解为模型外面负责让任务跑起来的那层程序：准备指令、调用工具、保存消息、处理权限，再把结果交给模型。上下文管理是其中一部分。

一次上下文，大致会带上这些内容：

```text
system prompt + Agents.md + skill description + mcp + user prompt  + tool result + compacted text + history context
```

它们占的是同一个窗口，但保存价值差别很大。项目约定可能整个任务都要遵守，一份目录搜索结果可能找到文件后就没用了。

拿“修一个接口报错”举例，后续真正需要知道的，可能只有：定位到了哪个文件，原因确认到哪一步，改了什么，还有哪个测试没过。中间搜索了多少次、命令输出重复了多少遍，未必值得一直带着。

也因此，我会分开看三件事：**哪些内容需要加载，哪些旧结果可以裁剪，以及什么时候必须生成摘要。** 至于换一个会话还能记住项目经验，那是另一层 memory 问题，这篇先关注怎么把当前任务接着做完。

## DeepSeek Harness：把测量、裁剪和摘要分开

[DeepSeek Harness 的 compaction 模块](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/compaction/README.md)拆得比较细：公共接口在 `compaction`，默认摘要实现在 `compaction-basic`，工具结果裁剪和手动 `/compact` 又各自是单独的包。

这样拆的好处很直接：以后想换一个摘要实现，不必连 Agent 主循环一起改。token 怎么测量，也交给独立的 `tokenMeter` 服务。[模块接口说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/compaction.md)

### 先裁剪，再决定要不要花一次模型调用

配置了 `compaction-tool-result-pruner` 后，达到压缩触发条件时，会先把过大的工具输出缩短：保留开头和结尾，中间放一个省略标记。这个过程不调用模型；处理完重新测量，如果已经降到预算以内，就不用继续生成摘要了。完整结果仍留在 session 日志里。[工具结果裁剪说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/compaction/compaction-tool-result-pruner/README.md)

这个顺序我觉得很实用。假设历史里大半都是旧构建日志，先处理日志就能腾出空间，没必要马上把用户需求和排查过程也一起总结。

### 老历史做摘要，近期内容保留原文

裁剪还不够时，`compaction-basic` 会选择较早的一段历史生成摘要，同时保留最近的一段原文。选择边界时会维护工具调用和结果的配对关系，避免留下一个没有对应结果的调用。[压缩范围与会话事件](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/compaction.md)

它当前默认的触发条件还会考虑输出预留和额外余量，不能简单理解为“用了 80% 就压缩”。用文档里的变量表示：

```text
W：模型上下文窗口
O：请求的输出上限
B：额外余量，当前默认 65,536 token

触发阈值 = floor(min(W × 0.8, W - O - B))
近期原文保留预算 = (W - O) × 0.16
```

这些参数可以按模型调整。小窗口尤其不能照搬默认余量，否则还没开始工作，预算就不成立了。[默认策略与配置](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/compaction/compaction-basic/README.md)

### 原始记录和模型看到的历史分开保存

这里还有一个我比较在意的设计：摘要替换的是下一次给模型看的历史范围，原事件还在日志里。压缩过程也会记录选择了哪段内容、生成了什么摘要，便于回放和排查。[Compaction 会话事件](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/compaction.md)

这能回答一个很实际的问题：Agent 压缩后忘了一条要求，到底是当初没存下来，还是存了但没进入摘要？如果直接覆盖原记录，事后很难查。

至于内容怎么进来，它另有一组 [context 插件](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/context/README.md)，负责项目指令、文件引用、其他会话的有限快照等。加载什么和怎么缩小历史，分别有各自的入口。

## Codex：接入模型侧的 compaction

看 Codex 时，要区分客户端整理上下文，以及模型侧压缩状态这两件事。

项目约定这一层比较直观。Codex 会读取全局和项目里的 `AGENTS.md`，沿项目根目录到当前工作目录收集指令，更深层目录的约定可以覆盖前面的内容。它也有总大小限制，并不会把整个仓库所有目录下的说明都递归塞进去。[AGENTS.md 加载规则](https://learn.chatgpt.com/docs/agent-configuration/agents-md)

例如项目统一要求用 pnpm，而某个子目录有自己的测试命令，这两种约定就可以分别放在对应位置。指令的适用范围，比把所有规则写进一份很长的提示词更容易看清楚。

### 压缩结果不一定是一篇能读懂的总结

OpenAI 的 [Codex Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide)介绍了通过 Responses API 做 compaction 的方式。这里和普通“请总结以上对话”有个明显区别：返回的上下文中可以包含带 `encrypted_content` 的 compaction item，客户端把它继续传给模型，用来延续之前的状态。

我们能看到这个 item 的存在，但不能把它当作 Markdown 摘要阅读，也不能据此断言它完整保留了哪些细节。

单独调用 `/responses/compact` 时，官方要求把返回的整份压缩窗口作为后续输入；返回值可能还包括保留下来的其他消息。只取其中一个压缩 item，或者只拿一段可见文本，都不等同于沿用返回的上下文。[Compaction API 说明](https://developers.openai.com/api/docs/guides/compaction)

可以把这个过程理解为：

```text
当前输入窗口
    → /responses/compact
    → 返回压缩后的窗口，包含 compaction item 和可能保留的消息
    → 用返回窗口继续下一次请求
```

Codex 的[配置文档](https://learn.chatgpt.com/docs/config-file/config-reference)也暴露了自动压缩阈值 `model_auto_compact_token_limit`，未设置时使用模型默认值。所以“Codex 到多少 token 一定会压缩”不适合写成一个固定数字，具体要看模型、配置和运行版本。

对自己做 Agent 来说，这条路线能少维护一部分摘要逻辑，但接入也有前提：provider 得支持对应接口和状态格式。换成一个只兼容聊天接口的服务，不能默认它也能接着使用同样的 compaction item。

## Claude Code：除了压缩，还控制什么东西进入主会话

Claude Code 的官方文档把上下文入口讲得比较清楚。项目规则、skills、工具定义、子任务结果，各有自己的加载方式，不需要从开头就把所有正文放进来。

### 长期规则写进文件，当前进度交给摘要

接近窗口上限时，Claude Code 会自动把对话压成摘要，也支持手动 `/compact`，并且可以附带保留重点，例如 `/compact focus on the API changes`。官方同时提醒，早期对话里的细节指令可能在压缩中丢失。[上下文工作方式](https://code.claude.com/docs/en/how-claude-code-works)

所以“这个项目的迁移脚本不能直接在线上跑”这样的约定，适合写进 `CLAUDE.md`，别只在对话开头说一次。文件本身也应保持简短，记录那些需要反复提醒的要求。[项目指令与记忆](https://code.claude.com/docs/en/memory)

这里的分工是：摘要记录当前做到哪一步，项目文件保存后续会话仍然需要的约定。两者都能帮助 Agent 接着工作，但更新频率和适用范围不同。

### Skills 按需加载，subagent 承接大量中间材料

skills 在启动时提供描述，完整内容等使用时再加载；MCP 工具定义也有按需搜索和加载的机制。这些做法减少的是任务尚未用到的内容。[Skills 与工具加载说明](https://code.claude.com/docs/en/how-claude-code-works)

另一种情况是，材料确实需要看，但主会话不需要保留全部过程。比如排查一个构建失败，需要翻很多配置、跑几次命令，最后只需要带回来失败原因和相关文件。

这时 subagent 可以在自己的上下文窗口里完成调查，再返回结果，主会话继续负责整体任务。它仍会单独发送模型请求、消耗额度，省下的是主会话里堆积的中间材料。[Subagents 文档](https://code.claude.com/docs/en/sub-agents)

这也有代价：如果主 Agent 问得含糊，或者子任务的返回结果漏了证据，主会话照样会拿不到关键信息。拆出去之前，最好先明确它需要带回来什么，比如错误位置、复现命令、已经确认和还没确认的结论。

### Auto memory 也不需要一次加载所有笔记

Claude Code 还有跨会话的 auto memory。目前 `MEMORY.md` 只在启动时加载前 200 行或前 25KB，以先到的限制为准；更细的主题文件等需要时再读。[Auto memory 加载方式](https://code.claude.com/docs/en/memory)

我比较喜欢这里“短入口加详细文件”的组织方式。入口告诉 Agent 去哪找，细节留在文件里。对项目文档也一样：能通过路径找到的内容，不一定每轮都要完整携带。

## 自己搭建的coding-agent：运行中裁剪，轮次后压缩

回到自己的项目。目前这套实现主要在三个地方：

```text
src/main/ipc/handlers/local_agent/local_agent_handler.ts
    流式执行、分段续跑、轮次结束后的处理

src/main/utils/compaction.ts
    消息重建、轻量清理、工具裁剪、摘要持久化

src/main/prompts/compaction.ts
    摘要需要保留哪些内容
```

### 每次请求先找最新摘要

`buildMessageHistory` 会从后往前找最新一条 `isCompactionSummary` 消息。

没有摘要，就解析已有消息；有摘要，就把它包装成一条 user 消息，再接上摘要之后产生的新消息。更早的记录仍在数据库里，但不再进入这次请求。

```text
数据库：旧消息 → 旧消息 → 压缩摘要 → 新消息 → 新消息
                            ↓
模型输入：               压缩摘要 → 新消息 → 新消息
```

这个实现比较容易跟踪：下一轮用了哪份摘要、从哪里开始接历史，都有明确的标记。

### 跑到 75% 时，先停一段、裁剪、再继续

主循环里有一个 `PREEMPTIVE_THRESHOLD`，取模型窗口的 75%。每个 step 结束后记录用量，达到阈值就结束当前分段，保存消息，再调用 `pruneOldToolResults`，从数据库重新加载历史，开始下一段。单轮最多运行 5 段。

这里判断上下文压力时优先使用当前 step 的 `inputTokens`，缺失时回退到 `totalTokens`，没有直接拿整个任务累计消耗的 token 来比较窗口。

裁剪时会跳过最近的用户轮次，并保护一部分较新的工具输出。当前 `PRUNE_PROTECT_TOKENS` 是 20,000，预计节省超过 10,000 token 才实际更新。不同工具的结果也有不同处理方式：

| 工具输出 | 当前裁剪方式 |
| --- | --- |
| `bash` | 尝试保留退出码、部分 stderr，以及 stdout 首尾各 40 行 |
| `read_file` | 保留首尾各 60 行 |
| `grep`、`glob`、`list_files` 等 | 保留前 50 行 |
| 其他 | 使用通用字符截断 |

这些是当前实现的规则，并不保证每条结果最终都小于固定 token 数。比如保留下来的某一行特别长，按行截断就未必能省多少。

这条运行中的路径只做裁剪，没有在每个分段之间调用模型摘要。如果裁剪空间很小，后面几段仍可能很快达到阈值。5 段是执行上限，不能据此理解为可以无限续跑。

### 一轮结束后，再做轻量清理和摘要

流式执行结束后，`autoCompactIfNeeded` 会先根据模型窗口和输出预留判断是否需要摘要，再尝试 `microCompact`。

`microCompact` 不调用模型，会把更早的工具结果替换成占位信息，保护近期用户轮次；估算能省下超过 10,000 token 时才写回。它比前面的裁剪更激进：裁剪还留着输出首尾，轻量清理会直接移除结果正文。

这里要留意一点：**它会更新数据库里的 `aiMessagesJson`。** 占位文案虽然写着数据还在数据库，但不能因此认为完整工具结果已经另存了一份；这条路径确实会覆盖对应字段。和 DeepSeek Harness 保留完整原结果日志的方式有区别。

如果前面判断已经超出可用预算，就调用 `performCompaction` 生成摘要。当前预算计算是：

```text
输出预留 = min(40,000, 模型最大输出 token)
可用预算 = 模型上下文窗口 - 输出预留
```

摘要输入也做了整理：用户消息去掉二进制部分，助手消息提取正文和结构化工具记录，过滤掉思考标签及部分展示标签，再交给摘要模型。

摘要提示词要求保存用户目标、关键技术信息、文件变更、错误和修复、待处理任务、当前状态等九类内容。生成后还会补充从历史提取的文件路径；有项目路径时，再加上 Git 状态和最近提交。最后作为新的 `isCompactionSummary` 消息写入数据库。

手动入口目前叫 `/summary`，别名是 `/s`，同样会触发全量压缩。


## 接下来更想验证什么

把这几套做法放在一起看，我现在更想先补齐自己的消息测量和持久化，再考虑更复杂的摘要策略。

| 实现 | 这次最值得参考的地方 |
| --- | --- |
| DeepSeek Harness | 裁剪后重新测量，原始日志与模型有效历史分开 |
| Codex | 使用模型侧 compaction 时，完整沿用接口返回的上下文窗口 |
| Claude Code | 按需加载 skills 和细节，用独立上下文承接大量调查过程 |
| 自己的 coding-agent | 已接入分段裁剪和摘要，需要补齐清理后的测量、tail 保存 |

相比摘要缩短了多少，这些更接近我用 Agent 时在意的事情：它能接着往下干，而且知道前面为什么做到这里。
