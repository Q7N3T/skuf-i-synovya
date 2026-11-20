// Hero: побуквенный заголовок, печать в окне ICQ, параллакс слоёв, пена на canvas.
import { $, $$, reducedMotion, store } from "./utils.js?v=202611201641"
import { runOdometer, setupOdometer } from "./odometer.js?v=202611201641"

/* ---------- Разбивка заголовка на буквы (для скринридера остаётся aria-label на h1) */
function split(el) {
  const text = el.textContent
  el.textContent = ""
  el.setAttribute("aria-hidden", "true")
  for (const ch of text) {
    const span = document.createElement("span")
    span.className = "char"
    span.textContent = ch === " " ? " " : ch
    el.append(span)
  }
  return $$(".char", el)
}

/* ---------- Печать подзаголовка как в ICQ */
function typeMessage() {
  const msg = $("#icqMsg")
  const typing = $("#icqTyping")
  const text = msg.dataset.text
  if (reducedMotion) return Promise.resolve()
  msg.textContent = ""
  const caret = document.createElement("span")
  caret.className = "caret"
  typing.classList.add("is-on")
  return new Promise((resolve) => {
    let i = 0
    setTimeout(function next() {
      typing.classList.remove("is-on")
      msg.textContent = text.slice(0, ++i)
      msg.append(caret)
      if (i < text.length) setTimeout(next, 45 + Math.random() * 70)
      else resolve()
    }, 450)
  })
}

/* ---------- Пена: лёгкие пузыри на canvas, пауза вне экрана */
function foam(canvas) {
  const ctx = canvas.getContext("2d")
  const dpr = Math.min(devicePixelRatio || 1, 2)
  let w = 0, h = 0, raf = 0, running = false
  const bubbles = []
  const count = () => Math.round(Math.min(60, (w * h) / 26000))
  const spawn = (b = {}, initial = false) => Object.assign(b, {
    x: Math.random() * w,
    y: initial ? Math.random() * h : h + 10,
    r: 1 + Math.random() * 3.2,
    v: 0.25 + Math.random() * 0.7,
    a: 0.12 + Math.random() * 0.35,
    p: Math.random() * Math.PI * 2,
  })
  const resize = () => {
    w = canvas.clientWidth; h = canvas.clientHeight
    canvas.width = w * dpr; canvas.height = h * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    while (bubbles.length < count()) bubbles.push(spawn({}, true))
    bubbles.length = count()
  }
  const draw = () => {
    ctx.clearRect(0, 0, w, h)
    for (const b of bubbles) {
      b.y -= b.v
      b.p += 0.02
      if (b.y < -10) spawn(b)
      const x = b.x + Math.sin(b.p) * 6
      ctx.beginPath()
      ctx.arc(x, b.y, b.r, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(245,239,227,${b.a})`
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.25, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(245,239,227,${b.a * 0.8})`
      ctx.fill()
    }
  }
  const loop = () => { draw(); raf = requestAnimationFrame(loop) }
  const setRunning = (on) => {
    if (on === running || reducedMotion) return
    running = on
    on ? loop() : cancelAnimationFrame(raf)
  }
  resize()
  draw()
  new ResizeObserver(resize).observe(canvas)
  // пена оживает после интро, чтобы не мешать первой отрисовке
  setTimeout(() => {
    new IntersectionObserver(([e]) => setRunning(e.isIntersecting && !document.hidden)).observe(canvas)
  }, 2600)
  document.addEventListener("visibilitychange", () => setRunning(!document.hidden))
}

export function setupHero() {
  const lines = $$("[data-split]").map(split)
  setupOdometer($("#odometer"), visitorNumber())
  foam($("#foam"))
  return lines
}

export function playHero(lines) {
  const { gsap } = window
  const odo = $("#odometer")
  if (reducedMotion || !gsap) {
    runOdometer(odo, true)
    return
  }
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } })
  tl.fromTo(lines[0], { y: "105%" }, { y: 0, duration: 1.4, stagger: 0.05 })
    .fromTo(lines[1], { y: "105%" }, { y: 0, duration: 1.2, stagger: 0.03 }, "-=1.15")
    .fromTo(".hero [data-reveal]", { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.08 }, "-=0.9")
    .from(".icq", { opacity: 0, scale: 0.94, transformOrigin: "100% 100%", duration: 1.2 }, "<0.1")
    .add(() => { typeMessage(); runOdometer(odo) }, "-=1.4")

  // Параллакс слоёв — только на широких экранах: в одну колонку слои наезжали бы на текст
  gsap.matchMedia().add("(min-width: 1024px)", () => {
    $$(".hero [data-depth]").forEach((el) => {
      gsap.to(el, {
        y: () => -parseFloat(el.dataset.depth) * innerHeight,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true },
      })
    })
  })
}

/* Правдоподобный номер посетителя: 2007xxx, один на сессию */
function visitorNumber() {
  let n = Number(store.get("skuf-visitor", sessionStorage))
  if (!n) {
    n = 2007000 + 100 + Math.floor(Math.random() * 899)
    store.set("skuf-visitor", String(n), sessionStorage)
  }
  return n
}
