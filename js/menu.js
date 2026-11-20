// Меню: липкая полоска разделов (Пиво · Закуски · Движ · Сеты · Барбершоп).
// Это ссылки-якоря (работают и без JS); с JS — плавный скролл с учётом шапки и полоски,
// а активный раздел подсвечивается сам, пока листаешь меню.
import { getLenis } from "./modules/smooth.js?v=202611201610"

const nav = document.getElementById("menuTabs")
if (nav) {
  const tabs = [...nav.querySelectorAll(".mtab")]
  const secs = tabs.map((t) => document.getElementById(t.hash.slice(1))).filter(Boolean)
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches

  const offset = () => {
    const h = document.querySelector(".header")
    const headerH = h && !h.classList.contains("is-hidden") ? h.offsetHeight : 0
    return headerH + nav.offsetHeight + 12
  }
  const setActive = (id) => tabs.forEach((t) => {
    const on = t.hash === "#" + id
    if (on) t.setAttribute("aria-current", "true"); else t.removeAttribute("aria-current")
    // на телефоне полоска листается — держим активный таб в поле зрения
    if (on && nav.scrollWidth > nav.clientWidth) {
      const row = nav.querySelector(".mtabs__row") || nav
      row.scrollTo({ left: t.offsetLeft - 16, behavior: reduce ? "auto" : "smooth" })
    }
  })

  tabs.forEach((t) => t.addEventListener("click", (e) => {
    const target = document.getElementById(t.hash.slice(1))
    if (!target) return
    e.preventDefault()
    setActive(target.id)
    const lenis = getLenis()
    const y = target.getBoundingClientRect().top + scrollY - offset()
    if (lenis) lenis.scrollTo(y, { duration: reduce ? 0 : 1.1 })
    else scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" })
    history.replaceState(null, "", t.hash)
  }))

  // активный раздел — тот, что пересекает линию чуть ниже полоски
  let ticking = false
  const spy = () => {
    ticking = false
    const line = offset() + 24
    let cur = secs[0]
    for (const s of secs) if (s.getBoundingClientRect().top <= line) cur = s
    if (cur) setActive(cur.id)
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(spy) } }, { passive: true })

  // полоска «прилипла» — даём ей подложку и тень
  const sentinel = document.createElement("div")
  sentinel.className = "mtabs__sentinel"
  nav.before(sentinel)
  new IntersectionObserver(([e]) => nav.classList.toggle("is-stuck", !e.isIntersecting && e.boundingClientRect.top < 0), { rootMargin: "-90px 0px 0px 0px" }).observe(sentinel)
}
