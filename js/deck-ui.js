// Анимированные элементы презентации, перенесены без зависимостей:
//  • Tab pill и Step progress — по designbookmark.com/motion (пружины те же: жёсткость и затухание из tokens.css / исходников);
//  • Marker text и плеер «Сейчас играет» на стеклянной карточке — по Kokonut UI (MIT), тайминги и движение те же.
// Один цикл requestAnimationFrame на всё; он засыпает, когда пружины успокоились, — на слабых ПК ничего не крутится зря.

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches

/* ============================================================ пружины (motion.js) */
const S = (x, k = 400, c = 30) => ({ x, v: 0, t: x, k, c })
const tune = (s, k, c) => { s.k = k; s.c = reduce ? 2 * Math.sqrt(k) : c }
const step = (s, dt) => { const a = -s.k * (s.x - s.t) - s.c * s.v; s.v += a * dt; s.x += s.v * dt }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const resting = (s) => Math.abs(s.x - s.t) < 1e-3 && Math.abs(s.v) < 1e-3

const comps = new Set()
const timers = []
let raf = 0, last = 0
const after = (sec, fn) => { timers.push({ t: sec, fn }); wake() }
function loop(now) {
  const dt = Math.min((now - (last || now)) / 1000, 1 / 30); last = now
  for (let i = timers.length - 1; i >= 0; i--) if ((timers[i].t -= dt) <= 0) timers.splice(i, 1)[0].fn()
  let busy = timers.length > 0
  for (let k = 0; k < 4; k++) comps.forEach((c) => c.frame(dt / 4))
  comps.forEach((c) => { c.render(); if (!c.idle()) busy = true })
  raf = busy ? requestAnimationFrame(loop) : 0
  if (!busy) last = 0
}
function wake() { if (!raf) raf = requestAnimationFrame(loop) }

/* ============================================================ Tab pill */
// Две пружины на пилюлю, по одной на край. Край по направлению движения жёсткий, другой мягкий —
// пилюля тянется к новой вкладке и подтягивает хвост.
export function initTabs(root) {
  const tabs = [...root.querySelectorAll('[role="tab"]')]
  const pill = root.querySelector(".tp__pill")
  const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")))
  const A = S(0), B = S(0)
  let cur = -1
  function pick(i, snap) {
    const dir = i > cur ? 1 : -1
    cur = i
    tabs.forEach((t, k) => {
      t.setAttribute("aria-selected", String(k === i)); t.tabIndex = k === i ? 0 : -1
      if (panels[k]) panels[k].hidden = k !== i
    })
    const el = tabs[i]
    A.t = el.offsetLeft; B.t = el.offsetLeft + el.offsetWidth
    if (dir > 0) { tune(B, 620, 40); tune(A, 170, 19) } else { tune(A, 620, 40); tune(B, 170, 19) }
    if (snap) { A.x = A.t; B.x = B.t }
    panels[i]?.querySelectorAll("[data-mark-root]").forEach((m) => m._marker?.draw())
    wake()
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => pick(i))
    t.addEventListener("keydown", (e) => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
      if (!d) return
      e.preventDefault(); e.stopPropagation()
      const n = (cur + d + tabs.length) % tabs.length
      pick(n); tabs[n].focus()
    })
  })
  comps.add({
    frame(dt) { step(A, dt); step(B, dt) },
    render() { pill.style.transform = `translateX(${A.x.toFixed(2)}px)`; pill.style.width = Math.max(0, B.x - A.x).toFixed(2) + "px" },
    idle: () => resting(A) && resting(B),
  })
  // при первом показе слайда меряем заново (пока слайд скрыт, offsetLeft может быть 0)
  return { show() { pick(Math.max(0, cur), true) } }
}

