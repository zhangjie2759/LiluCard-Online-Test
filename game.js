// v7.9 积分系统基础版（在你现有 game.js 上补充使用）

// ===== 本地数据 =====
const saveKey = 'lilucard_profile_v1'

function loadProfile() {
  const data = localStorage.getItem(saveKey)
  if (data) return JSON.parse(data)
  return {
    totalKcal: 0,
    credit: 1000,
    win: 0,
    lose: 0,
    draw: 0,
    maxKcal: 0
  }
}

function saveProfile(p) {
  localStorage.setItem(saveKey, JSON.stringify(p))
}

// ===== 结算接入 =====
function applyEndGameResult(result) {
  // result: { winner: 'p1' / 'p2' / null, myKcal: number }

  const p = loadProfile()

  const myId = getSelfId()
  const win = result.winner === myId
  const draw = result.winner === null

  if (win) {
    p.totalKcal += result.myKcal
    p.credit += 20
    p.win += 1
  } else if (draw) {
    p.draw += 1
  } else {
    p.credit -= 20
    p.lose += 1
  }

  if (result.myKcal > p.maxKcal) {
    p.maxKcal = result.myKcal
  }

  saveProfile(p)
}

// ===== 称号 =====
function getTitle(p) {
  if (p.totalKcal > 1000000) return '行走的美食城'
  if (p.totalKcal > 500000) return '人体自助餐'
  if (p.totalKcal > 100000) return '热量富豪'
  if (p.totalKcal > 50000) return '碳水玩家'
  if (p.totalKcal > 10000) return '夜宵学徒'
  return '新手'
}

// ===== 档案 UI（简单版）=====
function drawProfile(ctx) {
  const p = loadProfile()

  ctx.fillStyle = '#000'
  ctx.font = '16px Arial'

  ctx.fillText('累计卡路里: ' + p.totalKcal, 20, 100)
  ctx.fillText('信用分: ' + p.credit, 20, 130)
  ctx.fillText('胜/负: ' + p.win + '/' + p.lose, 20, 160)
  ctx.fillText('称号: ' + getTitle(p), 20, 190)
}
