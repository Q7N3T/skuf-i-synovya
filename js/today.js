// Первый экран бара: виджет «Сегодня», табло «На кранах», подсветка дня в афише, мобильная панель брони.
// Данные — только data/afisha.json и data/menu.json. Без JS в разметке остаются ссылка «Афиша недели» и статическая афиша.
import { moscowNow } from "./modules/booking.js?v=202611211356"

const $ = (s, r = document) => r.querySelector(s)
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
const NB = " "
const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m }
const wd = (d) => (d.getDay() === 0 ? 7 : d.getDay())          // 1 = пн … 7 = вс

/* ---------- какая «смена» сейчас: после полуночи ещё идёт вчерашний вечер */
export function session(afisha, now = moscowNow()) {
  const today = wd(now), min = now.getHours() * 60 + now.getMinutes()
  const prev = today === 1 ? 7 : today - 1
  const [, pc] = afisha.hours[prev]
  // вчерашний вечер, который закрывается после полуночи (пт–сб до 01:00)
  if (toMin(pc) > 0 && toMin(pc) < 6 * 60 && min < toMin(pc)) return { day: prev, open: true, until: pc }
  const [o, c] = afisha.hours[today]
  const openMin = toMin(o), closeMin = toMin(c) <= 6 * 60 ? toMin(c) + 24 * 60 : toMin(c)
  if (min >= openMin && min < closeMin) return { day: today, open: true, until: c }
  return { day: today, open: false, opens: o }
}

/* ---------- виджет «Сегодня» */
function renderToday(afisha, s) {
  const body = $("#todayBody")
  if (!body) return
  const d = afisha.days.find((x) => x.day === s.day)
  const status = s.open
    ? `<p class="today__status is-open"><i class="dot" aria-hidden="true"></i>Открыто до${NB}${s.until}</p>`
    : `<p class="today__status"><i class="dot dot--off" aria-hidden="true"></i>Откроемся в${NB}${s.opens}</p>`
  body.innerHTML = `
    <p class="today__day mono">Сегодня, ${d.name}</p>
    <h3 class="today__event">${d.title}</h3>
    <p class="today__meta">${d.time} · ${d.price.replace(/ (?=\d{3}\b)/g, NB).replace(/ ₽/g, NB + "₽")}</p>
    ${status}
    <div class="today__actions">
      <button class="xp__btn xp__btn--default today__go" type="button" data-book="${d.book}" data-day="${d.day}" data-event="${d.dow} · ${d.title}" aria-haspopup="dialog">Иду</button>
      <a class="today__link" href="#afisha">Вся афиша</a>
    </div>`
}

/* ---------- афиша: сегодня — первым, крупно и с бейджем */
function markAfisha(day) {
  const list = $("#afishaList")
  if (!list) return
  const items = [...list.children]
  items.forEach((li) => li.classList.toggle("is-today", +li.dataset.day === day))
  const order = items.slice().sort((a, b) => ((+a.dataset.day - day + 7) % 7) - ((+b.dataset.day - day + 7) % 7))
  order.forEach((li) => list.append(li))
  list.classList.add("has-today")
  list.scrollLeft = 0 // лента на телефоне: браузер держит прежнюю позицию, а первым должен быть сегодняшний день
}

/* ---------- табло «На кранах»: перекидные буквы, один раз при появлении */
const FLAP = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ0123456789"
function renderTaps(menu) {
  const list = $("#tapsList")
  if (!list) return
  const taps = menu.beer.items.filter((x) => x.tap)
  const W = Math.max(...taps.map((t) => t.short.length))
  list.innerHTML = taps.map((t, i) => `
    <li class="tap">
      <span class="tap__n mono" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
      <span class="tap__name" aria-label="${t.short}">${[...t.short.toUpperCase().padEnd(W, " ")].map((ch) => `<i data-ch="${ch}">${ch === " " ? NB : ch}</i>`).join("")}</span>
      <span class="tap__style mono">${t.style} · ${String(t.abv).replace(".", ",")}%</span>
      <span class="tap__price">${t.p05}${NB}₽</span>
    </li>`).join("")
  if (reduce || !("IntersectionObserver" in window)) return
  const cells = [...list.querySelectorAll(".tap__name i")]
  cells.forEach((c) => { if (c.dataset.ch !== " ") c.textContent = FLAP[(Math.random() * FLAP.length) | 0] })
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return
    io.disconnect()
    cells.forEach((c, k) => {
      if (c.dataset.ch === " ") return
      let n = 5 + (k % 7) + Math.floor(k / 9)
      const tick = () => {
        c.classList.remove("is-flip"); void c.offsetWidth; c.classList.add("is-flip")
        c.textContent = --n > 0 ? FLAP[(Math.random() * FLAP.length) | 0] : c.dataset.ch
        if (n > 0) setTimeout(tick, 55)
      }
      setTimeout(tick, 120 + k * 12)
    })
  }, { threshold: 0.4 })
  io.observe(list)
}

/* ---------- мобильная панель: после первого экрана, прячется над футером */
function initMobileBar() {
  const bar = $("#mbar"), hero = $("#top"), footer = $(".footer")
  if (!bar || !hero || !("IntersectionObserver" in window)) return
  let pastHero = false, atFooter = false
  const sync = () => bar.classList.toggle("is-on", pastHero && !atFooter && !document.documentElement.classList.contains("is-booting"))
  new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; sync() }, { rootMargin: "0px 0px -40% 0px" }).observe(hero)
  if (footer) new IntersectionObserver(([e]) => { atFooter = e.isIntersecting; sync() }).observe(footer)
}

async function load(path) {
  const r = await fetch(path, { cache: "no-cache" })
  if (!r.ok) throw new Error(path + " " + r.status)
  return r.json()
}

initMobileBar()
Promise.all([load("data/afisha.json"), load("data/menu.json")])
  .then(([afisha, menu]) => {
    const s = session(afisha)
    renderToday(afisha, s)
    markAfisha(s.day)
    renderTaps(menu)
    window.ScrollTrigger?.refresh()
    // раз в минуту обновляем статус «открыто / откроемся»
    let last = JSON.stringify(s)
    setInterval(() => { const n = session(afisha), k = JSON.stringify(n); if (k !== last) { last = k; renderToday(afisha, n); markAfisha(n.day) } }, 60000)
  })
  .catch((err) => console.warn("[today] данные не загрузились, остаётся статическая афиша", err))
