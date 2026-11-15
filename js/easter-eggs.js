// Пасхалки и отсылки к интернету 2000-х. Модуль грузится лениво, когда браузер свободен.
// Всё отключается тоглом «Режим ностальгии» в футере. Звук — только по явному действию.
// Шпаргалка по всем пасхалкам — в README.
import { $, $$, store, toast, sound, reducedMotion, finePointer } from "./modules/utils.js?v=202611151120"
import { getLenis } from "./modules/smooth.js?v=202611151120"

/* ---------- Учёт находок */
const EGGS = {
  icq: "ICQ-сообщение",
  teletext: "Телетекст",
  geocities: "Режим Geocities",
  preved: "Превед",
  snake: "Змейка",
  mayahi: "Ма-я-хи",
  404: "Страница 404",
  rickroll: "Секретная скидка",
}
const TOTAL = Object.keys(EGGS).length
const readFound = () => { try { return JSON.parse(store.get("skuf-eggs") || "[]") } catch { return [] } }
let found = readFound()
const renderCount = () => { const el = $("#eggCount"); if (el) el.textContent = `Найдено пасхалок: ${found.length}/${TOTAL}` }
function discover(id) {
  if (found.includes(id)) return
  found.push(id)
  store.set("skuf-eggs", JSON.stringify(found))
  renderCount()
  toast("Пасхалка найдена!", `${EGGS[id]} · ${found.length}/${TOTAL}`)
}

/* ---------- Режим ностальгии */
let nostalgia = store.get("skuf-nostalgia") !== "0"
const on = () => nostalgia

/* ---------- Стили пасхалок — тоже лениво */
let cssLoaded = false
function loadCss() {
  if (cssLoaded) return
  cssLoaded = true
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = "css/easter-eggs.css"
  document.head.append(link)
}

/* ---------- Пиксельные спрайты (свои) */
const PAL = {
  k: "#1a120c", s: "#f1c6a2", h: "#f1c6a2", d: "#d6a07c", w: "#faf8f0", b: "#5a3a22", m: "#7a2a22",
  y: "#f2a93b", Y: "#c97f14", a: "#f2a93b", f: "#f5efe3", t: "#282628",
}
const SPRITES = {
  peek: [
    "....................", "hh....kkkkkkkk....hh", "hhh..kbbbbbbbbk..hhh", ".hhhkbbbbbbbbbbkhhh.",
    "..hhkssssssssssk hh.", "...kswwsssssswwsk...", "...kswkssssssswksk..", "...ksssssddsssssk...",
    "...ksbbbbbbbbbbsk...", "...ksssbmmmmbsssk...", "....kssmmmmmmssk....", ".....ksssmmsssk.....",
    "......kssssssk......", ".......kkkkkk.......", "......kttttttk......", ".....kttttttttk.....",
  ],
  builder: [
    "....kkkkkkkk....", "...kyyyyyyyyk...", "..kyyyYyyyyyyk..", ".kkkkkkkkkkkkkk.", "..kssssssssssk..",
    "..kswksssswksk..", "..kssssddssssk..", "..ksbbbbbbbbsk..", "...ksssmmsssk...", "....kssssssk....",
    "..kkkttttttkk...", ".kttttttttttkff.", ".kttttttttttkaak", ".ktttttttttskaak", ".kttttttttttkkk.", "................",
  ],
  mug: [
    "..fff.fff..", ".fffffffff.", "kfffffffffk", "kaaaaaaaakkk", "kaaaaaaaak.k", "kaYaaaaaak.k",
    "kaaaYaaaakkk", "kaaaaaaaak..", "kaaYaaaaak..", "kkkkkkkkkk..", ".k......k...", ".kk....kk...",
  ],
}
function sprite(name) {
  const rows = SPRITES[name]
  const c = document.createElement("canvas")
  c.width = Math.max(...rows.map((r) => r.length))
  c.height = rows.length
  c.setAttribute("aria-hidden", "true")
  const ctx = c.getContext("2d")
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (PAL[ch]) { ctx.fillStyle = PAL[ch]; ctx.fillRect(x, y, 1, 1) } }))
  return c
}

/* =========================================================
   Явный слой
   ========================================================= */

