# TimeWorth 安卓交付与更新：当前证据和缺口

更新日期2026-10-21。各项按实际证据记录；GitHub发行级别按用户明确要求执行，设备/恢复/公开更新验收单列。核验方法见[DELIVERY](DELIVERY.md)，当前入口见[根交接](../HANDOFF.md)。

## 已验证

- [x] 原签名非调试APK已生成：构建[39613534837](https://github.com/h516df/timeworth-android/actions/runs/39613534837)全部success。包名dev.h516.timeworth，0.1.0/versionCode1，最低Android8.0。原证书、包名/版本、非调试属性、全部产品资源与源码字节及SHA256已独立核对。
- [x] [v0.1.0正式GitHub发行](https://github.com/h516df/timeworth-android/releases/tag/v0.1.0)：非草稿、非预发行、latest指向此版，4个原生附件名字/状态/大小/摘要已回读。上传[39615594938](https://github.com/h516df/timeworth-android/actions/runs/39615594938)成功。
- [x] 现有云端一次性JIT runner替代托管机器额度受阻通道；未改费用、原签名或仓库可见性。任务后runner已退出，远端零残留、临时连接材料已删除。
- [x] 发布契约及只读工具已采用，实际核验v0.1.0通过。不把API摘要核对当作真实客户端匿名下载或安装通过。

完整应用源码在发布标签及PR #15依赖链，尚未合入main。早期网页成果在PR #3；不按main旧规划重新开发。此私有下载需要GitHub登录，不声称匿名可用。

## 仍未完成或需要另行验收

- [ ] **独立签名恢复**：继续使用原长期签名，落实受控长期保存和独立恢复路径，验证恢复后证书一致。单份Secrets和临时VM不能冒充独立恢复；私钥不进入普通附件。
- [ ] **公开更新渠道**：复用既有android-update-kit和app-releases的独立timeworth/stable入口；普通用户匿名读取公开清单/下载APK，取消/失败/来源/大小/摘要/包名/签名/版本验证独立验收。公开stable清单当前仍unavailable，不依赖多App仓库全库latest。
- [ ] **公开发布顺序**：真实公开APK及匿名下载验证成功后，才切换apps/timeworth/stable.json。本轮不因私有GitHub正式发行更改公开入口。
- [ ] **真机迁移**：网页与原生包不自动共享数据；已实现JSON导出/恢复及v2兼容，但真实设备上的迁移流程、工资/应还/目标/图标/主题需继续核对。旧preview包与正式包包名不同，先导出再恢复。
- [ ] **最小覆盖升级**：旧版安装→合成数据→更高versionCode同包名兼容签名新版→系统覆盖安装→核心功能/数据保留。至少一台目标实体手机验证安装授权及确认，不以浏览器、模拟器或JAR验签替代。
- [ ] **失败与恢复**：断网、取消、损坏和不兼容包不破坏旧版；保留上版产物及回执。Android低版本通常不能直接覆盖安装，必要时发布更高versionCode修复版，不承诺静默安装或直接降级。

这份状态不是把全部未来验收自动加成用户未要求的GitHub发行前置条件。当前产品需求继续由[#6](https://github.com/h516df/timeworth-android/issues/6)管理，不在本次工作流复盘中顺带开发新功能。
