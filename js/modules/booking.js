// Единая бронь: стол, караоке, приставка, праздник, стрижка (и карта «Пузо Карт»).
// Любая кнопка с data-book="тип" (и, по желанию, data-event="…") открывает форму с нужными полями.
// Заявки никуда не уходят — учебный проект — но окно «Заявка принята» показываем честно.
import { $, $$ } from "./utils.js?v=202611201747"

const DAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"]
const MONTHS = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]

// часы работы: бар 12–00 (пт–сб 13–01), барбершоп 10–22; последняя бронь — за час до закрытия
const TYPES = {
  table:   { label: "стол",        hours: (d) => (d === 5 || d === 6 ? [13, 23] : [12, 22]), guests: [1, 12], def: 4, submit: "Забронировать стол", time: 19 },
  karaoke: { label: "караоке",     hours: () => [20, 23], days: [5, 6], guests: [4, 6], def: 5, submit: "Забронировать караоке", time: 20 },
  console: { label: "приставку",   hours: (d) => (d === 5 || d === 6 ? [13, 23] : [12, 22]), guests: [1, 4], def: 2, submit: "Забронировать приставку", time: 18 },
  party:   { label: "праздник",    hours: (d) => (d === 5 || d === 6 ? [13, 21] : [12, 20]), guests: [10, 48], step: 2, def: 20, submit: "Обсудить праздник", time: 19, horizon: 60 },
  barber:  { label: "стрижку",     hours: () => [10, 21], guests: null, submit: "Записаться на стрижку", time: 12 },
  card:    { label: "карту «Пузо Карт»", hours: (d) => (d === 5 || d === 6 ? [13, 23] : [12, 22]), guests: null, submit: "Оформить карту", time: 19 },
}

// «сейчас» по Москве (можно подменить ?now=2026-11-20T23:30 — для проверки)
export function moscowNow() {
  const q = new URLSearchParams(location.search).get("now")
  if (q) { const [d, t = "12:00"] = q.split("T"); const [y, m, dd] = d.split("-").map(Number); const [h, mi] = t.split(":").map(Number); return new Date(y, m - 1, dd, h, mi) }
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
    .formatToParts(new Date()).map((x) => [x.type, x.value]))
  return new Date(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute)
}

const el = {}
let state = { type: "table", event: "" }