/* 2. Гостевая книга: свои записи — только в этом браузере */
function initGuestbook() {
  const form = $("#gbForm"), list = $("#gbList"), err = $("#gbError"), msg = $("#gb-msg")
  if (!form) return
  const addItem = (e, fresh = false) => {
    const li = document.createElement("li")
    li.className = "gb__item" + (fresh ? " is-new" : "")
    li.innerHTML = '<img class="gb__ava" width="48" height="48" alt="" /><div class="gb__body"><p class="gb__head"><b></b> <span class="mono"></span></p><p class="gb__msg"></p><p class="gb__via mono"></p></div>'
    li.querySelector(".gb__ava").src = `assets/gb/${(e.nick.length % 8) + 1}.png` // пиксельные аватарки 16×16
    li.querySelector("b").textContent = e.nick
    li.querySelector(".mono").textContent = e.date
    li.querySelector(".gb__msg").textContent = e.msg
    li.querySelector(".gb__via").textContent = `отправлено с ${e.phone} · учебный проект`
    list.prepend(li)
  }
  let saved = []
  try { saved = JSON.parse(store.get("skuf-guestbook") || "[]") } catch { saved = [] }
  saved.forEach((e) => addItem(e))

  $$("[data-smile]", form).forEach((b) => b.addEventListener("click", () => {
    const pos = msg.selectionStart ?? msg.value.length
    msg.value = `${msg.value.slice(0, pos)} ${b.dataset.smile} ${msg.value.slice(pos)}`.replace(/\s{2,}/g, " ")
    msg.focus()
  }))
  form.addEventListener("submit", (e) => {
    e.preventDefault()
    const text = msg.value.trim()
    if (!text) { err.textContent = "Пустую запись не примем, даже в 2007-м."; msg.focus(); return }
    err.textContent = ""
    const d = new Date()
    const entry = {
      nick: $("#gb-nick").value.trim() || "Аноним",
      msg: text.slice(0, 280),
      phone: $("#gb-phone").value,
      date: `${d.toLocaleDateString("ru-RU").replace(/\d{4}$/, "2007")} ${d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`,
    }
    saved.push(entry)
    store.set("skuf-guestbook", JSON.stringify(saved.slice(-20)))
    addItem(entry, true)
    form.reset()
    toast("Запись добавлена", "Сохранена только в твоём браузере.")
  })
}

/* 4. Рингтон «Батя зовёт»: свои ноты, square-волна как у полифонии */
function initRingtone() {
  const btn = $("#ringtone")
  if (!btn) return
  const notes = [[659, 0.14], [784, 0.14], [880, 0.28], [784, 0.14], [659, 0.14], [587, 0.28], [523, 0.14], [587, 0.14],
    [659, 0.28], [0, 0.14], [659, 0.14], [880, 0.14], [1047, 0.42], [988, 0.14], [880, 0.14], [784, 0.42]]
  let ctx
  btn.addEventListener("click", () => {
    if (btn.getAttribute("aria-pressed") === "true") return
    try {
      ctx ||= new (window.AudioContext || window.webkitAudioContext)()
      let t = ctx.currentTime + 0.05
      for (const [f, d] of notes) {
        if (f) {
          const o = ctx.createOscillator(), g = ctx.createGain()
          o.type = "square"; o.frequency.value = f
          g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d * 0.95)
          o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + d)
        }
        t += d
      }
      btn.setAttribute("aria-pressed", "true")
      btn.textContent = "Играет…"
      setTimeout(() => { btn.setAttribute("aria-pressed", "false"); btn.textContent = "Послушать" }, (t - ctx.currentTime) * 1000)
    } catch {
      toast("Рингтон не загрузился", "Браузер не дал включить звук. Попробуй ещё раз.")
    }
  })
}

/* =========================================================
   Полускрытый слой
   ========================================================= */

/* 5. ICQ: «У вас 1 новое сообщение» по клику на «в сети» */
function initIcq() {
  $("#presence")?.addEventListener("click", () => {
    if (!on()) return
    sound.uhOh()
    toast("У вас 1 новое сообщение от: Батя", "Заходи, полубокс сам себя не сделает.")
    discover("icq")
  })
}

/* 6. «Вас оценили на 5+» — один раз за сессию, через минуту на странице */
function initRated() {
  if (store.get("skuf-rated", sessionStorage)) return
  setTimeout(() => {
    if (!on() || document.hidden) return
    store.set("skuf-rated", "1", sessionStorage)
    toast("Вас оценили на 5+", "Батя посмотрел ваш профиль. Это взаимно.")
  }, 60000)
}

/* 7. Телетекст по клику на «Часы работы» */
function initTeletext() {
  const btn = $("#teletextBtn"), card = $("#hoursCard"), clock = $("#ttClock")
  if (!btn) return
  let timer = 0
  btn.addEventListener("click", () => {
    if (!on()) return
    const active = card.classList.toggle("is-teletext")
    btn.setAttribute("aria-pressed", String(active))
    clearInterval(timer)
    if (active) {
      const tick = () => { clock.textContent = new Date().toLocaleTimeString("ru-RU") }
      tick(); timer = setInterval(tick, 1000)
      discover("teletext")
    }
  })
  btn.setAttribute("aria-pressed", "false")
}