/* ============================================================ Step progress */
// Длина зелёной линии — пружина к текущему шагу. У каждого шага: заливка (готово), галочка, которая рисует себя,
// и «поп», когда шаг становится текущим. Кнопки «Назад/Дальше» и сам проход по шагам.
export function initSteps(root) {
  const bar = root.querySelector(".sp__bar"), dotsEl = root.querySelector(".sp__dots"), namesEl = root.querySelector(".sp__names")
  const next = root.querySelector("[data-next]"), back = root.querySelector("[data-back]")
  const details = [...root.querySelectorAll(".sp__panel")]
  const NAMES = details.map((d) => d.dataset.name)
  const N = NAMES.length
  const steps = NAMES.map((name, i) => {
    const d = document.createElement("span"); d.className = "sp__dot"; d.style.left = (i / (N - 1)) * 100 + "%"
    const num = document.createElement("b"); num.textContent = i + 1; d.append(num)
    d.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>')
    const path = d.querySelector("path"); path.style.strokeDasharray = 22
    dotsEl.append(d)
    const nm = document.createElement("span"); nm.textContent = name; nm.style.left = (i / (N - 1)) * 100 + "%"; namesEl.append(nm)
    return { d, num, path, nm, f: S(0, 260, 24), c: S(0, 140, 20), p: S(1, 500, 14), on: S(0, 300, 26) }
  })
  const L = S(0, 160, 22)
  let cur = -1, auto = 0, user = false
  function go(i) {
    i = clamp(i, 0, N - 1); if (i === cur) return; cur = i
    L.t = i / (N - 1)
    steps.forEach((s, k) => {
      const done = k < i || (i === N - 1 && k === N - 1)
      s.f.t = done ? 1 : 0
      s.on.t = k === i && !done ? 1 : 0
      s.nm.classList.toggle("on", k <= i)
      if (done) after(0.12, () => { s.c.t = 1 }); else s.c.t = 0
    })
    steps[i].p.x = 0.7; steps[i].p.v = 6
    details.forEach((d, k) => { d.hidden = k !== i })
    next.textContent = i === N - 1 ? "Сначала" : "Дальше"
    back.disabled = i === 0
    wake()
  }
  const walk = () => { clearTimeout(auto); if (user) return; auto = setTimeout(() => { go(cur === N - 1 ? 0 : cur + 1); walk() }, cur === N - 1 ? 5200 : 3600) }
  next.addEventListener("click", () => { user = true; go(cur === N - 1 ? 0 : cur + 1) })
  back.addEventListener("click", () => { user = true; go(cur - 1) })
  comps.add({
    frame(dt) { step(L, dt); steps.forEach((s) => { step(s.f, dt); step(s.c, dt); step(s.p, dt); step(s.on, dt) }) },
    render() {
      bar.style.width = (clamp(L.x, 0, 1) * 100).toFixed(3) + "%"
      steps.forEach((s) => {
        const f = clamp(s.f.x, 0, 1), o = clamp(s.on.x, 0, 1)
        s.d.style.background = f > 0.01 ? `color-mix(in srgb, var(--c-green) ${(f * 100).toFixed(1)}%, var(--c-bg-3))`
          : o > 0.01 ? `color-mix(in srgb, var(--c-amber) ${(o * 100).toFixed(1)}%, var(--c-bg-3))` : ""
        s.d.style.color = o > 0.5 ? "var(--c-on-amber)" : ""
        s.num.style.opacity = (1 - f).toFixed(3)
        s.path.style.strokeDashoffset = (22 * (1 - clamp(s.c.x, 0, 1))).toFixed(2)
        s.d.style.transform = `scale(${s.p.x.toFixed(4)})`
      })
    },
    idle: () => resting(L) && steps.every((s) => resting(s.f) && resting(s.c) && resting(s.p) && resting(s.on)),
  })
  go(0)
  return {
    show() { user = false; cur = -1; go(0); walk() },
    hide() { clearTimeout(auto) },
  }
}

