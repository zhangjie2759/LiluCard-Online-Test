// online.js
// Firebase Realtime Database 联机层
// 普通 script 版本：避免 ES Module / CDN import 失败导致整页白屏。

(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyDfYIxdrFi8hep4ek1Y3YfypzuWChdB68Q",
    authDomain: "lilucard-online-test.firebaseapp.com",
    databaseURL: "https://lilucard-online-test-default-rtdb.firebaseio.com",
    projectId: "lilucard-online-test",
    storageBucket: "lilucard-online-test.firebasestorage.app",
    messagingSenderId: "271720161820",
    appId: "1:271720161820:web:8bfacf9c549b14881cb5d9"
  }

  let db = null

  function initFirebase() {
    if (!window.firebase) {
      throw new Error("Firebase SDK 没有加载成功，请检查网络或刷新页面")
    }

    if (!window.firebase.apps || window.firebase.apps.length === 0) {
      window.firebase.initializeApp(firebaseConfig)
    }

    db = window.firebase.database()
    return db
  }

  function getDB() {
    if (!db) return initFirebase()
    return db
  }

  function cleanRoomId(roomId) {
    return String(roomId || "").trim().toUpperCase()
  }

  function roomRef(roomId) {
    return getDB().ref("rooms/" + cleanRoomId(roomId))
  }

  function makeRoomCode() {
    return String(Math.floor(1000 + Math.random() * 9000))
  }

  async function createRoom(initialGame) {
    let roomId = makeRoomCode()

    for (let i = 0; i < 10; i++) {
      const snap = await roomRef(roomId).get()
      if (!snap.exists()) break
      roomId = makeRoomCode()
    }

    await roomRef(roomId).set({
      roomId,
      status: "waiting",
      createdAt: window.firebase.database.ServerValue.TIMESTAMP,
      updatedAt: window.firebase.database.ServerValue.TIMESTAMP,
      players: {
        p1: {
          joined: true,
          name: "玩家1",
          joinedAt: window.firebase.database.ServerValue.TIMESTAMP
        }
      },
      game: initialGame
    })

    return {
      roomId,
      playerId: "p1"
    }
  }

  async function joinRoom(roomId) {
    const id = cleanRoomId(roomId)

    if (!id) {
      throw new Error("请输入房间码")
    }

    const snap = await roomRef(id).get()

    if (!snap.exists()) {
      throw new Error("房间不存在")
    }

    const room = snap.val()
    const players = room.players || {}

    if (players.p1 && !players.p2) {
      await roomRef(id).update({
        status: "playing",
        updatedAt: window.firebase.database.ServerValue.TIMESTAMP,
        "players/p2": {
          joined: true,
          name: "玩家2",
          joinedAt: window.firebase.database.ServerValue.TIMESTAMP
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

  function listenRoom(roomId, callback) {
    const ref = roomRef(roomId)
    const handler = snapshot => {
      callback(snapshot.exists() ? snapshot.val() : null)
    }

    ref.on("value", handler)
    return function unsubscribe() {
      ref.off("value", handler)
    }
  }

  async function updateRoom(roomId, patch) {
    return roomRef(roomId).update({
      ...patch,
      updatedAt: window.firebase.database.ServerValue.TIMESTAMP
    })
  }

  async function deleteRoom(roomId) {
    return roomRef(roomId).remove()
  }

  window.createRoom = createRoom
  window.joinRoom = joinRoom
  window.listenRoom = listenRoom
  window.updateRoom = updateRoom
  window.deleteRoom = deleteRoom
})()
