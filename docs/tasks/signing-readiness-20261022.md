# 原签名准备（2026-10-22）

## 当前接续（2026-10-23）

实际手动入口为已有 `Original signing readiness` 的 `portable-backup` 模式，再调用下述恢复工作流；新工作流未登记在默认分支时，不能直接按新文件名派发。本次不为注册入口而合并 PR。

GitHub 现状已经变化：产品 PR #15 已由其他任务合入 main，当前仓库为公开；本次没有修改可见性。main 的普通云端检查已成功，不能继续把旧付款阻断当作当前不可执行的结论。下面早期记录按历史保留。

本准备分支新增手动 `Portable original-key recovery`：只在固定准备分支、受保护的 `android-signing` 环境运行。先核对已有 `TIMEWORTH_KEYSTORE_BASE64` / `TIMEWORTH_KEYSTORE_PASSWORD` 的原证书及私钥，再用环境中的 `TIMEWORTH_RECOVERY_KEY_BASE64` 加密完整原 keystore 与原密码；不生成替代签名身份。归档采用与其他 App 一致的 AES-256-GCM 格式，密文只临时转交独立 Linux restore 作业，解密凭据不进入附件，明文原材料只在进程内存中处理。恢复作业只注入恢复凭据，不读取原签名 Secrets；核对完整原文件摘要、固定证书与私钥挑战。

新恢复入口尚需以实际运行结果验收，配置存在不能算通过。临时密文应在验证后转存独立私人备份位置并读回校验；Actions 附件不是长期备份。恢复凭据另有受保护的本机 DPAPI 副本，但独立于原电脑的非 GitHub 安全副本尚未确认，不能声称账号同时丢失也能恢复。

原 repository Secrets 保留。只有独立备份、恢复与替代环境配置实际验证成功，并核对当前 main 的所有签名入口已采用环境保护后，才能退役仓库级副本；本任务不自动合并 PR、不改变下载通道、不发布或安装。

## 历史准备记录

## 本次实际备份与环境迁移验证

