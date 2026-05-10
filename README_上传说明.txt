利禄卡 Online v0.2 上传说明

这版是在你上传的 game.js 基础上改的：
1. 保留原本卡牌数据、图片路径、单机规则、UI绘制。
2. 首页新增三个入口：
   - 单机游戏
   - 开房间
   - 加入房间
3. 开房间/加入房间使用 Firebase Realtime Database。
4. 上传到 GitHub 时，请把这三个文件放在仓库根目录：
   - index.html
   - game.js
   - online.js
5. 原来的 images 文件夹必须保留，尤其是：
   - images/cards/...
6. 测试方式：
   - 手机/电脑A点“开房间”
   - 手机/电脑B点“加入房间”
   - 输入房间码
7. 当前是 GitHub 联机测试版，不是正式防作弊版。
