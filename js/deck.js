// Презентация-защита: масштаб сцены, навигация (клавиши, свайп, кнопки, #номер), анимация слайдов, рикролл.
import { initTabs, initSteps, initMarker, initPlayer } from "./deck-ui.js?v=202611201532"
import { initStats } from "./deck-stats.js?v=202611201532"

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches

const deck = $("#deck"), stage = $("#stage")
const slides = $$(".slide", stage)
const total = slides.length
let index = 0

/* ---------- Масштаб сцены 1600×900 под доступную область */
function fit() {
  const r = deck.getBoundingClientRect()
  const pad = innerWidth < 768 ? 8 : 24
  const scale = Math.min((r.width - pad * 2) / 1600, (r.height - pad * 2) / 900)
  stage.style.setProperty("--scale", Math.max(0.1, scale).toFixed(4))
  // на телефоне в портрете — подсказка повернуть
  const rot = $("#deckRotate")
  if (rot && !rot.dataset.closed) rot.hidden = !(innerWidth < 600 && innerHeight > innerWidth)
}
new ResizeObserver(fit).observe(deck)
addEventListener("orientationchange", fit)
$("#rotateClose")?.addEventListener("click", () => { const r = $("#deckRotate"); r.dataset.closed = "1"; r.hidden = true })

/* ---------- Интерактивные элементы слайдов: живут только пока их слайд открыт */
const parts = []   // { slide, show(), hide() }
const own = (el, api) => el && parts.push({ slide: el.closest(".slide"), ...api })
const docTabs = $("#docTabs"); if (docTabs) own(docTabs, initTabs(docTabs))
const regSteps = $("#regSteps"); if (regSteps) own(regSteps, initSteps(regSteps))
$$("[data-mark-root]").forEach((root) => { const m = initMarker(root); own(root, { show: () => m.draw(), hide: () => m.hide() }) })
const player = $("#deckPlayer")
if (player) own(player, initPlayer(player, [
  { src: "assets/audio/zveri-rayony-kvartaly.mp3", title: "Районы-кварталы", artist: "Звери", duration: 199, art: 0, accent: "#f2a93b" },
  { src: "assets/audio/the-killers-mr-brightside.mp3", title: "Mr. Brightside", artist: "The Killers", duration: 217, art: 1, accent: "#4cd964" },
  { src: "assets/audio/ruki-vverh-kroshka-moya.mp3", title: "Крошка моя", artist: "Руки Вверх!", duration: 210, art: 2, accent: "#ff7a5c" },
  { src: "assets/audio/bi-2-polkovniku.mp3", title: "Полковнику никто не пишет", artist: "Би-2", duration: 296, art: 0, accent: "#5b8cff" },
  { src: "assets/audio/franz-ferdinand-take-me-out.mp3", title: "Take Me Out", artist: "Franz Ferdinand", duration: 286, art: 1, accent: "#f2a93b" },
  { src: "assets/audio/splin-vyhoda-net.mp3", title: "Выхода нет", artist: "Сплин", duration: 228, art: 2, accent: "#4cd964" },
  { src: "assets/audio/leningrad-www.mp3", title: "WWW", artist: "Ленинград", duration: 167, art: 0, accent: "#ff7a5c" },
  { src: "assets/audio/white-stripes-seven-nation-army.mp3", title: "Seven Nation Army", artist: "The White Stripes", duration: 239, art: 1, accent: "#5b8cff" },
  { src: "assets/audio/uma2rman-prostitsya.mp3", title: "Проститься", artist: "Uma2rman", duration: 302, art: 2, accent: "#f2a93b" },
  { src: "assets/audio/tancy-minus-polovinka.mp3", title: "Половинка", artist: "Танцы Минус", duration: 171, art: 0, accent: "#4cd964" },
  { src: "assets/audio/gorillaz-feel-good-inc.mp3", title: "Feel Good Inc.", artist: "Gorillaz", duration: 224, art: 1, accent: "#ff7a5c" },
  { src: "assets/audio/basta-moya-igra.mp3", title: "Моя игра", artist: "Баста", duration: 271, art: 2, accent: "#5b8cff" },
  { src: "assets/audio/korni-ty-uznaesh-eyo.mp3", title: "Ты узнаешь её", artist: "Корни", duration: 280, art: 0, accent: "#f2a93b" },
  { src: "assets/audio/arctic-monkeys-dancefloor.mp3", title: "I Bet You Look Good on the Dancefloor", artist: "Arctic Monkeys", duration: 177, art: 1, accent: "#4cd964" },
  { src: "assets/audio/zemfira-hochesh.mp3", title: "Хочешь?", artist: "Земфира", duration: 188, art: 2, accent: "#ff7a5c" },
  { src: "assets/audio/linkin-park-numb.mp3", title: "Numb", artist: "Linkin Park", duration: 235, art: 0, accent: "#5b8cff" },
  { src: "assets/audio/diskoteka-avariya-pey-pivo.mp3", title: "Пей пиво", artist: "Дискотека Авария", duration: 65, art: 1, accent: "#f2a93b" },
  { src: "assets/audio/outkast-hey-ya.mp3", title: "Hey Ya!", artist: "OutKast", duration: 289, art: 2, accent: "#4cd964" },
  { src: "assets/audio/kasabian-club-foot.mp3", title: "Club Foot", artist: "Kasabian", duration: 210, art: 0, accent: "#ff7a5c" },
], { autoplay: true }))
function partsOn(slide) { parts.forEach((p) => (p.slide === slide ? p.show?.() : p.hide?.())) }

