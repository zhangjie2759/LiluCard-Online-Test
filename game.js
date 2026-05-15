// game.js
// 利禄卡 Online v8.2 首页排行榜和我的档案版
// 状态机：lobby / opening / meal_playing / meal_result / night_picking / day_result

const IS_WEB = typeof window !== 'undefined' && typeof document !== 'undefined'
const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

let W = window.innerWidth
let H = window.innerHeight
const DPR = window.devicePixelRatio || 1

canvas.width = W * DPR
canvas.height = H * DPR
ctx.scale(DPR, DPR)

const SAFE_TOP = 18
const SAFE_BOTTOM = 18

const TOTAL_ORDERS_PER_DAY = 10

const meals = [
  { name: '早餐', threshold: 400 },
  { name: '午餐', threshold: 800 },
  { name: '晚餐', threshold: 600 },
  { name: '夜宵', threshold: 800 }
]

const FOOD_CARDS = [
  { name: '生菜沙拉', english: 'Salad', type: '素', kcal: 30 },
  { name: '西兰花', english: 'Broccoli', type: '素', kcal: 50 },
  { name: '牛油果', english: 'Avocado', type: '素', kcal: 80 },
  { name: '炒藕片', english: 'Lotus Root', type: '素', kcal: 80 },
  { name: '烤黄金香菇', english: 'Grilled Golden', type: '素', kcal: 60 },
  { name: '臭豆腐', english: 'Stinky Tofu', type: '素', kcal: 150 },

  { name: '水煮蛋', english: 'Boiled Egg', type: '荤', kcal: 100 },
  { name: '烤生蚝', english: 'Grilled Oyster', type: '荤', kcal: 120 },
  { name: '烤鸡翅', english: 'Chicken Wing', type: '荤', kcal: 160 },
  { name: '烤鱿鱼', english: 'Grilled Squid', type: '荤', kcal: 160 },
  { name: '炸鸡', english: 'Fried Chicken', type: '荤', kcal: 220 },
  { name: '羊肉串', english: 'Lamb Skewer', type: '荤', kcal: 180 },

  { name: '米饭', english: 'Rice Bowl', type: '主食', kcal: 150 },
  { name: '牛肉面', english: 'Beef Noodles', type: '主食', kcal: 200 },
  { name: '饺子', english: 'Dumpling', type: '主食', kcal: 180 },
  { name: '包子', english: 'Baozi', type: '主食', kcal: 180 },
  { name: '披萨片', english: 'Pizza Slice', type: '主食', kcal: 220 },
  { name: '咖喱饭', english: 'Curry Rice', type: '主食', kcal: 250 },

  { name: '酸奶', english: 'Yogurt', type: '甜点', kcal: 80 },
  { name: '布丁', english: 'Pudding', type: '甜点', kcal: 250 },
  { name: '珍珠奶茶', english: 'Milk Tea', type: '甜点', kcal: 260 },
  { name: '冰淇淋', english: 'Ice Cream', type: '甜点', kcal: 300 },
  { name: '瑞士卷', english: 'Swiss Roll', type: '甜点', kcal: 260 },
  { name: '融化蛋糕', english: 'Cake Ooze', type: '甜点', kcal: 350 }
]

const CARD_IMAGE_PATHS = {
  '生菜沙拉': 'images/cards/salad.png',
  '西兰花': 'images/cards/broccoli.png',
  '牛油果': 'images/cards/avocado.png',
  '炒藕片': 'images/cards/lotus_root.png',
  '烤黄金香菇': 'images/cards/grilled_golden.png',
  '臭豆腐': 'images/cards/stinky_tofu.png',

  '水煮蛋': 'images/cards/boiled_egg.png',
  '烤生蚝': 'images/cards/grilled_oyster.png',
  '烤鸡翅': 'images/cards/chicken_wing.png',
  '烤鱿鱼': 'images/cards/grilled_squid.png',
  '炸鸡': 'images/cards/fried_chicken.png',
  '羊肉串': 'images/cards/lamb_skewer.png',

  '米饭': 'images/cards/rice_bowl.png',
  '牛肉面': 'images/cards/beef_noodles.png',
  '饺子': 'images/cards/dumpling.png',
  '包子': 'images/cards/baozi.png',
  '披萨片': 'images/cards/pizza_slice.png',
  '咖喱饭': 'images/cards/curry_rice.png',

  '酸奶': 'images/cards/yogurt.png',
  '布丁': 'images/cards/pudding.png',
  '珍珠奶茶': 'images/cards/milk_tea.png',
  '冰淇淋': 'images/cards/ice_cream.png',
  '瑞士卷': 'images/cards/swiss_roll.png',
  '融化蛋糕': 'images/cards/cake.png'
}

const CARD_BACK_PATHS = {
  '荤': 'images/cards/red_back.png',
  '素': 'images/cards/green_back.png',
  '主食': 'images/cards/yellow_back.png',
  '甜点': 'images/cards/blue_back.png'
}

const TYPE_COLORS = {
  '荤': '#FF9BB4',
  '素': '#A9F0D1',
  '主食': '#FFE169',
  '甜点': '#9EDBFF'
}

const TYPE_TEXT_COLORS = {
  '荤': '#7A1230',
  '素': '#0E5C44',
  '主食': '#5C4300',
  '甜点': '#063D66'
}

let appMode = 'home' // home / single / online
let myPlayerId = 'p1'
let roomId = ''
let roomData = null
let unsubscribeRoom = null
let buttons = []
let message = ''
let rulesExpanded = false
let tarotCard = null
let tarotState = 0 // 0 未出票 / 1 出票动画 / 2 已出票
let tarotRevealStartedAt = 0

// =========================
// 新手教程：轻量覆盖层
// =========================
let tutorialOn = false
let tutorialStep = 0
let tutorialDone = localStorage.getItem('lilucard_tutorial_done') === '1'

// =========================
// 语言切换（v6.6 安全恢复版）
// =========================
let lang = localStorage.getItem('lilucard_lang') || 'zh'

const I18N = {
  zh: {
    langBtn: 'EN',
    musicOn: '音乐 开', musicOff: '音乐 关', musicErr: '音乐失败',
    title: '利禄卡', subtitle: 'LILU CARDS', tagline: '卡路里外卖对战', slogan: '我的嘴，就是秤。', modes: '单机 / 开房间 / 加入房间',
    tarotTitle: '美食塔罗牌', tarotHint: '', tarotButton: '', tarotLoading: '', tarotResultPrefix: '你今天适合吃', tarotAgain: '',
    result: '结算', rules: '查看游戏规则', rulesTitle: '游戏规则', close: '收起', swipe: '上下滑动',
    solo: '单机游戏', create: '开房间', join: '加入房间', home: '首页',
    finalResult: '今日结算', finalWin: '恭喜你赢了！', finalLose: '你输了', finalDraw: '平局', finalWinSub: '你赢得了这一整局', finalLoseSub: '对方赢得了这一整局', finalDrawSub: '双方今天吃得不相上下',
    you: '你', rival: '对手', dayKcal: '全日热量', noRecord: '无记录', nextReady: '下一整局准备', ready: '已准备', notReady: '未准备', readyNext: '准备下一局', waitingRival: '已准备，等待对方', backHome: '返回首页',
    player1: '玩家1', player2: '玩家2', waiting: '等待', room: '房间', onlineMode: '联机模式',
    meat: '荤', veg: '素', staple: '主食', dessert: '甜点', eat: '开吃', reveal: '展示夜宵', opening: '起手中',
    pickedAllNight: '双方已选完夜宵，点击展示', chooseDoneReveal: '选完后展示', drawTogether: '双方可同时抽',
    endReveal: '结束并摊牌', confirmKcal: '确认热量', waitRivalTurn: '对方点餐回合', rivalOrdering: '对方点餐中', waitRivalAction: '请等待对方点外卖或开吃',
    mealResult: '本餐结算', continueBtn: '继续', enter: '进入', confirmEnter: '确认进入', confirmStatus: '确认状态', confirmed: '已确认', unconfirmed: '未确认',
    settledKcal: '已结算热量', totalKcal: '全日总热量', orders: '外卖', warning: '警戒线', hiddenCard: '底牌', cardBack: '背面', noOrders: '无外卖',
    statusBust: '爆牌', statusSafe: '未爆牌', statusStood: '已收手', statusOrdering: '点餐中', statusOpening: '起手中', statusWatching: '观察中',
    mealPoint: '本餐点数', combo: '组合', comboNone: '无组合', comboBustNone: '爆牌不触发组合', yourOrders: '你的外卖', rivalOrders: '对方外卖', quoteWin: '你很会吃啊，小朋友。', quoteLose: '你会吃有个屁用。', quoteDraw: '你俩都挺能装。', youWonMeal: '本餐你赢了', youLostMeal: '本餐你输了', mealDraw: '本餐平局',
    rulesLines: [
      '🎯 胜负目标',
      '每餐胜利 = 1分。一天共 4 餐，最终分数高者获胜。',

      '🔁 游戏流程',
      '游戏分为：早餐 → 午餐 → 晚餐 → 夜宵。',
      '每餐你可以重复选择：点外卖，或开吃。',
      '当双方都开吃后，自动结算本餐胜负。',

      '⚠️ 爆牌规则',
      '每餐都有一个警戒线。',
      '总热量超过警戒线 = 爆牌。',
      '爆牌者本餐直接输。',
      '爆牌这一餐的热量不会计入今日总热量。',

      '👀 信息规则',
      '对方第一张是暗牌。',
      '后续抽的都是明牌。',
      '对方热量显示为：？ + 明牌热量。',

      '🧠 卡牌特性',
      '每张牌都有不同热量。',
      '有低热量补分牌，也有高热量风险牌。',
      '刺客牌看起来安全，但容易让你意外爆牌。',

      '🧩 牌型系统',
      '牌型仅在不爆牌时生效。',
      '中级牌型奖励：+1张荤牌计入今日总热量。',
      '双拼套餐：任意两类 ≥2张。',
      '偏科套餐：任意一类 ≥3张。',
      '高级牌型奖励：本餐直接+1分。',
      '满汉大餐：四类齐全且 ≥5张。',
      '卡线大师：总热量刚好等于警戒线。',
      '每餐只触发最高级一个牌型。',

      '🌙 夜宵规则',
      '夜宵会使用剩余所有外卖次数。',
      '一次性点完，然后统一结算。',

      '✅ 一句话总结',
      '在不爆的前提下，比对方更接近极限。'
    ]
  },
  en: {
    langBtn: '中',
    musicOn: 'Music On', musicOff: 'Music Off', musicErr: 'Music Err',
    title: 'LiluCard', subtitle: 'LILU CARDS', tagline: 'Calorie Takeout Duel', slogan: 'My mouth is the scale.', modes: 'Solo / Create / Join',
    tarotTitle: 'Food Tarot', tarotHint: '', tarotButton: '', tarotLoading: '', tarotResultPrefix: 'Today you should eat ', tarotAgain: '',
    result: 'Result', rules: 'How to Play', rulesTitle: 'How to Play', close: 'Close', swipe: 'Scroll',
    solo: 'Solo', create: 'Create Room', join: 'Join Room', home: 'Home',
    finalResult: 'Final Result', finalWin: 'You Win!', finalLose: 'You Lose', finalDraw: 'Draw', finalWinSub: 'You won the full day', finalLoseSub: 'Rival won the full day', finalDrawSub: 'Both ate equally hard',
    you: 'You', rival: 'Rival', dayKcal: 'Day Total', noRecord: 'No record', nextReady: 'Next round ready', ready: 'Ready', notReady: 'Not ready', readyNext: 'Ready Next Round', waitingRival: 'Ready, waiting', backHome: 'Back Home',
    player1: 'P1', player2: 'P2', waiting: 'Wait', room: 'Room', onlineMode: 'Online Mode',
    meat: 'Meat', veg: 'Veg', staple: 'Staple', dessert: 'Dessert', eat: 'Eat', reveal: 'Reveal Night', opening: 'Opening',
    pickedAllNight: 'Both picked. Tap to reveal.', chooseDoneReveal: 'Pick then reveal', drawTogether: 'Both draw together',
    endReveal: 'Stop & Reveal', confirmKcal: 'Confirm kcal', waitRivalTurn: 'Rival turn', rivalOrdering: 'Rival ordering', waitRivalAction: 'Wait for rival to order or eat',
    mealResult: 'Meal Result', continueBtn: 'Continue', enter: 'Enter ', confirmEnter: 'Confirm ', confirmStatus: 'Confirm', confirmed: 'Confirmed', unconfirmed: 'Pending',
    settledKcal: 'Settled kcal', totalKcal: 'Day total', orders: 'Orders', warning: 'Limit', hiddenCard: 'Hidden', cardBack: 'Back', noOrders: 'No orders',
    statusBust: 'Bust', statusSafe: 'Safe', statusStood: 'Stopped', statusOrdering: 'Ordering', statusOpening: 'Opening', statusWatching: 'Watching',
    mealPoint: 'Meal points', combo: 'Combo', comboNone: 'No combo', comboBustNone: 'Bust: no combo', yourOrders: 'Your Orders', rivalOrders: 'Rival Orders', quoteWin: 'You really know how to eat.', quoteLose: 'Eating well did nothing.', quoteDraw: 'Both of you can bluff.', youWonMeal: 'You won this meal', youLostMeal: 'You lost this meal', mealDraw: 'Meal Draw',
    rulesLines: [
      '🎯 Goal',
      'Winning a meal gives 1 point. There are 4 meals in a day. Higher final score wins.',

      '🔁 Game Flow',
      'The day has 4 meals: Breakfast → Lunch → Dinner → Night Snack.',
      'During each meal, you may keep ordering cards or choose Eat to stop.',
      'When both players choose Eat, the meal is settled automatically.',

      '⚠️ Bust Rule',
      'Each meal has a calorie limit.',
      'Going over the limit means Bust.',
      'If you bust, you lose that meal immediately.',
      'Calories from a busted meal do not count toward your daily total.',

      '👀 Information',
      'The rival’s first card is hidden.',
      'All later cards are visible.',
      'The rival’s calories show as: ? + visible calories.',

      '🧠 Card Traits',
      'Each card has a different calorie value.',
      'Some cards are low-calorie fillers, while others are high-risk cards.',
      'Assassin cards may look safe, but can unexpectedly make you bust.',

      '🧩 Combo System',
      'Combos only activate if you do not bust.',
      'Mid combo reward: +1 Meat card added to your daily total.',
      'Double Combo: any two categories have at least 2 cards each.',
      'One-Type Combo: any one category has at least 3 cards.',
      'High combo reward: +1 point for this meal.',
      'Full Feast: all 4 categories appear and you have at least 5 cards.',
      'Limit Master: your calories exactly equal the limit.',
      'Only the highest combo can trigger each meal.',

      '🌙 Night Snack',
      'Night Snack uses all remaining order chances.',
      'Choose them all at once, then reveal and settle.',

      '✅ Summary',
      'Do not bust. Get closer to the limit than your rival.'
    ]
  }
}

function t(key) {
  const pack = I18N[lang] || I18N.zh
  return pack[key] !== undefined ? pack[key] : (I18N.zh[key] || key)
}

function mealName(index) {
  const names = lang === 'en'
    ? ['Breakfast', 'Lunch', 'Dinner', 'Night Snack']
    : ['早餐', '午餐', '晚餐', '夜宵']
  return names[index] || ''
}

function foodName(card) {
  if (!card) return ''
  return lang === 'en' ? (card.english || card.name || '') : (card.name || card.english || '')
}

function foodTypeLabel(type) {
  const t0 = normalizeType(type)
  if (t0 === '荤') return t('meat')
  if (t0 === '素') return t('veg')
  if (t0 === '主食') return t('staple')
  if (t0 === '甜点') return t('dessert')
  return t0
}

function playerLabel(pid) {
  return pid === 'p1' ? t('player1') : t('player2')
}

function comboLabel(name) {
  if (lang !== 'en') return name
  const map = {
    '卡线大师': 'Limit Master',
    '满汉大餐': 'Full Feast',
    '偏科套餐': 'One-type Combo',
    '双拼套餐': 'Double Combo'
  }
  return map[name] || name
}

function comboResultText(combo) {
  if (!combo) return t('comboNone')
  if (lang !== 'en') return combo.resultText || combo.name || ''
  if (combo.level === 'high') return `${comboLabel(combo.name)}: +1 meal point`
  if (combo.rewardCard) return `${comboLabel(combo.name)}: bonus ${foodName(combo.rewardCard)} +${combo.rewardCard.kcal} kcal`
  return `${comboLabel(combo.name)}: no bonus Meat card`
}

function localizedMealResultText(result, selfId) {
  if (!result) return ''
  const oppId = otherPlayer(selfId)
  if (lang === 'zh') return result.resultText || ''
  if (!result.winner) return 'This meal is a draw'
  return result.winner === selfId ? 'You win this meal' : 'Rival wins this meal'
}

function toggleLang() {
  lang = lang === 'zh' ? 'en' : 'zh'
  localStorage.setItem('lilucard_lang', lang)
  requestRender()
}

