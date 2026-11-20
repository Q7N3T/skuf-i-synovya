// Телевизор «СКУФТРОН»: корпус, OSD, включение/выключение, каналы — плюс окно ошибки «скидка.exe».
// Отдельный модуль: откатывается удалением <script src="js/crt.js"> и блока .crt в разметке.
// Ничего не оборачивает и не трансформирует html/body/main/секции — только свой fixed-слой.
import { getLenis } from "./modules/smooth.js?v=202611201345"

const root = document.documentElement
const $ = (s, r = document) => r.querySelector(s)
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
const crt = $("#crt")

/* ---------------------------------------------------------------- телевизор */
if (crt) {
  const top = $(".crt__power i:first-child", crt), bottom = $(".crt__power i:nth-child(2)", crt), beam = $(".crt__beam", crt)
  const osd = $(".crt__osd", crt), offMsg = $(".crt__off-msg", crt)
  const nostalgia = () => !root.classList.contains("no-nostalgia")
  const sync = () => root.classList.toggle("crt-on", nostalgia())
  sync()
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ["class"] })

  const anim = (el, frames, ms, easing = "cubic-bezier(.2,.7,.2,1)", delay = 0) =>
    el.animate(frames, { duration: reduce ? 1 : ms, easing, delay: reduce ? 0 : delay, fill: "forwards" }).finished

  // Включение: полоска вспыхивает по центру и раскрывается в изображение (≈0,5 с)
  async function powerOn() {
    root.classList.remove("crt-off")
    beam.getAnimations().forEach((a) => a.cancel())
    await anim(beam, [{ opacity: 0, transform: "scaleX(0.02)" }, { opacity: 1, transform: "scaleX(1)" }], 160)
    root.classList.remove("crt-boot")
    await Promise.all([
      anim(top, [{ transform: "translateY(0)" }, { transform: "translateY(-101%)" }], 380),
      anim(bottom, [{ transform: "translateY(0)" }, { transform: "translateY(101%)" }], 380),
      anim(beam, [{ opacity: 1, transform: "scaleY(1)" }, { opacity: 0, transform: "scaleY(30)" }], 380),
    ])
    showOsd(currentLabel)
  }
  // Выключение: изображение схлопывается в линию, потом в точку и гаснет
  async function powerOff() {
    hideOsd()
    await Promise.all([
      anim(top, [{ transform: "translateY(-101%)" }, { transform: "translateY(0)" }], 260, "cubic-bezier(.6,0,.8,.4)"),
      anim(bottom, [{ transform: "translateY(101%)" }, { transform: "translateY(0)" }], 260, "cubic-bezier(.6,0,.8,.4)"),
      anim(beam, [{ opacity: 0, transform: "scaleX(1)" }, { opacity: 1, transform: "scaleX(1)" }], 200, "linear", 120),
    ])
    await anim(beam, [{ transform: "scaleX(1)" }, { transform: "scaleX(0.004)" }], 260, "cubic-bezier(.7,0,.9,.6)")
    await anim(beam, [{ opacity: 1 }, { opacity: 0 }], 220)
    root.classList.add("crt-off")
    offMsg.focus({ preventScroll: true })
  }
  $(".crt__power-btn", crt)?.addEventListener("click", () => (root.classList.contains("crt-off") ? powerOn() : powerOff()))
  offMsg.addEventListener("click", powerOn)

  // Старт: после экрана «Дозвон до 2007-го…» (если он есть) — эффект включения
  const start = () => (nostalgia() ? powerOn() : root.classList.remove("crt-boot"))
  if (root.classList.contains("is-booting")) {
    const mo = new MutationObserver(() => { if (!root.classList.contains("is-booting")) { mo.disconnect(); start() } })
    mo.observe(root, { attributes: true, attributeFilter: ["class"] })
  } else start()

  // OSD: «CH 02 · ПУЗО КАРТ» при входе в раздел, гаснет через 2 с
  const fixedOsd = crt.dataset.osd   // на странице 404 надпись постоянная
  let osdTimer = 0, currentLabel = fixedOsd || ""
  function showOsd(text, sticky = false) {
    if (!text || root.classList.contains("crt-off")) return
    osd.textContent = text; osd.classList.add("is-on")
    clearTimeout(osdTimer)
    if (!sticky && !fixedOsd) osdTimer = setTimeout(hideOsd, 2000)
  }
  function hideOsd() { if (!fixedOsd) osd.classList.remove("is-on") }

  const CH = [["#prices", "01", "Прайс"], ["#gold", "02", "Пузо Карт"], ["#team", "03", "Бати"], ["#faq", "04", "Вопросы"], ["#guestbook", "05", "Гостевая"], ["#contacts", "06", "Контакты"]]
  const buttons = [...crt.querySelectorAll("[data-ch]")]
  if (!fixedOsd && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const ch = CH.find(([id]) => id === "#" + e.target.id)
        if (!ch) continue
        currentLabel = `CH ${ch[1]} · ${ch[2]}`
        buttons.forEach((b) => b.setAttribute("aria-current", String(b.dataset.ch === ch[0])))
        showOsd(currentLabel)
      }
    }, { rootMargin: "-45% 0px -50% 0px" })
    CH.forEach(([id]) => { const s = $(id); if (s) io.observe(s) })
  } else if (fixedOsd) showOsd(fixedOsd, true)

  // Каналы: плавный скролл через Lenis с учётом шапки и рамки; на 404 — переход на главную
  buttons.forEach((b) => b.addEventListener("click", () => {
    const target = $(b.dataset.ch)
    if (!target) { location.href = "./" + b.dataset.ch; return }
    const cs = getComputedStyle(root)
    const offset = -((parseFloat(cs.getPropertyValue("--header-h")) || 4) * 16 + (parseFloat(cs.getPropertyValue("--crt-t")) || 0))
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(target, { offset, duration: 1.4 })
    else window.scrollTo({ top: target.getBoundingClientRect().top + scrollY + offset, behavior: reduce ? "auto" : "smooth" })
  }))
  // Громкость — декоративная
  const tip = $(".crt__tip", crt)
  let tipTimer = 0
  crt.querySelectorAll("[data-vol]").forEach((b) => b.addEventListener("click", () => {
    tip.classList.add("is-on"); clearTimeout(tipTimer); tipTimer = setTimeout(() => tip.classList.remove("is-on"), 1800)
  }))

  // Над «Пузо Карт» скан-линии и шум гаснут — видео на карте чистое
  const gold = $("#gold")
  if (gold && "IntersectionObserver" in window) new IntersectionObserver(([e]) => root.classList.toggle("crt-clean", e.isIntersecting)).observe(gold)

  // 60 секунд без действий — «НЕТ СИГНАЛА… батя, ты уснул?»; любое действие убирает
  if (!fixedOsd) {
    let idle = 0, asleep = false
    const wake = () => {
      clearTimeout(idle)
      if (asleep) { asleep = false; hideOsd() }
      idle = setTimeout(() => { asleep = true; showOsd("НЕТ СИГНАЛА… батя, ты уснул?", true) }, 60000)
    }
    ;["scroll", "wheel", "pointerdown", "pointermove", "keydown", "touchstart"].forEach((t) => addEventListener(t, wake, { passive: true }))
    wake()
  }
}

