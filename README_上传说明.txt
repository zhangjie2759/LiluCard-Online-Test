利禄卡 Online v3.2 全机型移动端适配版

这版是为 iPhone 17 Pro 变形/卡顿做的“全机型自适应”，不是写死苹果17尺寸。

修复重点：
1. 使用 visualViewport 获取真实可用宽高
   - 避免 Safari / 微信地址栏变化导致 100vh 画面被压扁。
2. 增加 resizeCanvas()
   - 视口变化、地址栏收起、旋转屏幕时自动重算 W/H。
3. 使用 ctx.setTransform()
   - 防止 resize 后重复 scale，造成画面变形。
4. 动态 DPR
   - 普通 iPhone 保留较高清晰度。
   - 高分屏大视口设备自动降到 1.45～1.65，减少 iPhone 17 Pro 渲染压力。
5. 游戏主界面动态布局
   - 小屏优先保证底部按钮不被压扁。
   - 高屏自动展开卡牌区。
6. 等待提示框和文字字号根据屏幕高度自适应。
7. 继续保留 v3.1 的图片加载修复：
   - 不等待 img.decode()
   - 图片路径带 ?v33
   - 点击失败图片自动重试

上传到 GitHub 仓库根目录，替换：
- index.html
- game.js
- online.js

继续保留：
- images/cards
- 如果你要音乐，请自己保留 audio/bgm.mp3

注意：
这次 zip 不包含 audio 文件夹。

上传后用这个链接测试：
https://zhangjie2759.github.io/LiluCard-Online-Test/?v=34
