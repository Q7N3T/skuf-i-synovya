// Модалка записи: дни и время, проверка полей, честное сообщение «учебный проект».
import { $ } from "./utils.js?v=202611201546"

const DAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]

function fillSlots() {
  const day = $("#f-day")
  const time = $("#f-time")
  const today = new Date()
  day.innerHTML = ""
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const label = i === 0 ? "Сегодня" : i === 1 ? "Завтра" : `${DAYS[d.getDay()]}, ${d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}`
    day.add(new Option(label, d.toISOString().slice(0, 10)))
  }
  time.innerHTML = ""
  // бар работает до полуночи (пт–сб до 01:00), барбершоп — до 22:00
  for (let h = 12; h <= 23; h++) time.add(new Option(`${h}:00`, `${h}:00`))
  time.value = "19:00"
}

export function openBooking({ service } = {}) {
  const dialog = $("#booking")
  if (service) $("#f-service").value = service
  dialog.api.open()
}

export function initBooking() {
  const dialog = $("#booking")
  const form = $("#bookForm")
  const done = $("#formDone")
  const error = $("#formError")
  fillSlots()

  const invalid = (input, message) => {
    input.setAttribute("aria-invalid", "true")
    input.setAttribute("aria-describedby", "formError")
    error.textContent = message
    input.focus()
  }

  form.addEventListener("change", (e) => {
    e.target.removeAttribute("aria-invalid")
    error.textContent = ""
  })
  form.addEventListener("input", (e) => {
    e.target.removeAttribute("aria-invalid")
    error.textContent = ""
  })

  form.addEventListener("submit", (e) => {
    e.preventDefault()
    const name = $("#f-name")
    const phone = $("#f-phone")
    if (!name.value.trim()) return invalid(name, "Напиши, как к тебе обращаться.")
    if (phone.value.replace(/\D/g, "").length < 10) return invalid(phone, "В телефоне нужно хотя бы 10 цифр.")
    const consent = $("#f-consent")
    if (!consent.checked) return invalid(consent, "Поставь галочку согласия на обработку данных — без неё запись не примем.")
    $("#doneName").textContent = name.value.trim()
    form.hidden = true
    done.hidden = false
    done.querySelector("button")?.focus()
  })

  // После закрытия — форма снова чистая
  dialog.addEventListener("openchangecomplete", () => {
    if (dialog.open) return
    form.reset()
    fillSlots()
    form.hidden = false
    done.hidden = true
    error.textContent = ""
    form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"))
  })
}
