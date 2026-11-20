// Окно ошибки «скидка.exe» в стиле Windows XP вместо перехода на YouTube.
// Esc и клик мимо закрывают, фокус возвращается на ссылку, окно таскается за заголовок мышью.
const $ = (s, r = document) => r.querySelector(s)

const secret = $("#secret")
if (secret) {
  let win = null, opener = null
  function close() {
    if (!win) return
    win.remove(); win = null
    document.removeEventListener("keydown", onKey, true)
    opener?.focus()
  }
  function onKey(e) {
    if (e.key === "Escape") { e.preventDefault(); close() }
    else if (e.key === "Tab" && win) {   // фокус не уходит из окна
      const f = [...win.querySelectorAll("button")], i = f.indexOf(document.activeElement)
      if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus() } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus() }
    }
  }
  secret.addEventListener("click", (e) => {
    e.preventDefault()
    if (win) return
    opener = secret
    win = document.createElement("div")
    win.className = "xperr-layer"
    win.innerHTML = `
      <div class="xperr" role="alertdialog" aria-modal="true" aria-labelledby="xperrTitle" aria-describedby="xperrText">
        <div class="xperr__bar"><span class="xperr__title" id="xperrTitle">скидка.exe</span><button class="xperr__x" type="button" aria-label="Закрыть" data-close>×</button></div>
        <div class="xperr__body">
          <span class="xperr__icon" aria-hidden="true">×</span>
          <p id="xperrText">Программа скидка.exe выполнила недопустимую операцию и будет закрыта.<br />Скидка 90% действует только 29 февраля 2007 года.</p>
        </div>
        <div class="xperr__btns"><button class="xperr__btn" type="button" data-close>ОК</button><button class="xperr__btn" type="button" data-close>Всё равно ОК</button></div>
      </div>`
    document.body.append(win)
    const box = $(".xperr", win)
    win.addEventListener("click", (ev) => { if (ev.target.closest("[data-close]") || !ev.target.closest(".xperr")) close() })
    document.addEventListener("keydown", onKey, true)
    $(".xperr__btn", win).focus()
    // перетаскивание за заголовок (мышь, десктоп)
    const bar = $(".xperr__bar", win)
    let dx = 0, dy = 0, drag = false
    bar.addEventListener("pointerdown", (ev) => {
      if (ev.pointerType !== "mouse" || ev.target.closest("button")) return
      drag = true; const r = box.getBoundingClientRect(); dx = ev.clientX - r.left; dy = ev.clientY - r.top
      bar.setPointerCapture(ev.pointerId)
    })
    bar.addEventListener("pointermove", (ev) => {
      if (!drag) return
      box.style.position = "fixed"; box.style.margin = "0"
      box.style.left = Math.max(0, Math.min(innerWidth - box.offsetWidth, ev.clientX - dx)) + "px"
      box.style.top = Math.max(0, Math.min(innerHeight - box.offsetHeight, ev.clientY - dy)) + "px"
    })
    bar.addEventListener("pointerup", () => { drag = false })
  })
}
