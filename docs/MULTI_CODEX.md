# TimeWorth 多 Codex 接续与分工

规则 0.3 / 简版 r3，协调器协议 1。由代理操作，用户无需填表、搬运聊天或记分支。

## 从哪里开始

- [通用多会话规则](https://github.com/h516df/vibe-ui-quality-kit/blob/main/workflow/MULTI_CODEX.md)；本地[协调器](../cloud/coordinate.py)与[通用全文](AI_WORKFLOW.md)。
- [唯一产品需求池 #6](https://github.com/h516df/timeworth-android/issues/6)；[产品 PR #3](https://github.com/h516df/timeworth-android/pull/3)；[当前交接](../HANDOFF.md)。
- 真实共享登记：[codex-coordination-v1 / .codex-coordination/state.json](https://github.com/h516df/timeworth-android/blob/codex-coordination-v1/.codex-coordination/state.json)。先读实时 ref，再以该提交的状态生成转换提案；该分支不合入 main。

本轮已初始化登记并领取真实工作流任务。原有 PR 未被自动批量登记成正在开发，不把缺少登记当作原写手已停的证明。当前 TW-001 动画仍待做，不因协作基础设施接入而启动产品更新。

## 执行方式

有已配置 Git 认证时，由代理使用：

```bash
python3 cloud/coordinate.py git-status
python3 cloud/coordinate.py git-apply --request /tmp/task-request.json
```

只有连接器时使用同一脚本的 plan 模式，再通过 GitHub 工具以单父提交、force=false 更新协调 ref；初始化采用只创建 ref 的接口。详见通用规则，不要求用户运行命令或提供 token。

- 会话 owner/workspace 必须唯一，不用同一个 GitHub 账号替代。
- claim 成功并回读后编辑；目录/文件重叠、相同分支/工作区会冲突。需要增加路径先 expand。
- 暂停或到期保留占用；移交/恢复先确认旧写手停止并保留远端成果，隔离恢复使用新分支/工作区和代次。
- 各会话在自己的 PR 或 docs/tasks/<task-id>.md 交接，整合者汇总根 HANDOFF 和需求池。此文件是项目入口，不复制整份实时登记。
- 所有成员 ready 后，一个独立整合任务封批、合入确切成员提交并检查整合结果；源码变化后旧检查失效。更新发布前核对整合者有效租期与源码回执；不自动合并无关 PR 或增加公开发布授权。
- 对 ready 核对实际远端 head 和完整变更路径（重命名含原路径）；对 verify 核对成员 head 未变且在整合提交祖先链，检查绑定整合 SHA。连接器模式不自动替代理读取这些外部证据。

## 仍然存在的边界

此机制是合作式协调，不是 GitHub 权限隔离；不能强停其他 Codex 或阻止直接绕过工具写库。新云端任务未必带有当前连接；暂缺登记访问可先做隔离草稿与检查，明确降级状态。不得强推业务分支或抢占未确认停止的任务。

本次不改 UI/金额规则/数据，不运行 APK、签名或手机验收，也不解决 Actions 的账户付款/支出上限。安卓交付缺口仍见 [ANDROID_DELIVERY](ANDROID_DELIVERY.md)。
