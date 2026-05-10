利禄卡 Online v3.5 iPhone17 Pro图片音乐与夜宵优化版

根据反馈修复：
1. iPhone17 Pro 图片读取慢：
   - v3.4 使用渐进加载，iPhone17 Pro 上补图仍偏慢；
   - v3.5 因为图片已压到约 36KB，改成快速触发全部图片请求；
   - 保留失败后自动尝试原始路径的兜底。

2. iPhone17 Pro 音乐无法播放：
   - 重新整理 Audio 初始化；
   - 加入 playsinline / webkit-playsinline；
   - 每次触摸时都会尝试解锁一次音频；
   - 点“音乐”或任意按钮都更容易触发播放。
   - 如果仍无音乐，请检查 audio/bgm.mp3 路径和 iPhone 是否静音/低电量模式限制。

3. 音乐和首页按钮上移并缩小：
   - 音乐按钮放到左上更靠边；
   - 首页按钮放到右上更靠边；
   - 减少遮挡游戏内容。

4. 夜宵规则：
   - 如果任意一方没有留下外卖机会，夜宵局直接结算；
   - 没机会的一方直接输掉夜宵；
   - 如果双方都没机会，夜宵无人得分。

5. 警戒线 UI 固定：
   - 警戒线改为中间框内第二行满宽进度条；
   - 避免在不同手机上遮挡标题或提示文字。

上传到 GitHub 仓库根目录，替换：
- index.html
- game.js
- online.js

继续保留：
- images/cards
- 如果需要音乐，请你自己保留 audio/bgm.mp3

注意：
这次 zip 不包含 audio 文件夹。

上传后用这个链接测试：
https://zhangjie2759.github.io/LiluCard-Online-Test/?v=37