/* ---------- Рикролл (последний слайд): наше видео + надпись + танцующие мы, всё в такт музыке */
const LOCAL = "assets/video/rickroll.mp4"
const RICK = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&playsinline=1&modestbranding=1"
// Темп и первый удар вычислены по аудиодорожке клипа: 113,65 уд/мин, первый удар на 0,46 с
const BEAT = 60 / 113.65
const OFFSET = 0.46
let rickRun = null

// по видео — точная синхронизация даже после паузы и перемотки; без видео — по часам
function beatClock(video) {
  const t0 = performance.now()
  return () => (video ? video.currentTime : (performance.now() - t0) / 1000)
}

const rickSlide = $(".slide--rick")

function startShow(clock, video) {
  const gsap = window.gsap
  const big = $("#rickBig"), title = $("#rickTitle")
  let introDone = false

  // через 3 секунды после старта видео — надпись на весь экран, съезжает вниз, и только потом выходим мы
  const intro = () => {
    if (!gsap || reduce) {
      title.style.visibility = "visible"; introDone = true; return
    }
    gsap.set(big, { visibility: "visible" })
    gsap.timeline({ onComplete: () => { introDone = true } })
      .fromTo(big.children, { scale: 3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)", stagger: 0.12 })
      .to({}, { duration: 1.4 })
      .to(big, { y: 298, scale: 0.36, duration: 0.9, ease: "expo.inOut" })
      .to(big, { backgroundColor: "rgba(0,0,0,0)", duration: 0.5 }, "<")
      .set(title, { visibility: "visible" }, "-=0.25")
      .fromTo(title, { opacity: 0 }, { opacity: 1, duration: 0.25 }, "<")
      .to(big, { opacity: 0, duration: 0.25 }, "<")
      .set(big, { visibility: "hidden", clearProps: "transform,opacity,backgroundColor" })
      // мы выходим снизу уже танцуя
  }
  let introTimer = 0
  const scheduleIntro = () => { clearTimeout(introTimer); introTimer = setTimeout(intro, 3000) }
  if (video) {
    if (!video.paused && video.currentTime > 0) scheduleIntro()
    else video.addEventListener("playing", scheduleIntro, { once: true })
  } else scheduleIntro()

  let raf = 0
  const tick = () => {
    raf = requestAnimationFrame(tick)
    if (reduce) return
    if (video && video.paused) return
    const t = clock()
    if (t < OFFSET) return
    const f = (t - OFFSET) / BEAT
    const n = Math.floor(f), p = f - n
    if (introDone) {
      const pulse = Math.pow(1 - p, 3)
      title.style.transform = `scale(${1 + 0.09 * pulse}) rotate(${(n % 2 ? 1 : -1) * 1.5 * pulse}deg)`
      title.style.color = n % 4 === 0 ? "var(--c-foam)" : "var(--c-amber)"
    }
  }
  tick()
  // остановка при уходе со слайда
  return () => {
    cancelAnimationFrame(raf); clearTimeout(introTimer)
    gsap?.killTweensOf([big, title, ...big.children])
    ;[big, title, ...big.children].forEach((el) => { el.style.cssText = "" })
  }
}

// Шаг 2: нажали «Получить скидку» — внезапно выезжает плеер и играет рикролл (звук разрешён: это клик посетителя)
function rickOn() {
  const frame = $("#rickFrame")
  if (frame.querySelector("iframe, video")) return
  rickSlide.dataset.state = "play"
  const gsap = window.gsap
  const video = Object.assign(document.createElement("video"), { src: LOCAL, controls: true, autoplay: true, playsInline: true })
  frame.append(video)
  video.play().catch(() => {})
  rickRun = startShow(beatClock(video), video)
  // нет своего файла — YouTube, танец по часам
  video.addEventListener("error", () => {
    rickRun?.(); video.remove()
    frame.append(Object.assign(document.createElement("iframe"), {
      src: RICK, title: "Rick Astley — Never Gonna Give You Up",
      allow: "autoplay; encrypted-media; picture-in-picture; fullscreen", allowFullscreen: true,
    }))
    rickRun = startShow(beatClock(null), null)
  }, { once: true })
  if (gsap && !reduce) {
    gsap.fromTo(frame, { scale: 0.2, rotate: -8, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 0.7, ease: "back.out(1.8)", clearProps: "transform,opacity" })
    gsap.fromTo(".s-rick__cap", { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.3, clearProps: "all" })
  }
  try { // засчитать пасхалку «Секретная скидка» на сайте
    const found = JSON.parse(localStorage.getItem("skuf-eggs") || "[]")
    if (!found.includes("rickroll")) { found.push("rickroll"); localStorage.setItem("skuf-eggs", JSON.stringify(found)) }
  } catch {}
}
// уход со слайда — всё в исходное: снова только кнопка и стрелки
function rickOff() {
  rickRun?.(); rickRun = null
  $("#rickFrame iframe, #rickFrame video")?.remove()
  rickSlide.dataset.state = "cta"
}
$("#rickGet").addEventListener("click", rickOn)
// Шаг 0: «Секретная скидка» на слайде «Спасибо» — просто ведёт на слайд с кнопкой
$("#secretBtn").addEventListener("click", () => go(total - 1))

/* ---------- Показатели (слайд 12): анимация живёт только пока слайд открыт */
const statsSlide = $("#statSeg")?.closest(".slide")
const stats = initStats(statsSlide)

/* ---------- Переход между слайдами */
function show(i, dir = 1) {
  const prev = slides[index], next = slides[i]
  const gsap = window.gsap
  slides.forEach((s, k) => { s.classList.toggle("is-active", k === i); s.setAttribute("aria-hidden", String(k !== i)) })
  if (gsap && !reduce && prev !== next) {
    gsap.fromTo(next, { opacity: 0, x: 60 * dir }, { opacity: 1, x: 0, duration: 0.6, ease: "expo.out" })
    gsap.fromTo($$("[data-in]", next), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: "expo.out", stagger: 0.06, delay: 0.08 })
    $$(".s-bar i", next).forEach((bar) => gsap.fromTo(bar, { scaleY: 0 }, { scaleY: 1, duration: 0.9, ease: "expo.out", delay: 0.3 }))
  }
  index = i
  $("#deckCount").textContent = `${String(i + 1).padStart(2, "0")} / ${total}`
  $("#deckBar").style.setProperty("--p", (i + 1) / total)
  $("#deckPrev").disabled = i === 0
  $("#deckNext").disabled = i === total - 1
  history.replaceState(null, "", `#${i + 1}`)
  if (i !== total - 1) rickOff()
  stats(slides[i] === statsSlide)
  // после анимации входа слайда — чтобы маркер мерил уже вставший на место текст
  parts.forEach((p) => { if (p.slide !== slides[i]) p.hide?.() })   // уходим со слайда — музыка и анимации стихают сразу
  setTimeout(() => { if (index === i) partsOn(slides[i]) }, reduce ? 0 : 420)
}
function go(i) {
  const n = Math.max(0, Math.min(total - 1, i))
  if (n !== index) show(n, n > index ? 1 : -1)
}

$("#deckPrev").addEventListener("click", () => go(index - 1))
$("#deckNext").addEventListener("click", () => go(index + 1))
addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea, select, [role=tab], [role=slider]")) return
  if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); go(index + 1) }
  else if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); go(index - 1) }
  else if (e.key === "Home") go(0)
  else if (e.key === "End") go(total - 1)
  else if (e.key.toLowerCase() === "f" || e.key.toLowerCase() === "а") toggleFull()
})
// свайп
let sx = 0, sy = 0
deck.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY }, { passive: true })
deck.addEventListener("touchend", (e) => {
  const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1))
})

/* ---------- Полный экран */
function toggleFull() {
  if (document.fullscreenElement) document.exitFullscreen?.()
  else document.documentElement.requestFullscreen?.().catch(() => {})
}
$("#deckFull").addEventListener("click", toggleFull)

/* ---------- Старт: слайд из адреса (#5) */
const start = Math.max(1, Math.min(total, parseInt(location.hash.slice(1), 10) || 1)) - 1
index = -1
show(start)
fit()
