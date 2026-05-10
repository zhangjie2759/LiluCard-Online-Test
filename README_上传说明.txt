利禄卡 Online v4.0 回归稳定基础版

这版目标：
不是继续加补丁，而是回到早期图片能稳定显示的基础环境。

主要变化：
1. index.html 回退到早期简单结构：
   - width=100vw
   - height=100vh
   - 不再使用 100dvh
   - 不再使用 position: fixed
   - 不再使用 viewport-fit=cover / interactive-widget

2. Canvas 适配回归简单：
   - 不再使用 visualViewport
   - 不再监听 visualViewport resize / scroll
   - 只监听 window resize / orientationchange
   - DPR 简单限制到 1.6

3. 图片调用回归稳定方式：
   - img.src = 原始路径
   - 不加 ?v 参数
   - 不使用 img.decode()
   - 不使用 Loading 阻塞
   - 图片失败后，下次显示会重新请求

4. 资源竞争降低：
   - 背景图预热变保守
   - 音乐不再在进入游戏时自动抢加载
   - 只有点“音乐”按钮才启动音乐

5. 保留：
   - 联机功能
   - 顶部按钮
   - 结算逻辑
   - 移动端基本 DPR 限制

不包含 audio 文件夹。

上传到 GitHub 仓库根目录，替换：
- index.html
- game.js
- online.js

继续保留：
- images/cards
- 如果需要音乐，请你自己保留 audio/bgm.mp3

上传后用这个链接测试：
https://zhangjie2759.github.io/LiluCard-Online-Test/?v=42
