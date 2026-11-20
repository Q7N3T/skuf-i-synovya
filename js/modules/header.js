// Шапка: фон после скролла, прячется при скролле вниз, активный пункт меню.
import { $, $$ } from "./utils.js?v=202611201345"

export function initHeader() {
  const header = $("#header")
  const { ScrollTrigger } = window
  let last = 0
  const onScroll = () => {
    const y = scrollY
    header.classList.toggle("is-scrolled", y > 8)
    const menuOpen = $("#menu")?.open || $("#booking")?.open
    header.classList.toggle("is-hidden", y > 400 && y > last && !menuOpen && !header.contains(document.activeElement))
    last = y
  }
  addEventListener("scroll", onScroll, { passive: true })
  onScroll()

  // Активный пункт меню
  const links = $$(".nav__list a")
  const setActive = (id) => links.forEach((a) => a.setAttribute("aria-current", String(a.getAttribute("href") === `#${id}`)))
  $$("main section[id]").forEach((section) => {
    if (!ScrollTrigger) return
    ScrollTrigger.create({
      trigger: section,
      start: "top 45%",
      end: "bottom 45%",
      onToggle: (self) => self.isActive && setActive(section.id),
    })
  })

  // Мобильное меню: «Записаться» закрывает меню и открывает запись
  $("#drawerBook")?.addEventListener("click", () => {
    const menu = $("#menu")
    menu.addEventListener("openchangecomplete", () => { $("#booking").api.open() }, { once: true })
    menu.api.close()
  })
}