/* 8. Rickroll: секретная скидка 90% */
function initRickroll() {
  $("#secret")?.addEventListener("click", () => discover("rickroll"))
}

/* =========================================================
   Пасхалки
   ========================================================= */

/* 9. Konami-код (↑↑↓↓←→←→BA) или 5 тапов по номеру карты → Geocities на 15 секунд */
function geocities() {
  if (document.documentElement.classList.contains("geocities")) return
  loadCss()
  discover("geocities")
  const root = document.documentElement
  root.classList.add("geocities")
  const banner = document.createElement("div")
  banner.className = "geo-banner"
  banner.setAttribute("role", "status")
  const art = sprite("builder")
  const text = document.createElement("p")
  text.textContent = "Добро пожаловать на мою страничку! Сайт находится в разработке. Заходите ещё!!!"
  const stripe = document.createElement("div"); stripe.className = "geo-banner__stripe"; stripe.setAttribute("aria-hidden", "true")
  const back = document.createElement("button"); back.type = "button"; back.textContent = "Вернуть 2026"
  banner.append(art, text, stripe, back)
  document.body.append(banner)
  back.focus({ preventScroll: true })

  // хвост из звёздочек за курсором
  const trail = (e) => {
    const star = document.createElement("span")
    star.className = "geo-star"; star.textContent = "★"
    star.style.left = `${e.clientX}px`; star.style.top = `${e.clientY}px`
    document.body.append(star)
    star.animate([{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(24px) scale(.4)" }], { duration: 700 }).onfinish = () => star.remove()
  }
  if (!reducedMotion && finePointer) addEventListener("pointermove", trail)

  let timer = 0
  const stop = () => {
    clearTimeout(timer)
    root.classList.remove("geocities")
    removeEventListener("pointermove", trail)
    banner.remove()
  }
  back.addEventListener("click", stop)
  timer = setTimeout(stop, 15000)
}
function initKonami() {
  const code = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"]
  let pos = 0
  addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
    const want = code[pos]
    const ok = key === want || (want === "b" && key === "и") || (want === "a" && key === "ф")
    pos = ok ? pos + 1 : key === code[0] ? 1 : 0
    if (pos === code.length) { pos = 0; if (on()) geocities() }
  })
  // на телефоне — 5 быстрых тапов по номеру карты
  const num = $("#cardNum")
  let taps = 0, last = 0
  num?.addEventListener("pointerup", () => {
    const now = performance.now()
    taps = now - last < 600 ? taps + 1 : 1
    last = now
    if (taps >= 5) { taps = 0; if (on()) geocities() }
  })
}

/* 10. Набери «превед» — батя выглядывает из угла */
function preved() {
  loadCss()
  discover("preved")
  const box = document.createElement("div")
  box.className = "peek"
  box.setAttribute("role", "status")
  const bubble = document.createElement("span"); bubble.className = "peek__bubble"; bubble.textContent = "ПРЕВЕД!"
  box.append(bubble, sprite("peek"))
  document.body.append(box)
  sound.uhOh()
  requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add("is-in")))
  setTimeout(() => { box.classList.remove("is-in"); setTimeout(() => box.remove(), 800) }, 3200)
}
function initPreved() {
  let buf = ""
  addEventListener("keydown", (e) => {
    if (e.target.closest?.("input, textarea, select")) return
    if (e.key.length !== 1) return
    buf = (buf + e.key.toLowerCase()).slice(-6)
    // «превед» в русской раскладке или те же клавиши в английской
    if ((buf === "превед" || buf === "ghtdtl") && on()) { buf = ""; preved() }
  })
}

