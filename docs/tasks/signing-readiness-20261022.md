# 原签名准备（2026-10-22）

独立分支 codex/cloud-signing-prep-20261022；协调任务 signing-readiness-20261022。只核验签名与云端入口，不合并产品 PR、不发布、不操作手机或真实财务数据。

main 主要保存工作流；实际 Android 产品在 v0.1.0 标签及仍未合并的 PR #15 依赖链。已重新下载 v0.1.0 原生 APK、核对大小、SHA256、包名 dev.h516.timeworth 及原证书 fbee77769f3ccde6509b2d70465d2992d2bb20f7edb69fa9a75f6bfa9cc25366。

既有 TIMEWORTH_KEYSTORE_BASE64 / TIMEWORTH_KEYSTORE_PASSWORD 未覆盖、未撤销。新增 android-signing 环境只允许 main 和本准备分支；本分支签名作业加该保护。已有 Secrets 仍是 repository scope，其他拥有工作流写权限的分支仍可引用它们；只给当前作业加 environment 不能改变这一事实。因无原始可恢复文件，无法安全复制到 environment 后退役 repository 副本。本次不擅自撤销已有凭据，需保留这个隔离缺口。

Original signing readiness 用既有私钥签署合成 APK，验证原证书以及缺项、错误密码、错误证书拒绝；不输出密钥，不上传探针或构建任何产品新版。签名成功与否以当前分支 Actions 为准。现有 signing-check 继续可手动验证 JAR 挑战，第三方 Actions 固定完整 SHA。

独立长期备份未发现：此前原材料只在一次性云端受限工作区和不可导出的 GitHub Secrets 中；原 .p12 与其密码的独立加密恢复包不在当前可访问本机签名目录。不能生成新证书代替。新环境存在不等于备份通过，跨机器恢复尚未验证。

未验证：产品 PR #15 在本分支的 Android 构建、数据库/JSON 升级、图片/视频导入失败、空间不足、进程中断及恢复、系统覆盖安装、实体手机和财务数据保持。使用合成资料；原签名不等于数据安全。
