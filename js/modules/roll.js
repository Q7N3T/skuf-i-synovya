// «Стригись · Пей · Общайся · Кайфуй»: каждая буква — барабан с буквой дважды.
// Наведение (или фокус) прокатывает буквы слева направо, остальные слова гаснут.
// Когда никто не наводит и блок на экране — слова подсвечиваются сами по очереди.
import { $, $$, reducedMotion } from "./utils.js?v=202611201632"

const STAGGER = 32 // мс между буквами

export function initRoll() {
  const nav = $("#roll")
  if (!nav) return
  const links = $$(".roll__link", nav)

  // буквы → барабаны (без JS остаётся обычный текст)
  links.forEach((link) => {
    const word = $(".roll__word", link)
    const text = word.textContent.trim()
    word.textContent = ""
    ;[...text].forEach((ch, i) => {
      const c = document.createElement("span")
      c.className = "roll__ch"
      c.style.setProperty("--i", i)
      const inner = document.createElement("span")
      inner.className = "roll__in"
      for (let k = 0; k < 2; k++) { const x = document.createElement("i"); x.textContent = ch; inner.append(x) }
      c.append(inner)
      word.append(c)
    })
  })

  let active = null
  const on = (link) => {
    if (active === link) return
    active?.classList.remove("is-on")
    active = link
    link?.classList.add("is-on")
    nav.classList.toggle("is-hot", !!link)
  }

  // пользователь
  let pointerInside = false
  links.forEach((link) => {
    link.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { pointerInside = true; on(link) } })
    link.addEventListener("focus", () => on(link))
    link.addEventListener("blur", () => { if (!pointerInside) on(null) })
  })
  nav.addEventListener("pointerleave", () => { pointerInside = false; on(null); idle = 900 })

  // автопрокрутка: только пока блок виден, без reduced motion и без наведения
  if (reducedMotion) return
  let visible = false, idle = 600, step = 0, last = 0, raf = 0
  const tick = (now) => {
    raf = visible ? requestAnimationFrame(tick) : 0
    const dt = Math.min(100, now - (last || now)); last = now
    if (pointerInside || nav.contains(document.activeElement)) return
    if ((idle -= dt) > 0) return
    if (active) { on(null); idle = 380; step = (step + 1) % links.length }
    else { on(links[step]); idle = 1300 }
  }
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting
    if (visible && !raf) { last = 0; raf = requestAnimationFrame(tick) }
    if (!visible && !pointerInside) on(null)
  }, { threshold: 0.35 }).observe(nav)
}
