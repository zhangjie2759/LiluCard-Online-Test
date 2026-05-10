利禄卡 Online v3.6 资源预加载与最终热量结算版

这版重点解决 iPhone17 Pro 图片迟迟不显示的问题：
1. 增加进入游戏前的 Loading 页面：
   - 打开游戏后先显示“正在备餐 0%-100%”
   - 预加载全部卡牌正面和卡背
   - 加载完成后才进入首页
2. 图片加载失败会自动重试 2 次：
   - 带版本号请求失败后，会尝试原始路径
   - 仍失败时显示“重试 / 继续”
3. 音乐只在 Loading 阶段 preload：
   - iPhone 不允许自动播放
   - 真正播放仍然需要玩家第一次点击按钮
4. 最终今日结算优化：
   - 在“几比几”左右显示双方最终总卡路里
   - 赢的一方用红色粗体
   - 输的一方用灰色粗体
   - 平局双方都用红色
5. 不包含 audio 文件夹。

上传到 GitHub 仓库根目录，替换：
- index.html
- game.js
- online.js

继续保留：
- images/cards
- 如果需要音乐，请你自己保留 audio/bgm.mp3

上传后用这个链接测试：
https://zhangjie2759.github.io/LiluCard-Online-Test/?v=38

如果 loading 显示图片失败，请直接检查图片路径：
https://zhangjie2759.github.io/LiluCard-Online-Test/images/cards/chicken_wing.png?v38
