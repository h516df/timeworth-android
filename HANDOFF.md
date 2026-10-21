# 当前接续（2026-10-21 · 交付复盘和工作流0.4）

- 用户要求“复盘，改进工作流”。[完整复盘](docs/RETROSPECTIVE_20261021.md)记录目标错位、错误归因账单、擅加发行条件、缺少最终回读、过早结批和当前文档冲突；[交付规则](docs/DELIVERY.md)与只读工具已落地，不止写建议。
- [v0.1.0正式发行](https://github.com/h516df/timeworth-android/releases/tag/v0.1.0)已存在，draft=false、prerelease=false、latest指向该版，4个原生附件已核对。APK原签名非调试，约2.4MB/Android8+；构建39613534837、上传39615594938均成功。工具以当前契约真实只读核验通过。真机安装/覆盖升级、独立长期签名恢复和公开稳定更新仍未验收，不能冒称通过。
- 默认main现保存工作流、发布契约和准确入口；完整应用源码在v0.1.0标签（4097e5f）及[PR #15](https://github.com/h516df/timeworth-android/pull/15)依赖链，本批不自动合并旧产品PR，也不从main重新实现产品。
- 规则0.4/简版r4，通用来源[8416611](https://github.com/h516df/vibe-ui-quality-kit/commit/84166117b827309daca6fb14e56fcc5df3c15052)已合入通用库main；本地脚本/规则字节一致。接入配置协议0.1和协调器协议1不变，没有升级用户账户级配置或批量改其他项目。
- 验证命令：`python3 cloud/verify_release.py --contract release/delivery-contract.json --receipt /tmp/timeworth-release-receipt.json`。通用32项隔离回归passed（包含13项发布核验回归），本项目不重复执行未改动的产品构建/浏览器/设备检查。只有本次退出码0与本次status=verified才能作为核验回执；API摘要核验不代表真实客户端下载通过。
- 采用工作分支codex/delivery-workflow-adoption-20261021，就绪8a07ef9；整合分支codex/delivery-adoption-integration-20261021。默认main的合并结果、精确SHA和本批检查见协调批次delivery-workflow-adoption-20261021及本轮PR，不能把只写到分支说成已默认生效。
- 没有修改产品、当前发行附件、签名、计费、仓库可见性、公开stable清单或运行中服务。后续先读AGENTS和本交接、核对需求池#6、当前发布契约及相关PR；新版本交付由代理同步更新契约和入口，用户不需管理表格或记分支。

以前的交接及当时的约束/证据：[历史归档](docs/history/HANDOFF-before-delivery-0.4.md)。历史“未开发/未发布”的状态不能覆盖上面当前事实。
