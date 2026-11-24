// Магнитные кнопки. Только точный указатель. Курсор — банка пива — живёт в CSS (css/home.css) и js/cursor.js.
import { $$, finePointer, reducedMotion } from "./utils.js?v=202611241505"


export function initPointer() {
  const { gsap } = window
  if (!finePointer || reducedMotion || !gsap) return

  // Магнитные кнопки
  $$("[data-magnetic]").forEach((el) => {
    const mx = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" })
    const my = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" })
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect()
      mx((e.clientX - r.left - r.width / 2) * 0.28)
      my((e.clientY - r.top - r.height / 2) * 0.35)
    })
    el.addEventListener("pointerleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.45)" })
    })
  })
}