/* ---------------------------------------------------------------- скидка.exe */
// Окно ошибки в стиле Windows XP вместо перехода на YouTube. Esc и клик мимо закрывают, фокус возвращается на ссылку.
const secret = $("#secret")
if (secret) {
  let win = null, opener = null
  function close() {
    if (!win) return
    win.remove(); win = null
    document.removeEventListener("keydown", onKey, true)
    opener?.focus()
  }
  function onKey(e) {
    if (e.key === "Escape") { e.preventDefault(); close() }
    else if (e.key === "Tab" && win) {   // фокус не уходит из окна
      const f = [...win.querySelectorAll("button")], i = f.indexOf(document.activeElement)
      if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus() } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus() }
    }
  }
  secret.addEventListener("click", (e) => {
    e.preventDefault()
    if (win) return
    opener = secret
    win = document.createElement("div")
    win.className = "xperr-layer"
    win.innerHTML = `
      <div class="xperr" role="alertdialog" aria-modal="true" aria-labelledby="xperrTitle" aria-describedby="xperrText">
        <div class="xperr__bar"><span class="xperr__title" id="xperrTitle">скидка.exe</span><button class="xperr__x" type="button" aria-label="Закрыть" data-close>×</button></div>
        <div class="xperr__body">
          <span class="xperr__icon" aria-hidden="true">×</span>
          <p id="xperrText">Программа скидка.exe выполнила недопустимую операцию и будет закрыта.<br />Скидка 90% действует только 29 февраля 2007 года.</p>
        </div>
        <div class="xperr__btns"><button class="xperr__btn" type="button" data-close>ОК</button><button class="xperr__btn" type="button" data-close>Всё равно ОК</button></div>
      </div>`
    document.body.append(win)
    const box = $(".xperr", win)
    win.addEventListener("click", (ev) => { if (ev.target.closest("[data-close]") || !ev.target.closest(".xperr")) close() })
    document.addEventListener("keydown", onKey, true)
    $(".xperr__btn", win).focus()
    // перетаскивание за заголовок (мышь, десктоп)
    const bar = $(".xperr__bar", win)
    let dx = 0, dy = 0, drag = false
    bar.addEventListener("pointerdown", (ev) => {
      if (ev.pointerType !== "mouse" || ev.target.closest("button")) return
      drag = true; const r = box.getBoundingClientRect(); dx = ev.clientX - r.left; dy = ev.clientY - r.top
      bar.setPointerCapture(ev.pointerId)
    })
    bar.addEventListener("pointermove", (ev) => {
      if (!drag) return
      box.style.position = "fixed"; box.style.margin = "0"
      box.style.left = Math.max(0, Math.min(innerWidth - box.offsetWidth, ev.clientX - dx)) + "px"
      box.style.top = Math.max(0, Math.min(innerHeight - box.offsetHeight, ev.clientY - dy)) + "px"
    })
    bar.addEventListener("pointerup", () => { drag = false })
  })
}
