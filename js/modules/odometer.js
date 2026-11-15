// Одометр «Ты посетитель №…»: каждая цифра прокручивается барабаном.

export function setupOdometer(el, value) {
  const digits = String(value).split("")
  el.setAttribute("aria-label", Number(value).toLocaleString("ru-RU"))
  el.setAttribute("role", "img")
  el.textContent = ""
  digits.forEach((d, i) => {
    // разделитель тысяч: 2 007 431
    if (i > 0 && (digits.length - i) % 3 === 0) {
      const gap = document.createElement("span")
      gap.className = "odo__gap"
      el.append(gap)
    }
    const cell = document.createElement("span")
    cell.className = "odo__d"
    const col = document.createElement("span")
    col.className = "odo__col"
    col.dataset.digit = d
    for (let k = 0; k < 20; k++) {
      const s = document.createElement("span")
      s.textContent = k % 10
      col.append(s)
    }
    cell.append(col)
    el.append(cell)
  })
}

export function runOdometer(el, instant = false) {
  const { gsap } = window
  ;[...el.querySelectorAll(".odo__col")].forEach((col, i) => {
    const target = 10 + Number(col.dataset.digit)
    const y = `${-target * 1.5}em`
    if (instant || !gsap) col.style.transform = `translateY(${y})`
    else gsap.fromTo(col, { y: 0 }, { y, duration: 1.6 + i * 0.12, ease: "expo.out" })
  })
}
