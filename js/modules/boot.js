// Прелоадер «Скуф XP»: ~1.3 с, пропуск по клику, только при первом визите в сессии.
import { $, store, reducedMotion } from "./utils.js?v=202611201328"

const LOG = ["Дозвон до 2007-го… 56 кбит/с", "Соединение установлено", "Загрузка бороды… 100%"]

export function boot() {
  const root = document.documentElement
  const el = $("#boot")
  if (!root.classList.contains("is-booting") || !el) return Promise.resolve()
  store.set("skuf-booted", "1", sessionStorage)

  return new Promise((resolve) => {
    const log = $("#bootLog")
    let step = 0
    const tick = setInterval(() => { if (log && LOG[++step]) log.textContent = LOG[step] }, 330)
    let done = false
    const finish = () => {
      if (done) return
      done = true
      clearInterval(tick)
      const gsap = window.gsap
      const end = () => root.classList.remove("is-booting")
      resolve() // интро стартует вместе с уходом заставки
      if (gsap && !reducedMotion) gsap.to(el, { yPercent: -100, duration: 0.7, ease: "expo.inOut", onComplete: end })
      else end()
    }
    el.addEventListener("click", finish, { once: true })
    addEventListener("keydown", (e) => { if (e.key === "Escape" || e.key === "Enter") finish() }, { once: true })
    setTimeout(finish, reducedMotion ? 300 : 1000)
  })
}
