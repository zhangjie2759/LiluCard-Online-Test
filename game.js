// game.js
// 利禄卡 Online Test v0.1
// 最小联机测试：创建房间 / 加入房间 / 轮流抽牌 / 收手 / 简单结算

import {
  createRoom,
  joinRoom,
  listenRoom,
  updateRoom
} from "./online.js"

const TEST_CARDS = [
  { name: "鸡翅", type: "荤", kcal: 180 },
  { name: "炸鸡", type: "荤", kcal: 260 },
  { name: "米饭", type: "主食", kcal: 160 },
  { name: "披萨", type: "主食", kcal: 220 },
  { name: "沙拉", type: "素", kcal: 20 },
  { name: "臭豆腐", type: "素", kcal: 150 },
  { name: "奶茶", type: "甜点", kcal: 250 },
  { name: "蛋糕", type: "甜点", kcal: 350 }
]

const THRESHOLD = 800

let currentRoomId = ""
let myPlayerId = ""
let roomData = null
let unsubscribeRoom = null

const $ = id => document.getElementById(id)

const el = {
  homePanel: $("homePanel"),
  gamePanel: $("gamePanel"),
  createRoomBtn: $("createRoomBtn"),
  joinRoomBtn: $("joinRoomBtn"),
  roomInput: $("roomInput"),
  roomCodeText: $("roomCodeText"),
  statusText: $("statusText"),
  leaveBtn: $("leaveBtn"),
  resetBtn: $("resetBtn"),
  p1Box: $("p1Box"),
  p2Box: $("p2Box"),
  p1Cards: $("p1Cards"),
  p2Cards: $("p2Cards"),
  p1Score: $("p1Score"),
  p2Score: $("p2Score"),
  drawMeatBtn: $("drawMeatBtn"),
  drawVegBtn: $("drawVegBtn"),
  drawMainBtn: $("drawMainBtn"),
  drawDessertBtn: $("drawDessertBtn"),
  standBtn: $("standBtn")
}

function createInitialState() {
  return {
    p1Cards: [],
    p2Cards: [],
    p1Stood: false,
    p2Stood: false,
    message: "等待玩家 2 加入",
    actionCount: 0
  }
}

function showGame(roomId, playerId) {
  currentRoomId = roomId
  myPlayerId = playerId
  el.homePanel.classList.add("hidden")
  el.gamePanel.classList.remove("hidden")
  el.roomCodeText.textContent = roomId
}

function showHome() {
  currentRoomId = ""
  myPlayerId = ""
  roomData = null

  if (unsubscribeRoom) {
    unsubscribeRoom()
    unsubscribeRoom = null
  }

  el.homePanel.classList.remove("hidden")
  el.gamePanel.classList.add("hidden")
}

function watchRoom(roomId) {
  if (unsubscribeRoom) unsubscribeRoom()

  unsubscribeRoom = listenRoom(roomId, data => {
    roomData = data
    render()
  })
}

function getCards(playerId) {
  const state = roomData?.state || {}
  return playerId === "p1" ? (state.p1Cards || []) : (state.p2Cards || [])
}

function getTotal(cards) {
  return cards.reduce((sum, card) => sum + Number(card.kcal || 0), 0)
}

function getOtherPlayer(playerId) {
  return playerId === "p1" ? "p2" : "p1"
}

function getTypeClass(type) {
  if (type === "荤") return "type-meat"
  if (type === "素") return "type-veg"
  if (type === "主食") return "type-main"
  if (type === "甜点") return "type-dessert"
  return ""
}

function drawCardByType(type) {
  const pool = TEST_CARDS.filter(card => card.type === type)
  const card = pool[Math.floor(Math.random() * pool.length)]
  return {
    ...card,
    id: `${Date.now()}-${Math.floor(Math.random() * 99999)}`
  }
}

function renderCards(container, cards) {
  container.innerHTML = ""

  if (!cards || cards.length === 0) {
    const empty = document.createElement("div")
    empty.className = "sub"
    empty.textContent = "还没有牌"
    container.appendChild(empty)
    return
  }

  cards.forEach(card => {
    const node = document.createElement("div")
    node.className = `mini-card ${getTypeClass(card.type)}`
    node.innerHTML = `
      <div>${card.name}</div>
      <div class="kcal">${card.type} / ${card.kcal} kcal</div>
    `
    container.appendChild(node)
  })
}

