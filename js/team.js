// «Наши бати» — «Топ-5 друзей» 2007 года.
// Карточка открывает анкету (одна за раз): на десктопе — широкой панелью под рядом карточек, на телефоне — под своей карточкой.
// «5+» — как оценка на «Одноклассниках»: один раз с одного браузера. Звук «о-оу» — при раскрытии анкеты, если включён.
// Разметку собирает tools/build-data.py из data/team.json; без JS все анкеты открыты.
import { sound, store } from "./modules/utils.js?v=202611201632"
import { getLenis } from "./modules/smooth.js?v=202611201632"

const list = document.getElementById("teamList")
if (list) {
  const root = document.documentElement
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
  const items = [...list.querySelectorAll(".bati__item")]
  const DUR = reduce ? 0 : 300
  let open = null // текущий .bati__item

  list.classList.add("is-js")
  items.forEach((it) => { it.querySelector(".anketa").hidden = true })

  const parts = (it) => ({ btn: it.querySelector(".buddy__open"), panel: it.querySelector(".anketa") })

  function animateHeight(el, from, to) {
    if (!DUR || !el.animate) return Promise.resolve()
    el.style.overflow = "clip"
    return el.animate([{ height: from + "px", opacity: from ? 1 : 0.4 }, { height: to + "px", opacity: to ? 1 : 0.4 }],
      { duration: DUR, easing: "cubic-bezier(.2,.7,.2,1)" }).finished.then(() => { el.style.overflow = "" })
  }

  async function close(it, { focus = true, instant = false } = {}) {
    const { btn, panel } = parts(it)
    btn.setAttribute("aria-expanded", "false")
    it.classList.remove("is-open")
    if (!instant) await animateHeight(panel, panel.offsetHeight, 0)
    panel.hidden = true
    if (open === it) { open = null; list.classList.remove("has-open") }
    if (focus) btn.focus({ preventScroll: true })
  }

  async function show(it) {
    if (open && open !== it) close(open, { focus: false, instant: true })
    const { btn, panel } = parts(it)
    open = it
    btn.setAttribute("aria-expanded", "true")
    it.classList.add("is-open")
    list.classList.add("has-open")
    panel.hidden = false
    sound.uhOh() // «о-оу» — только если звук включён
    await animateHeight(panel, 0, panel.offsetHeight)
    panel.focus({ preventScroll: true })
    // анкета целиком в поле зрения
    const r = panel.getBoundingClientRect()
    if (r.bottom > innerHeight || r.top < 0) {
      const lenis = getLenis()
      const y = scrollY + r.top - Math.max(80, (innerHeight - r.height) / 2)
      if (lenis?.scrollTo) lenis.scrollTo(y, { duration: reduce ? 0 : 0.8 }); else scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" })
    }
    window.ScrollTrigger?.refresh()
  }

  items.forEach((it) => {
    const { btn, panel } = parts(it)
    btn.addEventListener("click", () => (open === it ? close(it) : show(it)))
    panel.querySelector("[data-close-anketa]")?.addEventListener("click", () => close(it))
  })
  // перехват на погружении: пока открыто окно брони или меню, Esc закрывает их, а не анкету
  addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !open) return
    if ([...document.querySelectorAll("ui-dialog")].some((d) => d.open)) return
    e.preventDefault(); close(open)
  }, true)

  /* ---------- «5+» */
  const KEY = (id) => `skuf-5plus-${id}`
  const rated = (id) => { try { return store.get(KEY(id)) === "1" } catch { return false } }
  list.querySelectorAll("[data-rate]").forEach((b) => {
    const id = b.dataset.rate, base = +b.dataset.base, name = b.closest(".bati__item").querySelector(".buddy__name").textContent
    const count = b.querySelector(".buddy__count")
    const paint = () => {
      const on = rated(id)
      count.textContent = base + (on ? 1 : 0)
      b.classList.toggle("is-rated", on)
      b.setAttribute("aria-label", on ? `Батя уже оценён — ${name}. Оценок: ${base + 1}` : `Поставить 5+ — ${name}. Оценок: ${base}`)
    }
    paint()
    b.addEventListener("click", () => {
      if (rated(id)) return tip(b, "Батя уже оценён")
      try { store.set(KEY(id), "1") } catch {}
      paint()
      if (!rated(id)) { count.textContent = base + 1; b.classList.add("is-rated") } // localStorage недоступен — хотя бы в этой вкладке
      plusOne(b)
    })
  })

  function plusOne(b) {
    if (reduce) return
    const s = document.createElement("span")
    s.className = "buddy__plus mono"; s.textContent = "+1"; s.setAttribute("aria-hidden", "true")
    b.append(s)
    s.addEventListener("animationend", () => s.remove(), { once: true })
  }
  let tipTimer = 0
  function tip(b, text) {
    b.querySelector(".buddy__tip")?.remove()
    const t = document.createElement("span")
    t.className = "buddy__tip mono"; t.setAttribute("role", "status"); t.textContent = text
    b.append(t)
    clearTimeout(tipTimer); tipTimer = setTimeout(() => t.remove(), 1600)
  }

  /* ---------- чекбокс «Звук при входе друга» — та же логика, что у старого переключателя */
  const check = document.getElementById("soundCheck")
  if (check) {
    check.checked = sound.enabled
    check.addEventListener("change", () => { sound.enabled = check.checked; if (check.checked) sound.uhOh() })
  }
  root.classList.add("team-ready")
}
