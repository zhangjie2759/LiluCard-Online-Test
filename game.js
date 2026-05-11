(() => {
  'use strict';

  const VERSION = 'v6.3-egg-tarot-shell';
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const DPR_MAX = 2;

  let W = 0;
  let H = 0;
  let DPR = 1;
  let buttons = [];
  let lastTime = performance.now();

  const TOTAL_ORDERS_PER_DAY = 10;
  const meals = [
    { name: '早餐', threshold: 400 },
    { name: '午餐', threshold: 800 },
    { name: '晚餐', threshold: 600 },
    { name: '夜宵', threshold: 800 }
  ];

  const FOOD_CARDS = [
    { name: '生菜沙拉', english: 'Lettuce Salad', type: '素', kcal: 20 },
    { name: '西兰花', english: 'Broccoli', type: '素', kcal: 30 },
    { name: '魔芋结', english: 'Konjac Knot', type: '素', kcal: 30 },
    { name: '莲藕', english: 'Lotus Root', type: '素', kcal: 40 },
    { name: '烤黄金香菇', english: 'Golden Shiitake', type: '素', kcal: 60 },
    { name: '臭豆腐', english: 'Stinky Tofu', type: '素', kcal: 150 },
    { name: '水煮蛋', english: 'Boiled Egg', type: '荤', kcal: 80 },
    { name: '烤生蚝', english: 'Grilled Oyster', type: '荤', kcal: 120 },
    { name: '烤鸡翅', english: 'Chicken Wing', type: '荤', kcal: 180 },
    { name: '烤鱿鱼', english: 'Grilled Squid', type: '荤', kcal: 220 },
    { name: '炸鸡', english: 'Fried Chicken', type: '荤', kcal: 260 },
    { name: '羊肉串', english: 'Lamb Skewer', type: '荤', kcal: 300 },
    { name: '米饭', english: 'Rice Bowl', type: '主食', kcal: 160 },
    { name: '牛肉面', english: 'Beef Noodles', type: '主食', kcal: 180 },
    { name: '饺子', english: 'Dumplings', type: '主食', kcal: 200 },
    { name: '包子', english: 'Baozi', type: '主食', kcal: 200 },
    { name: '披萨片', english: 'Pizza Slice', type: '主食', kcal: 220 },
    { name: '咖喱饭', english: 'Curry Rice', type: '主食', kcal: 240 },
    { name: '酸奶', english: 'Yogurt', type: '甜点', kcal: 60 },
    { name: '布丁', english: 'Pudding', type: '甜点', kcal: 200 },
    { name: '珍珠奶茶', english: 'Bubble Tea', type: '甜点', kcal: 250 },
    { name: '冰淇淋', english: 'Ice Cream', type: '甜点', kcal: 260 },
    { name: '瑞士卷', english: 'Swiss Roll', type: '甜点', kcal: 300 },
    { name: '蛋糕', english: 'Cake', type: '甜点', kcal: 350 }
  ];

  const TYPE_COLORS = { '荤': '#FF9BB4', '素': '#A9F0D1', '主食': '#FFE169', '甜点': '#9EDBFF' };
  const TYPE_TEXT_COLORS = { '荤': '#7A1230', '素': '#0E5C44', '主食': '#5C4300', '甜点': '#063D66' };

  let deck = [];
  let currentMealIndex = 0;
  let phase = 'home';
  let message = '';
  let comboMessage = '';
  let sides = {};
  let records = {};

  const tarot = {
    state: 'closed', // closed | cracked | open
    card: null,
    openedAt: 0,
    crackAt: 0,
    pieces: []
  };

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, DPR_MAX);
    W = Math.floor(window.innerWidth);
    H = Math.floor(window.innerHeight);
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  function fillRoundRect(x, y, w, h, r, fill, stroke = '#111', lw = 2) {
    roundRect(x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }

  function drawText(text, x, y, size, color = '#111', align = 'left', weight = 'normal') {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
  }

  function wrapText(text, x, y, maxWidth, lineHeight, size, color = '#111', weight = 'normal', maxLines = 2) {
    ctx.font = `${weight} ${size}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    let line = '';
    let yy = y;
    let lines = 0;
    for (const ch of String(text)) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, yy);
        yy += lineHeight;
        lines++;
        if (lines >= maxLines) return;
        line = ch;
      } else {
        line = test;
      }
    }
    if (line && lines < maxLines) ctx.fillText(line, x, yy);
  }

  function addButton(id, label, x, y, w, h, fill, text = '#111', size = 16) {
    buttons.push({ id, x, y, w, h });
    fillRoundRect(x, y, w, h, 16, fill, '#111', 2.5);
    drawText(label, x + w / 2, y + h / 2 - size / 2 - 1, size, text, 'center', '800');
  }

  function cloneCard(c) { return { ...c, hidden: false, privateCard: false }; }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function makeDeck() { return shuffle(FOOD_CARDS.map(cloneCard)); }
  function drawFromDeck() { if (!deck.length) deck = makeDeck(); return deck.pop(); }
  function drawFromDeckByType(type) {
    let list = deck.map((c, i) => c.type === type ? i : -1).filter(i => i >= 0);
    if (!list.length) { deck = deck.concat(makeDeck()); list = deck.map((c, i) => c.type === type ? i : -1).filter(i => i >= 0); }
    if (!list.length) return drawFromDeck();
    const idx = list[Math.floor(Math.random() * list.length)];
    return deck.splice(idx, 1)[0];
  }
  function calcCardsKcal(cards) { return cards.reduce((s, c) => s + Number(c.kcal || 0), 0); }

  function createSideState(name) { return { name, cards: [], stood: false, busted: false, nightChoices: [] }; }
  function createRecord() { return { mealKcal: meals.map(() => 0), rawMealKcal: meals.map(() => 0), basePoint: meals.map(() => 0), comboBonusPoint: meals.map(() => 0), dayBonusKcal: 0, dayOrdersUsed: 0 }; }
  function resetRecords() { records = { self: createRecord(), opponent: createRecord() }; }
  function isNightMeal() { return currentMealIndex === meals.length - 1; }
  function isSelfOpeningPhase() { return !isNightMeal() && sides.self && sides.self.cards.length < 2 && phase === 'playing'; }
  function getRemainingOrders(sideKey) { return Math.max(0, TOTAL_ORDERS_PER_DAY - records[sideKey].dayOrdersUsed); }

  function startGame() {
    deck = makeDeck();
    currentMealIndex = 0;
    resetRecords();
    phase = 'playing';
    comboMessage = '';
    startMeal(0);
  }

  function startMeal(index) {
    currentMealIndex = index;
    comboMessage = '';
    sides = { opponent: createSideState('对手'), self: createSideState('你') };
    if (isNightMeal()) {
      message = `夜宵开始：一次性选完剩余 ${getRemainingOrders('self')} 次外卖搭配`;
      return;
    }
    const h = drawFromDeck(); h.hidden = true; sides.opponent.cards.push(h);
    const o = drawFromDeck(); sides.opponent.cards.push(o);
    message = `${meals[index].name}开始：请先抽你的第 1 张起手牌`;
  }

  function updateBust(sideKey) {
    const total = calcCardsKcal(sides[sideKey].cards);
    sides[sideKey].busted = total > meals[currentMealIndex].threshold;
  }

  function playerDraw(type) {
    if (phase !== 'playing') return;
    const self = sides.self;
    if (self.stood || self.busted) return;
    if (isNightMeal()) {
      if (records.self.dayOrdersUsed >= TOTAL_ORDERS_PER_DAY) { message = '夜宵搭配已选完，点击揭晓夜宵'; return; }
      self.nightChoices.push(type);
      records.self.dayOrdersUsed++;
      message = getRemainingOrders('self') > 0 ? `夜宵搭配已选：${self.nightChoices.join('、')}；还剩 ${getRemainingOrders('self')} 次` : `夜宵搭配完成，点击揭晓夜宵`;
      return;
    }
    const opening = isSelfOpeningPhase();
    if (!opening && records.self.dayOrdersUsed >= TOTAL_ORDERS_PER_DAY) { message = '你的全日外卖次数已经用完，只能收手'; return; }
    const card = drawFromDeckByType(type);
    if (opening) {
      card.privateCard = self.cards.length === 0;
      self.cards.push(card);
      message = self.cards.length === 1 ? `你抽到第 1 张起手牌：${card.name}，这是你的底牌` : `你抽到第 2 张起手牌：${card.name}，起手完成`;
    } else {
      self.cards.push(card);
      records.self.dayOrdersUsed++;
      message = `你点了${type}外卖：${card.name} +${card.kcal} kcal；今日外卖 ${records.self.dayOrdersUsed}/${TOTAL_ORDERS_PER_DAY}`;
      opponentAutoStep();
    }
    updateBust('self');
    if (self.busted) message += '，你爆牌了，请点击收手结算';
  }

  function opponentAutoStep() {
    const op = sides.opponent;
    if (op.stood || op.busted) return;
    if (records.opponent.dayOrdersUsed >= TOTAL_ORDERS_PER_DAY) { op.stood = true; message += '；对手外卖用完，收手'; return; }
    const total = calcCardsKcal(op.cards);
    const selfTotal = calcCardsKcal(sides.self.cards);
    const threshold = meals[currentMealIndex].threshold;
    const should = total < threshold * 0.45 || (total < threshold * 0.68 && total < selfTotal - 50 && Math.random() < 0.65);
    if (should) {
      op.cards.push(drawFromDeck());
      records.opponent.dayOrdersUsed++;
      message += '；对手叫了一单';
      updateBust('opponent');
      if (op.busted) message += '，对手爆牌';
    } else {
      op.stood = true;
      message += '；对手收手';
    }
  }

  function opponentAutoPlayToEnd() { for (let i = 0; i < 8 && !sides.opponent.stood && !sides.opponent.busted; i++) opponentAutoStep(); }

  function evaluateMealCombo(cards, threshold) {
    const total = calcCardsKcal(cards);
    if (total > threshold) return null;
    const counts = { '荤': 0, '素': 0, '主食': 0, '甜点': 0 };
    cards.forEach(c => counts[c.type]++);
    const types = Object.keys(counts);
    if (total === threshold) return { level: 'high', name: '卡线大师', resultText: '卡线大师：本餐胜局 +1' };
    if (types.every(t => counts[t] >= 1)) return { level: 'high', name: '满汉大餐', resultText: '满汉大餐：本餐胜局 +1' };
    if (types.filter(t => counts[t] >= 2).length >= 2) return { level: 'middle', name: '双拼套餐', resultText: '双拼套餐：奖励荤牌入全日总分' };
    const maxType = types.sort((a, b) => counts[b] - counts[a])[0];
    if (counts[maxType] >= 3) return { level: 'middle', name: '偏科套餐', resultText: `偏科套餐：${maxType}类 ≥3 张` };
    return null;
  }

  function settleSide(sideKey) {
    const total = calcCardsKcal(sides[sideKey].cards);
    const busted = total > meals[currentMealIndex].threshold;
    records[sideKey].rawMealKcal[currentMealIndex] = total;
    records[sideKey].mealKcal[currentMealIndex] = busted ? 0 : total;
    const combo = evaluateMealCombo(sides[sideKey].cards, meals[currentMealIndex].threshold);
    if (combo && combo.level === 'high') records[sideKey].comboBonusPoint[currentMealIndex] += 1;
    return combo;
  }

  function playerStand() {
    if (phase !== 'playing') return;
    if (isNightMeal()) {
      if (getRemainingOrders('self') > 0) { message = `请先选完夜宵搭配，还剩 ${getRemainingOrders('self')} 次`; return; }
      sides.self.nightChoices.forEach(t => sides.self.cards.push(drawFromDeckByType(t)));
      while (records.opponent.dayOrdersUsed < TOTAL_ORDERS_PER_DAY) {
        const types = ['荤','素','主食','甜点'];
        sides.opponent.cards.push(drawFromDeckByType(types[Math.floor(Math.random()*types.length)]));
        records.opponent.dayOrdersUsed++;
      }
      finishMeal();
      return;
    }
    if (sides.self.cards.length < 2) { message = `请先抽满 2 张起手牌，目前 ${sides.self.cards.length}/2`; return; }
    sides.self.stood = true;
    opponentAutoPlayToEnd();
    finishMeal();
  }

  function finishMeal() {
    sides.opponent.cards.forEach(c => c.hidden = false);
    updateBust('self'); updateBust('opponent');
    const meal = meals[currentMealIndex];
    const st = calcCardsKcal(sides.self.cards);
    const ot = calcCardsKcal(sides.opponent.cards);
    const sb = st > meal.threshold;
    const ob = ot > meal.threshold;
    const sc = settleSide('self');
    const oc = settleSide('opponent');
    let result = '';
    if (sb && ob) result = '双方卡路里都爆炸啦！';
    else if (sb) { records.opponent.basePoint[currentMealIndex] += 1; result = '会吃有个屁用啊'; }
    else if (ob) { records.self.basePoint[currentMealIndex] += 1; result = '你很会吃啊，小朋友'; }
    else if (st > ot) { records.self.basePoint[currentMealIndex] += 1; result = '你很会吃啊，小朋友'; }
    else if (ot > st) { records.opponent.basePoint[currentMealIndex] += 1; result = '对手更接近警戒线，赢得本餐'; }
    else result = '双方热量相同，本餐平局';
    message = `${meal.name}结算：你 ${st} / 对手 ${ot}`;
    comboMessage = [result, sc ? `你触发：${sc.resultText}` : '', oc ? `对手触发：${oc.resultText}` : ''].filter(Boolean).join('｜');
    phase = 'mealEnd';
  }

  function goNextMeal() {
    if (phase !== 'mealEnd') return;
    if (currentMealIndex >= meals.length - 1) { phase = 'gameOver'; message = '今日结算完成'; return; }
    phase = 'playing';
    startMeal(currentMealIndex + 1);
  }

  function restart() { tarot.state = 'closed'; tarot.card = null; tarot.pieces = []; phase = 'home'; }

  function getTarotRect() {
    const w = Math.min(176, W * 0.42);
    const h = w * 1.17;
    return { x: W - w - 18, y: Math.max(90, H * 0.18), w, h };
  }

  function pickTarotCard() {
    const list = FOOD_CARDS;
    return list[Math.floor(Math.random() * list.length)];
  }

  function tapTarot() {
    if (tarot.state === 'closed') {
      tarot.state = 'cracked';
      tarot.crackAt = performance.now();
    } else if (tarot.state === 'cracked') {
      tarot.state = 'open';
      tarot.card = pickTarotCard();
      tarot.openedAt = performance.now();
      tarot.pieces = Array.from({ length: 10 }).map((_, i) => ({
        x: (Math.random() - 0.5) * 32,
        y: -Math.random() * 14,
        vx: (Math.random() - 0.5) * 2.2,
        vy: -2 - Math.random() * 3.5,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.12,
        s: 6 + Math.random() * 9,
        life: 1
      }));
    } else {
      tarot.state = 'closed';
      tarot.card = null;
      tarot.pieces = [];
    }
  }

  function eggPath(cx, cy, w, h, topClip) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.47);
    ctx.bezierCurveTo(cx + w * 0.44, cy - h * 0.44, cx + w * 0.48, cy - h * 0.08, cx + w * 0.45, cy + h * 0.17);
    ctx.bezierCurveTo(cx + w * 0.39, cy + h * 0.49, cx + w * 0.18, cy + h * 0.55, cx, cy + h * 0.55);
    ctx.bezierCurveTo(cx - w * 0.18, cy + h * 0.55, cx - w * 0.39, cy + h * 0.49, cx - w * 0.45, cy + h * 0.17);
    ctx.bezierCurveTo(cx - w * 0.48, cy - h * 0.08, cx - w * 0.44, cy - h * 0.44, cx, cy - h * 0.47);
    ctx.closePath();
  }

  function drawCrack(cx, cy, w) {
    ctx.save();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.37, cy - 4);
    ctx.lineTo(cx - w * 0.24, cy + 9);
    ctx.lineTo(cx - w * 0.11, cy - 2);
    ctx.lineTo(cx + w * 0.02, cy + 12);
    ctx.lineTo(cx + w * 0.18, cy - 3);
    ctx.lineTo(cx + w * 0.32, cy + 9);
    ctx.lineTo(cx + w * 0.43, cy - 1);
    ctx.stroke();
    ctx.restore();
  }

  function drawTarotCard(cx, cy, w, h, card) {
    const cardW = w * 0.45;
    const cardH = h * 0.61;
    const x = cx - cardW / 2;
    const y = cy - h * 0.2;
    fillRoundRect(x, y, cardW, cardH, 12, TYPE_COLORS[card.type] || '#fff', '#111', 2.5);
    drawText('今日建议吃', cx, y + 13, 12, '#111', 'center', '800');
    wrapText(card.name, x + 10, y + 36, cardW - 20, 18, 16, TYPE_TEXT_COLORS[card.type] || '#111', '900', 2);
    drawText(`${card.kcal} kcal`, cx, y + cardH - 30, 13, '#111', 'center', '800');
    ctx.save();
    ctx.strokeStyle = 'rgba(17,17,17,.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 12, y + cardH * 0.56);
    ctx.lineTo(x + cardW - 12, y + cardH * 0.56);
    ctx.stroke();
    ctx.restore();
  }

  function drawEggTarot() {
    const r = getTarotRect();
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const ew = r.w * 0.78;
    const eh = r.h * 0.82;
    buttons.push({ id: 'tarot', x: r.x, y: r.y, w: r.w, h: r.h });

    ctx.save();
    ctx.globalAlpha = 0.15;
    fillRoundRect(r.x + 8, r.y + r.h - 20, r.w - 16, 20, 999, '#111', null, 0);
    ctx.restore();

    if (tarot.state === 'open' && tarot.card) {
      drawTarotCard(cx, cy + 12, ew, eh, tarot.card);
    }

    if (tarot.state === 'open') {
      const t = Math.min(1, (performance.now() - tarot.openedAt) / 420);
      // 上半壳碎掉消失：只画飞散碎片，透明度快速降低
      tarot.pieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.r += p.vr;
        p.life *= 0.965;
        ctx.save();
        ctx.translate(cx + p.x, cy - eh * 0.18 + p.y);
        ctx.rotate(p.r);
        ctx.globalAlpha = Math.max(0, p.life * (1 - t * 0.5));
        ctx.fillStyle = '#fff7dc';
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, -p.s);
        ctx.lineTo(p.s * 0.9, p.s * 0.45);
        ctx.lineTo(-p.s * 0.8, p.s * 0.55);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.restore();
      });

      // 下半壳保留，遮住牌的下部
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - ew * 0.52, cy - 2, ew * 1.04, eh * 0.63);
      ctx.clip();
      eggPath(cx, cy, ew, eh);
      ctx.fillStyle = '#fff7dc';
      ctx.fill();
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 3;
      ctx.stroke();
      drawCrack(cx, cy, ew);
      ctx.restore();

      drawText('今天建议吃 ' + tarot.card.name, cx, r.y + r.h + 8, 15, '#111', 'center', '900');
      return;
    }

    // closed / cracked 完整鸡蛋
    eggPath(cx, cy, ew, eh);
    ctx.fillStyle = '#fff7dc';
    ctx.fill();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#ffd77a';
    ctx.beginPath();
    ctx.ellipse(cx + ew * 0.13, cy - eh * 0.13, ew * 0.18, eh * 0.28, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawText('美食', cx, cy - 25, 18, '#111', 'center', '900');
    drawText('塔罗牌', cx, cy + 2, 18, '#111', 'center', '900');

    if (tarot.state === 'cracked') {
      const shake = Math.sin((performance.now() - tarot.crackAt) / 45) * 1.5;
      ctx.save();
      ctx.translate(shake, 0);
      drawCrack(cx, cy + 26, ew * 0.78);
      ctx.restore();
      drawText('再点一下打开', cx, r.y + r.h + 8, 13, '#111', 'center', '800');
    } else {
      drawText('点蛋抽牌', cx, r.y + r.h + 8, 13, '#111', 'center', '800');
    }
  }

  function drawCard(card, x, y, w, h) {
    if (card.hidden) {
      fillRoundRect(x, y, w, h, 10, '#111', '#111', 2);
      drawText('?', x + w / 2, y + h / 2 - 13, 26, '#fff', 'center', '900');
      return;
    }
    fillRoundRect(x, y, w, h, 10, TYPE_COLORS[card.type] || '#fff', '#111', 2);
    drawText(card.type, x + 8, y + 7, 12, '#111', 'left', '900');
    wrapText(card.name, x + 8, y + 28, w - 16, 15, 12, TYPE_TEXT_COLORS[card.type] || '#111', '800', 2);
    drawText(String(card.kcal), x + w - 8, y + h - 22, 14, '#111', 'right', '900');
  }

  function drawSidePanel(key, x, y, w, h) {
    const side = sides[key];
    const total = calcCardsKcal(side.cards || []);
    const meal = meals[currentMealIndex];
    fillRoundRect(x, y, w, h, 20, key === 'self' ? '#fff7dc' : '#f2f2f2', '#111', 2.5);
    drawText(side.name, x + 14, y + 12, 18, '#111', 'left', '900');
    drawText(`${total}/${meal.threshold} kcal`, x + w - 14, y + 12, 16, total > meal.threshold ? '#f04b36' : '#111', 'right', '900');
    const cards = side.cards || [];
    const cw = Math.min(58, (w - 34) / 5);
    const ch = 78;
    cards.slice(0, 8).forEach((c, i) => drawCard(c, x + 14 + (i % 5) * (cw + 5), y + 42 + Math.floor(i / 5) * 30, cw, ch));
  }

  function drawHome() {
    ctx.fillStyle = '#fff4d6';
    ctx.fillRect(0, 0, W, H);
    drawText('利禄卡', 24, 36, 38, '#111', 'left', '900');
    drawText('LiluCard', 27, 82, 18, '#111', 'left', '900');
    wrapText('背着教练偷偷点外卖，尽量贴近每餐警戒线。别爆卡路里。', 24, 126, Math.min(330, W - 48), 24, 17, '#111', '800', 3);

    const eggLeftEdge = getTarotRect().x;
    const bw = Math.min(250, Math.max(180, eggLeftEdge - 48));
    addButton('start', '开始游戏', 24, Math.min(H - 160, 230), bw, 54, '#111', '#fff', 18);
    addButton('rules', 'How to play', 24, Math.min(H - 92, 296), bw, 46, '#FFE169', '#111', 16);
    drawEggTarot();
    drawText(VERSION, 24, H - 28, 11, 'rgba(0,0,0,.45)', 'left', '700');
  }

  function drawGame() {
    ctx.fillStyle = '#fff4d6';
    ctx.fillRect(0, 0, W, H);
    const top = 18;
    const panelH = Math.max(128, Math.min(170, (H - 250) / 2));
    drawSidePanel('opponent', 14, top, W - 28, panelH);
    const centerY = top + panelH + 12;
    fillRoundRect(14, centerY, W - 28, 86, 18, '#111', '#111', 2);
    const meal = meals[currentMealIndex];
    drawText(`${currentMealIndex + 1}/${meals.length} ${meal.name}`, 30, centerY + 10, 18, '#FFE169', 'left', '900');
    drawText(`警戒线 ${meal.threshold}`, W - 30, centerY + 10, 17, '#FF4A3D', 'right', '900');
    wrapText(message, 30, centerY + 38, W - 60, 18, 13, '#fff', '800', 1);
    if (comboMessage) wrapText(comboMessage, 30, centerY + 58, W - 60, 17, 12, '#A9F0D1', '800', 1);
    drawSidePanel('self', 14, centerY + 98, W - 28, panelH);

    const y = H - 84;
    const gap = 10;
    const leftW = (W - 38) * 0.58;
    const rightW = W - 38 - leftW;
    const smallW = (leftW - gap) / 2;
    const smallH = 27;
    const types = [['荤','draw_meat'], ['素','draw_veg'], ['主食','draw_staple'], ['甜点','draw_dessert']];
    types.forEach(([t,id], i) => addButton(id, t, 14 + (i % 2) * (smallW + gap), y + Math.floor(i / 2) * (smallH + 6), smallW, smallH, TYPE_COLORS[t], '#111', i < 2 ? 15 : 14));
    addButton('stand', isNightMeal() ? '揭晓夜宵' : '收手', 24 + leftW, y, rightW, 60, '#111', '#fff', 17);
  }

  function drawMealEnd() {
    drawGame();
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.62)';
    ctx.fillRect(0, 0, W, H);
    const mw = Math.min(330, W - 42);
    const mh = 210;
    const x = (W - mw) / 2;
    const y = (H - mh) / 2;
    fillRoundRect(x, y, mw, mh, 24, '#fff7dc', '#111', 3);
    drawText('本餐结算', x + mw / 2, y + 22, 26, '#111', 'center', '900');
    wrapText(message, x + 24, y + 68, mw - 48, 24, 17, '#111', '900', 2);
    wrapText(comboMessage, x + 24, y + 116, mw - 48, 22, 15, '#111', '800', 2);
    addButton('next_meal', currentMealIndex >= meals.length - 1 ? '查看今日结算' : '下一餐', x + 34, y + mh - 62, mw - 68, 46, '#111', '#fff', 17);
    ctx.restore();
  }

  function drawGameOver() {
    ctx.fillStyle = '#fff4d6'; ctx.fillRect(0, 0, W, H);
    const selfPoint = records.self.basePoint.reduce((a,b)=>a+b,0) + records.self.comboBonusPoint.reduce((a,b)=>a+b,0);
    const oppPoint = records.opponent.basePoint.reduce((a,b)=>a+b,0) + records.opponent.comboBonusPoint.reduce((a,b)=>a+b,0);
    drawText('今日结算', W / 2, 52, 34, '#111', 'center', '900');
    fillRoundRect(24, 116, W - 48, 180, 24, '#fff7dc', '#111', 3);
    drawText(`你：${selfPoint} 胜局`, W / 2, 150, 24, '#111', 'center', '900');
    drawText(`对手：${oppPoint} 胜局`, W / 2, 190, 21, '#111', 'center', '800');
    drawText(selfPoint >= oppPoint ? '你很会吃啊，小朋友' : '会吃有个屁用啊', W / 2, 236, 18, '#111', 'center', '900');
    addButton('restart', '重新开始', 36, H - 96, W - 72, 56, '#111', '#fff', 18);
  }

  function render(now = performance.now()) {
    const dt = Math.min(50, now - lastTime);
    lastTime = now;
    buttons = [];
    if (phase === 'home') drawHome();
    else if (phase === 'playing') drawGame();
    else if (phase === 'mealEnd') drawMealEnd();
    else if (phase === 'gameOver') drawGameOver();
    requestAnimationFrame(render);
  }

  function handleTap(x, y) {
    const b = [...buttons].reverse().find(btn => x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h);
    if (!b) return;
    if (b.id === 'start') startGame();
    else if (b.id === 'rules') alert('目标：每餐尽量接近警戒线，但不要爆。前两张是起手牌，不消耗外卖次数。夜宵会一次性选完剩余外卖再揭晓。');
    else if (b.id === 'tarot') tapTarot();
    else if (b.id === 'draw_meat') playerDraw('荤');
    else if (b.id === 'draw_veg') playerDraw('素');
    else if (b.id === 'draw_staple') playerDraw('主食');
    else if (b.id === 'draw_dessert') playerDraw('甜点');
    else if (b.id === 'stand') playerStand();
    else if (b.id === 'next_meal') goNextMeal();
    else if (b.id === 'restart') restart();
  }

  canvas.addEventListener('pointerup', (e) => {
    const rect = canvas.getBoundingClientRect();
    handleTap(e.clientX - rect.left, e.clientY - rect.top);
  });

  window.addEventListener('resize', resize);
  resize();
  deck = makeDeck();
  requestAnimationFrame(render);
})();
