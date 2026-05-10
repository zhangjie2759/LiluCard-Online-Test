利禄卡 Online v1.1 上传说明

这版修复：
1. 一方收手、另一方爆牌后无法进入结算的问题。
2. 自己爆牌后可以点击“结算”。
3. 双方都完成后会自动进入本餐结算。
4. 联机轮询从 900ms 降到 350ms，点击后本地先渲染，减少等待感。
5. 谁都可以点“进入下一餐”，避免房主不点卡住。

上传到 GitHub 仓库根目录，替换：
- index.html
- game.js
- online.js

继续保留：
- images/cards 文件夹

上传后请用这个链接打开：
https://zhangjie2759.github.io/LiluCard-Online-Test/?v=11

请重新开一个新房间测试。
