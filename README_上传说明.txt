利禄卡 Online v2.2 准备开局修复版

这版修复的核心问题：
上一版使用 Firebase REST PATCH 时，把 "players/p2" 这种路径错误展开成了 players 对象。
这样会覆盖整个 players 节点，导致 p1 或 p2 被删掉。
所以你会看到：双方都点了准备，但一边仍然显示“等待另一名玩家加入”，无法开局。

v2.2 修复：
1. online.js 的 patchRoom 改为直接提交多路径 key，不再覆盖 players。
2. 双方准备后，任意一边监听到都可以触发开局。
3. 开局前会再次读取最新房间，确认 p1 / p2 都 ready。
4. 如果另一边已经开局，本机直接跟随，不再重复覆盖。

上传到 GitHub 仓库根目录，替换：
- index.html
- game.js
- online.js

继续保留：
- images/cards 文件夹

上传后用这个链接测试：
https://zhangjie2759.github.io/LiluCard-Online-Test/?v=22

重要：
请重新开一个新房间测试。
旧房间里 players 节点可能已经被上一版覆盖坏了，不要继续用旧房间码。