function render() {
  if (!roomData) return

  const state = roomData.state || createInitialState()
  const p1Cards = state.p1Cards || []
  const p2Cards = state.p2Cards || []
  const p1Total = getTotal(p1Cards)
  const p2Total = getTotal(p2Cards)
  const p1Busted = p1Total > THRESHOLD
  const p2Busted = p2Total > THRESHOLD
  const players = roomData.players || {}
  const isFull = Boolean(players.p1 && players.p2)
  const gameOver = roomData.status === "finished"
  const isMyTurn = roomData.turn === myPlayerId
  const myStood = myPlayerId === "p1" ? state.p1Stood : state.p2Stood

  el.roomCodeText.textContent = currentRoomId
  el.p1Score.textContent = `${p1Total} / ${THRESHOLD}`
  el.p2Score.textContent = `${p2Total} / ${THRESHOLD}`

  renderCards(el.p1Cards, p1Cards)
  renderCards(el.p2Cards, p2Cards)

  el.p1Box.classList.toggle("active", roomData.turn === "p1" && !gameOver)
  el.p2Box.classList.toggle("active", roomData.turn === "p2" && !gameOver)
  el.p1Box.classList.toggle("me", myPlayerId === "p1")
  el.p2Box.classList.toggle("me", myPlayerId === "p2")

  let status = state.message || "同步中..."

  if (!isFull) {
    status = `房间 ${currentRoomId} 创建成功。等待玩家 2 加入。`
  } else if (gameOver) {
    status = state.message || "本局结束"
  } else if (myStood) {
    status = "你已收手，等待对方操作或结算。"
  } else if (isMyTurn) {
    status = "轮到你了：抽一张牌，或者收手。"
  } else {
    status = "等待对方操作..."
  }

  if (p1Busted || p2Busted) {
    status += `\n爆牌提示：${p1Busted ? "玩家1已爆 " : ""}${p2Busted ? "玩家2已爆" : ""}`
  }

  el.statusText.textContent = status

  const canAct = isFull && !gameOver && isMyTurn && !myStood
  const drawButtons = [
    el.drawMeatBtn,
    el.drawVegBtn,
    el.drawMainBtn,
    el.drawDessertBtn,
    el.standBtn
  ]

  drawButtons.forEach(btn => {
    btn.disabled = !canAct
  })

  // 房主可以重开，方便测试
  el.resetBtn.disabled = myPlayerId !== "p1"
}

async function handleCreateRoom() {
  try {
    el.createRoomBtn.disabled = true
    el.createRoomBtn.textContent = "创建中..."

    const result = await createRoom(createInitialState())

    showGame(result.roomId, result.playerId)
    watchRoom(result.roomId)
  } catch (error) {
    alert(error.message || "创建房间失败")
  } finally {
    el.createRoomBtn.disabled = false
    el.createRoomBtn.textContent = "创建房间"
  }
}

async function handleJoinRoom() {
  try {
    el.joinRoomBtn.disabled = true
    el.joinRoomBtn.textContent = "加入中..."

    const roomId = el.roomInput.value.trim()
    const result = await joinRoom(roomId)

    showGame(result.roomId, result.playerId)
    watchRoom(result.roomId)
  } catch (error) {
    alert(error.message || "加入房间失败")
  } finally {
    el.joinRoomBtn.disabled = false
    el.joinRoomBtn.textContent = "加入房间"
  }
}