// =========================
// 背景音乐 BGM
// =========================
// 请在 GitHub 根目录上传：audio/bgm.mp3
// 手机浏览器必须在玩家第一次点击后才能播放音乐。
const BGM_SRC = './audio/bgm.mp3'

let bgm = null
let bgmEnabled = true
let bgmStarted = false
let bgmLoadFailed = false
let localReadyLocked = false
let startRequested = false
let startOverlayText = ''
let startOverlayUntil = 0
let localGameActionSeq = 0
let pendingWriteUntil = 0
let pendingActionId = ''
let rulesScroll = 0
let rulesMaxScroll = 0
let rulesTouchDragging = false
let rulesTouchLastY = 0
const buttonPulse = {}
const BUTTON_PULSE_MS = 160
let onlineActionLocked = false
let onlineActionLockUntil = 0

let game = createGame('single')

function initBgm() {
  if (bgm) return

  try {
    bgm = new Audio(BGM_SRC)
    bgm.loop = true
    bgm.volume = 0.32
    bgm.preload = 'auto'

    bgm.addEventListener('error', () => {
      bgmLoadFailed = true
      requestRender()
    })
  } catch (err) {
    bgmLoadFailed = true
  }
}

function startBgm() {
  if (!bgmEnabled) return

  initBgm()

  if (!bgm || bgmLoadFailed) return

  bgm.play()
    .then(() => {
      bgmStarted = true
      requestRender()
    })
    .catch(() => {
      // 手机浏览器可能会拦截，等下一次玩家点击再尝试。
    })
}

function toggleBgm() {
  initBgm()

  bgmEnabled = !bgmEnabled

  if (bgmEnabled) {
    startBgm()
  } else if (bgm) {
    bgm.pause()
  }

  requestRender()
}

function drawMusicButton() {
  const label = bgmLoadFailed
    ? t('musicErr')
    : bgmEnabled
      ? t('musicOn')
      : t('musicOff')

  const y = 4
  const h = 22
  const font = 9
  const musicW = lang === 'en' ? 64 : 50
  const langW = 32
  const tutorialW = lang === 'en' ? 48 : 40

  addButton('music_toggle', label, 8, y, musicW, h, '#FFFFFF', '#111', font)
  addButton('lang_toggle', t('langBtn'), 12 + musicW, y, langW, h, '#FFFFFF', '#111', font)

  // v7.6：首页增加教程入口，和音乐/中英按钮同一水平线、同一高度。
  if (appMode === 'home') {
    addButton('tutorial_btn', lang === 'en' ? 'Guide' : '教程', 16 + musicW + langW, y, tutorialW, h, '#FFFFFF', '#111', font)
  }
}



// =========================
// 基础工具
// =========================

function safeArray(value) {
  if (Array.isArray(value)) return value.filter(v => v !== null && v !== undefined)
  if (!value) return []
  if (typeof value === 'object') {
    return Object.keys(value)
      .sort((a, b) => Number(a) - Number(b))
      .map(k => value[k])
      .filter(v => v !== null && v !== undefined)
  }
  return []
}

function safeNumberArray(value, length) {
  const arr = safeArray(value)
  const out = []
  for (let i = 0; i < length; i++) out[i] = Number(arr[i] || 0)
  return out
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function randomId() {
  return `${Date.now()}_${Math.floor(Math.random() * 999999)}`
}

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const t = a[i]
    a[i] = a[j]
    a[j] = t
  }
  return a
}

function cloneCard(card) {
  return {
    id: randomId(),
    name: card.name,
    english: card.english,
    type: card.type,
    kcal: card.kcal,
    hidden: false,
    privateCard: false
  }
}

function makeDeck() {
  return shuffle(FOOD_CARDS.map(cloneCard))
}

function normalizeType(cardOrType) {
  const t = typeof cardOrType === 'string'
    ? cardOrType
    : (cardOrType.type || cardOrType.category || cardOrType.suit || cardOrType.kind || '')

  if (t === '荤' || t === '肉' || t === '肉菜' || t === 'meat') return '荤'
  if (t === '素' || t === '素菜' || t === 'veg') return '素'
  if (t === '主' || t === '主食' || t === 'rice' || t === 'staple') return '主食'
  if (t === '甜' || t === '甜点' || t === 'dessert') return '甜点'
  return t
}

function drawFromDeck(g, type) {
  if (!g.deck || g.deck.length === 0) g.deck = makeDeck()

  let indexes = []
  if (type) {
    for (let i = 0; i < g.deck.length; i++) {
      if (normalizeType(g.deck[i]) === type) indexes.push(i)
    }

    if (indexes.length === 0) {
      g.deck = g.deck.concat(makeDeck())
      for (let i = 0; i < g.deck.length; i++) {
        if (normalizeType(g.deck[i]) === type) indexes.push(i)
      }
    }
  } else {
    indexes = g.deck.map((_, i) => i)
  }

  if (indexes.length === 0) return null
  const deckIndex = indexes[Math.floor(Math.random() * indexes.length)]
  return g.deck.splice(deckIndex, 1)[0]
}

function calcCardsKcal(cards) {
  return safeArray(cards).reduce((sum, card) => sum + Number(card.kcal || 0), 0)
}

function getVisibleKcal(cards) {
  return safeArray(cards).reduce((sum, card) => {
    if (card.hidden) return sum
    return sum + Number(card.kcal || 0)
  }, 0)
}

function getPlayerName(pid) {
  return playerLabel(pid)
}

function otherPlayer(pid) {
  return pid === 'p1' ? 'p2' : 'p1'
}

function getSelfId() {
  return appMode === 'online' ? myPlayerId : 'p1'
}

function getOpponentId() {
  return otherPlayer(getSelfId())
}

function getMeal() {
  return meals[game.mealIndex]
}

function getRoomPlayers() {
  return roomData && roomData.players ? roomData.players : {}
}

function isReadyLockedForMe() {
  const players = getRoomPlayers()
  return Boolean(localReadyLocked || (players[myPlayerId] && players[myPlayerId].ready))
}

function areBothPlayersReady() {
  const players = getRoomPlayers()
  return Boolean(players.p1 && players.p2 && players.p1.ready && players.p2.ready)
}

function showStartOverlay(text, ms) {
  startOverlayText = text || '开局中...'
  startOverlayUntil = Date.now() + (ms || 1200)
}

function isBusted(g, pid) {
  const meal = meals[g.mealIndex]
  return calcCardsKcal(g.players[pid].cards) > meal.threshold
}


function isEnded(g, pid) {
  const p = g.players[pid]
  // v2.4：爆牌不再自动结束。
  // 玩家可以继续叫外卖来迷惑对方，只有主动开吃才算结束。
  return Boolean(p.stood)
}

function getRemainingOrders(g, pid) {
  return Math.max(0, TOTAL_ORDERS_PER_DAY - Number(g.records[pid].dayOrdersUsed || 0))
}

function getMealStarter(g, index) {
  if (!g.firstTurnPlayer) g.firstTurnPlayer = Math.random() < 0.5 ? 'p1' : 'p2'

  if (index === 0) return g.firstTurnPlayer
  if (index === 1) return otherPlayer(g.firstTurnPlayer)
  if (index === 2) return g.firstTurnPlayer
  return null
}

// =========================
// 游戏数据结构
// =========================

function createPlayerState() {
  return {
    cards: [],
    nightChoices: [],
    stood: false,
    busted: false,
    ordersUsed: 0
  }
}

function createRecord() {
  return {
    mealKcal: meals.map(() => 0),
    rawMealKcal: meals.map(() => 0),
    basePoint: meals.map(() => 0),
    comboBonusPoint: meals.map(() => 0),
    comboResults: meals.map(() => null),
    dayBonusKcal: 0,
    dayBonusCards: [],
    dayOrdersUsed: 0
  }
}

function normalizePlayerState(p) {
  const base = createPlayerState()
  const src = p && typeof p === 'object' ? p : {}
  return {
    ...base,
    ...src,
    cards: safeArray(src.cards),
    nightChoices: safeArray(src.nightChoices),
    stood: Boolean(src.stood),
    busted: Boolean(src.busted),
    ordersUsed: Number(src.ordersUsed || 0)
  }
}

function normalizeRecord(r) {
  const base = createRecord()
  const src = r && typeof r === 'object' ? r : {}

  return {
    ...base,
    ...src,
    mealKcal: safeNumberArray(src.mealKcal, meals.length),
    rawMealKcal: safeNumberArray(src.rawMealKcal, meals.length),
    basePoint: safeNumberArray(src.basePoint, meals.length),
    comboBonusPoint: safeNumberArray(src.comboBonusPoint, meals.length),
    comboResults: safeArray(src.comboResults),
    dayBonusKcal: Number(src.dayBonusKcal || 0),
    dayBonusCards: safeArray(src.dayBonusCards),
    dayOrdersUsed: Number(src.dayOrdersUsed || 0)
  }
}

function normalizeGame(g) {
  const base = createGame('online')
  const src = g && typeof g === 'object' ? g : {}

  return {
    ...base,
    ...src,
    deck: safeArray(src.deck),
    players: {
      p1: normalizePlayerState(src.players && src.players.p1),
      p2: normalizePlayerState(src.players && src.players.p2)
    },
    records: {
      p1: normalizeRecord(src.records && src.records.p1),
      p2: normalizeRecord(src.records && src.records.p2)
    },
    mealIndex: Number(src.mealIndex || 0),
    actionSeq: Number(src.actionSeq || 0),
    lastMealResult: src.lastMealResult || null,
    mealResults: safeArray(src.mealResults).length ? safeArray(src.mealResults) : meals.map(() => null),
    firstTurnPlayer: src.firstTurnPlayer || null,
    turn: src.turn || null,
    phase: src.phase || 'lobby',
    message: src.message || '',
    comboMessage: src.comboMessage || '',
    nextReady: {
      p1: Boolean(src.nextReady && src.nextReady.p1),
      p2: Boolean(src.nextReady && src.nextReady.p2)
    },
    replayReady: {
      p1: Boolean(src.replayReady && src.replayReady.p1),
      p2: Boolean(src.replayReady && src.replayReady.p2)
    }
  }
}

function createGame(mode) {
  return {
    mode,
    phase: mode === 'single' ? 'opening' : 'lobby',
    mealIndex: 0,
    turn: null,
    firstTurnPlayer: null,
    deck: makeDeck(),
    players: {
      p1: createPlayerState(),
      p2: createPlayerState()
    },
    records: {
      p1: createRecord(),
      p2: createRecord()
    },
    lastMealResult: null,
    mealResults: meals.map(() => null),
    message: mode === 'single'
      ? `${mealName(0)}${lang === 'en' ? ': opening draw, take 2 cards' : '开始：起手阶段，先抽2张起手牌'}`
      : (lang === 'en' ? 'Waiting for players to join and ready up' : '等待玩家加入并准备'),
    comboMessage: '',
    actionSeq: 0,
    nextReady: { p1: false, p2: false },
    replayReady: { p1: false, p2: false }
  }
}

function resetMealState(g) {
  g.players.p1 = createPlayerState()
  g.players.p2 = createPlayerState()
  g.lastMealResult = null
  g.comboMessage = ''
  g.nextReady = { p1: false, p2: false }
}

function enterOpening(g) {
  g.phase = 'opening'
  g.turn = null
  resetMealState(g)
  g.message = lang === 'en' ? `${mealName(g.mealIndex)} starts: both players draw 2 opening cards` : `${mealName(g.mealIndex)}开始：起手阶段不分先后，双方各抽2张`
}

function enterMealPlayingIfReady(g) {
  const p1Count = safeArray(g.players.p1.cards).length
  const p2Count = safeArray(g.players.p2.cards).length

  if (p1Count < 2 || p2Count < 2) return false

  g.players.p1.busted = isBusted(g, 'p1')
  g.players.p2.busted = isBusted(g, 'p2')

  if (isEnded(g, 'p1') && isEnded(g, 'p2')) {
    settleMeal(g)
    return true
  }

  const starter = getMealStarter(g, g.mealIndex)
  g.turn = isEnded(g, starter) ? otherPlayer(starter) : starter
  g.phase = 'meal_playing'
  g.message = lang === 'en' ? `${mealName(g.mealIndex)} ordering starts: ${getPlayerName(g.turn)}'s turn` : `${mealName(g.mealIndex)}点餐开始：${getPlayerName(g.turn)}点餐回合`
  return true
}

function enterNightPicking(g) {
  g.phase = 'night_picking'
  g.turn = null
  resetMealState(g)

  const p1Remain = getRemainingOrders(g, 'p1')
  const p2Remain = getRemainingOrders(g, 'p2')

  // v7.3：夜宵边界兜底。
  // 如果双方都没有剩余外卖次数，不再停在 night_picking 等待玩家操作，直接以 0 kcal 结算夜宵。
  if (p1Remain <= 0 && p2Remain <= 0) {
    g.message = lang === 'en'
      ? 'Night Snack skipped: both players have no order chances left.'
      : '夜宵跳过：双方都没有剩余外卖次数，直接结算夜宵。'
    revealNightAndSettle(g)
    return
  }

  g.message = lang === 'en' ? 'Night Snack: both players pick with remaining order chances' : '夜宵开始：不分先后，双方按剩余外卖次数选择搭配'
}

function enterNextMeal(g) {
  const next = g.mealIndex + 1

  if (next >= meals.length) {
    g.phase = 'day_result'
    g.turn = null
    g.message = lang === 'en' ? 'Final result complete' : '今日结算完成'
    return
  }

  g.mealIndex = next
  g.nextReady = { p1: false, p2: false }

  if (g.mealIndex === 3) {
    enterNightPicking(g)
  } else {
    enterOpening(g)
  }
}

// =========================
// 组合与结算
// =========================

function getTypeCounts(cards) {
  const counts = { '荤': 0, '素': 0, '主食': 0, '甜点': 0 }

  safeArray(cards).forEach(card => {
    const type = normalizeType(card)
    if (counts[type] !== undefined) counts[type] += 1
  })

  return counts
}

function evaluateMealCombo(cards, threshold) {
  const total = calcCardsKcal(cards)
  if (total > threshold) return null

  const counts = getTypeCounts(cards)
  const types = ['荤', '素', '主食', '甜点']
  const hasAllTypes = types.every(type => counts[type] >= 1)
  const pairTypes = types.filter(type => counts[type] >= 2)
  const maxType = types.reduce((a, b) => counts[a] >= counts[b] ? a : b)
  const maxCount = counts[maxType]

  if (total === threshold) {
    return {
      level: 'high',
      name: '卡线大师',
      desc: '本餐热量刚好等于警戒线',
      reward: '本餐胜局 +1'
    }
  }

  if (hasAllTypes) {
    return {
      level: 'high',
      name: '满汉大餐',
      desc: '荤 / 素 / 主食 / 甜点四类齐全',
      reward: '本餐胜局 +1'
    }
  }

  const hasDoubleCombo = pairTypes.length >= 2
  const hasBiasCombo = maxCount >= 3

  if (hasDoubleCombo && hasBiasCombo) {
    if (maxCount >= 4) {
      return {
        level: 'middle',
        name: '偏科套餐',
        desc: `${maxType}类 ≥3 张`,
        reward: '抽1张荤牌加入全日总分'
      }
    }

    return {
      level: 'middle',
      name: '双拼套餐',
      desc: '任意两个类别各 ≥2 张',
      reward: '抽1张荤牌加入全日总分'
    }
  }

  if (hasDoubleCombo) {
    return {
      level: 'middle',
      name: '双拼套餐',
      desc: '任意两个类别各 ≥2 张',
      reward: '抽1张荤牌加入全日总分'
    }
  }

  if (hasBiasCombo) {
    return {
      level: 'middle',
      name: '偏科套餐',
      desc: `${maxType}类 ≥3 张`,
      reward: '抽1张荤牌加入全日总分'
    }
  }

  return null
}

function drawRewardMeatCard(g, pid) {
  let indexes = []
  for (let i = 0; i < g.deck.length; i++) {
    if (normalizeType(g.deck[i]) === '荤') indexes.push(i)
  }

  if (indexes.length === 0) {
    g.deck = g.deck.concat(makeDeck())
    for (let i = 0; i < g.deck.length; i++) {
      if (normalizeType(g.deck[i]) === '荤') indexes.push(i)
    }
  }

  if (indexes.length === 0) return null

  const deckIndex = indexes[Math.floor(Math.random() * indexes.length)]
  const reward = g.deck.splice(deckIndex, 1)[0]
  reward.hidden = false
  reward.privateCard = false

  g.records[pid].dayBonusCards.push(reward)
  g.records[pid].dayBonusKcal += Number(reward.kcal || 0)

  return reward
}

