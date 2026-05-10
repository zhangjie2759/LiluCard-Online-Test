利禄卡 Online v0.4 非阻塞白屏修复版

这版专门修复：Firebase 脚本在首页阻塞加载导致整页白屏。

改动：
1. index.html 只加载 game.js，不再提前加载 Firebase。
2. 首页会先正常显示。
3. 只有点击“开房间 / 加入房间”时，才动态加载 online.js 和 Firebase。
4. 保留你原本的 images/cards 路径和单机内容。

上传到 GitHub 根目录：
- index.html
- game.js
- online.js

同时保留原 images/cards 文件夹。

上传后建议：
1. 等 1-3 分钟。
2. 浏览器强制刷新。
3. 手机重新打开链接，不要用旧缓存页面。
