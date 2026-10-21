# 云端原签名构建（避开托管机器额度）

用户询问 GitHub 为何涉及账单，要求解决阻塞。GitHub 托管机器对私有仓库有免费额度；失败注释只说明付款失败或支出上限，当前连接无账单读取权限，不能据此推断欠款或已用尽分钟。

尝试使用当前已授权云端工作区作为一次性 self-hosted runner。仅为本私有仓库注册，独有 timeworth-cloud-20261021 标签，ephemeral 单任务退出，按需触发本分支 signing-check.yml；不改默认分支，不改计费，不用本地电脑，不读取或替换原 GitHub Secrets。原 Secrets 仅由正常 Actions 作业使用，临时 keystore 在作业内创建并清理。

继承已验证的原签名构建步骤；原证书固定为 release/signing-identity.json。保留非 debuggable 校验、所有产品资源字节核对和 SHA256。输出只包含 APK 与公开元数据；不上传私钥，不自动声明真机通过或稳定发行。

构建能力、账户是否允许 self-hosted 调度、实际 APK 签名与运行回执以本次结果为准。仅配置成功不等于已完成构建。任务结束应停止并移除 runner，删除短期连接材料。产品代码未改，无需重跑已通过且未受影响的 UI 场景。

首次实际运行 [39612652582](https://github.com/h516df/timeworth-android/actions/runs/39612652582) 已在一次性云端 runner 调度并执行；账单未拦截。环境/财务测试通过，wrapper 下载 Gradle 时连接被拒绝，签名步骤未产出 APK。改为本云端先前已校验并用于成功编译的 Gradle 8.11.1，使用已锁定的现有依赖缓存离线构建；不改变 Gradle 版本或放宽 TLS。首次传统注册端点 404，改用官方 JIT 配置 API后 runner 已正常连接并自动退出、解除配置。

第二次运行 39613198841 已进入 Gradle，发现 runner 默认 Java 路径只有运行时、无编译器。明确选择前一轮成功编译用过的 `/workspace/jdk21`，并把 javac 检查加入环境步骤；不下载新 JDK、不改变 JDK 大版本。