function settlePlayerCombo(g, pid) {
  const meal = meals[g.mealIndex]
  const player = g.players[pid]
  const total = calcCardsKcal(player.cards)
  const busted = total > meal.threshold

  g.records[pid].rawMealKcal[g.mealIndex] = total
  g.records[pid].mealKcal[g.mealIndex] = busted ? 0 : total

  player.busted = busted
  player.stood = true

  if (busted) {
    g.records[pid].comboResults[g.mealIndex] = null
    return null
  }

  const combo = evaluateMealCombo(player.cards, meal.threshold)

  if (!combo) {
    g.records[pid].comboResults[g.mealIndex] = null
    return null
  }

  if (combo.level === 'high') {
    g.records[pid].comboBonusPoint[g.mealIndex] += 1
    combo.resultText = `${combo.name}：本餐胜局 +1`
  }

  if (combo.level === 'middle') {
    const rewardCard = drawRewardMeatCard(g, pid)
    combo.rewardCard = rewardCard || null

    if (rewardCard) {
      combo.resultText = `${combo.name}：奖励 ${rewardCard.name} +${rewardCard.kcal} kcal`
    } else {
      combo.resultText = `${combo.name}：没有可奖励的荤牌`
    }
  }

  g.records[pid].comboResults[g.mealIndex] = combo
  return combo
}

function getMealPoint(g, pid, mealIndex) {
  return Number(g.records[pid].basePoint[mealIndex] || 0) + Number(g.records[pid].comboBonusPoint[mealIndex] || 0)
}

function getMealTotalPoint(g, pid) {
  let point = 0
  for (let i = 0; i < meals.length; i++) point += getMealPoint(g, pid, i)
  return point
}

function getDayBaseKcal(g, pid) {
  return safeNumberArray(g.records[pid].mealKcal, meals.length).reduce((sum, kcal) => sum + kcal, 0)
}

function getDayTotalKcal(g, pid) {
  return getDayBaseKcal(g, pid) + Number(g.records[pid].dayBonusKcal || 0)
}

function getDayTotalPoint(g, pid) {
  const p1 = getDayTotalKcal(g, 'p1')
  const p2 = getDayTotalKcal(g, 'p2')

  if (p1 === p2) return 0
  if (pid === 'p1') return p1 > p2 ? 1 : 0
  return p2 > p1 ? 1 : 0
}

function getFinalPoint(g, pid) {
  return getMealTotalPoint(g, pid) + getDayTotalPoint(g, pid)
}

function settleMeal(g) {
  const meal = meals[g.mealIndex]

  safeArray(g.players.p1.cards).forEach(card => { card.hidden = false })
  safeArray(g.players.p2.cards).forEach(card => { card.hidden = false })

  const p1Total = calcCardsKcal(g.players.p1.cards)
  const p2Total = calcCardsKcal(g.players.p2.cards)
  const p1Busted = p1Total > meal.threshold
  const p2Busted = p2Total > meal.threshold

  g.players.p1.busted = p1Busted
  g.players.p2.busted = p2Busted
  g.players.p1.stood = true
  g.players.p2.stood = true

  const p1Combo = settlePlayerCombo(g, 'p1')
  const p2Combo = settlePlayerCombo(g, 'p2')

  let resultText = ''
  let winner = null

  if (p1Busted && p2Busted) {
    resultText = '双方都爆牌，本餐无人得分'
  } else if (p1Busted) {
    g.records.p2.basePoint[g.mealIndex] += 1
    winner = 'p2'
    resultText = '玩家1爆牌，玩家2赢得本餐'
  } else if (p2Busted) {
    g.records.p1.basePoint[g.mealIndex] += 1
    winner = 'p1'
    resultText = '玩家2爆牌，玩家1赢得本餐'
  } else if (p1Total > p2Total) {
    g.records.p1.basePoint[g.mealIndex] += 1
    winner = 'p1'
    resultText = '玩家1热量更高，赢得本餐'
  } else if (p2Total > p1Total) {
    g.records.p2.basePoint[g.mealIndex] += 1
    winner = 'p2'
    resultText = '玩家2热量更高，赢得本餐'
  } else {
    resultText = '双方热量相同，本餐平局'
  }

  const p1Point = getMealPoint(g, 'p1', g.mealIndex)
  const p2Point = getMealPoint(g, 'p2', g.mealIndex)

  g.lastMealResult = {
    mealIndex: g.mealIndex,
    mealName: meal.name,
    threshold: meal.threshold,
    p1Cards: clone(g.players.p1.cards),
    p2Cards: clone(g.players.p2.cards),
    p1Total,
    p2Total,
    p1Busted,
    p2Busted,
    p1Combo,
    p2Combo,
    p1Point,
    p2Point,
    winner,
    resultText,
    scoreText: `${t('player1')} ${getMealTotalPoint(g, 'p1')} : ${getMealTotalPoint(g, 'p2')} ${t('player2')}`
  }

  if (!g.mealResults) g.mealResults = meals.map(() => null)
  g.mealResults[g.mealIndex] = clone(g.lastMealResult)

  g.phase = g.mealIndex >= meals.length - 1 ? 'meal_result' : 'meal_result'
  g.turn = null
  g.nextReady = { p1: false, p2: false }
  g.message = lang === 'en' ? `${mealName(g.mealIndex)} result: ${localizedMealResultText(g.lastMealResult, getSelfId())}` : `${mealName(g.mealIndex)}结算：${resultText}`
  g.comboMessage = ''
  g.actionSeq += 1
}

// =========================
// 玩家操作
// =========================



function canPlayerAct(g, pid) {
  if (g.phase === 'opening') {
    return safeArray(g.players[pid].cards).length < 2
  }

  if (g.phase === 'meal_playing') {
    if (g.players[pid].stood) return false
    return g.turn === pid
  }

  if (g.phase === 'night_picking') {
    return getRemainingOrders(g, pid) > 0
  }

  return false
}



function getActionHint(g, selfId) {
  const oppId = otherPlayer(selfId)
  const self = g.players[selfId]
  const opp = g.players[oppId]

  if (appMode === 'online' && (!roomData || roomData.status === 'lobby' || g.phase === 'lobby')) {
    const players = roomData && roomData.players ? roomData.players : {}
    const p1Ready = Boolean(players.p1 && players.p1.ready)
    const p2Ready = Boolean(players.p2 && players.p2.ready)

    if (!players.p1 || !players.p2) return lang === 'en' ? `${t('room')} ${roomId}: waiting for another player` : `房间码 ${roomId}：等待另一名玩家加入`
    return lang === 'en'
      ? `Ready: ${t('player1')} ${p1Ready ? t('ready') : t('notReady')} | ${t('player2')} ${p2Ready ? t('ready') : t('notReady')}`
      : `准备状态：玩家1 ${p1Ready ? '已准备' : '未准备'}｜玩家2 ${p2Ready ? '已准备' : '未准备'}`
  }

  if (g.phase === 'opening') {
    const count = safeArray(self.cards).length
    const oppCount = safeArray(opp.cards).length

    if (count < 2) return lang === 'en' ? `Opening: draw directly, ${count}/2` : `起手阶段：你可以直接抽牌，目前 ${count}/2`
    if (oppCount < 2) return lang === 'en' ? 'Opening complete. Waiting for rival.' : '你已抽满起手牌，等待对方出牌'
    return lang === 'en' ? 'Both openings complete. Ordering begins.' : '双方起手完成，准备进入点餐回合'
  }

  if (g.phase === 'meal_playing') {
    if (self.stood) return lang === 'en' ? 'You stopped. Wait for rival to order or eat.' : '你已开吃，等待对方继续点外卖或开吃'
    if (opp.stood && g.turn === selfId) return lang === 'en' ? 'Rival stopped. You may order more or eat.' : '对方已开吃，你可以继续点外卖，或选择开吃结算'

    if (g.turn === selfId) {
      if (self.busted || isBusted(g, selfId)) {
        return lang === 'en' ? 'Busted: you can still bluff, or eat to reveal.' : '你的点餐回合：你已爆牌，但可以继续叫外卖迷惑对方，或选择开吃'
      }

      return lang === 'en' ? 'Your turn: order or eat' : '你的点餐回合：请选择外卖或收手'
    }

    return lang === 'en' ? "Rival's turn: wait. Rival hidden card is unknown." : '对方点餐回合：请等待对方点外卖或开吃；对方底牌热量未知'
  }

  if (g.phase === 'night_picking') {
    const remain = getRemainingOrders(g, selfId)
    const oppRemain = getRemainingOrders(g, oppId)

    if (remain > 0) return lang === 'en' ? `Night Snack: choose ${remain} more orders` : `夜宵阶段：不分先后，你还要选择 ${remain} 单`
    if (oppRemain > 0) return lang === 'en' ? 'Your night picks are done. Waiting for rival.' : '你已选完夜宵，等待对方选完'
    return lang === 'en' ? 'Both picked Night Snack. Tap reveal.' : '双方夜宵已选完，点击展示夜宵'
  }

  if (g.phase === 'night_ready') {
    return lang === 'en' ? 'Both picked. Tap Reveal to settle.' : '双方夜宵已选完，点击“展示夜宵”后统一揭晓'
  }

  if (g.phase === 'meal_result') {
    const next = g.mealIndex >= 3 ? (lang === 'en' ? 'Final Result' : '今日结算') : mealName(g.mealIndex + 1)
    return lang === 'en' ? `Meal settled. Tap to enter ${next}.` : `本餐结算完成，点击「进入${next}」`
  }

  if (g.phase === 'day_result') return lang === 'en' ? 'Final result complete' : '今日结算完成'

  return g.message || ''
}



function applyDraw(g, pid, type) {
  if (!canPlayerAct(g, pid)) return

  if (g.phase === 'opening') {
    const card = drawFromDeck(g, type)
    if (!card) return

    card.hidden = false
    card.privateCard = safeArray(g.players[pid].cards).length === 0
    g.players[pid].cards.push(card)

    if (isBusted(g, pid)) {
      // 只有自己界面会通过自己的总热量知道爆牌；
      // 不在共享 message 里暴露给对方。
      g.players[pid].busted = true
    }

    g.message = lang === 'en' ? `${getPlayerName(pid)} drew an opening card` : `${getPlayerName(pid)}抽了一张起手牌`

    enterMealPlayingIfReady(g)
    g.actionSeq += 1
    return
  }

  if (g.phase === 'meal_playing') {
    const card = drawFromDeck(g, type)
    if (!card) return

    card.hidden = false
    card.privateCard = false
    g.players[pid].cards.push(card)
    g.players[pid].ordersUsed += 1
    g.records[pid].dayOrdersUsed += 1

    if (isBusted(g, pid)) {
      // v2.4：爆牌只记录在状态里，不自动结束，也不广播给对方。
      g.players[pid].busted = true
    }

    g.message = lang === 'en' ? `${getPlayerName(pid)} ordered ${foodTypeLabel(type)}` : `${getPlayerName(pid)}点了一单${type}外卖`

    // 只有双方都主动开吃，才进入本餐结算。
    if (g.players.p1.stood && g.players.p2.stood) {
      settleMeal(g)
    } else {
      const other = otherPlayer(pid)
      g.turn = g.players[other].stood ? pid : other
      g.message += lang === 'en' ? `, ${getPlayerName(g.turn)}'s turn` : `，${getPlayerName(g.turn)}点餐回合`
    }

    g.actionSeq += 1
    return
  }

  if (g.phase === 'night_picking') {
    if (getRemainingOrders(g, pid) <= 0) return

    g.players[pid].nightChoices.push(type)
    g.records[pid].dayOrdersUsed += 1

    const remain = getRemainingOrders(g, pid)
    g.message = lang === 'en' ? `${getPlayerName(pid)} picked a night order; ${remain} left` : `${getPlayerName(pid)}选择了一单夜宵；剩余 ${remain} 单`

    if (getRemainingOrders(g, 'p1') <= 0 && getRemainingOrders(g, 'p2') <= 0) {
      g.phase = 'night_ready'
      g.turn = null
      g.message = lang === 'en' ? 'Both picked Night Snack. Tap reveal.' : '双方夜宵已选完，点击展示夜宵'
    }

    g.actionSeq += 1
  }
}


function applyStand(g, pid) {
  if (g.phase === 'opening') {
    g.message = lang === 'en' ? 'Draw 2 opening cards first' : '起手阶段请先抽满2张起手牌'
    return
  }

  if (g.phase === 'meal_playing') {
    if (g.players[pid].stood) return

    if (safeArray(g.players[pid].cards).length < 2) {
      g.message = lang === 'en' ? `${getPlayerName(pid)} has not drawn 2 opening cards` : `${getPlayerName(pid)}还没抽满起手牌`
      return
    }

    if (isBusted(g, pid)) {
      g.players[pid].busted = true
    }

    g.players[pid].stood = true
    g.message = lang === 'en' ? `${getPlayerName(pid)} chose to eat` : `${getPlayerName(pid)}选择收手`

    if (g.players.p1.stood && g.players.p2.stood) {
      settleMeal(g)
    } else {
      const other = otherPlayer(pid)
      if (!g.players[other].stood) g.turn = other
    }

    g.actionSeq += 1
    return
  }

  if (g.phase === 'night_picking') {
    g.message = getRemainingOrders(g, pid) > 0
      ? (lang === 'en' ? `Pick all night orders first: ${getRemainingOrders(g, pid)} left` : `请先选完夜宵搭配，还剩 ${getRemainingOrders(g, pid)} 单`)
      : (lang === 'en' ? 'Your night picks are done. Waiting for rival.' : '你已选完夜宵，等待对方')
    g.actionSeq += 1
  }
}

function revealNightAndSettle(g) {
  ;['p1', 'p2'].forEach(pid => {
    const player = g.players[pid]
    safeArray(player.nightChoices).forEach(type => {
      const card = drawFromDeck(g, type)
      if (card) {
        card.hidden = false
        card.privateCard = false
        player.cards.push(card)
      }
    })
    player.nightChoices = []
    player.stood = true
  })

  settleMeal(g)
}


function applyNext(g, pid) {
  if (g.phase === 'meal_result') {
    if (appMode === 'online') {
      if (!g.nextReady) g.nextReady = { p1: false, p2: false }

      g.nextReady[pid] = true

      if (g.nextReady.p1 && g.nextReady.p2) {
        enterNextMeal(g)
      } else {
        const nextName = g.mealIndex >= meals.length - 1 ? t('finalResult') : mealName(g.mealIndex + 1)
        g.message = lang === 'en' ? `${getPlayerName(pid)} confirmed, waiting for rival to enter ${nextName}` : `${getPlayerName(pid)}已确认，等待对方进入${nextName}`
      }

      g.actionSeq += 1
      return
    }

    enterNextMeal(g)
    g.actionSeq += 1
    return
  }

  if (g.phase === 'day_result') {
    // 今日结算页不自动重开，由 replayReady 控制
  }
}

function createReplayGameFrom(g) {
  const fresh = createGame(appMode === 'online' ? 'online' : 'single')
  fresh.phase = 'opening'
  fresh.message = lang === 'en' ? 'New round: Breakfast opening, both players draw 2 cards' : '新一局开始：早餐起手阶段，双方可以同时抽2张'
  fresh.actionSeq = Number(g.actionSeq || 0) + 1
  fresh.nextReady = { p1: false, p2: false }
  fresh.replayReady = { p1: false, p2: false }
  return fresh
}

function applyReplayReady(pid) {
  if (appMode !== 'online') {
    leaveToHome()
    return
  }

  if (!game.replayReady) game.replayReady = { p1: false, p2: false }

  game.replayReady[pid] = true

  if (game.replayReady.p1 && game.replayReady.p2) {
    game = createReplayGameFrom(game)
    // v2.4：下一整局直接进入起手阶段，不再弹出“双方已准备”覆盖层。
  } else {
    game.message = lang === 'en' ? `${getPlayerName(pid)} is ready for next round, waiting for rival` : `${getPlayerName(pid)}已准备下一局，等待对方准备`
    game.actionSeq += 1
  }
}


// =========================
// 单机 AI
// =========================

function aiOpeningIfNeeded(g) {
  while (g.phase === 'opening' && safeArray(g.players.p2.cards).length < 2) {
    const types = ['荤', '素', '主食', '甜点']
    applyDraw(g, 'p2', types[Math.floor(Math.random() * types.length)])
  }
}

function aiTakeTurn(g) {
  if (appMode !== 'single') return
  if (g.phase !== 'meal_playing') return
  if (g.turn !== 'p2') return
  if (isEnded(g, 'p2')) return

  const meal = meals[g.mealIndex]
  const p2Total = calcCardsKcal(g.players.p2.cards)
  const p1Total = calcCardsKcal(g.players.p1.cards)

  if (p2Total < meal.threshold * 0.48) {
    applyDraw(g, 'p2', ['荤', '素', '主食', '甜点'][Math.floor(Math.random() * 4)])
  } else if (!g.players.p1.busted && !g.players.p1.stood && p2Total < p1Total - 50 && p2Total < meal.threshold - 80) {
    applyDraw(g, 'p2', ['荤', '素', '主食', '甜点'][Math.floor(Math.random() * 4)])
  } else if (Math.random() < 0.35 && p2Total < meal.threshold * 0.72) {
    applyDraw(g, 'p2', ['荤', '素', '主食', '甜点'][Math.floor(Math.random() * 4)])
  } else {
    applyStand(g, 'p2')
  }
}

function singleAfterPlayerAction() {
  if (appMode !== 'single') return

  if (game.phase === 'opening') {
    aiOpeningIfNeeded(game)
  }

  let guard = 0
  while (game.phase === 'meal_playing' && game.turn === 'p2' && guard < 12) {
    aiTakeTurn(game)
    guard += 1
  }

  if (game.phase === 'night_picking') {
    while (getRemainingOrders(game, 'p2') > 0) {
      const types = ['荤', '素', '主食', '甜点']
      applyDraw(game, 'p2', types[Math.floor(Math.random() * 4)])
    }
  }
}

