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

上述是原先的交付计划。现已通过一次性云端Actions runner完成原签名非调试APK构建39613534837，原生附件上传39615594938，以及v0.1.0正式GitHub发行；核验契约和最终状态见根HANDOFF及DELIVERY.md。公开自动更新入口仍为unavailable，不因私有GitHub正式发行自动切换。

## 签名的云端配置

私钥在云端生成。`tools/prepare_cloud_signing.py` 把准备状态放在 Git 仓库之外的受限目录，公开仓库仅记录证书指纹。准备状态是临时工作区资料，不是长期密钥备份。

已向源码仓库写入并实际验证两个 GitHub Actions Secrets：

- `TIMEWORTH_KEYSTORE_BASE64`
- `TIMEWORTH_KEYSTORE_PASSWORD`

ChatGPT GitHub App 本身仍不具备 Secrets 管理权限。现已通过用户正式授权的 Make GitHub OAuth 云端连接补足；实际返回的 scope 为 `repo`。

已先只读核对账号为 `h516df`（ID `155412647`）、源码仓库 ID 为 `1427824994`，确认 Secrets 公钥可读且不存在同名秘密，再以 GitHub 公钥密封加密后分别写入。Secrets 列表回读确认两项存在。

### 后续 Agent 的云端连接信息

- Make 区域：`us2.make.com`；组织 ID `8913239`；用户私有空间 ID `2895912`。
- 可用连接 ID：`11842349`；已核对账号及 `repo` scope。
- 对应按需 API shell：scenario ID `6715378`，只在明确调用时执行，没有定时或公开 webhook。
- 首次无 scope 的连接 `11841877` 不用于私有仓库；对应测试 shell `6715151` 已停用，不重绑用户的既有自动化。
- Make 凭证请求页仍可能显示 `incomplete`；实际 `/user`、私有仓库读取、Secrets 公钥读取、列表读取和两项写入均已成功。以具体 API 与签名工作流的证据为准，不再要求用户重复授权。

API-call 模块自身没有声明所需 OAuth scopes。修正请求时使用 GitHub 端点声明的 `public_repo`、`repo` 授权要求；只借用连接权限声明，没有创建 Issue。

发送给 Make 的写入请求只包含使用 GitHub 公钥密封加密后的值，没有传递明文 keystore 或密码。[Cloud signing readiness 运行记录](https://github.com/h516df/timeworth-android/actions/runs/39543286090)已通过：核对证书指纹，并实际签名、验证一个临时测试 JAR。测试没有构建 APK，没有上传私钥或签名探针。

在云端签名与恢复路径验证完成前，保留受限的临时准备状态。独立长期保管和恢复尚未验收，需继续落实并如实记录；不能把一次性云端文件系统当作唯一长期副本，也不能将签名材料放入普通Actions artifact或发布附件。用户明确指定的GitHub正式发行级别与这项恢复验收分别记录，不据此将已经正式发布的版本改写为“未发布”或阻止其指定标签。

## 一次性授权的边界

授权通过 Make / GitHub 的页面完成，不要求用户在电脑上运行命令，不要求把密码或 Token 发到聊天里。是否存在费用、额外账号限制或权限不足，以连接页面和实际验证结果为准。

## 验证边界

构建环境检查通过、签名检查通过、APK 编译通过、公开下载验证通过，以及手机实际覆盖安装和数据保留，是分别记录的结果。用户尚未安装验证时不得声称已完成真机验收。
