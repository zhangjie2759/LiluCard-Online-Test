利禄卡 Online v3.0 iPhone流畅优化版

针对 iPhone 单机也卡、刚进卡、卡牌信息读不清做了优化：

1. Canvas DPR 限制到最高 2
   - iPhone 原本常见 DPR=3，实际渲染像素约 9 倍
   - 限制后渲染压力明显下降，同时保留清晰度

2. 图片改为渐进预加载
   - 先加载 4 张卡背
   - 正面卡图分批加载，不再刚进入就一次性解码全部图片
   - 减少刚进游戏卡顿

3. 卡牌信息增强
   - 卡牌缩小时会叠加 kcal 标签
   - 尺寸允许时会叠加简短菜名
   - 解决放久/卡牌多时看不清卡片信息的问题

4. iPhone 解码优化
   - 使用 decoding='async'
   - 图片加载后节流重绘，减少连续 render

5. 联机轮询从 200ms 降到 420ms
   - 减少 iPhone 后台请求和重绘压力
   - 保留点击后主动同步机制，不完全依赖轮询

上传到 GitHub 仓库根目录，替换：
- index.html
- game.js
- online.js

继续保留：
- images/cards 文件夹
- audio/bgm.mp3

上传后用这个链接测试：
https://zhangjie2759.github.io/LiluCard-Online-Test/?v=32