/* ============================================================ Marker text (Kokonut UI) */
const MARK_COLOR = { highlight: "#f2a93b", underline: "#4cd964", circle: "#f2a93b", box: "#4cd964", strike: "#ff7a5c" }
const PEN_SPEED = 0.9, HIGHLIGHT_SPEED = 1.15, MIN_MS = 260, MAX_MS = 820, LINE_GAP = 60, GAP = 140
const PEN_EASE = "cubic-bezier(0.45, 0.05, 0.25, 1)"
const MASK_SPAN = 20000
function random(seed) { let n = seed; return () => { n += 1; const x = Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453; return x - Math.floor(x) } }
function hash(text) { let h = 7; for (const ch of text) h = (h * 31 + (ch.codePointAt(0) ?? 0)) % 1000003; return h }
const r1 = (n) => Math.round(n * 10) / 10
const polyline = (pts) => pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${r1(x)} ${r1(y)}`).join("")
function lengthOf(pts) { let t = 0; for (let i = 1; i < pts.length; i++) t += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return t }
function outline(points, widths) {
  const left = [], right = [], last = points.length - 1
  for (let i = 0; i <= last; i++) {
    const prev = points[Math.max(0, i - 1)], next = points[Math.min(last, i + 1)]
    const dx = next[0] - prev[0], dy = next[1] - prev[1], len = Math.hypot(dx, dy) || 1, half = widths[i] / 2
    const nx = (-dy / len) * half, ny = (dx / len) * half
    left.push([points[i][0] + nx, points[i][1] + ny]); right.push([points[i][0] - nx, points[i][1] - ny])
  }
  const endCap = r1(widths[last] / 2), startCap = r1(widths[0] / 2), back = right.reverse()
  return `${polyline(left)}A${endCap} ${endCap} 0 0 0 ${r1(back[0][0])} ${r1(back[0][1])}${polyline(back).replace("M", "L")}A${startCap} ${startCap} 0 0 0 ${r1(left[0][0])} ${r1(left[0][1])}Z`
}
function pressure(t, base) { const land = Math.min(1, t / 0.1), lift = Math.min(1, (1 - t) / 0.18); return base * (0.45 + 0.55 * Math.sin((land * Math.PI) / 2)) * (0.55 + 0.45 * lift) }
function wobble(rand, amp) { const p1 = rand() * Math.PI * 2, p2 = rand() * Math.PI * 2, f1 = 1 + rand() * 1.5, f2 = 3 + rand() * 3; return (t) => amp * (0.7 * Math.sin(t * f1 * Math.PI + p1) + 0.3 * Math.sin(t * f2 * Math.PI + p2)) }
function sample(count, at) { const p = []; for (let i = 0; i <= count; i++) p.push(at(i / count)); return p }
function penStroke(points, width, key, color) {
  const widths = points.map((_, i) => pressure(i / (points.length - 1), width))
  return { key, shape: outline(points, widths), pen: polyline(points), penWidth: width * 4, length: lengthOf(points), color, under: false, alpha: 1 }
}
function circleStroke(box, rand, width, key, color) {
  const cx = (box.left + box.right) / 2, cy = (box.top + box.bottom) / 2, rx = (box.right - box.left) / 2 + 8, ry = (box.bottom - box.top) / 2 + 4
  const tilt = ((rand() - 0.5) * 6 * Math.PI) / 180, start = -Math.PI * (0.62 + rand() * 0.12), sweep = Math.PI * 2 + 0.45 + rand() * 0.2
  const drift = 0.05 + rand() * 0.04, wave = wobble(rand, 0.025), steps = Math.max(48, Math.round((rx + ry) / 3))
  const points = sample(steps, (t) => {
    const a = start + sweep * t, grow = 1 - drift / 2 + drift * t + wave(t), x = Math.cos(a) * rx * grow, y = Math.sin(a) * ry * grow
    return [cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)]
  })
  return penStroke(points, width, key, color)
}
function boxStroke(box, rand, width, key, color) {
  const padX = 5, padY = 3
  const c = [[box.left - padX - rand() * 2, box.top - padY + (rand() - 0.5) * 2], [box.right + padX + rand() * 2, box.top - padY + (rand() - 0.5) * 2],
    [box.right + padX + (rand() - 0.5) * 2, box.bottom + padY + rand() * 2], [box.left - padX + (rand() - 0.5) * 2, box.bottom + padY + rand() * 2]]
  const points = []
  for (let side = 0; side < 4; side++) {
    const a = c[side], b = c[(side + 1) % 4], bow = (rand() - 0.5) * 3, len = Math.hypot(b[0] - a[0], b[1] - a[1])
    const nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len, steps = Math.max(6, Math.round(len / 8))
    for (let s = side === 0 ? 0 : 1; s <= steps; s++) { const t = s / steps, lift = Math.sin(t * Math.PI) * bow; points.push([a[0] + (b[0] - a[0]) * t + nx * lift, a[1] + (b[1] - a[1]) * t + ny * lift]) }
  }
  const over = 14 / Math.hypot(c[1][0] - c[0][0], c[1][1] - c[0][1])
  points.push([c[0][0] + (c[1][0] - c[0][0]) * over, c[0][1] + (c[1][1] - c[0][1]) * over + 1.5])
  return penStroke(points, width, key, color)
}
function strokesFor(type, color, lines, seed, index) {
  const rand = random(seed), lh = lines[0].bottom - lines[0].top
  const width = Math.min(4.5, Math.max(1.6, lh * 0.085))
  if (type === "highlight") {
    return lines.map((line, i) => {
      const h = line.bottom - line.top, top = wobble(rand, 0.9), bottom = wobble(rand, 0.9)
      const chisel = h * 0.2, tilt = (rand() - 0.5) * Math.min(3, h * 0.08)
      const x0 = line.left - 3 - rand() * 2, x1 = line.right + 3 + rand() * 3, y0 = line.top + h * 0.08, y1 = line.bottom - h * 0.02
      const steps = Math.max(6, Math.round((x1 - x0) / 14))
      const edge = (y, wave, dx) => sample(steps, (t) => [x0 + dx + (x1 - x0) * t, y + wave(t) + tilt * (t - 0.5)])
      const upper = edge(y0, top, chisel * 0.5), lower = edge(y1, bottom, -chisel * 0.5).reverse(), mid = (y0 + y1) / 2
      const pen = [[x0 - chisel, mid], [x1 + chisel, mid + tilt * 0.5]]
      return { key: `${index}-${i}`, shape: `${polyline(upper)}${polyline(lower).replace("M", "L")}Z`, pen: polyline(pen), penWidth: h * 1.8, length: lengthOf(pen), color, under: true, alpha: 0.42 }
    })
  }
  if (type === "underline" || type === "strike") {
    return lines.map((line, i) => {
      const h = line.bottom - line.top, bow = (rand() - 0.5) * 3, slope = (rand() - 0.5) * (type === "strike" ? 4 : 2.4), wave = wobble(rand, 0.5)
      const x0 = line.left - 2 - rand() * 3, x1 = line.right + 2 + rand() * 4
      const y = type === "strike" ? line.top + h * 0.56 : line.bottom + Math.max(1, h * 0.04)
      const steps = Math.max(8, Math.round((x1 - x0) / 6))
      return penStroke(sample(steps, (t) => [x0 + (x1 - x0) * t, y + Math.sin(t * Math.PI) * bow + slope * (t - 0.5) + wave(t)]), width, `${index}-${i}`, color)
    })
  }
  return lines.map((line, i) => (type === "circle" ? circleStroke : boxStroke)(line, rand, width, `${index}-${i}`, color))
}
let maskSeq = 0
export function initMarker(root) {
  const ns = "http://www.w3.org/2000/svg"
  const mk = () => { const s = document.createElementNS(ns, "svg"); s.setAttribute("aria-hidden", "true"); s.setAttribute("width", "1"); s.setAttribute("height", "1"); s.classList.add("mk__layer"); return s }
  const under = mk(), over = mk(); under.classList.add("mk__layer--under"); over.classList.add("mk__layer--over")
  root.classList.add("mk"); root.prepend(under); root.append(over)
  const id = "mk" + ++maskSeq
  let strokes = []
  function measure() {
    const origin = root.getBoundingClientRect()
    const scale = origin.width / (root.offsetWidth || 1) || 1   // сцена презентации масштабируется — переводим в её пиксели
    const marks = [...root.querySelectorAll("[data-mark]")]
    let clock = 0
    strokes = []
    marks.forEach((el, index) => {
      const type = el.dataset.mark
      const lines = [...el.getClientRects()].filter((r) => r.width > 1).map((r) => ({
        left: (r.left - origin.left) / scale, top: (r.top - origin.top) / scale, right: (r.right - origin.left) / scale, bottom: (r.bottom - origin.top) / scale,
      }))
      if (!lines.length) return
      const made = strokesFor(type, el.dataset.color || MARK_COLOR[type], lines, hash(`${el.textContent}${index}`), index)
      const speed = type === "highlight" ? HIGHLIGHT_SPEED : PEN_SPEED
      made.forEach((s, i) => {
        const duration = Math.min(MAX_MS, Math.max(MIN_MS, s.length / speed))
        strokes.push({ ...s, delay: clock, duration })
        clock += duration + (i < made.length - 1 ? LINE_GAP : 0)
      })
      clock += GAP
    })
  }
  // mode: "hidden" — штрихов не видно; "armed" — с переходом, проявятся при смене offset; "static" — сразу видны
  function paint(mode) {
    for (const [svg, isUnder] of [[under, true], [over, false]]) {
      svg.innerHTML = strokes.filter((s) => s.under === isUnder).map((s) => {
        const m = `${id}-${s.key}`
        const tr = mode === "armed" ? `stroke-dashoffset ${s.duration}ms ${PEN_EASE} ${s.delay}ms` : "none"
        return `<g><mask id="${m}" maskUnits="userSpaceOnUse" x="${-MASK_SPAN / 2}" y="${-MASK_SPAN / 2}" width="${MASK_SPAN}" height="${MASK_SPAN}">` +
          `<path d="${s.pen}" fill="none" stroke="white" stroke-dasharray="${s.length + 1}" stroke-dashoffset="${mode === "static" ? 0 : s.length + 1}" ` +
          `stroke-linecap="${isUnder ? "butt" : "round"}" stroke-linejoin="round" stroke-width="${s.penWidth}" style="transition:${tr}"/></mask>` +
          `<path d="${s.shape}" fill="${s.color}" fill-opacity="${s.alpha}" mask="url(#${m})"/></g>`
      }).join("")
    }
  }
  const api = {
    // спрятать сразу, нарисовать на следующем кадре после отрисовки спрятанного — так переход идёт всегда, даже повторно
    draw() {
      measure()
      if (reduce) { paint("static"); return }
      paint("armed")
      requestAnimationFrame(() => requestAnimationFrame(() => root.querySelectorAll(".mk__layer mask path").forEach((p) => { p.style.strokeDashoffset = "0" })))
    },
    hide() { strokes = []; paint("hidden") },
  }
  root._marker = api
  return api
}

/* ============================================================ Плеер «Сейчас играет» на стеклянной карточке (Kokonut UI) */
const CRUISE = 200, CRUISE_MS = 1800, MAX_OMEGA = 2160, COAST_TAU = 0.45, SPIN_UP_TAU = 0.22, SPIN_DOWN_TAU = 0.2, SETTLE_EPSILON = 2
const DEAD_ZONE = 10, VELOCITY_WINDOW_MS = 80, STALE_MOVE_MS = 60, HOLD_SETTLE_S = 0.05
const BAR_COUNT = 5, BAR_REST = 0.14, BAR_DECAY_S = 0.3, BAR_ATTACK_S = 0.08
const RUBBER_MAX = 18, SEEK_STEP = 5, RESTART_THRESHOLD = 3, MAX_DT = 0.05, ROLL_MS = 220
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)", RUBBER_RETURN = "transform 450ms cubic-bezier(0.34, 1.4, 0.64, 1)"
const damp = (d, max) => max * (1 - Math.exp(-d / max))
const fmt = (s) => { s = Math.max(0, Math.floor(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` }
const h1 = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s) }
const noise = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return h1(i) * (1 - u) + h1(i + 1) * u }
const barLevel = (i, t) => 0.6 * noise(t * 4.3 + i * 17.3) + 0.4 * noise(t * 9.1 + i * 31.7 + 100)
const scrubGain = (sp) => { const ex = Math.max(0, Math.abs(sp) - CRUISE) / CRUISE; return 1 + 1.5 * ex ** 1.5 }
const trackRate = (w) => (w / CRUISE) * scrubGain(w)
const rotate = (a) => `rotate(${Math.round((a % 360) * 100) / 100}deg)`

