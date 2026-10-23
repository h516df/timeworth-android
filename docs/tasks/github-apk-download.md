# GitHub APK 下载交付

用户纠正：“这玩意不应该我去 GitHub 下载吗”。沿用已验证的 0.1.0-preview APK，不重新开发、不重新签名。原生 Release 创建可用，但 uploads.github.com 附件上传返回 HTTP 401；已有 Make GitHub API 模块仅支持 api.github.com 相对路径，无法将其当作上传服务使用。

本任务把 3,041,867 字节的原 APK 和元数据放在私有源码仓库版本目录；发布页链接同一标签里的 APK，用户以有访问权的 GitHub 账号下载。仅新增产物与交接，产品源码仍为 4b97f9d8faec054629b371a2a5fe2fd38633b144；不把 GitHub 原生附件上传说成成功。

验证：复制前后 SHA256 相同：6d20683339f12e1f5707b39cf5769e46b564c809acab8f26fb7a2b8c5f1fa815。整合者继续核对远端 Git blob、标签、Release 发布状态及准确下载链接。

原有功能/编译检查证据见前一交付任务；本任务不改产品、不冒称真机安装通过。正式签名构建仍受账户付款/支出上限阻塞，公开稳定渠道保持 unavailable。
