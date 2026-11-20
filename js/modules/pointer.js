// Микроинтеракции указателя: курсор-пузырёк и магнитные кнопки. Только точный указатель.
import { $, $$, finePointer, reducedMotion } from "./utils.js?v=202611201546"

const HOVERABLE = "a, button, [data-magnetic], ui-slider-thumb, ui-segmented-control-item, select, input"

export function initPointer() {
  const { gsap } = window
  if (!finePointer || reducedMotion || !gsap) return

  // Курсор-пузырёк
  const cursor = $("#cursor")
  const x = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" })
  const y = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" })
  addEventListener("pointermove", (e) => {
    x(e.clientX); y(e.clientY)
    cursor.classList.add("is-visible")
    cursor.classList.toggle("is-hover", !!e.target.closest?.(HOVERABLE))
  }, { passive: true })
  document.documentElement.addEventListener("pointerleave", () => cursor.classList.remove("is-visible"))

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