const LABEL = [
  '<circle class="pl-acc" cx="64" cy="36" r="20"/><rect class="pl-ink" height="5" width="64" x="18" y="60"/><rect class="pl-ink" height="5" width="52" x="18" y="70"/><rect class="pl-ink" height="5" width="40" x="18" y="80"/>',
  '<path class="pl-acc" d="M50 50 L50 8 A42 42 0 0 1 92 50 Z"/><path class="pl-ink" d="M50 50 L8 50 A42 42 0 0 1 50 8 Z"/><rect class="pl-ink" height="6" rx="1" width="30" x="50" y="62"/><rect class="pl-ink" height="6" rx="1" width="20" x="50" y="72"/>',
  Array.from({ length: 25 }, (_, i) => `<circle class="${i === 8 ? "pl-acc" : "pl-ink"}" cx="${26 + (i % 5) * 12}" cy="${26 + Math.floor(i / 5) * 12}" r="${i === 8 ? 5.5 : 2.6}"/>`).join(""),
]
const disc = (art, cid) => `<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="pl-vinyl" cx="50" cy="50" r="50"/>` +
  [28, 31, 34, 37, 40, 43, 46].map((r) => `<circle cx="50" cy="50" r="${r}" fill="none" stroke="rgb(255 255 255 / .08)" stroke-width=".6"/>`).join("") +
  `<circle cx="50" cy="50" r="49" fill="none" stroke="rgb(255 255 255 / .16)" stroke-width=".8"/><clipPath id="${cid}"><circle cx="50" cy="50" r="24"/></clipPath>` +
  `<circle class="pl-paper" cx="50" cy="50" r="24"/><g clip-path="url(#${cid})" transform="translate(26 26) scale(0.48)">${LABEL[art % 3]}</g><circle class="pl-hole" cx="50" cy="50" r="1.8"/></svg>`
