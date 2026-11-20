// Точка входа. Порядок: модули без анимаций → прелоадер → интро → появление по скроллу.
import { $, $$, reducedMotion, store } from "./modules/utils.js?v=202611201546"
import { boot } from "./modules/boot.js?v=202611201546"
import { initSmooth, scrollToTarget } from "./modules/smooth.js?v=202611201546"
import { initHeader } from "./modules/header.js?v=202611201546"
import { setupHero, playHero } from "./modules/hero.js?v=202611201546"
import { initMarquee } from "./modules/marquee.js?v=202611201546"
import { initPrices } from "./modules/prices.js?v=202611201546"
import { initPuzo } from "./modules/puzo.js?v=202611201546"
import { initTeam } from "./modules/team.js?v=202611201546"
import { initBooking } from "./modules/booking.js?v=202611201546"
import { initPointer } from "./modules/pointer.js?v=202611201546"
import { initRoll } from "./modules/roll.js?v=202611201546"

const { gsap, ScrollTrigger } = window
if (gsap) gsap.registerPlugin(ScrollTrigger)
else document.documentElement.classList.remove("motion") // без GSAP показываем всё сразу

// Каждый модуль изолирован: ошибка в одном не ломает остальные
const safe = (name, fn) => { try { return fn() } catch (err) { console.error(`[${name}]`, err) } }

// Счётчик найденных пасхалок виден сразу, ещё до загрузки модуля пасхалок
safe("egg-count", () => {
  const found = JSON.parse(store.get("skuf-eggs") || "[]")
  const el = $("#eggCount")
  if (el) el.textContent = `Найдено пасхалок: ${found.length}/8`
})

const lenis = safe("smooth", initSmooth)
safe("header", initHeader)
const lines = safe("hero", setupHero)
safe("marquee", () => initMarquee(lenis))
safe("prices", initPrices)
safe("puzo", initPuzo)
safe("team", initTeam)
safe("booking", initBooking)
safe("pointer", initPointer)
safe("roll", initRoll)

/* Появление секций: единый ритм — expo.out, сдвиг 24px, 0.7 с, stagger 0.06.
   Старт, когда верх элемента на 90% высоты экрана — при быстром скролле контент уже на месте. */
function initReveal() {
  const targets = $$("[data-reveal]").filter((el) => !el.closest(".hero"))
  if (reducedMotion || !gsap || !ScrollTrigger) return
  ScrollTrigger.batch(targets, {
    start: "top 90%",
    once: true,
    interval: 0.05,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: "expo.out", stagger: 0.06, overwrite: true }),
  })
}

boot().then(() => {
  safe("reveal", initReveal)
  safe("hero-intro", () => playHero(lines))
  document.documentElement.dataset.ready = "1"
  ScrollTrigger?.refresh()

  // Ссылка вида …/#gold: браузер прыгает к якорю раньше, чем страница достроилась,
  // поэтому после загрузки доводим до раздела сами
  const target = location.hash.length > 1 && document.getElementById(location.hash.slice(1))
  if (target) requestAnimationFrame(() => scrollToTarget(target, location.hash, true))

  // Пасхалки — отдельный модуль: грузится при первом действии посетителя или через 8 с простоя.
  // Видимая часть (цитатник, гостевая, реклама) — обычный HTML и от модуля не зависит.
  let eggs = null
  const loadEggs = () => (eggs ||= import("./easter-eggs.js?v=202611201546").catch((err) => console.error("[easter-eggs]", err)))
  const triggers = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"]
  const onFirst = () => { triggers.forEach((t) => removeEventListener(t, onFirst)); loadEggs() }
  triggers.forEach((t) => addEventListener(t, onFirst, { passive: true, once: true }))
  setTimeout(() => ("requestIdleCallback" in window ? requestIdleCallback(loadEggs) : loadEggs()), 8000)
})
