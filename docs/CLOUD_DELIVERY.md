# 纯云端开发、签名与交付

## 用户约束

用户明确要求目前不使用本地电脑。后续操作均在云端执行，不再调用 MY-AI-PC，不使用或复制其登录凭据、签名材料或开发环境。

## 已找到的复用基础

- 私有源码：`h516df/timeworth-android`，repoID `1427824994`。
- 既有公开分发：`h516df/app-releases`，repoID `1426495445`。
- 既有工具：`h516df/android-update-kit`，调研快照 `0f55b6f14a99a792b1abe3a28d538ce15a2fae1f`。
- TimeWorth 的公开身份为 `appId: timeworth`、`channel: stable`。
- 不把源码仓库改公开，不新建重复下载仓库，不改其他 App 的入口。

现有 update-kit 的默认客户端面向私有仓库设备授权，并不能原样满足普通用户匿名下载。公开客户端应遵循分发仓库清单契约，按 appId 查找版本；可复用现有 HTTP、验签、中文说明和安装代码，具体差异在应用开发时实现和验证。共享发布脚本的标签规则也须适配多 App 分发约定，不能直接对共享仓库使用全库 latest。

## 构建与发布流程

1. 云端提交源码并完成相关检查。
2. GitHub Actions 以固定源码提交构建正式 APK，使用仓库 Secrets 中的长期签名。
3. 云端执行端下载产物，核对真实包名、版本、证书、最低系统、架构和字节摘要。
4. 使用现有 GitHub 连接发布 TimeWorth 专属 Release、APK、中文说明和 SHA256 文件；不在 Actions 中保存跨仓库的广泛访问令牌。
5. 实际匿名下载公开 APK，重新核对大小、摘要和签名。
6. 最后更新 `apps/timeworth/stable.json`。失败时保持原入口和历史包。

这是计划中的交付顺序。目前没有 App 源码或正式 APK，公开入口保持 `unavailable`，不得填写虚构版本或下载链接。

## 签名的云端配置

私钥在云端生成。`tools/prepare_cloud_signing.py` 把准备状态放在 Git 仓库之外的受限目录，公开仓库仅记录证书指纹。准备状态是临时工作区资料，不是长期密钥备份。

需要向源码仓库写入两个 GitHub Actions Secrets：

- `TIMEWORTH_KEYSTORE_BASE64`
- `TIMEWORTH_KEYSTORE_PASSWORD`

当前 ChatGPT GitHub App 不具备 Secrets 管理权限，普通重连不能增加权限。云端备选是通过 Make 的 GitHub 连接调用 Secrets API；现有两个 Make 空间均未找到可复用的 GitHub 连接，因此需要一次正式的云端授权。

新连接授权后先只读验证账号为 `h516df`、仓库 ID 正确、Secrets 公钥可读，再写入。权限是否满足必须以实际 API 成功为依据，不将授权页面完成视为已配置成功。

发送给 Make 的写入请求只包含使用 GitHub 公钥密封加密后的值，不传递明文 keystore 或密码。写入完成后触发 `Cloud signing readiness`：核对证书指纹，并实际签名、验证一个临时测试 JAR。测试不构建 APK，不上传私钥或签名探针。

在云端签名与恢复路径验证完成前，保留受限的临时准备状态。长期保管和可恢复备份必须在首次正式分发前落实，不能把一次性云端文件系统当作唯一长期副本，也不能将签名材料放入普通 Actions artifact 或发布附件。

## 一次性授权的边界

授权通过 Make / GitHub 的页面完成，不要求用户在电脑上运行命令，不要求把密码或 Token 发到聊天里。是否存在费用、额外账号限制或权限不足，以连接页面和实际验证结果为准。

## 验证边界

构建环境检查通过、签名检查通过、APK 编译通过、公开下载验证通过，以及手机实际覆盖安装和数据保留，是分别记录的结果。用户尚未安装验证时不得声称已完成真机验收。