// =========================
// 联机同步
// =========================



function getOnlineStatusByGame(g) {
  if (g.phase === 'day_result') return 'finished'
  if (g.phase === 'lobby') return 'lobby'
  return 'playing'
}

function isGlobalActionAfterLocal(actionId, localGame) {
  // 这些动作会改变整局公共状态，可以整包写入。
  if (actionId === 'reveal_night') return true
  if ((actionId === 'draw_meat' || actionId === 'draw_veg' || actionId === 'draw_staple' || actionId === 'draw_dessert' || actionId === 'stand') && localGame.phase === 'meal_result') return true
  if (actionId === 'next' && localGame.phase !== 'meal_result') return true
  if (actionId === 'replay_ready' && localGame.phase === 'opening') return true
  return false
}

function buildOwnPatch(localGame, pid, actionSeq) {
  const patch = {}

  patch[`game/players/${pid}`] = normalizePlayerState(localGame.players[pid])
  patch[`game/records/${pid}`] = normalizeRecord(localGame.records[pid])

  // deck 可以更新，但就算两边同时写 deck，也不会覆盖玩家手牌。
  patch['game/deck'] = safeArray(localGame.deck)

  patch['game/phase'] = localGame.phase
  patch['game/mealIndex'] = localGame.mealIndex
  patch['game/turn'] = localGame.turn || null
  patch['game/firstTurnPlayer'] = localGame.firstTurnPlayer || null
  patch['game/message'] = localGame.message || ''
  patch['game/comboMessage'] = localGame.comboMessage || ''
  patch['game/actionSeq'] = actionSeq

  if (localGame.nextReady) {
    patch[`game/nextReady/${pid}`] = Boolean(localGame.nextReady[pid])
  }

  if (localGame.replayReady) {
    patch[`game/replayReady/${pid}`] = Boolean(localGame.replayReady[pid])
  }

  return patch
}

function runPostSyncTransitions(g) {
  const before = JSON.stringify({
    phase: g.phase,
    mealIndex: g.mealIndex,
    turn: g.turn,
    p1Cards: safeArray(g.players.p1.cards).length,
    p2Cards: safeArray(g.players.p2.cards).length,
    p1Stood: g.players.p1.stood,
    p2Stood: g.players.p2.stood,
    p1Night: safeArray(g.players.p1.nightChoices).length,
    p2Night: safeArray(g.players.p2.nightChoices).length,
    nextReady: g.nextReady,
    replayReady: g.replayReady
  })

  if (g.phase === 'opening') {
    enterMealPlayingIfReady(g)
  } else if (g.phase === 'meal_playing') {
    // v2.7：只有双方都主动开吃后，才进入结算。
    if (g.players.p1.stood && g.players.p2.stood) {
      settleMeal(g)
    }
  } else if (g.phase === 'night_picking') {
    const p1Remain = getRemainingOrders(g, 'p1')
    const p2Remain = getRemainingOrders(g, 'p2')
    const p1NightCount = safeArray(g.players.p1.nightChoices).length
    const p2NightCount = safeArray(g.players.p2.nightChoices).length

    if (p1Remain <= 0 && p2Remain <= 0) {
      if (p1NightCount <= 0 && p2NightCount <= 0) {
        // v7.3：双方都没留夜宵次数时，自动结算，避免没有按钮可点而卡住。
        g.message = lang === 'en'
          ? 'Night Snack skipped: both players have no order chances left.'
          : '夜宵跳过：双方都没有剩余外卖次数，直接结算夜宵。'
        revealNightAndSettle(g)
      } else {
        g.phase = 'night_ready'
        g.turn = null
        g.message = lang === 'en' ? 'Both picked Night Snack. Tap reveal.' : '双方夜宵已选完，点击展示夜宵'
      }
    }
  } else if (g.phase === 'meal_result') {
    if (g.nextReady && g.nextReady.p1 && g.nextReady.p2) {
      enterNextMeal(g)
    }
  } else if (g.phase === 'day_result') {
    if (g.replayReady && g.replayReady.p1 && g.replayReady.p2) {
      const fresh = createReplayGameFrom(g)
      Object.keys(fresh).forEach(key => {
        g[key] = fresh[key]
      })
    }
  }

  const after = JSON.stringify({
    phase: g.phase,
    mealIndex: g.mealIndex,
    turn: g.turn,
    p1Cards: safeArray(g.players.p1.cards).length,
    p2Cards: safeArray(g.players.p2.cards).length,
    p1Stood: g.players.p1.stood,
    p2Stood: g.players.p2.stood,
    p1Night: safeArray(g.players.p1.nightChoices).length,
    p2Night: safeArray(g.players.p2.nightChoices).length,
    nextReady: g.nextReady,
    replayReady: g.replayReady
  })

  return before !== after
}

async function writeFullOnlineGame(nextGame) {
  nextGame = normalizeGame(nextGame)
  nextGame.actionSeq = Date.now()

  game = nextGame
  localGameActionSeq = nextGame.actionSeq
  pendingWriteUntil = Date.now() + 1600
  requestRender()

  await window.LiluOnline.updateRoom(roomId, {
    game: nextGame,
    status: getOnlineStatusByGame(nextGame)
  })
}


async function saveOnlineGame() {
  if (appMode !== 'online' || !roomId) return

  const actionId = pendingActionId || ''
  pendingActionId = ''

  let local = normalizeGame(game)
  const seq = Date.now()
  local.actionSeq = seq

  game = local
  localGameActionSeq = seq
  pendingWriteUntil = Date.now() + 1600
  requestRender()

  // 结算、展示夜宵、进入下一餐这类“公共状态”动作，整包写入。
  if (isGlobalActionAfterLocal(actionId, local)) {
    await writeFullOnlineGame(local)
    return
  }

  // 普通动作只写“自己的玩家状态”和必要共享字段，避免双方同时抽牌时互相覆盖。
  await window.LiluOnline.updateRoom(roomId, buildOwnPatch(local, myPlayerId, seq))

  // 写完后立刻读取一次最新房间，把双方状态合并，再判断是否可以自动推进阶段。
  try {
    const latestRoom = await window.LiluOnline.getRoom(roomId)

    if (!latestRoom || !latestRoom.game) return

    roomData = latestRoom
    let merged = normalizeGame(latestRoom.game)

    const changed = runPostSyncTransitions(merged)

    if (changed) {
      await writeFullOnlineGame(merged)
    } else {
      game = merged
      localGameActionSeq = Math.max(localGameActionSeq, Number(merged.actionSeq || 0))
      requestRender()
    }
  } catch (err) {
    message = lang === 'en' ? `Sync failed: ${err.message || err}` : `同步失败：${err.message || err}`
    requestRender()
  }
}

async function createOnlineRoom() {
  try {
    if (!window.LiluOnline) {
      message = lang === 'en' ? 'Online module failed to load. Please refresh.' : '联机模块没有加载成功，请刷新页面'
      render()
      return
    }

    const initialGame = createGame('online')
    initialGame.phase = 'lobby'
    initialGame.message = lang === 'en' ? 'Waiting for Player 2 to join and ready up' : '等待玩家2加入并准备'

    const result = await window.LiluOnline.createRoom(initialGame)

    appMode = 'online'
    roomId = result.roomId
    myPlayerId = result.playerId
    localReadyLocked = false
    startRequested = false
    startOverlayText = ''
    startOverlayUntil = 0
    localGameActionSeq = 0
    pendingWriteUntil = 0
    pendingActionId = ''
    game = normalizeGame(initialGame)
    message = lang === 'en' ? `Room created: ${roomId}` : `房间创建成功：${roomId}`

    if (unsubscribeRoom) unsubscribeRoom()

    unsubscribeRoom = window.LiluOnline.listenRoom(roomId, data => {
      roomData = data

      if (data && data.game) {
        const incomingGame = normalizeGame(data.game)
        const incomingSeq = Number(incomingGame.actionSeq || 0)

        // 本机刚点击后的极短时间内，如果轮询拿到旧快照，不要盖回去。
        // 超过 pendingWriteUntil 后，无论如何接受数据库状态，避免因为时间戳差异卡死。
        if (Date.now() > pendingWriteUntil || incomingSeq >= localGameActionSeq) {
          game = incomingGame
          localGameActionSeq = Math.max(localGameActionSeq, incomingSeq)
        }
      }

      if (data && data.status === 'playing') {
        startRequested = false
      }

      if (data && data.players && data.players[myPlayerId] && data.players[myPlayerId].ready) {
        localReadyLocked = true
      }

      if (areBothPlayersReady() && (game.phase === 'lobby' || (data && data.status === 'lobby'))) {
        showStartOverlay(lang === 'en' ? 'Both ready. Starting...' : '双方已准备，正在开局...', 1400)
        maybeStartOnlineGame()
      }

      render()
    })

    render()
  } catch (err) {
    message = lang === 'en' ? `Create room failed: ${err.message || err}` : `创建房间失败：${err.message || err}`
    render()
  }
}

async function joinOnlineRoom() {
  try {
    if (!window.LiluOnline) {
      message = lang === 'en' ? 'Online module failed to load. Please refresh.' : '联机模块没有加载成功，请刷新页面'
      render()
      return
    }

    const code = window.prompt(lang === 'en' ? 'Enter room code' : '请输入房间码')
    if (!code) return

    const result = await window.LiluOnline.joinRoom(code)

    appMode = 'online'
    roomId = result.roomId
    myPlayerId = result.playerId
    localReadyLocked = false
    startRequested = false
    startOverlayText = ''
    startOverlayUntil = 0
    localGameActionSeq = 0
    pendingWriteUntil = 0
    pendingActionId = ''

    if (unsubscribeRoom) unsubscribeRoom()

    unsubscribeRoom = window.LiluOnline.listenRoom(roomId, data => {
      roomData = data

      if (data && data.game) {
        const incomingGame = normalizeGame(data.game)
        const incomingSeq = Number(incomingGame.actionSeq || 0)

        // 本机刚点击后的极短时间内，如果轮询拿到旧快照，不要盖回去。
        // 超过 pendingWriteUntil 后，无论如何接受数据库状态，避免因为时间戳差异卡死。
        if (Date.now() > pendingWriteUntil || incomingSeq >= localGameActionSeq) {
          game = incomingGame
          localGameActionSeq = Math.max(localGameActionSeq, incomingSeq)
        }
      }

      if (data && data.status === 'playing') {
        startRequested = false
      }

      if (data && data.players && data.players[myPlayerId] && data.players[myPlayerId].ready) {
        localReadyLocked = true
      }

      if (areBothPlayersReady() && (game.phase === 'lobby' || (data && data.status === 'lobby'))) {
        showStartOverlay(lang === 'en' ? 'Both ready. Starting...' : '双方已准备，正在开局...', 1400)
        maybeStartOnlineGame()
      }

      render()
    })

    message = lang === 'en' ? `Joined room: ${roomId}` : `已加入房间：${roomId}`
    render()
  } catch (err) {
    message = lang === 'en' ? `Join room failed: ${err.message || err}` : `加入房间失败：${err.message || err}`
    render()
  }
}

async function playerReady() {
  if (appMode !== 'online' || !roomId || !myPlayerId) return
  if (isReadyLockedForMe()) return

  localReadyLocked = true
  showStartOverlay(lang === 'en' ? 'Ready. Waiting for rival...' : '你已准备，等待对方准备...', 900)
  render()

  await window.LiluOnline.updateRoom(roomId, {
    [`players/${myPlayerId}/ready`]: true,
    'game/message': lang === 'en' ? `${getPlayerName(myPlayerId)} is ready` : `${getPlayerName(myPlayerId)}已准备`
  })

  const latest = await window.LiluOnline.getRoom(roomId)
  roomData = latest

  if (latest && latest.game) {
    game = normalizeGame(latest.game)
  }

  render()
  await maybeStartOnlineGame()
}

async function maybeStartOnlineGame() {
  if (appMode !== 'online' || !roomId || !roomData) return
  if (!areBothPlayersReady()) return

  const status = roomData.status || ''
  const phase = game.phase || ''

  // 已经开始就不重复开局
  if (status === 'playing' || phase !== 'lobby') return

  // 两边可能几乎同时检测到“双方已准备”，用本地锁避免重复点火。
  if (startRequested) return

  startRequested = true
  showStartOverlay(lang === 'en' ? 'Both ready. Starting...' : '双方已准备，正在开局...', 1400)
  render()

  try {
    const latest = await window.LiluOnline.getRoom(roomId)
    if (!latest) throw new Error(lang === 'en' ? 'Room does not exist' : '房间不存在')

    roomData = latest

    const players = latest.players || {}
    const bothReady = Boolean(players.p1 && players.p2 && players.p1.ready && players.p2.ready)

    if (!bothReady) {
      startRequested = false
      render()
      return
    }

    const latestGame = normalizeGame(latest.game)

    // 如果另一边已经开局了，直接跟随，不重复覆盖
    if (latest.status === 'playing' || latestGame.phase !== 'lobby') {
      game = latestGame
      render()
      return
    }

    latestGame.phase = 'opening'
    latestGame.message = lang === 'en' ? 'Both ready: Breakfast opening, both draw 2 cards' : '双方已准备：早餐起手阶段，双方各抽2张'
    latestGame.mealIndex = 0
    latestGame.turn = null
    latestGame.actionSeq = Number(latestGame.actionSeq || 0) + 1
    resetMealState(latestGame)
    localGameActionSeq = latestGame.actionSeq

    await window.LiluOnline.updateRoom(roomId, {
      status: 'playing',
      game: latestGame
    })
  } catch (err) {
    startRequested = false
    message = lang === 'en' ? `Start failed: ${err.message || err}` : `开局失败：${err.message || err}`
    render()
  }
}

function leaveToHome() {
  leaderboardOpen = false
  profileOpen = false
  if (unsubscribeRoom) {
    unsubscribeRoom()
    unsubscribeRoom = null
  }

  appMode = 'home'
  roomId = ''
  myPlayerId = 'p1'
  roomData = null
  localReadyLocked = false
  startRequested = false
  startOverlayText = ''
  startOverlayUntil = 0
  localGameActionSeq = 0
  pendingWriteUntil = 0
  pendingActionId = ''
  game = createGame('single')
  message = ''
  tutorialOn = false
  render()
}

// =========================
// 渲染节流与图片预加载
// =========================

let renderScheduled = false

function requestRender() {
  if (renderScheduled) return
  renderScheduled = true

  const runner = () => {
    renderScheduled = false
    render()
  }

  if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    window.requestAnimationFrame(runner)
  } else {
    setTimeout(runner, 16)
  }
}

function preloadGameImages() {
  const srcs = []

  Object.keys(CARD_IMAGE_PATHS).forEach(key => srcs.push(CARD_IMAGE_PATHS[key]))
  Object.keys(CARD_BACK_PATHS).forEach(key => srcs.push(CARD_BACK_PATHS[key]))

  srcs.forEach(src => getImage(src))
}

// =========================
// 餐段背景与小卡绘制
// =========================

function getMealTheme(index) {
  const i = Number(index || 0)
  if (i === 0) {
    return {
      bg: '#FFF5C7',
      panel: '#FFFDF0',
      opponentPanel: '#F4EED7',
      center: '#FFF2C5',
      accent: '#FFE169',
      text: '#111'
    }
  }

  if (i === 1) {
    return {
      bg: '#FFD85E',
      panel: '#FFF7D7',
      opponentPanel: '#F1D890',
      center: '#FFE98A',
      accent: '#FFB53D',
      text: '#111'
    }
  }

  if (i === 2) {
    return {
      bg: '#17294C',
      panel: '#F6F8FF',
      opponentPanel: '#DCE5FF',
      center: '#EAF0FF',
      accent: '#4E77C8',
      text: '#111'
    }
  }

  return {
    bg: '#111827',
    panel: '#F7F1E8',
    opponentPanel: '#D8D0C4',
    center: '#EFE6DA',
    accent: '#111',
    text: '#111'
  }
}

function getPageBg() {
  if (appMode === 'home' || !game) return '#F7F1E8'
  return getMealTheme(game.mealIndex).bg
}

