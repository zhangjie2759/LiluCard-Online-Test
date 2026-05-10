利禄卡 Online v3.1 图片加载修复版

这版针对“iPhone 流畅了，但图片加载不出来”做修复：

1. 修复 iPhone Safari / 微信内置浏览器图片不显示：
   - v3.0 使用 img.decode() 等待解码；
   - Safari 有时 decode 不 resolve，导致图片下载完也一直不显示；
   - v3.1 改成 onload 后立即显示图片。

2. 图片路径加入缓存版本号：
   - 图片实际请求会变成 images/cards/xxx.png?v33
   - 避免 iPhone 或微信继续使用旧的失败缓存。

3. 图片渐进加载加快：
   - 每批从 2 张改成 4 张；
   - 间隔从 120ms 改成 80ms；
   - 仍然比一次性全加载流畅，但补图更快。

4. 点击任意按钮时会重试失败图片：
   - 如果某张图片临时失败，会在下次点击时自动重新请求。

上传到 GitHub 仓库根目录，替换：
- index.html
- game.js
- online.js

继续保留：
- images/cards
- 如果需要音乐，保留 audio/bgm.mp3

注意：
这次 zip 不包含 audio 文件夹。

上传后用这个链接测试：
https://zhangjie2759.github.io/LiluCard-Online-Test/?v=33

如果图片还是不出来，直接打开一张卡图地址检查路径，例如：
https://zhangjie2759.github.io/LiluCard-Online-Test/images/cards/chicken_wing.png?v33
