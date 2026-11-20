// Плавный скролл (Lenis) в связке с ScrollTrigger + якоря с отступом под шапку.
import { $, $$, reducedMotion } from "./utils.js?v=202611201610"

let lenis = null

export function initSmooth() {
  const { gsap, ScrollTrigger, Lenis } = window
  if (!reducedMotion && Lenis && gsap) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
    lenis.on("scroll", ScrollTrigger.update)
    gsap.ticker.add((time) => lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)
  }

  // Модальные окна: пока открыты, страница не скроллится
  $$("ui-dialog").forEach((dialog) => {
    dialog.addEventListener("openchange", (e) => (e.detail.value ? lenis?.stop() : lenis?.start()))
  })

  // Якоря
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]')
    if (!link || e.defaultPrevented) return   // ссылку уже обработали (например, «скидка.exe»)
    const id = link.getAttribute("href")
    const target = id === "#top" ? document.body : $(id)
    if (!target) return
    e.preventDefault()
    const menu = $("#menu")
    const go = () => scrollToTarget(target, id)
    if (link.hasAttribute("data-close") && menu?.open) {
      // ждём, пока меню закроется и ui-sdk снимет блокировку прокрутки
      menu.addEventListener("openchangecomplete", () => requestAnimationFrame(go), { once: true })
      menu.api.close()
    } else go()
  })
  return lenis
}

export function scrollToTarget(target, id, instant = false) {
  const offset = -(parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) * 16 || 64)
  lenis?.start()
  if (lenis) lenis.scrollTo(target, { offset: id === "#top" ? 0 : offset, duration: 1.4, immediate: instant })
  else target.scrollIntoView({ behavior: reducedMotion || instant ? "auto" : "smooth" })
  history.replaceState(null, "", id === "#top" ? location.pathname : id)
  // Фокус в секцию — для клавиатуры и скринридеров
  if (id !== "#top") {
    target.setAttribute("tabindex", "-1")
    target.focus({ preventScroll: true })
  }
}

export const getLenis = () => lenis