function drawNightStars() {
  if (!game || game.mealIndex !== 3) return
  if (appMode === 'home') return

  ctx.save()
  // A subtle night tint on top of the page background so it still reads as night.
  ctx.globalAlpha = 0.18
  ctx.fillStyle = '#050814'
  ctx.fillRect(0, 0, W, H)
  const stars = [
    [0.10, 0.09, 1.4, 0.78], [0.21, 0.15, 0.9, 0.52], [0.38, 0.08, 1.1, 0.48],
    [0.56, 0.14, 1.3, 0.62], [0.74, 0.10, 1.5, 0.70], [0.90, 0.22, 0.9, 0.46],
    [0.14, 0.34, 0.8, 0.42], [0.31, 0.28, 1.2, 0.58], [0.66, 0.31, 0.9, 0.45],
    [0.83, 0.39, 1.2, 0.50], [0.08, 0.62, 0.9, 0.36], [0.27, 0.72, 1.0, 0.34],
    [0.49, 0.65, 0.8, 0.38], [0.78, 0.76, 0.9, 0.36], [0.93, 0.66, 1.1, 0.42]
  ]
  stars.forEach(([px, py, r, a]) => {
    ctx.globalAlpha = a
    ctx.fillStyle = '#FFF1B8'
    ctx.beginPath()
    ctx.arc(W * px, H * py, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = a * 0.22
    ctx.beginPath()
    ctx.arc(W * px, H * py, r * 3.2, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.globalAlpha = 0.12
  drawRoundRect(W - 120, SAFE_TOP + 42, 78, 78, 39, '#F6DFA6', null, 0)
  ctx.restore()
}


function getMealCardsFromResult(result, pid) {
  if (!result) return []
  return pid === 'p1' ? safeArray(result.p1Cards) : safeArray(result.p2Cards)
}

function drawTinyCards(cards, x, y, areaW, areaH, maxSize) {
  const list = safeArray(cards)
  if (list.length === 0) {
    drawText(t('noOrders'), x, y + 8, 12, '#777', 'left', 'bold')
    return
  }

  const gap = 3
  let cardW = maxSize || 38
  const perRow = Math.max(3, Math.floor((areaW + gap) / (cardW + gap)))

  const rows = Math.ceil(list.length / perRow)
  const maxH = Math.floor((areaH - gap * Math.max(0, rows - 1)) / rows)

  let cardH = Math.min(Math.round(cardW * 1121 / 671), Math.max(34, maxH))
  cardW = Math.round(cardH * 671 / 1121)

  for (let i = 0; i < list.length; i++) {
    const row = Math.floor(i / perRow)
    const col = i % perRow
    const yy = y + row * (cardH + gap)
    if (yy + cardH > y + areaH) break
    const card = { ...list[i], hidden: false }
    drawCard(card, x + col * (cardW + gap), yy, cardW, cardH)
  }
}

function drawCompactMealCards(title, cards, total, busted, x, y, w, h) {
  drawRoundRect(x, y, w, h, 16, '#FFFFFF', '#111', 2.2)
  drawText(title, x + 12, y + 10, 15, '#111', 'left', 'bold')
  drawText(`${total} kcal${busted ? ' ' + t('statusBust') : ''}`, x + w - 12, y + 11, 13, busted ? '#E94335' : '#111', 'right', 'bold')
  drawTinyCards(cards, x + 12, y + 34, w - 24, h - 42, 34)
}


// =========================
// 绘图工具
// =========================

function drawRoundRect(x, y, w, h, r, fillStyle, strokeStyle, lineWidth) {
  const radius = Math.min(r, w / 2, h / 2)

  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()

  if (fillStyle) {
    ctx.fillStyle = fillStyle
    ctx.fill()
  }

  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle
    ctx.lineWidth = lineWidth || 2
    ctx.stroke()
  }
}

function drawText(text, x, y, size, color, align, weight) {
  ctx.fillStyle = color || '#111'
  ctx.font = `${weight || 'normal'} ${size}px sans-serif`
  ctx.textAlign = align || 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(String(text), x, y)
}

function wrapText(text, x, y, maxWidth, lineHeight, size, color, weight, maxLines) {
  ctx.font = `${weight || 'normal'} ${size}px sans-serif`
  ctx.fillStyle = color || '#111'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  let line = ''
  let yy = y
  let lines = 0
  const chars = String(text || '').split('')

  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i]
    if (ctx.measureText(testLine).width > maxWidth && i > 0) {
      ctx.fillText(line, x, yy)
      lines += 1
      if (maxLines && lines >= maxLines) return yy + lineHeight
      line = chars[i]
      yy += lineHeight
    } else {
      line = testLine
    }
  }

  ctx.fillText(line, x, yy)
  return yy + lineHeight
}


function addButton(id, text, x, y, w, h, fill, color, fontSize) {
  buttons.push({ id, x, y, w, h })

  const now = Date.now()
  const pulseStart = buttonPulse[id] || 0
  const elapsed = now - pulseStart
  let scale = 1

  if (elapsed >= 0 && elapsed < BUTTON_PULSE_MS) {
    const t = elapsed / BUTTON_PULSE_MS
    scale = 1 + 0.055 * Math.sin(Math.PI * t)
  }

  const cx = x + w / 2
  const cy = y + h / 2
  const sx = cx - (w * scale) / 2
  const sy = cy - (h * scale) / 2
  const sw = w * scale
  const sh = h * scale

  drawRoundRect(sx + 4, sy + 5, sw, sh, 14, '#111', null, 0)
  drawRoundRect(sx, sy, sw, sh, 14, fill || '#111', '#111', 2.5)
  drawText(text, cx, cy - (fontSize || 18) / 2, fontSize || 18, color || '#fff', 'center', 'bold')
}

function hitButton(x, y) {
  for (let i = buttons.length - 1; i >= 0; i--) {
    const b = buttons[i]
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b.id
  }
  return null
}

// 图片懒加载
const imageCache = {}

function getImage(src) {
  if (!src) return null
  if (imageCache[src]) return imageCache[src]

  const img = new Image()
  img.loaded = false
  img.failed = false

  img.onload = () => {
    img.loaded = true
    requestRender()
  }

  img.onerror = () => {
    img.failed = true
    requestRender()
  }

  img.src = src
  imageCache[src] = img
  return img
}

function drawCard(card, x, y, w, h) {
  const type = normalizeType(card)
  const src = card.hidden ? (CARD_BACK_PATHS[type] || CARD_BACK_PATHS['荤']) : CARD_IMAGE_PATHS[card.name]
  const img = getImage(src)

  if (img && img.loaded) {
    const radius = 9
    ctx.save()

    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + w - radius, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
    ctx.lineTo(x + w, y + h - radius)
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
    ctx.lineTo(x + radius, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
    ctx.clip()

    const imageRatio = 671 / 1121
    const boxRatio = w / h
    let drawW = w
    let drawH = h

    if (boxRatio > imageRatio) {
      drawW = w
      drawH = w / imageRatio
    } else {
      drawH = h
      drawW = h * imageRatio
    }

    drawW *= card.hidden ? 1.06 : 1.08
    drawH *= card.hidden ? 1.06 : 1.08

    ctx.drawImage(img, x + (w - drawW) / 2, y + (h - drawH) / 2, drawW, drawH)
    ctx.restore()

    if (!card.hidden) drawRoundRect(x, y, w, h, radius, null, '#111', 2)

    if (card.privateCard && !card.hidden) {
      drawRoundRect(x + 5, y + 5, 32, 18, 7, '#111', null, 0)
      drawText(t('hiddenCard'), x + 21, y + 8, 10, '#fff', 'center', 'bold')
    }

    return
  }

  drawRoundRect(x, y, w, h, 10, TYPE_COLORS[type] || '#fff', '#111', 2)
  drawText(card.hidden ? t('cardBack') : foodName(card), x + w / 2, y + h / 2 - 12, 12, '#111', 'center', 'bold')
  if (!card.hidden) drawText(`${card.kcal}kcal`, x + w / 2, y + h - 20, 11, '#111', 'center', 'bold')
}

function drawCards(cards, x, y, areaW, areaH) {
  const list = safeArray(cards)
  if (list.length === 0) return

  const gap = 4
  let cardW = 62
  if (list.length > 4) cardW = 52
  if (list.length > 6) cardW = 44
  if (list.length > 8) cardW = 38

  const perRow = Math.max(3, Math.floor((areaW + gap) / (cardW + gap)))
  const rows = Math.ceil(list.length / perRow)
  const maxH = Math.floor((areaH - gap * (rows - 1)) / rows)
  const cardH = Math.min(Math.round(cardW * 1121 / 671), maxH)
  cardW = Math.round(cardH * 671 / 1121)

  for (let i = 0; i < list.length; i++) {
    const row = Math.floor(i / perRow)
    const col = i % perRow
    drawCard(list[i], x + col * (cardW + gap), y + row * (cardH + gap), cardW, cardH)
  }
}

// =========================
// 画面
// =========================


// =========================
// 首页：美食塔罗牌出票口模块
// =========================

function pickTarotCard() {
  const list = FOOD_CARDS || []
  if (!list.length) return null
  return list[Math.floor(Math.random() * list.length)]
}

function easeOutCubic(t) {
  const x = Math.max(0, Math.min(1, t))
  return 1 - Math.pow(1 - x, 3)
}

function drawTarotMiniCard(card, x, y, w, h) {
  const type = card ? normalizeType(card) : '甜点'
  drawRoundRect(x + 4, y + 5, w, h, 12, '#111', null, 0)
  drawRoundRect(x, y, w, h, 12, TYPE_COLORS[type] || '#FFE169', '#111', 2.4)

  ctx.save()
  ctx.globalAlpha = 0.18
  drawRoundRect(x + 10, y + 10, w - 20, h - 20, 10, '#FFFFFF', null, 0)
  ctx.restore()

  drawText('FOOD', x + w / 2, y + 12, 10, '#111', 'center', 'bold')
  drawText('TAROT', x + w / 2, y + 28, 14, '#111', 'center', 'bold')
  drawRoundRect(x + 12, y + 48, w - 24, 34, 15, '#FFFFFF', '#111', 2)
  drawText(card ? card.name : '???', x + w / 2, y + 56, 13, '#111', 'center', 'bold')
  if (card) drawText(`${card.kcal} kcal`, x + w / 2, y + h - 26, 11, '#111', 'center', 'bold')
}

function drawTarotSlot(panelX, panelY, panelW, panelH) {
  if (rulesExpanded) return

  const cx = W / 2
  // v7.2：出票口更像一条细缝，卡牌从内部细缝吐出，并保持在最上层绘制。
  const slotW = Math.min(104, panelW - 176)
  const slotH = 13
  const slotX = cx - slotW / 2
  const slotY = Math.min(panelY + panelH - 168, panelY + 218)
  const innerY = slotY + 7

  const cardW = Math.min(48, panelW * 0.15)
  const cardH = Math.round(cardW * 1121 / 671)
  const cardX = cx - cardW / 2

  // 点击区略大于视觉元素，但不显示任何提示文字。
  buttons.push({ id: 'tarot_slot', x: slotX - 18, y: slotY - 22, w: slotW + 36, h: cardH + 78 })

  drawText(t('tarotTitle'), cx, slotY - 22, 13, '#111', 'center', 'bold')

  let progress = tarotState === 2 ? 1 : 0
  if (tarotState === 1) {
    progress = easeOutCubic((Date.now() - tarotRevealStartedAt) / 760)
    if (progress >= 1) {
      tarotState = 2
      progress = 1
    } else {
      requestRender()
    }
  }

  // 先画出票口本体，再画卡牌：这样卡牌不会被其他 UI 或出票口大黑块盖住。
  drawRoundRect(slotX + 2, slotY + 4, slotW, slotH, 7, 'rgba(0,0,0,0.16)', null, 0)
  drawRoundRect(slotX, slotY, slotW, slotH, 7, '#111', '#111', 2)
  drawRoundRect(slotX + 13, innerY - 1, slotW - 26, 2.8, 2, '#050505', null, 0)
  drawRoundRect(slotX + 16, innerY + 1, slotW - 32, 1.4, 1, '#2A2A2A', null, 0)

  if ((tarotState === 1 || tarotState === 2) && tarotCard) {
    // 从“内部细缝”吐出：开始只露出卡牌下端，最终卡牌上沿刚好贴着细缝。
    const startY = innerY - cardH + 12
    const finalY = innerY + 1
    const cardY = startY + (finalY - startY) * progress

    ctx.save()
    ctx.beginPath()
    ctx.rect(cardX - 8, innerY, cardW + 16, cardH + 28)
    ctx.clip()
    drawCard(tarotCard, cardX, cardY, cardW, cardH)
    ctx.restore()
  }

  if (tarotState === 2 && tarotCard) {
    const textY = slotY + slotH + cardH + 12
    const resultText = `${t('tarotResultPrefix')}${foodName(tarotCard)}`
    drawText(resultText, cx, textY + 1, 12, '#16365C', 'center', 'bold')
  }
}

function handleTarotSlotTap() {
  if (rulesExpanded) return

  if (tarotState === 0) {
    tarotCard = pickTarotCard()
    tarotState = 1
    tarotRevealStartedAt = Date.now()
  } else {
    tarotState = 0
    tarotCard = null
    tarotRevealStartedAt = 0
  }

  requestRender()
}



function drawHome() {
  const panelX = 24
  const panelY = SAFE_TOP + 26
  const panelW = W - 48
  const bottomButtonsH = 172
  const panelH = Math.max(360, H - panelY - bottomButtonsH - SAFE_BOTTOM - 18)

  drawRoundRect(-40, H - 220, 160, 160, 36, '#A9F0D1', null, 0)
  drawRoundRect(W - 92, SAFE_TOP + 90, 130, 130, 32, '#FF9BB4', null, 0)

  drawRoundRect(panelX, panelY, panelW, panelH, 28, '#FFFFFF', '#111', 4)

  if (!rulesExpanded) {
    drawText(t('title'), W / 2, panelY + 12, lang === 'en' ? 40 : 44, '#111', 'center', 'bold')
    drawText(t('subtitle'), W / 2, panelY + 66, 14, '#555', 'center', 'bold')

    drawRoundRect(W / 2 - 92, panelY + 92, 184, 36, 18, '#111', null, 0)
    drawText(t('tagline'), W / 2, panelY + 101, lang === 'en' ? 13 : 15, '#FFE169', 'center', 'bold')

    // v6.4：主视觉文案整体上移，为黑色出票口留出空间。
    drawText(t('slogan'), W / 2, panelY + 138, lang === 'en' ? 21 : 23, '#111', 'center', 'bold')
    drawText(t('modes'), W / 2, panelY + 166, 13, '#555', 'center', 'bold')

    drawTarotSlot(panelX, panelY, panelW, panelH)

    const ruleBtnW = Math.min(panelW - 64, 210)
    addButton('rules_toggle', t('rules'), W / 2 - ruleBtnW / 2, panelY + panelH - 64, ruleBtnW, 42, '#FFFFFF', '#111', 16)
  } else {
    drawText(t('rulesTitle'), panelX + 24, panelY + 20, 28, '#111', 'left', 'bold')
    addButton('rules_toggle', t('close'), panelX + panelW - 88, panelY + 18, 58, 34, '#111', '#fff', 14)

    const viewX = panelX + 24
    const viewY = panelY + 66
    const viewW = panelW - 48
    const viewH = panelH - 88

    const lines = t('rulesLines')

    ctx.save()
    ctx.beginPath()
    ctx.rect(viewX, viewY, viewW, viewH)
    ctx.clip()

    let yy = viewY - rulesScroll
    const startY = yy

    lines.forEach(line => {
      yy = wrapText(line, viewX, yy, viewW, 18, 12, '#333', 'bold', 4)
      yy += 8
    })

    const contentH = yy - startY
    rulesMaxScroll = Math.max(0, contentH - viewH + 18)
    rulesScroll = Math.max(0, Math.min(rulesScroll, rulesMaxScroll))

    ctx.restore()

    if (rulesMaxScroll > 0) {
      const barH = Math.max(28, viewH * viewH / (contentH || viewH))
      const barY = viewY + (viewH - barH) * (rulesScroll / rulesMaxScroll)
      drawRoundRect(viewX + viewW + 6, barY, 4, barH, 3, '#111', null, 0)
      drawText(t('swipe'), W / 2, panelY + panelH - 18, 10, '#777', 'center', 'bold')
    }
  }

  const bottomY = H - SAFE_BOTTOM - 154
  addButton('single_start', t('solo'), 32, bottomY, W - 64, 54, '#111', '#fff', 22)

  const gap = 12
  const halfW = (W - 64 - gap) / 2
  addButton('online_create', t('create'), 32, bottomY + 68, halfW, 54, '#FFE169', '#111', 20)
  addButton('online_join', t('join'), 32 + halfW + gap, bottomY + 68, halfW, 54, '#9EDBFF', '#111', 20)

  if (message) wrapText(message, 32, H - SAFE_BOTTOM - 24, W - 64, 14, 11, '#E94335', 'bold', 1)

  drawMusicButton()

  const profile = loadLocalProfile()
  drawHomeProfileButtons(profile)
  drawLeaderboardOverlay(profile)
  drawProfileOverlay(profile)
}


function drawHomeMiniButton() {
  if (appMode !== 'single') return

  const y = 4
  const h = 22
  const font = 9
  const w = lang === 'en' ? 46 : 38

  addButton('home', t('home'), W - w - 8, y, w, h, '#FFFFFF', '#111', font)
}


function drawTopBadge() {
  if (appMode !== 'online') return
  const text = roomId ? (lang === 'en' ? `${t('room')} ${roomId} | You are ${getPlayerName(myPlayerId)}` : `房间 ${roomId}｜你是${getPlayerName(myPlayerId)}`) : t('onlineMode')
  const w = Math.min(W - 32, 240)
  drawRoundRect(W / 2 - w / 2, SAFE_TOP, w, 26, 13, '#111', null, 0)
  drawText(text, W / 2, SAFE_TOP + 6, 11, '#fff', 'center', 'bold')
}

function getDisplayPlayerIds() {
  const self = getSelfId()
  return {
    self,
    opponent: otherPlayer(self)
  }
}




function drawPlayerPanel(pid, label, x, y, w, h, isOpponent) {
  const player = game.players[pid]
  const meal = getMeal()

  const inResultPhase = game.phase === 'meal_result' || game.phase === 'day_result'
  const hiddenForOpponent = isOpponent && !inResultPhase

  const displayCards = safeArray(player.cards).map((card, index) => {
    const next = { ...card }

    // v2.5：对方只有第一张底牌隐藏，后续外卖牌都明牌。
    // 自己的底牌自己可见；结算页全部公开。
    if (hiddenForOpponent && next.privateCard) {
      next.hidden = true
    } else if (!inResultPhase) {
      next.hidden = false
    }

    return next
  })

  const total = calcCardsKcal(player.cards)
  const visibleTotal = hiddenForOpponent ? getVisibleKcal(displayCards) : total

  const theme = getMealTheme(game.mealIndex)
  const bg = isOpponent ? theme.opponentPanel : theme.panel

  let status = t('statusWatching')

  if (hiddenForOpponent) {
    // 结算前仍然不暴露对方是否爆牌。
    status = player.stood
      ? t('statusStood')
      : game.phase === 'meal_playing' && game.turn === pid
        ? t('statusOrdering')
        : game.phase === 'opening'
          ? t('statusOpening')
          : t('statusWatching')
  } else {
    status = player.busted || isBusted(game, pid)
      ? t('statusBust')
      : player.stood
        ? t('statusStood')
        : game.phase === 'meal_playing' && game.turn === pid
          ? t('statusOrdering')
          : game.phase === 'opening'
            ? t('statusOpening')
            : t('statusWatching')
  }

  drawRoundRect(x, y, w, h, 22, bg, '#111', 3)

  drawText(label, x + 16, y + 12, 24, '#111', 'left', 'bold')
  drawText(status, x + 76, y + 18, 14, status === t('statusBust') ? '#E94335' : '#111', 'left', 'bold')

  const kcalText = hiddenForOpponent
    ? `? + ${visibleTotal} kcal`
    : `${total}/${meal.threshold} kcal`

  drawText(kcalText, x + w - 16, y + 15, 16, status === t('statusBust') ? '#E94335' : '#111', 'right', 'bold')
  drawText(`${t('orders')} ${game.records[pid].dayOrdersUsed}/${TOTAL_ORDERS_PER_DAY}`, x + 16, y + 44, 13, '#666', 'left', 'bold')

  const dayText = hiddenForOpponent
    ? `${t('settledKcal')} ${getDayTotalKcal(game, pid)}`
    : `${t('totalKcal')} ${getDayTotalKcal(game, pid) + (inResultPhase ? 0 : total)}`

  drawText(dayText, x + 118, y + 44, 13, '#111', 'left', 'bold')

  let cardsToDraw = displayCards

  if ((game.phase === 'night_picking' || game.phase === 'night_ready') && safeArray(player.nightChoices).length > 0) {
    cardsToDraw = safeArray(player.nightChoices).map((type, index) => ({
      id: `night_${index}`,
      name: lang === 'en' ? `Night ${index + 1}` : `夜宵${index + 1}`,
      type,
      kcal: 0,
      hidden: true,
      privateCard: false
    }))
  }

  drawCards(cardsToDraw, x + 14, y + 72, w - 28, h - 86)
}



function drawCenterPanel(x, y, w, h) {
  const meal = getMeal()
  const selfId = getSelfId()
  const selfTotal = calcCardsKcal(game.players[selfId].cards)
  const ratio = Math.max(0, Math.min(1, selfTotal / meal.threshold))
  const theme = getMealTheme(game.mealIndex)

  drawRoundRect(x, y, w, h, 18, theme.center, '#111', 3)

  drawText(`${game.mealIndex + 1}/4  ${mealName(game.mealIndex)}`, x + 16, y + 10, 20, '#111', 'left', 'bold')

  const barX = x + w - 214
  const barY = y + 15
  const barW = 196
  const barH = 28
  const r = 14

  ctx.save()
  drawRoundRect(barX, barY, barW, barH, r, '#FFFFFF', null, 0)
  ctx.beginPath()
  ctx.moveTo(barX + r, barY)
  ctx.lineTo(barX + barW - r, barY)
  ctx.quadraticCurveTo(barX + barW, barY, barX + barW, barY + r)
  ctx.lineTo(barX + barW, barY + barH - r)
  ctx.quadraticCurveTo(barX + barW, barY + barH, barX + barW - r, barY + barH)
  ctx.lineTo(barX + r, barY + barH)
  ctx.quadraticCurveTo(barX, barY + barH, barX, barY + barH - r)
  ctx.lineTo(barX, barY + r)
  ctx.quadraticCurveTo(barX, barY, barX + r, barY)
  ctx.closePath()
  ctx.clip()

  const fillColor = selfTotal >= meal.threshold
    ? '#E94335'
    : ratio > 0.78
      ? '#FF7A3D'
      : '#FFE169'

  ctx.fillStyle = fillColor
  ctx.fillRect(barX, barY, barW * ratio, barH)
  ctx.restore()

  drawRoundRect(barX, barY, barW, barH, r, null, '#111', 3)
  drawText(`${t('warning')} ${meal.threshold}`, barX + barW / 2, barY + 8, lang === 'en' ? 9 : 10, '#111', 'center', 'bold')

  const hint = getActionHint(game, selfId)
  wrapText(hint, x + 16, y + 48, w - 32, 18, 13, '#333', 'bold', 2)
}




function drawActionButtons() {
  const y = H - SAFE_BOTTOM - 86
  const gap = 10
  const leftW = Math.floor((W - 32) * 0.52)
  const rightW = W - 32 - leftW - gap
  const leftX = 16
  const smallGap = 8
  const smallW = (leftW - smallGap) / 2
  const smallH = (72 - smallGap) / 2

  const selfId = getSelfId()

  if (appMode === 'online' && (!roomData || roomData.status === 'lobby' || game.phase === 'lobby')) {
    addButton('noop', t('meat'), leftX, y, smallW, smallH, '#ddd', '#555', 18)
    addButton('noop', t('veg'), leftX + smallW + smallGap, y, smallW, smallH, '#ddd', '#555', 18)
    addButton('noop', t('staple'), leftX, y + smallH + smallGap, smallW, smallH, '#ddd', '#555', 18)
    addButton('noop', t('dessert'), leftX + smallW + smallGap, y + smallH + smallGap, smallW, smallH, '#ddd', '#555', 18)

    const ready = isReadyLockedForMe()
    addButton(ready ? 'noop' : 'ready', ready ? t('ready') : (lang === 'en' ? 'Ready' : '准备'), leftX + leftW + gap, y, rightW, 72, '#FFE169', '#111', 24)
    return
  }

  if (game.phase === 'night_ready') {
    addButton('noop', t('meat'), leftX, y, smallW, smallH, '#ddd', '#555', 18)
    addButton('noop', t('veg'), leftX + smallW + smallGap, y, smallW, smallH, '#ddd', '#555', 18)
    addButton('noop', t('staple'), leftX, y + smallH + smallGap, smallW, smallH, '#ddd', '#555', 18)
    addButton('noop', t('dessert'), leftX + smallW + smallGap, y + smallH + smallGap, smallW, smallH, '#ddd', '#555', 18)
    addButton('reveal_night', t('reveal'), leftX + leftW + gap, y, rightW, 72, '#FFE169', '#111', 22)
    drawText(t('pickedAllNight'), leftX + leftW + gap + rightW / 2, y + 50, 10, '#5C4300', 'center', 'bold')
    return
  }

  const canAct = canPlayerAct(game, selfId)
  const disabledFill = '#ddd'
  const disabledColor = '#666'

  addButton(canAct ? 'draw_meat' : 'noop', t('meat'), leftX, y, smallW, smallH, canAct ? TYPE_COLORS['荤'] : disabledFill, canAct ? '#111' : disabledColor, 18)
  addButton(canAct ? 'draw_veg' : 'noop', t('veg'), leftX + smallW + smallGap, y, smallW, smallH, canAct ? TYPE_COLORS['素'] : disabledFill, canAct ? '#111' : disabledColor, 18)
  addButton(canAct ? 'draw_staple' : 'noop', t('staple'), leftX, y + smallH + smallGap, smallW, smallH, canAct ? TYPE_COLORS['主食'] : disabledFill, canAct ? '#111' : disabledColor, 18)
  addButton(canAct ? 'draw_dessert' : 'noop', t('dessert'), leftX + smallW + smallGap, y + smallH + smallGap, smallW, smallH, canAct ? TYPE_COLORS['甜点'] : disabledFill, canAct ? '#111' : disabledColor, 18)

  let standText = t('eat')
  let standSub = ''
  if (game.phase === 'opening') {
    standText = t('opening')
    standSub = t('drawTogether')
  } else if (game.phase === 'night_picking') {
    standText = mealName(3)
    standSub = t('chooseDoneReveal')
  } else if (game.phase === 'meal_playing') {
    if (game.turn === selfId) {
      standText = t('eat')
      standSub = (game.players[selfId].busted || isBusted(game, selfId)) ? t('endReveal') : t('confirmKcal')
    } else {
      standText = t('waiting')
      standSub = t('waitRivalTurn')
    }
  }

  addButton(game.phase === 'meal_playing' && game.turn === selfId ? 'stand' : 'noop', standText, leftX + leftW + gap, y, rightW, 72, '#FFE169', '#111', 24)
  if (standSub) drawText(standSub, leftX + leftW + gap + rightW / 2, y + 50, 10, '#5C4300', 'center', 'bold')
}


function drawGameScreen() {
  const topY = Math.max(SAFE_TOP + 34, 34) + (appMode === 'online' ? 18 : 0)
  const actionY = H - SAFE_BOTTOM - 94
  const centerH = 80
  const gap = 8
  let zoneH = Math.floor((actionY - topY - centerH - gap * 2 - 12) / 2)
  zoneH = Math.max(160, Math.min(228, zoneH))

  const ids = getDisplayPlayerIds()
  const opponentY = topY
  const centerY = opponentY + zoneH + gap
  const selfY = centerY + centerH + gap

  drawPlayerPanel(ids.opponent, t('rival'), 16, opponentY, W - 32, zoneH, true)
  drawCenterPanel(16, centerY, W - 32, centerH)
  drawPlayerPanel(ids.self, t('you'), 16, selfY, W - 32, zoneH, false)

  drawActionButtons()
  drawWaitingOpponentFloat()

  // Keep top utility buttons above all game panels.
  drawTopBadge()
  drawHomeMiniButton()
  drawMusicButton()
}




function applyRevealNight(g) {
  if (g.phase !== 'night_ready' && g.phase !== 'night_picking') return

  if (g.phase === 'night_picking') {
    const p1Remain = getRemainingOrders(g, 'p1')
    const p2Remain = getRemainingOrders(g, 'p2')
    if (p1Remain > 0 || p2Remain > 0) return
  }

  revealNightAndSettle(g)
  g.actionSeq += 1
}


function drawWaitingOpponentFloat() {
  if (appMode !== 'online') return
  if (game.phase !== 'meal_playing') return

  const selfId = getSelfId()
  const oppId = otherPlayer(selfId)

  if (game.turn !== oppId) return
  if (game.players[selfId] && game.players[selfId].stood) return

  const boxW = Math.min(W - 96, 250)
  const boxH = 66
  const x = (W - boxW) / 2
  const y = SAFE_TOP + (appMode === 'online' ? 142 : 118)

  ctx.save()
  ctx.globalAlpha = 0.97
  drawRoundRect(x + 5, y + 6, boxW, boxH, 22, '#111', null, 0)
  drawRoundRect(x, y, boxW, boxH, 22, '#FFF6E8', '#111', 3)
  ctx.restore()

  drawText(t('rivalOrdering'), W / 2, y + 12, 23, '#111', 'center', 'bold')
  drawText(t('waitRivalAction'), W / 2, y + 44, 11, '#555', 'center', 'bold')
}



function drawMealResult() {
  const result = game.lastMealResult

  if (!result) {
    drawText(t('mealResult'), 24, SAFE_TOP + 34, 28, '#111', 'left', 'bold')
    drawHomeMiniButton()
    drawMusicButton()
    addButton('next', t('continueBtn'), 24, H - SAFE_BOTTOM - 72, W - 48, 58, '#111', '#fff', 22)
    return
  }

  const selfId = getSelfId()
  const oppId = otherPlayer(selfId)

  let verdict = t('mealDraw')
  let quote = t('quoteDraw')

  if (result.winner === selfId) {
    verdict = t('youWonMeal')
    quote = t('quoteWin')
  } else if (result.winner === oppId) {
    verdict = t('youLostMeal')
    quote = t('quoteLose')
  }

  const selfScore = getMealTotalPoint(game, selfId)
  const oppScore = getMealTotalPoint(game, oppId)

  const selfCards = getMealCardsFromResult(result, selfId)
  const oppCards = getMealCardsFromResult(result, oppId)
  const selfTotal = selfId === 'p1' ? result.p1Total : result.p2Total
  const oppTotal = oppId === 'p1' ? result.p1Total : result.p2Total
  const selfBusted = selfId === 'p1' ? result.p1Busted : result.p2Busted
  const oppBusted = oppId === 'p1' ? result.p1Busted : result.p2Busted

  drawHomeMiniButton()
  drawMusicButton()

  const panelW = W - 48
  const panelH = Math.min(520, H - SAFE_TOP - SAFE_BOTTOM - 112)
  const x = 24
  const y = SAFE_TOP + 52

  drawRoundRect(x, y, panelW, panelH, 28, '#FFFFFF', '#111', 4)

  drawText(`${mealName(result.mealIndex)} ${t('result') || ''}`.trim(), W / 2, y + 24, 24, '#111', 'center', 'bold')
  drawText(verdict, W / 2, y + 62, 34, result.winner === selfId ? '#E94335' : '#111', 'center', 'bold')
  drawText(quote, W / 2, y + 108, 16, '#555', 'center', 'bold')

  drawRoundRect(W / 2 - 86, y + 138, 172, 44, 22, '#FFF6E8', '#111', 3)
  drawText(`${t('you')} ${selfScore} : ${oppScore} ${t('rival')}`, W / 2, y + 150, 22, '#111', 'center', 'bold')

  const cardAreaY = y + 202
  const cardPanelH = Math.max(108, Math.min(150, (panelH - 260) / 2))
  drawCompactMealCards(t('rivalOrders') || `${t('rival')} ${t('orders')}`, oppCards, oppTotal, oppBusted, x + 16, cardAreaY, panelW - 32, cardPanelH)
  drawCompactMealCards(t('yourOrders') || `${t('you')} ${t('orders')}`, selfCards, selfTotal, selfBusted, x + 16, cardAreaY + cardPanelH + 10, panelW - 32, cardPanelH)

  if (appMode === 'online') {
    const nextReady = game.nextReady || { p1: false, p2: false }
    const statusText = `${t('confirmStatus')}：${t('you')} ${nextReady[selfId] ? t('confirmed') : t('unconfirmed')}｜${t('rival')} ${nextReady[oppId] ? t('confirmed') : t('unconfirmed')}`
    drawText(statusText, W / 2, y + panelH - 30, 12, '#E94335', 'center', 'bold')
  }

  const nextReady = game.nextReady || { p1: false, p2: false }
  const nextName = game.mealIndex >= 3 ? t('finalResult') : mealName(game.mealIndex + 1)

  if (appMode === 'online') {
    const alreadyReady = Boolean(nextReady[selfId])
    addButton(alreadyReady ? 'noop' : 'next', alreadyReady ? t('waitingRival') : `${t('confirmEnter')}${nextName}`, 24, H - SAFE_BOTTOM - 72, W - 48, 58, '#111', '#fff', 19)
  } else {
    addButton('next', `${t('enter')}${nextName}`, 24, H - SAFE_BOTTOM - 72, W - 48, 58, '#111', '#fff', 22)
  }
}

function drawResultPlayer(title, pid, y, h) {
  const result = game.lastMealResult
  const cards = pid === 'p1' ? result.p1Cards : result.p2Cards
  const total = pid === 'p1' ? result.p1Total : result.p2Total
  const busted = pid === 'p1' ? result.p1Busted : result.p2Busted
  const combo = pid === 'p1' ? result.p1Combo : result.p2Combo
  const point = pid === 'p1' ? result.p1Point : result.p2Point

  drawRoundRect(20, y, W - 40, h, 20, '#FFFFFF', '#111', 3)
  drawText(title, 38, y + 12, 20, '#111', 'left', 'bold')
  drawText(`${total}/${result.threshold} kcal`, W - 38, y + 14, 16, busted ? '#E94335' : '#111', 'right', 'bold')
  drawText(busted ? `${t('statusBust')}` : `${t('statusSafe')}`, 38, y + 42, 13, busted ? '#E94335' : '#333', 'left', 'bold')
  drawText(`${t('mealPoint')} +${point}`, W - 38, y + 42, 13, '#E94335', 'right', 'bold')

  const comboText = busted ? t('comboBustNone') : combo ? comboResultText(combo) : t('comboNone')
  wrapText(`${t('combo')}：${comboText}`, 38, y + 62, W - 76, 16, 12, '#555', 'bold', 2)

  drawCards(cards, 38, y + 96, W - 76, h - 110)
}





// =========================
// 本地总积分 / 热量档案 v7.9
// =========================
const PROFILE_SAVE_KEY = 'lilucard_profile_v1'
const PROFILE_LAST_SETTLE_KEY = 'lilucard_profile_last_settle_v1'

function loadLocalProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_SAVE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      return {
        totalKcal: Number(data.totalKcal || 0),
        credit: Number(data.credit || 1000),
        win: Number(data.win || 0),
        lose: Number(data.lose || 0),
        draw: Number(data.draw || 0),
        maxKcal: Number(data.maxKcal || 0)
      }
    }
  } catch (err) {}

  return {
    totalKcal: 0,
    credit: 1000,
    win: 0,
    lose: 0,
    draw: 0,
    maxKcal: 0
  }
}

