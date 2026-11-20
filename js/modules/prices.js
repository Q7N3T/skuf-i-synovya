// Прайс: фильтр по категориям (гаснут → сетка перестраивается → новые выплывают) и штампы-бейджи.
import { $, $$, plural, reducedMotion } from "./utils.js?v=202611201511"

export function initPrices() {
  const control = $("#priceFilter")
  const items = $$("#priceGrid .item")
  const count = $("#priceCount")
  const { gsap, ScrollTrigger } = window
  let token = 0

  const apply = (value) => {
    let shown = 0
    items.forEach((item) => {
      const on = value === "all" || item.dataset.cat === value
      item.hidden = !on
      if (on && !item.hasAttribute("data-ad")) shown++ // реклама — не позиция прайса
    })
    $$("#priceGrid .prices__group").forEach((g) => { g.hidden = !(value === "all" || g.dataset.cat === value) })
    count.textContent = `${shown} ${plural(shown, ["позиция", "позиции", "позиций"])}`
    ScrollTrigger?.refresh()
    return items.filter((i) => !i.hidden)
  }

  // Две фазы, чтобы карточки никогда не накладывались друг на друга:
  // текущие гаснут → сетка перестраивается невидимой → новые выплывают по очереди
  const render = (value) => {
    if (!gsap || reducedMotion) return apply(value)
    const my = ++token
    const visible = items.filter((i) => !i.hidden)
    gsap.killTweensOf(items)
    gsap.to(visible, {
      opacity: 0, y: 8, duration: 0.15, ease: "power1.in",
      onComplete: () => {
        if (my !== token) return // пока гасли, нажали другой фильтр
        const next = apply(value)
        gsap.fromTo(next, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: "expo.out", stagger: 0.035, clearProps: "transform" })
      },
    })
  }
  control.addEventListener("valuechange", (e) => render(e.detail.value ?? "all"))

  // Штампы «Хит», «Мем»: «шлёпаются» при появлении
  if (gsap && !reducedMotion) {
    $$("[data-badge]").forEach((badge) => {
      gsap.from(badge, {
        scale: 1.8, opacity: 0, rotate: -40, duration: 0.7, ease: "back.out(2.2)",
        scrollTrigger: { trigger: badge, start: "top 85%", once: true },
      })
    })
  }
}
