// online.js
// 非阻塞 Firebase 联机层。这个文件只有点击“开房间 / 加入房间”时才会被 game.js 加载。

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

  let firebaseReadyPromise = null
  let db = null

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existed = Array.prototype.find.call(document.scripts, s => s.src && s.src.indexOf(src) >= 0)
      if (existed) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Firebase脚本加载失败：' + src))
      document.head.appendChild(script)
    })
  }

  async function ensureFirebase() {
    if (db) return db

    if (!firebaseReadyPromise) {
      firebaseReadyPromise = (async () => {
        if (!window.firebase || !window.firebase.initializeApp) {
          await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js')
        }

        if (!window.firebase || !window.firebase.database) {
          await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js')
        }

        if (!window.firebase) {
          throw new Error('Firebase SDK 没有加载成功')
        }

        if (!window.firebase.apps || window.firebase.apps.length === 0) {
          window.firebase.initializeApp(firebaseConfig)
        }

        db = window.firebase.database()
        return db
      })()
    }

    return firebaseReadyPromise
  }

  function cleanRoomId(roomId) {
    return String(roomId || '').trim().toUpperCase()
  }

  async function roomRef(roomId) {
    const database = await ensureFirebase()
    return database.ref('rooms/' + cleanRoomId(roomId))
  }

  function makeRoomCode() {
    return String(Math.floor(1000 + Math.random() * 9000))
  }

  async function createRoom(initialGame) {
    let roomId = makeRoomCode()

    for (let i = 0; i < 10; i++) {
      const ref = await roomRef(roomId)
      const snap = await ref.get()
      if (!snap.exists()) break
      roomId = makeRoomCode()
    }

    const ref = await roomRef(roomId)
    await ref.set({
      roomId,
      status: 'waiting',
      createdAt: window.firebase.database.ServerValue.TIMESTAMP,
      updatedAt: window.firebase.database.ServerValue.TIMESTAMP,
      players: {
        p1: {
          joined: true,
          name: '玩家1',
          joinedAt: window.firebase.database.ServerValue.TIMESTAMP
        }
      },
      game: initialGame
    })

    return { roomId, playerId: 'p1' }
  }

  async function joinRoom(roomId) {
    const id = cleanRoomId(roomId)
    if (!id) throw new Error('请输入房间码')

    const ref = await roomRef(id)
    const snap = await ref.get()
    if (!snap.exists()) throw new Error('房间不存在')

    const room = snap.val()
    const players = room.players || {}

    if (players.p1 && !players.p2) {
      await ref.update({
        status: 'playing',
        updatedAt: window.firebase.database.ServerValue.TIMESTAMP,
        'players/p2': {
          joined: true,
          name: '玩家2',
          joinedAt: window.firebase.database.ServerValue.TIMESTAMP
        },
        'game/message': '玩家2已加入，玩家1先抽起手牌'
      })
      return { roomId: id, playerId: 'p2' }
    }

    throw new Error('房间已满或无法加入')
  }

  function listenRoom(roomId, callback) {
    let activeRef = null
    let activeHandler = null

    roomRef(roomId).then(ref => {
      activeRef = ref
      activeHandler = snapshot => callback(snapshot.exists() ? snapshot.val() : null)
      activeRef.on('value', activeHandler)
    }).catch(err => {
      callback({
        status: 'error',
        game: {
          message: err && err.message ? err.message : String(err)
        }
      })
    })

    return function unsubscribe() {
      if (activeRef && activeHandler) activeRef.off('value', activeHandler)
    }
  }

  async function updateRoom(roomId, patch) {
    const ref = await roomRef(roomId)
    return ref.update({
      ...patch,
      updatedAt: window.firebase.database.ServerValue.TIMESTAMP
    })
  }

  async function deleteRoom(roomId) {
    const ref = await roomRef(roomId)
    return ref.remove()
  }

  window.createRoom = createRoom
  window.joinRoom = joinRoom
  window.listenRoom = listenRoom
  window.updateRoom = updateRoom
  window.deleteRoom = deleteRoom
  window.liluOnlineReady = true
})()
