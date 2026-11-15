// Общие утилиты: флаги окружения, безопасное хранилище, уведомления, звук.

export const $ = (sel, root = document) => root.querySelector(sel)
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]

export const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches
export const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches

export const store = {
  get(key, area = localStorage) {
    try { return area.getItem(key) } catch { return null }
  },
  set(key, value, area = localStorage) {
    try { area.setItem(key, value) } catch { /* приватный режим: просто не запоминаем */ }
  },
}

/** Русское множественное число: plural(5, ["позиция", "позиции", "позиций"]) */
export function plural(n, forms) {
  const a = Math.abs(n) % 100, b = a % 10
  if (a > 10 && a < 20) return forms[2]
  if (b > 1 && b < 5) return forms[1]
  if (b === 1) return forms[0]
  return forms[2]
}

/** Уведомление в духе ICQ: «У вас 1 новое сообщение». */
/** group — уведомления одной группы заменяют друг друга (например, уровни пузометра), а не копятся стопкой */
export function toast(title, text, ms = 4200, group = "") {
  const box = $("#toasts")
  if (!box) return
  if (group) box.querySelectorAll(`.toast[data-group="${group}"]`).forEach((t) => t.remove())
  const el = document.createElement("div")
  el.className = "toast"
  if (group) el.dataset.group = group
  el.innerHTML = '<svg aria-hidden="true"><use href="#i-flower"/></svg><b></b><span></span>'
  el.querySelector("b").textContent = title
  el.querySelector("span").textContent = text
  box.append(el)
  const gsap = window.gsap
  if (gsap && !reducedMotion) gsap.from(el, { y: 24, opacity: 0, duration: 0.6, ease: "expo.out" })
  setTimeout(() => {
    if (gsap && !reducedMotion) gsap.to(el, { x: 40, opacity: 0, duration: 0.4, ease: "power2.in", onComplete: () => el.remove() })
    else el.remove()
  }, ms)
}

/* ---------- Звук: своя синтезированная «о-оу», выключен по умолчанию */
let ctx
let legendAudio
export const sound = {
  get enabled() { return store.get("skuf-sound") === "1" },
  set enabled(v) { store.set("skuf-sound", v ? "1" : "0") },
  /** «Легенда»: звук из оригинального видео «Dad, are you okay?» (используется с разрешения).
   *  Играет только по действию посетителя — когда он докручивает пузометр до «Легенды». */
  legend() {
    legendAudio ||= Object.assign(new Audio("assets/audio/dad-are-you-okay.mp3"), { preload: "none" })
    legendAudio.currentTime = 0
    legendAudio.play().catch(() => { /* браузер не дал воспроизвести — молча пропускаем */ })
  },
  stopLegend() {
    if (legendAudio && !legendAudio.paused) legendAudio.pause()
  },
  uhOh() {
    if (!this.enabled) return
    try {
      ctx ||= new (window.AudioContext || window.webkitAudioContext)()
      const now = ctx.currentTime
      ;[[740, 0], [554, 0.17]].forEach(([freq, at]) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "triangle"
        osc.frequency.setValueAtTime(freq * 1.04, now + at)
        osc.frequency.exponentialRampToValueAtTime(freq, now + at + 0.05)
        gain.gain.setValueAtTime(0.0001, now + at)
        gain.gain.exponentialRampToValueAtTime(0.22, now + at + 0.015)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.16)
        osc.connect(gain).connect(ctx.destination)
        osc.start(now + at)
        osc.stop(now + at + 0.18)
      })
    } catch { /* без звука — так без звука */ }
  },
}
