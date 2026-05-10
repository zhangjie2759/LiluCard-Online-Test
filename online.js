// online.js
// Firebase Realtime Database 联机层
// 这份是 GitHub Pages 静态网页可用版本，不需要 npm。

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js"
import {
  getDatabase,
  ref,
  set,
  update,
  get,
  onValue,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js"

// 你的 Firebase Web App 配置
const firebaseConfig = {
  apiKey: "AIzaSyDfYIxdrFi8hep4ek1Y3YfypzuWChdB68Q",
  authDomain: "lilucard-online-test.firebaseapp.com",
  databaseURL: "https://lilucard-online-test-default-rtdb.firebaseio.com",
  projectId: "lilucard-online-test",
  storageBucket: "lilucard-online-test.firebasestorage.app",
  messagingSenderId: "271720161820",
  appId: "1:271720161820:web:8bfacf9c549b14881cb5d9"
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

function roomRef(roomId) {
  return ref(db, `rooms/${roomId}`)
}

function makeRoomCode() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export async function createRoom(initialState) {
  let roomId = makeRoomCode()

  // 简单避开重复房间码
  for (let i = 0; i < 8; i++) {
    const snap = await get(roomRef(roomId))
    if (!snap.exists()) break
    roomId = makeRoomCode()
  }

  await set(roomRef(roomId), {
    roomId,
    status: "waiting",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    turn: "p1",
    winner: null,
    players: {
      p1: {
        joined: true,
        name: "玩家 1",
        joinedAt: serverTimestamp()
      }
    },
    state: initialState
  })

  return {
    roomId,
    playerId: "p1"
  }
}

export async function joinRoom(roomId) {
  const cleanRoomId = String(roomId || "").trim()
  if (!cleanRoomId) {
    throw new Error("请输入房间码")
  }

  const snap = await get(roomRef(cleanRoomId))
  if (!snap.exists()) {
    throw new Error("房间不存在")
  }

  const data = snap.val()
  const players = data.players || {}

  if (players.p1 && !players.p2) {
    await update(roomRef(cleanRoomId), {
      status: "playing",
      updatedAt: serverTimestamp(),
      "players/p2": {
        joined: true,
        name: "玩家 2",
        joinedAt: serverTimestamp()
      },
      "state/message": "玩家 2 已加入，玩家 1 先行动"
    })

    return {
      roomId: cleanRoomId,
      playerId: "p2"
    }
  }

  if (players.p1 && players.p2) {
    throw new Error("房间已满")
  }

  throw new Error("房间数据异常")
}

export function listenRoom(roomId, callback) {
  return onValue(roomRef(roomId), snapshot => {
    callback(snapshot.exists() ? snapshot.val() : null)
  })
}

export async function updateRoom(roomId, patch) {
  return update(roomRef(roomId), {
    ...patch,
    updatedAt: serverTimestamp()
  })
}