function fillDays() {
  const t = TYPES[state.type], now = moscowNow(), prev = el.day.value
  el.day.innerHTML = ""
  const horizon = t.horizon || 14
  for (let i = 0; i < horizon; i++) {
    const d = new Date(now); d.setDate(now.getDate() + i)
    const wd = d.getDay()
    if (t.days && !t.days.includes(wd)) continue
    const label = (i === 0 ? "Сегодня, " : i === 1 ? "Завтра, " : "") + `${DAYS[wd]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    el.day.add(new Option(label, iso))
  }
  if ([...el.day.options].some((o) => o.value === prev)) el.day.value = prev
}

function fillTimes() {
  const t = TYPES[state.type]
  const [y, m, d] = el.day.value.split("-").map(Number)
  const wd = new Date(y, m - 1, d).getDay()
  const [from, to] = t.hours(wd)
  const now = moscowNow(), isToday = now.getFullYear() === y && now.getMonth() === m - 1 && now.getDate() === d
  const prev = el.time.value
  el.time.innerHTML = ""
  for (let h = from; h <= to; h++) {
    if (isToday && h <= now.getHours()) continue
    el.time.add(new Option(`${h}:00`, `${h}:00`))
  }
  if (!el.time.options.length) el.time.add(new Option("на сегодня всё занято — выбери другой день", ""))
  const want = [...el.time.options].find((o) => o.value === prev) || [...el.time.options].find((o) => o.value === `${t.time}:00`)
  if (want) el.time.value = want.value
}

function fillGuests() {
  const t = TYPES[state.type]
  el.guestsField.hidden = !t.guests
  if (!t.guests) return
  el.guests.innerHTML = ""
  const [a, b] = t.guests, step = t.step || 1
  for (let n = a; n <= b; n += step) el.guests.add(new Option(String(n), String(n)))
  el.guests.value = String(t.def)
}

function applyType(type) {
  state.type = TYPES[type] ? type : "table"
  el.type.value = state.type
  fillDays(); fillTimes(); fillGuests()
  el.submit.textContent = TYPES[state.type].submit
}

/** Открыть форму: openBooking({ type: "karaoke", event: "Пт · Караоке нулевых" }).
 *  Старый вызов из «Пузо Карт» — openBooking({ service: "card" }) — тоже работает. */
export function openBooking({ type, service, event = "", note = "", day = 0 } = {}) {
  state.event = event || note
  applyType(type || (service === "card" ? "card" : "table"))
  // событие из афиши — сразу ближайшая дата этого дня недели (1 = пн … 7 = вс)
  if (day) {
    const opt = [...el.day.options].find((o) => { const [y, m, d] = o.value.split("-").map(Number); return (new Date(y, m - 1, d).getDay() || 7) === day })
    if (opt) { el.day.value = opt.value; fillTimes() }
  }
  el.event.hidden = !state.event
  el.event.textContent = state.event ? `Событие: ${state.event}` : ""
  $("#booking").api.open()
}

export function initBooking() {
  Object.assign(el, {
    dialog: $("#booking"), form: $("#bookForm"), done: $("#formDone"), error: $("#formError"),
    type: $("#f-type"), day: $("#f-day"), time: $("#f-time"), guests: $("#f-guests"), guestsField: $("#guestsField"),
    event: $("#bookEvent"), submit: $("#bookSubmit"),
  })
  applyType("table")

  // все кнопки «Забронировать», «Иду», «Записаться на стрижку» — одна форма
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-book]")
    if (!b) return
    e.preventDefault()
    openBooking({ type: b.dataset.book, event: b.dataset.event || "", day: +b.dataset.day || 0 })
  })

  el.type.addEventListener("change", () => { state.event = ""; el.event.hidden = true; applyType(el.type.value) })
  el.day.addEventListener("change", fillTimes)

  const invalid = (input, message) => {
    input.setAttribute("aria-invalid", "true")
    input.setAttribute("aria-describedby", "formError")
    el.error.textContent = message
    input.focus()
  }
  const clear = (e) => { e.target.removeAttribute("aria-invalid"); el.error.textContent = "" }
  el.form.addEventListener("change", clear)
  el.form.addEventListener("input", clear)

  el.form.addEventListener("submit", (e) => {
    e.preventDefault()
    const name = $("#f-name"), phone = $("#f-phone"), consent = $("#f-consent")
    if (!el.time.value) return invalid(el.time, "На этот день свободного времени нет — выбери другой.")
    if (!name.value.trim()) return invalid(name, "Напиши, как к тебе обращаться.")
    if (phone.value.replace(/\D/g, "").length < 10) return invalid(phone, "В телефоне нужно хотя бы 10 цифр.")
    if (!consent.checked) return invalid(consent, "Поставь галочку согласия на обработку данных — без неё бронь не примем.")
    const t = TYPES[state.type]
    $("#doneName").textContent = name.value.trim()
    $("#doneWhat").textContent = (state.event || t.label) + (t.guests && !el.guestsField.hidden ? `, гостей: ${el.guests.value}` : "")
    $("#doneWhen").textContent = `${el.day.selectedOptions[0].textContent.toLowerCase()}, ${el.time.value}`
    el.form.hidden = true
    el.done.hidden = false
    el.done.querySelector("button")?.focus()
  })

  // после закрытия — форма снова чистая, по умолчанию «стол»
  el.dialog.addEventListener("openchangecomplete", () => {
    if (el.dialog.open) return
    el.form.reset()
    state.event = ""; el.event.hidden = true
    applyType("table")
    el.form.hidden = false
    el.done.hidden = true
    el.error.textContent = ""
    $$("[aria-invalid]", el.form).forEach((x) => x.removeAttribute("aria-invalid"))
  })
}