/* 11. 10 кликов по логотипу — «Змейка» с экраном в духе Nokia */
function snake() {
  loadCss()
  discover("snake")
  const W = 24, H = 16, CELL = 12
  const opener = document.activeElement
  const wrap = document.createElement("div")
  wrap.className = "snake"
  wrap.setAttribute("role", "dialog")
  wrap.setAttribute("aria-modal", "true")
  wrap.setAttribute("aria-label", "Змейка")
  wrap.innerHTML = `
    <div class="snake__phone">
      <p class="snake__brand">СКУФИЯ</p>
      <div class="snake__screen">
        <div class="snake__hud"><span>Кружек: <b class="snake__score">0</b></span><span class="snake__best"></span></div>
        <canvas width="${W * CELL}" height="${H * CELL}"></canvas>
      </div>
      <div class="snake__pad">
        <button type="button" data-dir="up" aria-label="Вверх">▲</button>
        <button type="button" data-dir="left" aria-label="Влево">◀</button>
        <button type="button" data-act="restart">ОК</button>
        <button type="button" data-dir="right" aria-label="Вправо">▶</button>
        <button type="button" data-dir="down" aria-label="Вниз">▼</button>
      </div>
      <p class="snake__hint">Стрелки или WASD, на телефоне — кнопки или свайп. Змейка ест кружки.</p>
      <button type="button" class="snake__close">Закрыть</button>
    </div>`
  document.body.append(wrap)
  getLenis()?.stop()
  const cv = $("canvas", wrap), ctx = cv.getContext("2d")
  const scoreEl = $(".snake__score", wrap), bestEl = $(".snake__best", wrap)
  const INK = "#23301a", BG = "#8fa07a"
  let body, dir, next, food, score, dead, timer
  const best = () => Number(store.get("skuf-snake-best") || 0)
  const place = () => {
    do { food = { x: Math.floor(Math.random() * W), y: Math.floor(Math.random() * H) } } while (body.some((p) => p.x === food.x && p.y === food.y))
  }
  const reset = () => {
    body = [{ x: 6, y: 8 }, { x: 5, y: 8 }, { x: 4, y: 8 }]
    dir = next = { x: 1, y: 0 }
    score = 0; dead = false
    place(); draw()
    clearInterval(timer); timer = setInterval(step, 130)
  }
  const drawMug = (x, y) => {
    const px = x * CELL, py = y * CELL
    ctx.fillStyle = INK
    ctx.fillRect(px + 2, py + 3, 6, 7); ctx.fillRect(px + 8, py + 4, 2, 1); ctx.fillRect(px + 9, py + 4, 1, 4); ctx.fillRect(px + 8, py + 7, 2, 1)
    ctx.fillStyle = BG; ctx.fillRect(px + 3, py + 5, 4, 4)
    ctx.fillStyle = INK; ctx.fillRect(px + 2, py + 1, 6, 2)
  }
  function draw() {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, cv.width, cv.height)
    ctx.fillStyle = INK
    body.forEach((p, i) => ctx.fillRect(p.x * CELL + 1, p.y * CELL + 1, CELL - 2, CELL - 2 - (i === 0 ? 0 : 0)))
    drawMug(food.x, food.y)
    scoreEl.textContent = score
    bestEl.textContent = `Рекорд: ${Math.max(best(), score)}`
    if (dead) {
      ctx.fillStyle = BG; ctx.fillRect(40, 64, cv.width - 80, 64)
      ctx.strokeStyle = INK; ctx.strokeRect(40.5, 64.5, cv.width - 81, 63)
      ctx.fillStyle = INK; ctx.font = "bold 14px monospace"; ctx.textAlign = "center"
      ctx.fillText("ИГРА ОКОНЧЕНА", cv.width / 2, 92); ctx.font = "12px monospace"; ctx.fillText("ОК — ещё раз", cv.width / 2, 112)
    }
  }
  function step() {
    dir = next
    const head = { x: (body[0].x + dir.x + W) % W, y: (body[0].y + dir.y + H) % H }
    if (body.some((p) => p.x === head.x && p.y === head.y)) {
      dead = true; clearInterval(timer)
      if (score > best()) store.set("skuf-snake-best", String(score))
      sound.uhOh(); draw(); return
    }
    body.unshift(head)
    if (head.x === food.x && head.y === food.y) { score++; place() } else body.pop()
    draw()
  }
  const turn = (name) => {
    const d = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }[name]
    if (d && !(d.x === -dir.x && d.y === -dir.y)) next = d
  }
  const keys = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right", ц: "up", ы: "down", ф: "left", в: "right" }
  const close = () => {
    clearInterval(timer)
    removeEventListener("keydown", onKey, true)
    wrap.remove()
    getLenis()?.start()
    opener?.focus?.({ preventScroll: true })
  }
  function onKey(e) {
    if (e.key === "Escape") { e.preventDefault(); return close() }
    if (e.key === "Tab") { // фокус не уходит из окна
      const f = $$("button", wrap)
      const i = f.indexOf(document.activeElement)
      e.preventDefault()
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus()
      return
    }
    const k = keys[e.key.length === 1 ? e.key.toLowerCase() : e.key]
    if (k) { e.preventDefault(); e.stopPropagation(); turn(k) }
    if ((e.key === "Enter" || e.key === " ") && dead) { e.preventDefault(); reset() }
  }
  addEventListener("keydown", onKey, true)
  $$("[data-dir]", wrap).forEach((b) => b.addEventListener("click", () => turn(b.dataset.dir)))
  $("[data-act=restart]", wrap).addEventListener("click", () => { if (dead) reset() })
  $(".snake__close", wrap).addEventListener("click", close)
  wrap.addEventListener("click", (e) => { if (e.target === wrap) close() })
  let sx = 0, sy = 0
  cv.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY }, { passive: true })
  cv.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"))
  })
  $(".snake__close", wrap).focus()
  reset()
}
function initSnake() {
  const logo = $(".header .logo")
  let clicks = 0, last = 0
  logo?.addEventListener("click", () => {
    const now = performance.now()
    clicks = now - last < 800 ? clicks + 1 : 1
    last = now
    if (clicks >= 10 && on()) { clicks = 0; snake() }
  })
}

