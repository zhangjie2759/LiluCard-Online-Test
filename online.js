// online.js
// 利禄卡 Online v0.5
// 无 Firebase SDK 版本：不再加载 gstatic Firebase 脚本。
// 直接使用 Firebase Realtime Database REST API + 轮询同步。
// 优点：避免 “Firebase SDK 没有加载成功” 导致无法开房间。

(function () {
  const DATABASE_URL = "https://lilucard-online-test-default-rtdb.firebaseio.com"

  function now() {
    return Date.now()
  }

  function cleanRoomId(roomId) {
    return String(roomId || "").trim().toUpperCase()
  }

  function makeRoomCode() {
    return String(Math.floor(1000 + Math.random() * 9000))
  }

  function roomUrl(roomId) {
    return `${DATABASE_URL}/rooms/${cleanRoomId(roomId)}.json`
  }

  async function requestJSON(url, options) {
    const res = await fetch(url, {
      cache: "no-store",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options && options.headers ? options.headers : {})
      }
    })

    if (!res.ok) {
      throw new Error(`数据库请求失败：${res.status}`)
    }

    if (res.status === 204) return null

    const text = await res.text()
    if (!text) return null

    return JSON.parse(text)
  }

  async function getRoom(roomId) {
    return requestJSON(roomUrl(roomId), {
      method: "GET"
    })
  }

  function expandPatch(flatPatch) {
    const result = {}

    Object.keys(flatPatch || {}).forEach(key => {
      const value = flatPatch[key]

      if (key.indexOf("/") < 0) {
        result[key] = value
        return
      }

      const parts = key.split("/").filter(Boolean)
      let cursor = result

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]

        if (i === parts.length - 1) {
          cursor[part] = value
        } else {
          if (!cursor[part] || typeof cursor[part] !== "object") {
            cursor[part] = {}
          }
          cursor = cursor[part]
        }
      }
    })

    return result
  }

  async function putRoom(roomId, data) {
    return requestJSON(roomUrl(roomId), {
      method: "PUT",
      body: JSON.stringify(data)
    })
  }

  async function patchRoom(roomId, patch) {
    return requestJSON(roomUrl(roomId), {
      method: "PATCH",
      body: JSON.stringify(expandPatch(patch))
    })
  }

  async function createRoom(initialGame) {
    let roomId = makeRoomCode()

    for (let i = 0; i < 10; i++) {
      const existing = await getRoom(roomId)
      if (existing === null) break
      roomId = makeRoomCode()
    }

    await putRoom(roomId, {
      roomId,
      status: "waiting",
      createdAt: now(),
      updatedAt: now(),
      players: {
        p1: {
          joined: true,
          name: "玩家1",
          joinedAt: now()
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

    const room = await getRoom(id)

    if (room === null) {
      throw new Error("房间不存在")
    }

    const players = room.players || {}

    if (players.p1 && !players.p2) {
      await patchRoom(id, {
        status: "playing",
        updatedAt: now(),
        "players/p2": {
          joined: true,
          name: "玩家2",
          joinedAt: now()
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
    let stopped = false
    let timer = null
    let lastText = ""

    async function tick() {
      if (stopped) return

      try {
        const id = cleanRoomId(roomId)
        const url = roomUrl(id) + `?t=${Date.now()}`
        const res = await fetch(url, { cache: "no-store" })

        if (!res.ok) {
          throw new Error(`同步失败：${res.status}`)
        }

        const text = await res.text()

        // 数据没变化就不重复 render，减少手机卡顿
        if (text !== lastText) {
          lastText = text
          const data = text ? JSON.parse(text) : null
          callback(data)
        }
      } catch (err) {
        callback({
          status: "error",
          game: {
            message: err && err.message ? err.message : String(err)
          }
        })
      }

      if (!stopped) {
        timer = setTimeout(tick, 900)
      }
    }

    tick()

    return function unsubscribe() {
      stopped = true
      if (timer) clearTimeout(timer)
    }
  }

  async function updateRoom(roomId, patch) {
    return patchRoom(roomId, {
      ...patch,
      updatedAt: now()
    })
  }

  async function deleteRoom(roomId) {
    return requestJSON(roomUrl(roomId), {
      method: "DELETE"
    })
  }

  window.createRoom = createRoom
  window.joinRoom = joinRoom
  window.listenRoom = listenRoom
  window.updateRoom = updateRoom
  window.deleteRoom = deleteRoom
  window.liluOnlineReady = true
})()
