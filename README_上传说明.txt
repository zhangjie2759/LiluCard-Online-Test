利禄卡 Online v1.0 上传说明

这版重点修复：
1. “准备”按钮点不动的问题。
2. 准备按钮改用 stand 命中区，避免旧 online_ready 分支不触发。
3. 点击准备后会立刻显示“正在准备...”。
4. 修复 Cannot read properties of undefined (reading 'length')。
5. 强制缓存刷新：index.html 加载 game.js?v=10，game.js 加载 online.js?v=10。

上传到 GitHub 仓库根目录，替换：
- index.html
- game.js
- online.js

继续保留：
- images/cards 文件夹

上传后请用这个链接打开：
https://zhangjie2759.github.io/LiluCard-Online-Test/?v=10

请重新开一个新房间测试，不要用旧房间。
