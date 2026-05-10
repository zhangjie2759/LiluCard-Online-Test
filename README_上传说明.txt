利禄卡 Online v3.9 清理稳定版

这版不是加功能，而是把最近多轮补丁后残留的加载/渲染/音乐逻辑收束成一套稳定逻辑。

清理内容：
1. 删除旧 Loading 相关逻辑：
   - 不再强制等待图片加载完成才能进入首页
   - 不再保留 loadingProgress / startAssetPreload / loadImageWithRetry 等旧代码

2. 图片加载回到稳定模式：
   - 只使用原始路径 img.src = src
   - 不再默认添加 ?v 参数
   - 不使用 img.decode()
   - 不把游戏入口绑定在图片回调上

3. 图片后台预热：
   - 卡背优先加载
   - 正面卡图分批后台预热
   - 图片 onload 不再每张都立即整屏重绘，而是合并成较少重绘

4. 音乐逻辑收束：
   - 不再每次 touchstart 都尝试播放
   - 只在点“音乐”、单机、开房间、加入房间时尝试启动
   - 音乐失败不会影响游戏流程

5. resize 逻辑防抖：
   - visualViewport / resize 不再每次小变化都立即重排
   - 减少 iPhone 地址栏变化造成的卡顿和变形

6. 保留：
   - v3.x 的全机型移动端适配
   - 顶部按钮最上层
   - 小局/今日结算
   - 联机同步防覆盖逻辑

不包含 audio 文件夹。

上传到 GitHub 仓库根目录，替换：
- index.html
- game.js
- online.js

继续保留：
- images/cards
- 如果需要音乐，请你自己保留 audio/bgm.mp3

上传后用这个链接测试：
https://zhangjie2759.github.io/LiluCard-Online-Test/?v=41
