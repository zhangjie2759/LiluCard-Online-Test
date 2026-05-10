// online.js
// Firebase Realtime Database 联机层
// GitHub Pages 静态网页可直接使用，无需 npm。

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js"
import {
  getDatabase,
  ref,
  set,
  update,
  get,
  remove,
  onValue,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js"

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

function cleanRoomId(roomId) {
  return String(roomId || "").trim().toUpperCase()
}

function roomRef(roomId) {
  return ref(db, `rooms/${cleanRoomId(roomId)}`)
}

function makeRoomCode() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export async function createRoom(initialGame) {
  let roomId = makeRoomCode()

  for (let i = 0; i < 10; i++) {
    const snap = await get(roomRef(roomId))
    if (!snap.exists()) break
    roomId = makeRoomCode()
  }

  await set(roomRef(roomId), {
    roomId,
    status: "waiting",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    players: {
      p1: {
        joined: true,
        name: "玩家1",
        joinedAt: serverTimestamp()
      }
    },
    game: initialGame
  })

  return {
    roomId,
    playerId: "p1"
  }
}

export async function joinRoom(roomId) {
  const id = cleanRoomId(roomId)

  if (!id) {
    throw new Error("请输入房间码")
  }

  const snap = await get(roomRef(id))

  if (!snap.exists()) {
    throw new Error("房间不存在")
  }

  const room = snap.val()
  const players = room.players || {}

  if (players.p1 && !players.p2) {
    await update(roomRef(id), {
      status: "playing",
      updatedAt: serverTimestamp(),
      "players/p2": {
        joined: true,
        name: "玩家2",
        joinedAt: serverTimestamp()
      },
      "game/message": "玩家2已加入，玩家1先抽起手牌"
    })

    return {
      roomId: id,
      playerId: "p2"
    }
  }

  throw new Error("房间已满或无法加入")
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

export async function deleteRoom(roomId) {
  return remove(roomRef(roomId))
}
