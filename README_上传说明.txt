利禄卡 Online v0.5 上传说明

这版修复你截图里的问题：
“Firebase SDK 没有加载成功”。

原因：
手机/浏览器可能没有成功加载 Google 的 Firebase SDK 脚本。
v0.5 不再依赖 Firebase SDK，而是直接用 Firebase Realtime Database REST API。

上传到 GitHub 仓库根目录，替换这三个文件：
1. index.html
2. game.js
3. online.js

注意：
- images/cards 文件夹继续保留。
- 上传后等 1-3 分钟。
- 打开 Pages 链接时加 ?v=5 强制刷新，例如：
  https://zhangjie2759.github.io/LiluCard-Online-Test/?v=5

测试：
1. A设备点“开房间”
2. B设备点“加入房间”
3. 输入房间码
4. 两边轮流抽牌/收手
