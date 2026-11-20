// Бесшовная бегущая строка: ускоряется от скорости скролла, пауза при hover/focus и кнопкой.
import { $, reducedMotion, store } from "./utils.js?v=202611201355"

export function initMarquee(lenis) {
  const root = $("#marquee")
  const track = $(".marquee__track", root)
  const group = $(".marquee__group", root)
  const toggle = $("#marqueeToggle")
  const { gsap } = window

  // Клоны группы, чтобы лента была шире двух экранов
  const clones = Math.max(1, Math.ceil((innerWidth * 2) / group.offsetWidth))
  for (let i = 0; i < clones; i++) track.append(group.cloneNode(true))

  if (!gsap || reducedMotion) return

  const width = group.offsetWidth
  const tween = gsap.fromTo(track, { x: 0 }, { x: -width, duration: width / 70, ease: "none", repeat: -1 })

  let userPaused = store.get("skuf-marquee-paused") === "1"
  let hover = false
  const apply = () => (userPaused || hover ? tween.pause() : tween.resume())
  customElements.whenDefined("ui-toggle").then(() => { toggle.pressed = userPaused })
  toggle.addEventListener("pressedchange", (e) => {
    userPaused = e.detail.value
    store.set("skuf-marquee-paused", userPaused ? "1" : "0")
    apply()
  })
  root.addEventListener("pointerenter", () => { hover = true; apply() })
  root.addEventListener("pointerleave", () => { hover = false; apply() })
  root.addEventListener("focusin", () => { hover = true; apply() })
  root.addEventListener("focusout", () => { hover = false; apply() })
  apply()

  // Ускорение от скролла: timeScale растёт и плавно возвращается к 1
  const boost = (velocity) => {
    if (tween.paused()) return
    const ts = 1 + Math.min(Math.abs(velocity) / 12, 5)
    gsap.to(tween, { timeScale: ts * Math.sign(velocity || 1), duration: 0.2, overwrite: true })
    gsap.to(tween, { timeScale: 1, duration: 1.2, delay: 0.2, ease: "power2.out" })
  }
  if (lenis) lenis.on("scroll", ({ velocity }) => boost(velocity))
  else window.ScrollTrigger?.create({ onUpdate: (self) => boost(self.getVelocity() / 60) })
}