function saveLocalProfile(profile) {
  try {
    localStorage.setItem(PROFILE_SAVE_KEY, JSON.stringify(profile))
  } catch (err) {}
}

function getProfileTitle(profile) {
  const total = Number(profile.totalKcal || 0)

  if (total >= 1000000) return lang === 'en' ? 'Walking Food City' : '行走的美食城'
  if (total >= 500000) return lang === 'en' ? 'Human Buffet' : '人体自助餐'
  if (total >= 100000) return lang === 'en' ? 'Calorie Tycoon' : '热量富豪'
  if (total >= 50000) return lang === 'en' ? 'Carb Player' : '碳水玩家'
  if (total >= 10000) return lang === 'en' ? 'Night Snack Apprentice' : '夜宵学徒'
  return lang === 'en' ? 'New Eater' : '新手吃货'
}

function getDayResultWinner(g) {
  const selfId = getSelfId()
  const oppId = otherPlayer(selfId)
  const selfPoint = getFinalPoint(g, selfId)
  const oppPoint = getFinalPoint(g, oppId)

  if (selfPoint > oppPoint) return selfId
  if (oppPoint > selfPoint) return oppId
  return null
}

function getDaySettlementId(g) {
  try {
    return JSON.stringify({
      room: appMode === 'online' ? roomId : 'single',
      results: g.mealResults,
      p1: getFinalPoint(g, 'p1'),
      p2: getFinalPoint(g, 'p2'),
      k1: getDayTotalKcal(g, 'p1'),
      k2: getDayTotalKcal(g, 'p2')
    })
  } catch (err) {
    return `${Date.now()}`
  }
}

