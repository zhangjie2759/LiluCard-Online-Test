利禄卡 Online v0.3 上传说明

这版修复了 v0.2 可能出现的白屏问题：
- 不再使用 type="module" 和 Firebase ESM import
- 改为普通 script 加载，单机首页不会因为 Firebase 模块失败而白屏

上传到 GitHub 仓库根目录：
1. index.html
2. game.js
3. online.js

注意：
- 原来的 images/cards 文件夹必须保留。
- 如果 GitHub Pages 有缓存，上传后等 1-3 分钟再刷新。
- 手机上请强制刷新或重新打开链接。