/* 12. Удержание окна ICQ 3 секунды — «Ма-я-хи режим», пляшут пиксельные кружки */
function mayahi() {
  if ($(".dance")) return
  loadCss()
  discover("mayahi")
  const row = document.createElement("div")
  row.className = "dance"
  row.setAttribute("aria-hidden", "true")
  const count = Math.max(5, Math.min(12, Math.floor(innerWidth / 90)))
  for (let i = 0; i < count; i++) row.append(sprite("mug"))
  const cap = document.createElement("p")
  cap.className = "dance__caption"
  cap.setAttribute("role", "status")
  cap.textContent = "Ма-я-хи режим включён"
  document.body.append(row, cap)
  setTimeout(() => { row.remove(); cap.remove() }, reducedMotion ? 3000 : 6500)
}
function initMayahi() {
  const icq = $(".icq")
  if (!icq) return
  let timer = 0
  const start = (e) => {
    if (e.button > 0) return
    clearTimeout(timer)
    timer = setTimeout(() => { if (on()) mayahi() }, 3000)
  }
  const cancel = () => clearTimeout(timer)
  icq.addEventListener("pointerdown", start)
  ;["pointerup", "pointerleave", "pointercancel"].forEach((t) => icq.addEventListener(t, cancel))
  icq.addEventListener("contextmenu", (e) => { if (timer) e.preventDefault() })
}

/* 13. Заголовок вкладки: «Батя, ты где?» */
function initTabTitle() {
  const original = document.title
  let away = false
  document.addEventListener("visibilitychange", () => {
    if (!on()) { document.title = original; return }
    if (document.hidden) { away = true; document.title = "Батя, ты где? (1)" }
    else if (away) {
      document.title = "Батя вернулся!"
      setTimeout(() => { document.title = original }, 2500)
    }
  })
}

/* 14. Для тех, кто открыл DevTools */
function consoleArt() {
  const art = [
    "     .-~~~~~-.",
    "    (  ~  ~  ) )",
    "    |~~~~~~~~|_",
    "    |  СКУФ  | \\",
    "    |   И    | |",
    "    | СЫНОВЬЯ|_/",
    "    '--------'",
  ].join("\n")
  console.log(`%c${art}`, "color:#f2a93b;font-family:monospace;font-size:12px")
  console.log("%cИщем бать в команду!%c\nЕсли ты дочитал до консоли — ты уже наш. Пиши на info@skuf-i-synovya.ru (учебный проект, письмо не дойдёт, но мы ценим порыв).",
    "color:#4cd964;font-weight:bold;font-size:14px", "color:inherit")
}

/* ---------- Тогл «Режим ностальгии» */
function initNostalgiaToggle() {
  const toggle = $("#nostalgiaToggle")
  if (!toggle) return
  customElements.whenDefined("ui-toggle").then(() => { toggle.pressed = nostalgia })
  toggle.addEventListener("pressedchange", (e) => {
    nostalgia = e.detail.value
    store.set("skuf-nostalgia", nostalgia ? "1" : "0")
    document.documentElement.classList.toggle("no-nostalgia", !nostalgia)
    if (!nostalgia) document.documentElement.classList.remove("geocities")
    window.ScrollTrigger?.refresh()
    toast(nostalgia ? "Режим ностальгии включён" : "Режим ностальгии выключен", nostalgia ? "Добро пожаловать обратно в 2007-й." : "Сайт стал серьёзным. Почти.")
  })
}

/* ---------- Старт */
const parts = [initGuestbook, initRingtone, initIcq, initRated, initTeletext, initRickroll,
  initKonami, initPreved, initSnake, initMayahi, initTabTitle, consoleArt, initNostalgiaToggle, renderCount]
for (const fn of parts) {
  try { fn() } catch (err) { console.error("[easter-eggs]", err) }
}