function applyProfileSettlementOnce(g) {
  if (!g || g.phase !== 'day_result') return loadLocalProfile()

  const settleId = getDaySettlementId(g)

  try {
    if (localStorage.getItem(PROFILE_LAST_SETTLE_KEY) === settleId) {
      return loadLocalProfile()
    }
  } catch (err) {}

  const profile = loadLocalProfile()
  const selfId = getSelfId()
  const winner = getDayResultWinner(g)
  const selfKcal = getDayTotalKcal(g, selfId)

  if (winner === selfId) {
    profile.totalKcal += selfKcal
    profile.credit += 20
    profile.win += 1
  } else if (winner === null) {
    profile.draw += 1
  } else {
    profile.credit = Math.max(0, profile.credit - 20)
    profile.lose += 1
  }

  profile.maxKcal = Math.max(Number(profile.maxKcal || 0), selfKcal)
  saveLocalProfile(profile)

  try {
    localStorage.setItem(PROFILE_LAST_SETTLE_KEY, settleId)
  } catch (err) {}

  return profile
}

let leaderboardOpen = false
let profileOpen = false

function getLocalLeaderboard(profile) {
  const selfName = lang === 'en' ? 'Me' : '我'
  const fake = lang === 'en'
    ? [
        { name: 'Calorie Judge', kcal: 128000, score: 1460 },
        { name: 'Night Snack Assassin', kcal: 98500, score: 1320 },
        { name: 'Carb Gambler', kcal: 32200, score: 1080 }
      ]
    : [
        { name: '热量裁判王', kcal: 128000, score: 1460 },
        { name: '夜宵刺客', kcal: 98500, score: 1320 },
        { name: '碳水赌徒', kcal: 32200, score: 1080 }
      ]

  const me = {
    name: selfName,
    kcal: Number(profile.totalKcal || 0),
    score: Number(profile.credit || 1000),
    isMe: true
  }

  return fake.concat(me).sort((a, b) => {
    if (b.kcal !== a.kcal) return b.kcal - a.kcal
    return b.score - a.score
  })
}


function drawHomeProfileButtons(profile) {
  if (appMode !== 'home') return

  const y = 4
  const h = 22
  const font = 9
  const myLabel = lang === 'en' ? 'Me' : '我的'
  const rankLabel = lang === 'en' ? 'Rank' : '排行榜'
  const myW = lang === 'en' ? 38 : 40
  const rankW = lang === 'en' ? 48 : 56
  const gap = 6
  const myX = W - myW - 8
  const rankX = myX - gap - rankW

  addButton('leaderboard_toggle', rankLabel, rankX, y, rankW, h, '#FFFFFF', '#111', font)
  addButton('profile_toggle', myLabel, myX, y, myW, h, '#FFFFFF', '#111', font)
}

function getProfileWinRate(profile) {
  const win = Number(profile.win || 0)
  const lose = Number(profile.lose || 0)
  const draw = Number(profile.draw || 0)
  const total = win + lose + draw
  if (total <= 0) return '0%'
  return `${Math.round((win / total) * 100)}%`
}

const boxW = Math.min(W - 42, 340)
const boxH = Math.min(H - SAFE_TOP - SAFE_BOTTOM - 60, 390)
const x = (W - boxW) / 2
const y = Math.max(SAFE_TOP + 32, (H - boxH) / 2 - 34)
  const title = getProfileTitle(profile)
  const win = Number(profile.win || 0)
  const lose = Number(profile.lose || 0)
  const draw = Number(profile.draw || 0)
  const rate = getProfileWinRate(profile)

  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.30)'
  ctx.fillRect(0, 0, W, H)

  // 阻止点击穿透到底层首页按钮。
  buttons.push({ id: 'noop', x: 0, y: 0, w: W, h: H })

  drawRoundRect(x + 4, y + 5, boxW, boxH, 24, 'rgba(17,17,17,0.18)', null, 0)
  drawRoundRect(x, y, boxW, boxH, 24, '#FFFFFF', '#111', 3)

  drawText(lang === 'en' ? 'My Profile' : '我的档案', x + 22, y + 22, 22, '#111', 'left', 'bold')
  addButton('profile_close', lang === 'en' ? 'Close' : '关闭', x + boxW - 78, y + 18, 56, 26, '#111', '#fff', 11)

  const bigKcal = Number(profile.totalKcal || 0)
  drawRoundRect(x + 20, y + 62, boxW - 40, 58, 18, '#111', null, 0)
  drawText(`${bigKcal} kcal`, x + boxW / 2, y + 76, 24, '#FFE169', 'center', 'bold')
  drawText(lang === 'en' ? 'Total Calories' : '累计卡路里', x + boxW / 2, y + 104, 11, '#FFFFFF', 'center', 'bold')

  const rows = lang === 'en'
    ? [
        ['Score', String(Number(profile.credit || 1000))],
        ['Title', title],
        ['Wins / Losses', `${win} / ${lose}`],
        ['Win Rate', rate],
        ['Draws', String(draw)],
        ['Best Game', `${Number(profile.maxKcal || 0)} kcal`]
      ]
    : [
        ['积分', String(Number(profile.credit || 1000))],
        ['称号', title],
        ['胜场 / 负场', `${win} / ${lose}`],
        ['胜率', rate],
        ['平局', String(draw)],
        ['最高单局有效热量', `${Number(profile.maxKcal || 0)} kcal`]
      ]

  let rowY = y + 128
  rows.forEach(([label, value]) => {
    drawRoundRect(x + 20, rowY, boxW - 40, 28, 12, '#F7F1E8', null, 0)
    drawText(label, x + 34, rowY + 8, 12, '#777', 'left', 'bold')
    drawText(value, x + boxW - 34, rowY + 8, lang === 'en' && value.length > 15 ? 10 : 12, '#111', 'right', 'bold')
    rowY += 28
  })

  ctx.restore()
}

function drawProfileTopBar(profile) {
  const y = 30
  const h = 30
  const title = getProfileTitle(profile)
  const totalLabel = lang === 'en' ? 'Total' : '累计'
  const scoreLabel = lang === 'en' ? 'Score' : '积分'
  const rankLabel = lang === 'en' ? 'Rank' : '排行榜'
  const text = `${totalLabel} ${Number(profile.totalKcal || 0)} kcal｜${scoreLabel} ${Number(profile.credit || 1000)}｜${title}`

  const btnW = lang === 'en' ? 50 : 56
  const barX = 20
  const barW = W - 40
  const textW = barW - btnW - 8

  drawRoundRect(barX, y, barW, h, 15, '#111', null, 0)
  drawText(text, barX + textW / 2 + 6, y + 8, lang === 'en' ? 9 : 10, '#FFE169', 'center', 'bold')
  addButton('leaderboard_toggle', rankLabel, barX + barW - btnW - 5, y + 4, btnW, h - 8, '#FFE169', '#111', 9)
}

function drawLeaderboardOverlay(profile) {
  if (!leaderboardOpen) return

  const list = getLocalLeaderboard(profile)
  const boxW = Math.min(W - 42, 340)
  const boxH = Math.min(H - SAFE_TOP - SAFE_BOTTOM - 80, 292)
  const x = (W - boxW) / 2
  const y = Math.max(SAFE_TOP + 64, (H - boxH) / 2)

  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.30)'
  ctx.fillRect(0, 0, W, H)

  // 阻止点击穿透到底层按钮。
  buttons.push({ id: 'noop', x: 0, y: 0, w: W, h: H })

  drawRoundRect(x + 4, y + 5, boxW, boxH, 24, 'rgba(17,17,17,0.18)', null, 0)
  drawRoundRect(x, y, boxW, boxH, 24, '#FFFFFF', '#111', 3)

  drawText(lang === 'en' ? 'Leaderboard' : '排行榜', x + 22, y + 22, 22, '#111', 'left', 'bold')
  drawText(lang === 'en' ? 'Sorted by total calories' : '按累计卡路里排序', x + 22, y + 54, 12, '#777', 'left', 'bold')
  addButton('leaderboard_close', lang === 'en' ? 'Close' : '关闭', x + boxW - 78, y + 18, 56, 26, '#111', '#fff', 11)

  let rowY = y + 82
  list.forEach((item, index) => {
    const isMe = Boolean(item.isMe)
    const rowH = 42
    const fill = isMe ? '#FFE169' : '#F7F1E8'
    drawRoundRect(x + 18, rowY, boxW - 36, rowH, 14, fill, null, 0)
    drawText(String(index + 1), x + 36, rowY + 12, 16, isMe ? '#E94335' : '#111', 'center', 'bold')
    drawText(item.name, x + 58, rowY + 10, 13, '#111', 'left', 'bold')
    drawText(`${Number(item.kcal || 0)} kcal`, x + boxW - 30, rowY + 9, 12, '#111', 'right', 'bold')
    drawText(`${lang === 'en' ? 'Score' : '积分'} ${Number(item.score || 1000)}`, x + boxW - 30, rowY + 25, 10, '#777', 'right', 'bold')
    rowY += rowH + 8
  })

  ctx.restore()
}

function drawDayResult() {
  drawHomeMiniButton()
  drawMusicButton()

  const profile = applyProfileSettlementOnce(game)
  drawProfileTopBar(profile)

  const resultOffsetY = 34
  const selfId = getSelfId()
  const oppId = otherPlayer(selfId)
  const selfPoint = getFinalPoint(game, selfId)
  const oppPoint = getFinalPoint(game, oppId)
  const selfKcal = getDayTotalKcal(game, selfId)
  const oppKcal = getDayTotalKcal(game, oppId)

  let finalText = t('finalDraw')
  let finalSubText = t('finalDrawSub')

  if (selfPoint > oppPoint) {
    finalText = t('finalWin')
    finalSubText = t('finalWinSub')
  } else if (selfPoint < oppPoint) {
    finalText = t('finalLose')
    finalSubText = t('finalLoseSub')
  }

  const selfWin = selfPoint > oppPoint
  const oppWin = oppPoint > selfPoint
  const selfColor = selfWin ? '#E94335' : (oppWin ? '#8A8A8A' : '#111')
  const oppColor = oppWin ? '#E94335' : (selfWin ? '#8A8A8A' : '#111')

  drawRoundRect(20, SAFE_TOP + 34 + resultOffsetY, W - 40, 112, 22, '#FFFFFF', '#111', 3)
  drawText(finalText, W / 2, SAFE_TOP + 48 + resultOffsetY, 26, selfWin ? '#E94335' : '#111', 'center', 'bold')
  drawText(finalSubText, W / 2, SAFE_TOP + 80 + resultOffsetY, 13, '#555', 'center', 'bold')

  const boxY = SAFE_TOP + 102 + resultOffsetY
  const halfW = (W - 64) / 2
  drawRoundRect(32, boxY, halfW, 34, 16, '#F7F1E8', null, 0)
  drawRoundRect(32 + halfW, boxY, halfW, 34, 16, '#F7F1E8', null, 0)
  drawText(`${t('you')} ${selfKcal} kcal`, 32 + halfW / 2, boxY + 9, 14, selfColor, 'center', 'bold')
  drawText(`${t('rival')} ${oppKcal} kcal`, 32 + halfW + halfW / 2, boxY + 9, 14, oppColor, 'center', 'bold')

  const results = safeArray(game.mealResults)
  let y = SAFE_TOP + 158 + resultOffsetY
  const bottomLimit = H - SAFE_BOTTOM - 104
  const blockH = Math.max(74, Math.min(98, (bottomLimit - y - 18) / meals.length))

  for (let i = 0; i < meals.length; i++) {
    const res = results[i]

    drawRoundRect(20, y, W - 40, blockH, 16, '#FFFFFF', '#111', 2)

    drawText(mealName(i), 34, y + 10, 17, '#111', 'left', 'bold')

    if (!res) {
      drawText(t('noRecord'), W / 2, y + 12, 13, '#777', 'center', 'bold')
      y += blockH + 8
      continue
    }

    const selfCards = getMealCardsFromResult(res, selfId)
    const oppCards = getMealCardsFromResult(res, oppId)
    const selfRaw = selfId === 'p1' ? res.p1Total : res.p2Total
    const oppRaw = oppId === 'p1' ? res.p1Total : res.p2Total
    const selfBusted = selfId === 'p1' ? res.p1Busted : res.p2Busted
    const oppBusted = oppId === 'p1' ? res.p1Busted : res.p2Busted
    const selfP = getMealPoint(game, selfId, i)
    const oppP = getMealPoint(game, oppId, i)

    drawText(`${selfP}:${oppP}`, W - 34, y + 10, 16, '#E94335', 'right', 'bold')
    drawText(`${t('you')} ${selfRaw}${selfBusted ? ' ' + t('statusBust') : ''}｜${t('rival')} ${oppRaw}${oppBusted ? ' ' + t('statusBust') : ''}`, 92, y + 12, 12, '#333', 'left', 'bold')

    const cardY = y + 34
    const colW = (W - 76) / 2
    drawText(t('rival'), 34, cardY, 10, '#777', 'left', 'bold')
    drawTinyCards(oppCards, 34, cardY + 14, colW, blockH - 50, 26)
    drawText(t('you'), 42 + colW, cardY, 10, '#777', 'left', 'bold')
    drawTinyCards(selfCards, 42 + colW, cardY + 14, colW, blockH - 50, 26)

    y += blockH + 8
  }

  if (appMode === 'online') {
    const ready = game.replayReady || { p1: false, p2: false }
    const statusText = `${t('nextReady')}：${t('you')} ${ready[selfId] ? t('ready') : t('notReady')}｜${t('rival')} ${ready[oppId] ? t('ready') : t('notReady')}`
    drawText(statusText, W / 2, H - SAFE_BOTTOM - 92, 13, '#E94335', 'center', 'bold')
    addButton(ready[selfId] ? 'noop' : 'replay_ready', ready[selfId] ? t('waitingRival') : t('readyNext'), 24, H - SAFE_BOTTOM - 72, W - 48, 58, '#111', '#fff', 22)
  } else {
    addButton('restart_home', t('backHome'), 24, H - SAFE_BOTTOM - 72, W - 48, 58, '#111', '#fff', 22)
  }

  drawLeaderboardOverlay(profile)
}

// =========================
// 渲染入口
// =========================