async function handleDraw(type) {
  if (!roomData) return

  const state = roomData.state || createInitialState()
  const currentTurn = roomData.turn

  if (currentTurn !== myPlayerId) return

  const card = drawCardByType(type)
  const cardPath = myPlayerId === "p1" ? "state/p1Cards" : "state/p2Cards"
  const stoodPath = myPlayerId === "p1" ? "state/p1Stood" : "state/p2Stood"
  const oldCards = getCards(myPlayerId)
  const newCards = [...oldCards, card]
  const newTotal = getTotal(newCards)
  const other = getOtherPlayer(myPlayerId)

  let nextTurn = other
  let message = `${myPlayerId === "p1" ? "玩家 1" : "玩家 2"} 抽到：${card.name} +${card.kcal} kcal`

  // 如果自己爆牌，自动视为收手，回合交给对方
  const patch = {
    [cardPath]: newCards,
    [stoodPath]: newTotal > THRESHOLD,
    "state/message": newTotal > THRESHOLD ? `${message}，爆牌了！` : message,
    "state/actionCount": (state.actionCount || 0) + 1,
    turn: nextTurn
  }

  await updateRoom(currentRoomId, patch)
  await tryFinishAfterAction()
}

async function handleStand() {
  if (!roomData) return

  const currentTurn = roomData.turn
  if (currentTurn !== myPlayerId) return

  const state = roomData.state || createInitialState()
  const stoodPath = myPlayerId === "p1" ? "state/p1Stood" : "state/p2Stood"
  const other = getOtherPlayer(myPlayerId)

  await updateRoom(currentRoomId, {
    [stoodPath]: true,
    turn: other,
    "state/message": `${myPlayerId === "p1" ? "玩家 1" : "玩家 2"} 选择收手`,
    "state/actionCount": (state.actionCount || 0) + 1
  })

  await tryFinishAfterAction()
}

async function tryFinishAfterAction() {
  // 重新读一次数据库，确保拿到最新状态
  const latest = roomData
  if (!latest) return

  setTimeout(async () => {
    if (!roomData) return

    const state = roomData.state || createInitialState()
    const p1Cards = state.p1Cards || []
    const p2Cards = state.p2Cards || []
    const p1Total = getTotal(p1Cards)
    const p2Total = getTotal(p2Cards)

    const p1Done = state.p1Stood || p1Total > THRESHOLD
    const p2Done = state.p2Stood || p2Total > THRESHOLD

    if (!p1Done || !p2Done || roomData.status === "finished") return

    let message = ""
    let winner = null
    const p1Busted = p1Total > THRESHOLD
    const p2Busted = p2Total > THRESHOLD

    if (p1Busted && p2Busted) {
      message = `双方都爆牌：玩家1 ${p1Total} / 玩家2 ${p2Total}，平局。`
    } else if (p1Busted) {
      winner = "p2"
      message = `玩家1爆牌，玩家2获胜。玩家1 ${p1Total} / 玩家2 ${p2Total}`
    } else if (p2Busted) {
      winner = "p1"
      message = `玩家2爆牌，玩家1获胜。玩家1 ${p1Total} / 玩家2 ${p2Total}`
    } else if (p1Total > p2Total) {
      winner = "p1"
      message = `玩家1更接近警戒线，玩家1获胜。${p1Total} / ${p2Total}`
    } else if (p2Total > p1Total) {
      winner = "p2"
      message = `玩家2更接近警戒线，玩家2获胜。${p1Total} / ${p2Total}`
    } else {
      message = `双方热量相同，平局。${p1Total} / ${p2Total}`
    }

    await updateRoom(currentRoomId, {
      status: "finished",
      winner,
      "state/p1Stood": true,
      "state/p2Stood": true,
      "state/message": message
    })
  }, 350)
}

async function handleReset() {
  if (!currentRoomId || myPlayerId !== "p1") return

  await updateRoom(currentRoomId, {
    status: "playing",
    turn: "p1",
    winner: null,
    state: {
      ...createInitialState(),
      message: "房主已重新开始。玩家 1 先行动。"
    }
  })
}

el.createRoomBtn.addEventListener("click", handleCreateRoom)
el.joinRoomBtn.addEventListener("click", handleJoinRoom)
el.leaveBtn.addEventListener("click", showHome)
el.resetBtn.addEventListener("click", handleReset)

el.drawMeatBtn.addEventListener("click", () => handleDraw("荤"))
el.drawVegBtn.addEventListener("click", () => handleDraw("素"))
el.drawMainBtn.addEventListener("click", () => handleDraw("主食"))
el.drawDessertBtn.addEventListener("click", () => handleDraw("甜点"))
el.standBtn.addEventListener("click", handleStand)

showHome()