const ICON = {
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 20 9 12l10-8v16Z" fill="currentColor"/><path d="M5 19V5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 4 10 8-10 8V4Z" fill="currentColor"/><path d="M19 5v14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5-12-7.5Z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor"/><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor"/></svg>',
}
let filterSeq = 0
export function initPlayer(root, tracks, opts = {}) {
  const fid = "glass" + ++filterSeq
  root.classList.add("pl")
  root.innerHTML = `
    <svg class="pl-defs" aria-hidden="true" focusable="false"><defs><filter id="${fid}" color-interpolation-filters="sRGB" x="-50%" y="-50%" width="200%" height="200%">
      <feTurbulence baseFrequency="0.05 0.05" numOctaves="1" result="turbulence" seed="1" type="fractalNoise"/>
      <feGaussianBlur in="turbulence" result="blurredNoise" stdDeviation="2"/>
      <feDisplacementMap in="SourceGraphic" in2="blurredNoise" result="displaced" scale="30" xChannelSelector="R" yChannelSelector="B"/>
      <feGaussianBlur in="displaced" stdDeviation="4"/></filter></defs></svg>
    <div class="pl-glass" style="backdrop-filter:url(#${fid})" aria-hidden="true"></div>
    <div class="pl-shine" aria-hidden="true"></div>
    <div class="pl-body">
      <div class="pl-top">
        <div class="pl-deck"><div class="pl-disc" title="Покрути пластинку, чтобы перемотать"></div>
          <svg class="pl-arm" viewBox="0 0 40 110" aria-hidden="true"><circle class="pl-arm-base" cx="31" cy="11" r="8"/><circle class="pl-arm-pin" cx="31" cy="11" r="3"/><path class="pl-arm-rod" d="M31 11 L31 70 L18 92"/><rect class="pl-arm-head" height="12" rx="1.5" transform="rotate(32 16 96)" width="7" x="12.5" y="90"/></svg></div>
        <div class="pl-meta">
          <div class="pl-now"><span class="pl-bars" aria-hidden="true">${"<i></i>".repeat(BAR_COUNT)}</span><span>Сейчас играет</span></div>
          <p class="pl-title"></p><p class="pl-artist"></p><span class="pl-rpm mono">33⅓ rpm</span>${tracks.some((t) => t.href) ? '<a class="pl-listen mono" target="_blank" rel="noopener noreferrer">Слушать трек ↗</a>' : ""}
        </div>
      </div>
      <div class="pl-seek" role="slider" tabindex="0" aria-label="Перемотка" aria-valuemin="0"><div class="pl-rail"><i class="pl-fill"></i></div></div>
      <div class="pl-times mono"><span class="pl-clock" aria-hidden="true"></span><span class="pl-dur"></span></div>
      <div class="pl-ctrl">
        <button type="button" class="pl-btn" data-a="prev" aria-label="Предыдущий трек">${ICON.prev}</button>
        <button type="button" class="pl-btn pl-btn--main" data-a="play" aria-label="Пауза">${ICON.pause}</button>
        <button type="button" class="pl-btn" data-a="next" aria-label="Следующий трек">${ICON.next}</button>
      </div>
    </div>`
  const $ = (s) => root.querySelector(s)
  const discEl = $(".pl-disc"), arm = $(".pl-arm"), fill = $(".pl-fill"), rail = $(".pl-rail"), seek = $(".pl-seek"), rpm = $(".pl-rpm")
  const bars = [...root.querySelectorAll(".pl-bars i")], clockEl = $(".pl-clock"), playBtn = $('[data-a="play"]')
  let ti = 0, active = false
  // настоящий звук, если у треков есть src (на сайте); в презентации — тихая пластинка, как раньше
  const audio = tracks.some((t) => t.src) ? new Audio() : null
  if (audio) audio.preload = "none"
  const live = () => !!(audio && tracks[ti].src)
  const e = { angle: 0, omega: audio ? 0 : CRUISE, time: 0, duration: tracks[0].duration, playing: !audio, held: false, barDrag: false, pointerId: null,
    env: 0, scrubOmega: 0, pointerAngle: 0, center: { x: 0, y: 0 }, lastMoveAt: 0, samples: [], cruise: null, cruiseAngle: 0 }

  // часы: цифры перекатываются, как в оригинале (220 мс, ease-out)
  let shown = ""
  function setClock(s, dir) {
    const txt = fmt(s)
    if (txt === shown) return
    const prev = shown; shown = txt
    clockEl.replaceChildren(...[...txt].map((ch, i) => {
      const slot = document.createElement("span"); slot.className = "pl-digit"
      const was = prev.length === txt.length ? prev[i] : null
      if (was !== null && was !== ch && ch !== ":" && !reduce) {
        const o = document.createElement("i"); o.textContent = was; o.style.animation = `pl-out-${dir > 0 ? "up" : "down"} ${ROLL_MS}ms ${EASE_OUT} both`
        const n = document.createElement("i"); n.textContent = ch; n.style.animation = `pl-in-${dir > 0 ? "up" : "down"} ${ROLL_MS}ms ${EASE_OUT} both`
        slot.append(o, n)
      } else { const n = document.createElement("i"); n.textContent = ch; slot.append(n) }
      return slot
    }))
  }
  const readAngle = () => (e.cruise && e.cruise.currentTime !== null ? e.cruiseAngle + (Number(e.cruise.currentTime) / CRUISE_MS) * 360 : e.angle)
  function stopCruise() { if (!e.cruise) return; e.angle = readAngle(); discEl.style.transform = rotate(e.angle); e.cruise.cancel(); e.cruise = null }
  function startCruise() {
    if (e.cruise || reduce || typeof discEl.animate !== "function") return
    e.angle %= 360; e.cruiseAngle = e.angle
    e.cruise = discEl.animate([{ transform: `rotate(${e.angle}deg)` }, { transform: `rotate(${e.angle + 360}deg)` }], { duration: CRUISE_MS, iterations: Infinity })
    if (!active) e.cruise.pause()
  }
  function integrate(dt) {
    const target = e.playing ? CRUISE : 0
    if (reduce) { e.omega = target; e.time += e.playing ? dt : 0; return }
    if (e.cruise) { e.omega = CRUISE; e.time += dt; return }
    let tau = SPIN_UP_TAU
    if (Math.abs(e.omega) > Math.abs(target)) tau = e.playing ? COAST_TAU : SPIN_DOWN_TAU
    e.omega = target + (e.omega - target) * Math.exp(-dt / tau)
    if (Math.abs(e.omega - target) < SETTLE_EPSILON) e.omega = target
    e.angle += e.omega * dt
    e.time += trackRate(e.omega) * dt
    if (e.playing && e.omega === CRUISE) startCruise()
  }
  function meter(dt) {
    const target = clamp(Math.abs(e.held ? e.scrubOmega : e.omega) / CRUISE, 0, 1)
    if (reduce) e.env = e.playing ? 1 : 0
    else if (target > e.env) e.env = Math.min(target, e.env + dt / BAR_ATTACK_S)
    else e.env = Math.max(target, e.env - dt / BAR_DECAY_S)
    const t = reduce ? 0.37 : e.time
    bars.forEach((b, i) => { b.style.transform = `scaleY(${(BAR_REST + (1 - BAR_REST) * barLevel(i, t) * e.env).toFixed(3)})` })
  }
  let lastS = -1
  function paint() {
    if (!e.cruise) discEl.style.transform = rotate(e.angle)
    fill.style.transform = `scaleX(${(e.duration > 0 ? clamp(e.time / e.duration, 0, 1) : 0).toFixed(4)})`
    const label = e.held ? `${Math.round(e.scrubOmega / 6)} rpm` : e.omega === CRUISE ? "33⅓ rpm" : `${Math.round(e.omega / 6)} rpm`
    if (rpm.textContent !== label) rpm.textContent = label
    const s = Math.floor(e.time)
    if (s !== lastS) {
      setClock(s, s > lastS ? 1 : -1); lastS = s
      seek.setAttribute("aria-valuenow", s); seek.setAttribute("aria-valuetext", `${fmt(s)} из ${fmt(e.duration)}`)
    }
  }
  function load(i) {
    ti = ((i % tracks.length) + tracks.length) % tracks.length
    const t = tracks[ti]
    e.time = 0; e.duration = t.duration; lastS = -1
    $(".pl-title").textContent = t.title; $(".pl-artist").textContent = t.artist
    $(".pl-dur").textContent = fmt(t.duration)
    if (audio) { audio.src = t.src || ""; if (e.playing && t.src) audio.play().catch(() => setPlaying(false)) }
    const listen = $(".pl-listen"); if (listen) { listen.href = t.href || "#"; listen.setAttribute("aria-label", `Слушать «${t.title}» — ${t.artist} (откроется в новой вкладке)`) }
    seek.setAttribute("aria-valuemax", t.duration)
    discEl.innerHTML = disc(t.art ?? ti, fid + "-c" + ti)
    root.style.setProperty("--pl-accent", t.accent || "var(--c-amber)")
    root.dispatchEvent(new CustomEvent("pl:track", { detail: { index: ti } }))
    wakeP()
  }
  let rafP = 0, lastP = 0
  const awake = () => e.playing || e.held || e.barDrag || e.omega !== 0 || e.env > 0 || (audio && !audio.paused)
  function tick(now) {
    const dt = lastP ? Math.min((now - lastP) / 1000, MAX_DT) : 0; lastP = now
    if (e.held) e.scrubOmega *= Math.exp(-dt / HOLD_SETTLE_S)
    else if (!e.barDrag) integrate(dt)
    if (live() && !e.held && !e.barDrag) e.time = audio.currentTime || 0
    if (!live() && e.time >= e.duration) { if (e.playing && !e.held && !e.barDrag) { load(ti + 1); } else e.time = e.duration }
    if (e.time < 0) e.time = 0
    meter(dt); paint()
    if (awake() && active) rafP = requestAnimationFrame(tick); else { rafP = 0; lastP = 0 }
  }
  function wakeP() { paint(); if (!rafP && active) { lastP = 0; rafP = requestAnimationFrame(tick) } }
  function setPlaying(p) {
    if (p && e.time >= e.duration) e.time = 0
    e.playing = p
    if (!p) stopCruise()
    if (live()) { if (p) audio.play().catch(() => setPlaying(false)); else audio.pause() }
    playBtn.innerHTML = p ? ICON.pause : ICON.play; playBtn.setAttribute("aria-label", p ? "Пауза" : "Играть")
    arm.style.transform = p ? "rotate(11deg)" : "rotate(-8deg)"
    wakeP()
  }
  root.addEventListener("click", (ev) => {
    const a = ev.target.closest("[data-a]")?.dataset.a
    if (a === "play") setPlaying(!e.playing)
    else if (a === "prev") { if (e.time > RESTART_THRESHOLD) { e.time = 0; wakeP() } else load(ti - 1) }
    else if (a === "next") load(ti + 1)
  })
  // пластинку можно крутить пальцем: трек идёт за углом, сильный бросок проматывает дальше
  const ang = (x, y) => ({ angle: (Math.atan2(y - e.center.y, x - e.center.x) * 180) / Math.PI, distance: Math.hypot(x - e.center.x, y - e.center.y) })
  discEl.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0 || e.pointerId !== null) return
    ev.stopPropagation()
    e.pointerId = ev.pointerId; discEl.setPointerCapture(ev.pointerId)
    const r = discEl.getBoundingClientRect(); e.center = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    stopCruise(); e.held = true; e.omega = 0; e.scrubOmega = 0
    e.pointerAngle = ang(ev.clientX, ev.clientY).angle; e.lastMoveAt = performance.now(); e.samples = [{ t: e.lastMoveAt, a: e.angle }]
    wakeP()
  })
  discEl.addEventListener("pointermove", (ev) => {
    if (!e.held || e.pointerId !== ev.pointerId) return
    const { angle, distance } = ang(ev.clientX, ev.clientY)
    if (distance < DEAD_ZONE) { e.pointerAngle = angle; return }
    let delta = angle - e.pointerAngle; delta -= Math.round(delta / 360) * 360; e.pointerAngle = angle
    const now = performance.now(), dt = Math.max(now - e.lastMoveAt, 1) / 1000; e.lastMoveAt = now
    e.scrubOmega += (clamp(delta / dt, -MAX_OMEGA, MAX_OMEGA) - e.scrubOmega) * 0.35
    e.angle += delta
    e.time = clamp(e.time + (delta / CRUISE) * scrubGain(e.scrubOmega), 0, e.duration)
    e.samples.push({ t: now, a: e.angle })
    while (e.samples.length > 2 && now - e.samples[0].t > VELOCITY_WINDOW_MS) e.samples.shift()
    discEl.style.transform = rotate(e.angle)
  })
  const discUp = (ev) => {
    if (!e.held || e.pointerId !== ev.pointerId) return
    e.pointerId = null; if (discEl.hasPointerCapture(ev.pointerId)) discEl.releasePointerCapture(ev.pointerId)
    e.held = false
    const now = performance.now(), first = e.samples[0]
    let v = 0
    if (first && now - e.lastMoveAt < STALE_MOVE_MS && now > first.t) v = ((e.angle - first.a) / (now - first.t)) * 1000
    e.omega = reduce ? 0 : clamp(v, -MAX_OMEGA, MAX_OMEGA); e.scrubOmega = 0
    if (live()) audio.currentTime = e.time
    wakeP()
  }
  ;["pointerup", "pointercancel", "lostpointercapture"].forEach((t) => discEl.addEventListener(t, discUp))
  // полоса перемотки: за краями резиново тянется и истончается
  function seekFrom(x) {
    const r = rail.parentElement.getBoundingClientRect(), k = r.width / (rail.parentElement.offsetWidth || 1)
    const px = (x - r.left) / k, w = r.width / k
    e.time = clamp(px / w, 0, 1) * e.duration
    let over = 0
    if (px < 0) over = -damp(-px, RUBBER_MAX); else if (px > w) over = damp(px - w, RUBBER_MAX)
    rail.style.transition = "none"; rail.style.transformOrigin = over < 0 ? "right center" : "left center"
    rail.style.transform = over === 0 ? "" : `scale(${(1 + Math.abs(over) / w).toFixed(4)}, ${(1 - (0.35 * Math.abs(over)) / RUBBER_MAX).toFixed(3)})`
    wakeP()
  }
  seek.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0 || e.pointerId !== null) return
    ev.stopPropagation()
    e.pointerId = ev.pointerId; seek.setPointerCapture(ev.pointerId); e.barDrag = true; stopCruise(); seekFrom(ev.clientX)
  })
  seek.addEventListener("pointermove", (ev) => { if (e.barDrag && e.pointerId === ev.pointerId) seekFrom(ev.clientX) })
  const barUp = (ev) => {
    if (!e.barDrag || e.pointerId !== ev.pointerId) return
    e.pointerId = null; e.barDrag = false; rail.style.transition = RUBBER_RETURN; rail.style.transform = ""
    if (live()) audio.currentTime = e.time
    wakeP()
  }
  ;["pointerup", "pointercancel", "lostpointercapture"].forEach((t) => seek.addEventListener(t, barUp))
  seek.addEventListener("keydown", (ev) => {
    const t = { ArrowRight: e.time + SEEK_STEP, ArrowUp: e.time + SEEK_STEP, ArrowLeft: e.time - SEEK_STEP, ArrowDown: e.time - SEEK_STEP, Home: 0, End: e.duration - 1 }[ev.key]
    if (t === undefined) return
    ev.preventDefault(); ev.stopPropagation(); e.time = clamp(t, 0, e.duration); if (live()) audio.currentTime = e.time; wakeP()
  })
  if (audio) {
    audio.addEventListener("loadedmetadata", () => { if (isFinite(audio.duration)) { e.duration = audio.duration; $(".pl-dur").textContent = fmt(audio.duration); seek.setAttribute("aria-valuemax", Math.floor(audio.duration)) } })
    audio.addEventListener("ended", () => load(ti + 1))
  }
  load(0)
  if (audio) { playBtn.innerHTML = ICON.play; playBtn.setAttribute("aria-label", "Играть") }
  arm.style.transform = audio ? "rotate(-8deg)" : "rotate(11deg)"
  return {
    // крутится только на открытом слайде
    // выбрать трек из плейлиста и сразу играть
    select(i) { load(i); setPlaying(true) },
    pause() { if (e.playing) setPlaying(false) },
    // opts.autoplay (презентация): звук включается при показе слайда и глохнет при уходе с него
    show() { active = true; e.cruise?.play(); wakeP(); if (opts.autoplay && audio && !e.playing) setPlaying(true) },
    hide() { if (opts.autoplay && audio && e.playing) setPlaying(false); active = false; e.cruise?.pause(); cancelAnimationFrame(rafP); rafP = 0 },
  }
}