function drawOverlayIfNeeded() {
  if (Date.now() > startOverlayUntil || !startOverlayText) return

  // v2.6：正式开局后不再显示“开始”遮罩，避免误以为不能操作。
  if (game && game.phase && game.phase !== 'lobby') return

  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  ctx.fillRect(0, 0, W, H)

  const boxW = Math.min(W - 60, 280)
  const boxH = 96
  const x = (W - boxW) / 2
  const y = (H - boxH) / 2

  drawRoundRect(x, y, boxW, boxH, 22, '#111', '#111', 2)
  drawText(lang === 'en' ? 'Start' : '开始', x + boxW / 2, y + 18, 30, '#FFE169', 'center', 'bold')
  drawText(startOverlayText, x + boxW / 2, y + 56, 14, '#fff', 'center', 'bold')
  ctx.restore()
}



// =========================
// 新手教程覆盖层
// =========================
function startTutorialIfNeeded() {
  if (tutorialDone) return
  tutorialOn = true
  tutorialStep = 0
}


function startTutorialManual() {
  appMode = 'single'
  myPlayerId = 'p1'
  game = createGame('single')
  aiOpeningIfNeeded(game)
  tutorialOn = true
  tutorialStep = 0
}

function finishTutorial() {
  tutorialOn = false
  tutorialStep = 0
  tutorialDone = true
  localStorage.setItem('lilucard_tutorial_done', '1')
  requestRender()
}

function tutorialText(zh, en) {
  return lang === 'en' ? en : zh
}

function getActionButtonFocus(ids) {
  const list = safeArray(ids)
    .map(id => buttons.find(b => b.id === id))
    .filter(Boolean)
  if (list.length === 0) return null

  const minX = Math.min(...list.map(b => b.x))
  const minY = Math.min(...list.map(b => b.y))
  const maxX = Math.max(...list.map(b => b.x + b.w))
  const maxY = Math.max(...list.map(b => b.y + b.h))
  const pad = 4
  return {
    x: Math.max(8, minX - pad),
    y: Math.max(8, minY - pad),
    w: Math.min(W - 16, maxX - minX + pad * 2),
    h: maxY - minY + pad * 2
  }
}

function getTutorialGameLayout() {
  const topY = Math.max(SAFE_TOP + 34, 34) + (appMode === 'online' ? 18 : 0)
  const actionY = H - SAFE_BOTTOM - 94
  const centerH = 80
  const gap = 8
  let zoneH = Math.floor((actionY - topY - centerH - gap * 2 - 12) / 2)
  zoneH = Math.max(160, Math.min(228, zoneH))

  const opponentY = topY
  const centerY = opponentY + zoneH + gap
  const selfY = centerY + centerH + gap

  return {
    opponent: { x: 20, y: opponentY + 4, w: W - 40, h: zoneH - 8 },
    center: { x: 20, y: centerY + 4, w: W - 40, h: centerH - 8 },
    limit: { x: Math.max(20, W * 0.54), y: centerY + 18, w: Math.min(W * 0.38, W - Math.max(20, W * 0.54) - 28), h: 32 },
    self: { x: 20, y: selfY + 4, w: W - 40, h: zoneH - 8 }
  }
}

function getTutorialStep() {
  const layout = getTutorialGameLayout()
  const drawActions = ['draw_meat', 'draw_veg', 'draw_staple', 'draw_dessert']
  const bottomFocus = getActionButtonFocus(drawActions) || { x: 16, y: H - SAFE_BOTTOM - 84, w: Math.max(210, W * 0.5), h: 70 }
  const standFocus = getActionButtonFocus(['stand']) || { x: W * 0.54, y: H - SAFE_BOTTOM - 84, w: W * 0.42, h: 70 }

  const steps = [
    {
      title: tutorialText('大局目标', 'Full-game goal'),
      text: tutorialText(
        '一天有4餐：早餐、午餐、晚餐、夜宵。\n每餐是一小局，4小局结束后结算一整局。\n目标是在不爆牌的前提下，比对手吃得更多。',
        'A full game has 4 meals: Breakfast, Lunch, Dinner, and Night Snack.\nEach meal is one round. After 4 rounds, the full game is settled.\nYour goal is to eat more than your rival without busting.'
      ),
      focus: layout.center
    },
    {
      title: tutorialText('警戒线', 'Calorie limit'),
      text: tutorialText(
        '每餐都有警戒线。\n超过警戒线就爆牌，本餐热量不计入总分。',
        'Each meal has a calorie limit.\nGoing over the limit means Bust. That meal’s calories do not count toward your total.'
      ),
      focus: layout.limit
    },
    {
      title: tutorialText('对手区域', 'Rival area'),
      text: tutorialText(
        '上半区是对手。\n对手第一张是暗牌，所以你只能看到「? + 明牌热量」。',
        'The top area is your rival.\nTheir first card is hidden, so you only see “? + visible calories”.'
      ),
      focus: layout.opponent
    },
    {
      title: tutorialText('自己区域', 'Your area'),
      text: tutorialText(
        '下半区是你。\n你的外卖牌和热量都会显示在这里。',
        'The bottom area is yours.\nYour cards and calories are shown here.'
      ),
      focus: layout.self
    },
    {
      title: tutorialText('四个外卖按钮', 'Four food buttons'),
      text: tutorialText(
        '荤、素、主食、甜点代表四类外卖。\n不同类别热量区间不同，选择类别就是你的策略。',
        'Meat, Veg, Staple, and Dessert are the four food categories.\nEach category has different calorie ranges. Choosing a category is your strategy.'
      ),
      focus: bottomFocus
    },
    {
      title: tutorialText('起手阶段', 'Opening cards'),
      text: tutorialText(
        '每餐开始先抽2张起手牌。\n起手牌不消耗今日外卖次数。',
        'Each meal starts with 2 opening cards.\nOpening cards do not cost your daily order chances.'
      ),
      focus: bottomFocus
    },
    {
      title: tutorialText('点餐阶段', 'Ordering phase'),
      text: tutorialText(
        '起手后继续点外卖会消耗今日外卖次数。\n越接近警戒线越容易赢，但也越容易爆牌。',
        'After opening cards, each order uses one daily chance.\nThe closer you get to the limit, the better — but also riskier.'
      ),
      focus: bottomFocus
    },
    {
      title: tutorialText('开吃 / 收手', 'Eat / Stop'),
      text: tutorialText(
        '觉得差不多就点「开吃」。\n双方都开吃后，本餐结算。',
        'Tap “Eat” when you want to stop.\nWhen both players stop, the meal is settled.'
      ),
      focus: standFocus
    },
    {
      title: tutorialText('夜宵规则', 'Night Snack'),
      text: tutorialText(
        '夜宵比较特殊：会一次性用完剩余外卖次数。\n先选择搭配，再统一揭晓。',
        'Night Snack is special: it uses all remaining order chances at once.\nPick your mix first, then reveal together.'
      ),
      focus: bottomFocus,
      done: true
    }
  ]

  return steps[tutorialStep] || null
}

function advanceTutorial() {
  const step = getTutorialStep()
  if (step && step.done) {
    finishTutorial()
    return
  }

  tutorialStep += 1
  if (!getTutorialStep()) {
    finishTutorial()
  } else {
    requestRender()
  }
}

function getTutorialAllowedActions() {
  if (!tutorialOn) return null
  const step = getTutorialStep()
  return step && step.actions ? step.actions : null
}

function drawDashedRoundRect(x, y, w, h, r, stroke, lineWidth, dash) {
  ctx.save()
  ctx.setLineDash(dash || [7, 5])
  drawRoundRect(x, y, w, h, r, null, stroke, lineWidth || 2)
  ctx.restore()
}

function getTutorialBoxY(focus, boxH) {
  const margin = 14
  if (!focus) return Math.min(H - SAFE_BOTTOM - boxH - margin, H * 0.62)

  const topSpace = focus.y - SAFE_TOP - margin
  const bottomSpace = H - SAFE_BOTTOM - (focus.y + focus.h) - margin

  // 底部操作区说明优先放上方，避免压住按钮。
  if (focus.y + focus.h > H * 0.68 && topSpace >= boxH + 6) return focus.y - boxH - margin
  // 顶部区域说明优先放下方。
  if (focus.y < H * 0.34 && bottomSpace >= boxH + 6) return focus.y + focus.h + margin
  // 中间区域优先选择空间更大的一侧。
  if (topSpace >= bottomSpace && topSpace >= boxH + 6) return focus.y - boxH - margin
  if (bottomSpace >= boxH + 6) return focus.y + focus.h + margin
  if (topSpace >= boxH + 6) return focus.y - boxH - margin
  return Math.min(H - SAFE_BOTTOM - boxH - margin, Math.max(SAFE_TOP + margin, H * 0.52))
}

function drawTutorialOverlay() {
  if (!tutorialOn || appMode !== 'single') return

  const step = getTutorialStep()
  if (!step) return

  ctx.save()

  // 轻遮罩：只压暗环境，不遮住游戏内容。
  ctx.fillStyle = 'rgba(0, 0, 0, 0.24)'
  ctx.fillRect(0, 0, W, H)

  if (step.focus) {
    const f = step.focus
    // 高亮只用虚线描边，不再用白色块遮挡内容。
    drawDashedRoundRect(f.x, f.y, f.w, f.h, 16, '#FFE169', 3, [8, 6])
    drawRoundRect(f.x - 3, f.y - 3, f.w + 6, f.h + 6, 18, null, 'rgba(17,17,17,0.25)', 1)
  }

  const boxW = Math.min(W - 52, lang === 'en' ? 372 : 342)
  const lineCount = String(step.text || '').split('\n').length
  const boxH = lang === 'en'
    ? Math.min(214, Math.max(156, 82 + lineCount * 28))
    : Math.min(184, Math.max(132, 64 + lineCount * 24))
  const boxX = (W - boxW) / 2
  const boxY = getTutorialBoxY(step.focus, boxH)

  // 说明内容：半透明底 + 虚线框，避免像弹窗一样压死画面。
  drawRoundRect(boxX + 4, boxY + 5, boxW, boxH, 18, 'rgba(17,17,17,0.18)', null, 0)
  drawRoundRect(boxX, boxY, boxW, boxH, 18, 'rgba(255,255,255,0.82)', null, 0)
  drawDashedRoundRect(boxX, boxY, boxW, boxH, 18, '#111', 2, [7, 5])

  drawText(step.title || '', boxX + 18, boxY + 24, 15, '#111', 'left', 'bold')
  wrapText(step.text, boxX + 18, boxY + 48, boxW - 36, 21, lang === 'en' ? 11 : 13, '#253044', 'bold', 4)

  const label = step.done
    ? tutorialText('结束教学', 'Finish')
    : tutorialText('下一步', 'Next')
  addButton('tutorial_next', label, boxX + boxW - 106, boxY + boxH - 39, 88, 28, '#111', '#fff', 12)

  addButton('tutorial_skip', tutorialText('跳过', 'Skip'), W - 66, Math.max(4, SAFE_TOP - 12), 54, 22, '#FFFFFF', '#111', 10)
  ctx.restore()
}

function render() {
  buttons = []
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = getPageBg()
  ctx.fillRect(0, 0, W, H)
  drawNightStars()

  if (appMode === 'home') {
    drawHome()
    drawTutorialOverlay()
    drawOverlayIfNeeded()
    return
  }

  if (game.phase === 'meal_result') {
    drawMealResult()
    drawTutorialOverlay()
    drawOverlayIfNeeded()
    return
  }

  if (game.phase === 'day_result') {
    drawDayResult()
    drawTutorialOverlay()
    drawOverlayIfNeeded()
    return
  }

  drawGameScreen()
  drawTutorialOverlay()
  drawOverlayIfNeeded()
}

// =========================
// 点击事件
// =========================


async function handleAction(id) {
  const selfId = getSelfId()

  if (tutorialOn) {
    if (id === 'tutorial_next') {
      advanceTutorial()
      return
    }

    if (id === 'tutorial_skip') {
      finishTutorial()
      return
    }
  }

  const tutorialAllowedActions = getTutorialAllowedActions()
  let tutorialAdvanceAfterAction = false

  if (tutorialOn && appMode === 'single') {
    if (tutorialAllowedActions) {
      if (!tutorialAllowedActions.includes(id)) return
      tutorialAdvanceAfterAction = true
    } else {
      return
    }
  }

  const lockedActions = ['draw_meat', 'draw_veg', 'draw_staple', 'draw_dessert', 'stand', 'reveal_night', 'next', 'replay_ready', 'ready']
  const shouldLock = appMode === 'online' && lockedActions.includes(id)

  // v7.3：联机防连点。
  // 数据库写入/回读还没完成时，直接忽略下一次点牌，避免旧快照覆盖新状态导致卡死。
  if (shouldLock && (onlineActionLocked || Date.now() < onlineActionLockUntil || Date.now() < pendingWriteUntil)) {
    return
  }

  if (shouldLock) {
    onlineActionLocked = true
    onlineActionLockUntil = Date.now() + 1800
  }

  pendingActionId = id

  try {
    if (id === 'rules_toggle') {
      rulesExpanded = !rulesExpanded
      if (!rulesExpanded) rulesScroll = 0
      render()
      return
    }

    if (id === 'music_toggle') {
      toggleBgm()
      return
    }

    if (id === 'lang_toggle') {
      toggleLang()
      return
    }

    if (id === 'tutorial_btn') {
      startTutorialManual()
      render()
      return
    }

    if (id === 'leaderboard_toggle') {
      leaderboardOpen = true
      profileOpen = false
      render()
      return
    }

    if (id === 'leaderboard_close') {
      leaderboardOpen = false
      render()
      return
    }

    if (id === 'profile_toggle') {
      profileOpen = true
      leaderboardOpen = false
      render()
      return
    }

    if (id === 'profile_close') {
      profileOpen = false
      render()
      return
    }

    if (id === 'noop') {
      return
    }

    if (id === 'tarot_slot') {
      handleTarotSlotTap()
      return
    }

    if (id === 'home') {
      leaveToHome()
      return
    }

    if (id === 'single_start') {
      appMode = 'single'
      myPlayerId = 'p1'
      game = createGame('single')
      aiOpeningIfNeeded(game)
      startTutorialIfNeeded()
      render()
      return
    }

    if (id === 'online_create') {
      await createOnlineRoom()
      return
    }

    if (id === 'online_join') {
      await joinOnlineRoom()
      return
    }

    if (id === 'ready') {
      await playerReady()
      return
    }

    if (id === 'draw_meat') applyDraw(game, selfId, '荤')
    if (id === 'draw_veg') applyDraw(game, selfId, '素')
    if (id === 'draw_staple') applyDraw(game, selfId, '主食')
    if (id === 'draw_dessert') applyDraw(game, selfId, '甜点')
    if (id === 'stand') applyStand(game, selfId)
    if (id === 'reveal_night') applyRevealNight(game)

    if (['draw_meat', 'draw_veg', 'draw_staple', 'draw_dessert', 'stand', 'reveal_night'].includes(id)) {
      singleAfterPlayerAction()

      if (appMode === 'online') await saveOnlineGame()
      else render()

      return
    }

    if (id === 'next') {
      applyNext(game, selfId)

      if (appMode === 'online') await saveOnlineGame()
      else {
        if (game.phase === 'opening') aiOpeningIfNeeded(game)
        render()
      }

      return
    }

    if (id === 'replay_ready') {
      applyReplayReady(selfId)

      if (appMode === 'online') await saveOnlineGame()
      else render()

      return
    }

    if (id === 'restart_home') {
      leaveToHome()
      return
    }
  } finally {
    if (shouldLock) {
      setTimeout(() => {
        onlineActionLocked = false
      }, 180)
    }

    if (tutorialAdvanceAfterAction) {
      advanceTutorial()
    }
  }
}


function onPointer(clientX, clientY) {
  const id = hitButton(clientX, clientY)
  if (!id || id === 'noop') return

  startBgm()

  buttonPulse[id] = Date.now()
  requestRender()
  setTimeout(requestRender, BUTTON_PULSE_MS + 24)

  handleAction(id)
}

canvas.addEventListener('touchstart', event => {
  event.preventDefault()
  const touch = event.touches && event.touches[0]
  if (!touch) return

  const id = hitButton(touch.clientX, touch.clientY)

  if (id) {
    onPointer(touch.clientX, touch.clientY)
    return
  }

  if (appMode === 'home' && rulesExpanded) {
    rulesTouchDragging = true
    rulesTouchLastY = touch.clientY
  }
}, { passive: false })

canvas.addEventListener('touchmove', event => {
  if (!(appMode === 'home' && rulesExpanded && rulesTouchDragging)) return

  event.preventDefault()
  const touch = event.touches && event.touches[0]
  if (!touch) return

  const dy = rulesTouchLastY - touch.clientY
  rulesTouchLastY = touch.clientY
  rulesScroll = Math.max(0, Math.min(rulesMaxScroll, rulesScroll + dy))
  requestRender()
}, { passive: false })

canvas.addEventListener('touchend', event => {
  rulesTouchDragging = false
}, { passive: false })

canvas.addEventListener('wheel', event => {
  if (!(appMode === 'home' && rulesExpanded)) return

  event.preventDefault()
  rulesScroll = Math.max(0, Math.min(rulesMaxScroll, rulesScroll + event.deltaY))
  requestRender()
}, { passive: false })

canvas.addEventListener('mousedown', event => {
  event.preventDefault()
  onPointer(event.clientX, event.clientY)
})

preloadGameImages()
render()
