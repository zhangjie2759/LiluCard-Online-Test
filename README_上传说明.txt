利禄卡 Online v3.3 白屏修复版

这版修复 v3.2 的白屏问题。

白屏原因：
v3.2 在文件最上方调用 resizeCanvas(true)。
resizeCanvas 里会调用 requestRender()。
但 requestRender 内部依赖的 renderScheduled 变量还没有初始化，
所以浏览器直接报错并停止执行，导致所有机型白屏。

v3.3 修复：
1. 增加 resizeRenderReady 开关。
2. 初始化 resizeCanvas 时不触发 requestRender。
3. 等 requestRender 所需变量初始化后，再允许 resize 触发重绘。
4. 保留 v3.2 的全机型移动端适配逻辑。
5. 不包含 audio 文件夹。

上传到 GitHub 仓库根目录，替换：
- index.html
- game.js
- online.js

继续保留：
- images/cards
- 如果要音乐，你自己保留 audio/bgm.mp3

上传后用这个链接测试：
https://zhangjie2759.github.io/LiluCard-Online-Test/?v=35
