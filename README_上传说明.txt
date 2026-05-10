利禄卡 Online v3.8 图片加载回滚稳定版

这版是“回退式修复”，目标是回到以前更稳定的图片调用方式。

修复思路：
1. 删除强制 Loading 阻塞
   - 不再必须等所有图片加载完才进入首页。
   - 打开后直接进首页，图片后台预热。

2. 图片路径回滚为原始路径
   - 不再默认给图片加 ?v 参数。
   - 因为部分 iPhone / 微信 WebView 对带参数图片请求可能不稳定。

3. 删除复杂图片加载链路
   - 不依赖 img.decode()
   - 不依赖 loading 超时判断
   - 不把游戏入口绑定在图片回调上

4. 保留必要优化
   - 保留 DPR / 视口适配
   - 保留图片失败占位
   - 保留后台预热卡背和卡图
   - 保留 BGM 逻辑，但音乐不参与加载判断

5. 不包含 audio 文件夹。

上传到 GitHub 仓库根目录，替换：
- index.html
- game.js
- online.js

继续保留：
- images/cards
- 如果需要音乐，请你自己保留 audio/bgm.mp3

上传后用这个链接测试：
https://zhangjie2759.github.io/LiluCard-Online-Test/?v=40

如果 iPhone 仍不显示，请直接打开原始图片路径测试：
https://zhangjie2759.github.io/LiluCard-Online-Test/images/cards/chicken_wing.png