[恢复运行 39941997764](https://github.com/h516df/timeworth-android/actions/runs/39941997764) 在准备提交 `90a199092aedc3c8dd0fe446e242a6f427960b7f` 上通过：原证书与原私钥核验、AES-256-GCM 备份、另一台一次性 Linux 机器恢复全部成功。恢复作业没有注入原签名 Secrets，只使用恢复凭据；原文件摘要与私钥挑战通过。密文 SHA256 为 `e569dad1a5fda7de23dcada0ad66751c3447c9c117e9d8ba9d274c24a18ad8f0`，私人 Drive 备份已读回逐字节一致并核对仅所有者权限。原文件及所有旧副本保留。

已从这个私人备份在内存中恢复原材料，使用 GitHub 环境公钥加密写入 `android-signing`：`TIMEWORTH_ORIGINAL_KEYSTORE_BASE64`、`TIMEWORTH_ORIGINAL_KEYSTORE_PASSWORD`。它们与旧 repository Secrets 名称不同，可验证环境注入而不回退到仓库级同名值。签名与恢复入口已改用新名称；`product` 模式另以 main 的固定产品提交 `e3251591bbdc8459c05d646fd2dd42a2371682f8` 构建真实 `.preview` 和 unsigned release，再在独立受控作业签名；不在 Gradle 执行时注入正式密钥。环境签名的最终结果以新模式实际运行链接为准，本文此处不预先标记通过。

当前 main 的旧 `android-release.yml` 仍引用原 repository Secrets 且未设置签名环境；本准备 PR 尚未合入。因此本轮不能删除旧 Secrets 后声称全仓库作用域已缩小。后续审查整合必须将 main 的全部正式签名入口替换为受控流程，再复验并退役旧副本；本轮不自动合并、不静默破坏旧入口。

## 以下为早期状态，不能当作当前结论

[环境级真实产品签名 39943147964](https://github.com/h516df/timeworth-android/actions/runs/39943147964) 已通过，工具源 `5e9a18cce60fdc87ed5dcc5466f9eb3ff27862ba`，产品源 `e3251591bbdc8459c05d646fd2dd42a2371682f8`。实际开发 APK 为 `dev.h516.timeworth.preview`，Provider 为该包名下 `.files`；正式 APK 保留 `dev.h516.timeworth` 和原证书。产品签名回执 `syntheticProbe:false`，另验证缺项、错误密码、错误证书拒绝。Gradle 产品作业不读取正式凭据，签名作业只引用环境级的新名称，没有仓库级同名回退。

为后续日常使用，本 PR 还准备替换 main 的 `Android signed build` 入口，统一调用相同的分离构建/签名流程。main 调用绑定触发提交的产品源码；准备分支调用绑定上述已合入 main 的固定产品源。产物回执分别记录产品与签名策略 SHA。该替换未合并前，原 main 仍依赖仓库级 Secrets，故原副本继续保留；不能把“替代环境已验证”写成“全仓库作用域已缩小”。

独立分支 codex/cloud-signing-prep-20261022；协调任务 signing-readiness-20261022。只核验签名与云端入口，不合并产品 PR、不发布、不操作手机或真实财务数据。

main 主要保存工作流；实际 Android 产品在 v0.1.0 标签及仍未合并的 PR #15 依赖链。已重新下载 v0.1.0 原生 APK、核对大小、SHA256、包名 dev.h516.timeworth 及原证书 fbee77769f3ccde6509b2d70465d2992d2bb20f7edb69fa9a75f6bfa9cc25366。

既有 TIMEWORTH_KEYSTORE_BASE64 / TIMEWORTH_KEYSTORE_PASSWORD 未覆盖、未撤销。新增 android-signing 环境只允许 main 和本准备分支；本分支签名作业加该保护。已有 Secrets 仍是 repository scope，其他拥有工作流写权限的分支仍可引用它们；只给当前作业加 environment 不能改变这一事实。因无原始可恢复文件，无法安全复制到 environment 后退役 repository 副本。本次不擅自撤销已有凭据，需保留这个隔离缺口。

Original signing readiness 用既有私钥签署合成 APK，验证原证书以及缺项、错误密码、错误证书拒绝；不输出密钥，不上传探针或构建任何产品新版。签名成功与否以当前分支 Actions 为准。现有 signing-check 继续可手动验证 JAR 挑战，第三方 Actions 固定完整 SHA。

独立长期备份未发现：此前原材料只在一次性云端受限工作区和不可导出的 GitHub Secrets 中；原 .p12 与其密码的独立加密恢复包不在当前可访问本机签名目录。不能生成新证书代替。新环境存在不等于备份通过，跨机器恢复尚未验证。

未验证：产品 PR #15 在本分支的 Android 构建、数据库/JSON 升级、图片/视频导入失败、空间不足、进程中断及恢复、系统覆盖安装、实体手机和财务数据保持。使用合成资料；原签名不等于数据安全。

## 2026-10-23 再核对

已读取 `v0.1.0:tools/prepare_cloud_signing.py`：它只允许在仓库之外的 POSIX 云执行器目录中创建原 `timeworth-release.p12` 和 `signing-state.json`，后者保存原密码；已有身份时拒绝重新生成。该程序把材料封装后写入 repository Secrets，未建立独立可导出加密恢复包。当前可访问的本机签名目录未找到这两份原材料，不能从证书或已发布 APK 还原私钥，也不能通过 GitHub API 读取 Secret 明文。

新增环境并未缩小既有 repository Secrets 的实际作用域。本轮保留 `TIMEWORTH_KEYSTORE_BASE64`、`TIMEWORTH_KEYSTORE_PASSWORD`，没有假称环境迁移完成。下一步必须在可受控运行本私有仓库且有既有 Secret 注入的临时执行器中核对原证书，将完整原材料加密保存到独立私人存储，另存恢复凭据，实际跨机器恢复；随后才能写入并复验 environment Secrets，最后才可按授权退役 repository 副本。此前已封装的加密 Secret 请求不能代替可恢复原件。

私有 Actions 已知在作业开始前被账户付款／支出限制拒绝，本轮不重跑同一阻断。现有 SentinelX 执行主机离线；Desktop Commander 仅有离线本机；当前 Codespaces 认证缺少 scope，不扩权；已有 Make 场景只提供 GitHub API，不是持久或临时计算环境。未找到可直接复用的受控私有云执行渠道，因此独立备份、跨机器恢复和环境迁移仍未执行。PR #15 与 v0.1.0 产品源码保持原状，不发布、不安装、不操作真实资料。
