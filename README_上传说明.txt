利禄卡 Online v3.7 预加载超时修复版

这版修复：安卓马上进入，但苹果一直卡在 loading 且没有进度。

原因：
部分 iPhone / Safari / 微信 WebView 图片请求可能既不触发 onload，也不触发 onerror。
v3.6 的 Loading 会等待每张图返回结果，因此某些 iPhone 会卡在 0%。

v3.7 修复：
1. 每张图片增加 2.6 秒超时。
2. 带版本号路径失败/超时后，会自动尝试原始路径。
3. 每张图片最多重试 1 次，避免无限等待。
4. Loading 超过 3.2 秒会出现“重试 / 跳过”按钮。
5. 点击“跳过”可先进入首页，后续图片仍然会按需加载。
6. 不包含 audio 文件夹。

上传到 GitHub 仓库根目录，替换：
- index.html
- game.js
- online.js

继续保留：
- images/cards
- 如果需要音乐，请你自己保留 audio/bgm.mp3

上传后用这个链接测试：
https://zhangjie2759.github.io/LiluCard-Online-Test/?v=39
