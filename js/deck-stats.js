// Показатели (слайд 12): четыре карточки — число, плашка роста, плавный график.
// Переключение «Месяц / Квартал / Год» катит число, точки графика пружинят к новой высоте одна за другой,
// янтарная пилюля переезжает под выбранный период. Без нажатий периоды листаются сами.
// Цикл анимации крутится только пока слайд открыт.

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
const spring = (x, k, c) => ({ x, v: 0, t: x, k, c: reduce ? 2 * Math.sqrt(k) : c })
const step = (s, dt) => { const a = -s.k * (s.x - s.t) - s.c * s.v; s.v += a * dt; s.x += s.v * dt }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const nb = " "
const group = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, nb)
const comma = (n, d) => n.toFixed(d).replace(".", ",")

// Месяц — из слайда «Экономика»; квартал и год — с ростом загрузки
// Месяц и квартал — после выхода на план (слайд «Экономика»), год — с тремя месяцами раскачки на 60 % загрузки.
// Плашка — не «рост», а показатель из того же расчёта: доля бара, доля ночи, НДС в цене, маржа.
const DATA = {
  rev: {
    fmt: (v) => [comma(v, v >= 100 ? 0 : v >= 10 ? 1 : 2), "млн ₽"], chip: (d) => `бар ${comma(d, 1)}${nb}%`,
    r: [
      { v: 12.99, d: 72.5, note: "Барбершоп 3,57 + бар 9,42 млн", pts: [0.42, 0.5, 0.46, 0.58, 0.55, 0.64, 0.6, 0.7, 0.66, 0.74, 0.7, 0.8] },
      { v: 38.97, d: 72.5, note: "≈ 12,99 млн в месяц × 3", pts: [0.36, 0.44, 0.52, 0.48, 0.6, 0.57, 0.66, 0.63, 0.72, 0.78, 0.75, 0.86] },
      { v: 140.3, d: 72.5, note: "9 месяцев на плане + 3 месяца раскачки", pts: [0.08, 0.16, 0.24, 0.5, 0.56, 0.6, 0.64, 0.7, 0.74, 0.8, 0.86, 0.94] },
    ],
  },
  guests: {
    fmt: (v) => [group(v), "визитов"], chip: (d) => `ночью ${Math.round(d)}${nb}%`,
    r: [
      { v: 11100, d: 62, note: "70 в кресле + 300 в баре в сутки", pts: [0.5, 0.56, 0.48, 0.62, 0.66, 0.58, 0.7, 0.66, 0.74, 0.7, 0.8, 0.84] },
      { v: 33300, d: 62, note: "Пятничное караоке — пик недели", pts: [0.4, 0.48, 0.44, 0.56, 0.6, 0.55, 0.66, 0.7, 0.66, 0.76, 0.8, 0.86] },
      { v: 119880, d: 62, note: "С раскачкой в первые 3 месяца", pts: [0.1, 0.18, 0.26, 0.52, 0.58, 0.62, 0.66, 0.72, 0.76, 0.82, 0.88, 0.94] },
    ],
  },
  check: {
    fmt: (v) => [group(v), "₽"], chip: (d) => `НДС ${Math.round(d)}${nb}% в цене`,
    r: [
      { v: 1170, d: 5, note: "12,99 млн ÷ 11 100 визитов", pts: [0.56, 0.52, 0.6, 0.56, 0.62, 0.58, 0.64, 0.6, 0.66, 0.62, 0.68, 0.7] },
      { v: 1170, d: 5, note: "Комбо «Батя» тянет чек вверх", pts: [0.5, 0.56, 0.52, 0.6, 0.57, 0.63, 0.66, 0.62, 0.68, 0.66, 0.7, 0.72] },
      { v: 1170, d: 5, note: "Барбершоп 1 700 ₽, бар 900–1 100 ₽", pts: [0.44, 0.48, 0.52, 0.5, 0.56, 0.6, 0.58, 0.64, 0.66, 0.68, 0.7, 0.74] },
    ],
  },
  profit: {
    fmt: (v) => [comma(v, v >= 10 ? 1 : 2), "млн ₽"], chip: (d) => `маржа ${comma(d, 1)}${nb}%`,
    r: [
      { v: 2.25, d: 17.3, note: "После УСН 15 % и НДС 5 %", pts: [0.4, 0.46, 0.42, 0.54, 0.5, 0.6, 0.56, 0.66, 0.62, 0.7, 0.68, 0.78] },
      { v: 6.75, d: 17.3, note: "Дивиденды — половина, по 20 % каждому", pts: [0.34, 0.4, 0.48, 0.44, 0.56, 0.54, 0.64, 0.6, 0.7, 0.76, 0.74, 0.86] },
      { v: 21.75, d: 15.5, note: "Запуск 18 млн ₽ окупается ≈ за 10 мес.", pts: [0.04, 0.08, 0.12, 0.42, 0.5, 0.56, 0.62, 0.68, 0.74, 0.8, 0.86, 0.94] },
    ],
  },
}

export function initStats(slide) {
  if (!slide) return () => {}
  const seg = slide.querySelector("#statSeg"), pill = seg.querySelector(".stat-seg__pill")
  const btns = [...seg.querySelectorAll("button")]
  const cards = [...slide.querySelectorAll(".stat")].map((el) => {
    const d = DATA[el.dataset.key]
    return {
      el, d,
      big: el.querySelector("[data-big]"), delta: el.querySelector("[data-delta]"), note: el.querySelector("[data-note]"),
      svg: el.querySelector(".stat__chart"), line: el.querySelector(".stat__line"), fill: el.querySelector(".stat__fill"), dot: el.querySelector(".stat__dot"),
      pts: d.r[0].pts.map(() => spring(0, 200, 17)), val: spring(0, 160, 22), dv: spring(0, 160, 22),
    }
  })
  const px = spring(0, 380, 30), pw = spring(0, 380, 30)
  let r = -1, active = false, raf = 0, last = 0, clock = 0, nextAuto = 3.2, userUntil = 0
  const timers = []
  const after = (sec, fn) => timers.push({ t: sec, fn })

  function pick(i) {
    r = i
    btns.forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)))
    px.t = btns[i].offsetLeft; pw.t = btns[i].offsetWidth
    if (!pw.x) { px.x = px.t; pw.x = pw.t }
    cards.forEach((c, ci) => {
      const R = c.d.r[i]
      c.val.t = R.v; c.dv.t = R.d
      c.note.textContent = R.note
      c.pts.forEach((p, k) => after(ci * 0.05 + k * 0.03, () => { if (r === i) p.t = R.pts[k] }))
    })
  }
  btns.forEach((b, i) => b.addEventListener("click", () => { userUntil = clock + 8; nextAuto = clock + 8; pick(i) }))

  function render() {
    cards.forEach((c) => {
      const W = c.svg.clientWidth, H = c.svg.clientHeight, n = c.pts.length
      c.svg.setAttribute("viewBox", `0 0 ${W} ${H}`)
      const xy = c.pts.map((p, i) => [6 + (i / (n - 1)) * (W - 12), 10 + (1 - clamp(p.x, -0.05, 1.05)) * (H - 20)])
      let d = `M${xy[0][0].toFixed(1)} ${xy[0][1].toFixed(1)}`
      for (let i = 0; i < n - 1; i++) {
        const p0 = xy[i - 1] || xy[i], p1 = xy[i], p2 = xy[i + 1], p3 = xy[i + 2] || p2
        d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
      }
      c.line.setAttribute("d", d)
      c.fill.setAttribute("d", `${d} L${xy[n - 1][0].toFixed(1)} ${H} L${xy[0][0].toFixed(1)} ${H} Z`)
      const [lx, ly] = xy[n - 1]
      c.dot.style.transform = `translate(${(lx - 7).toFixed(1)}px,${(ly - 7).toFixed(1)}px)`
      const [num, unit] = c.d.fmt(Math.max(0, c.val.x))
      c.big.innerHTML = `${num}<small>${unit}</small>`
      c.delta.textContent = c.d.chip(Math.max(0, c.dv.x))
    })
    pill.style.transform = `translateX(${px.x.toFixed(1)}px)`
    pill.style.width = `${pw.x.toFixed(1)}px`
  }

  function loop(now) {
    raf = active ? requestAnimationFrame(loop) : 0
    const dt = Math.min((now - (last || now)) / 1000, 1 / 30); last = now
    clock += dt
    for (let i = timers.length - 1; i >= 0; i--) if ((timers[i].t -= dt) <= 0) timers.splice(i, 1)[0].fn()
    if (!reduce && clock >= nextAuto && clock >= userUntil) { pick((r + 1) % 3); nextAuto = clock + 3.2 }
    for (let s = 0; s < 4; s++) {
      cards.forEach((c) => { c.pts.forEach((p) => step(p, dt / 4)); step(c.val, dt / 4); step(c.dv, dt / 4) })
      step(px, dt / 4); step(pw, dt / 4)
    }
    render()
  }

  // вызывается при каждой смене слайда: включаем цикл на своём слайде, выключаем на остальных
  return (isActive) => {
    if (isActive === active) return
    active = isActive
    if (active) {
      // каждый показ — с нуля: график вырастает, числа набегают
      cards.forEach((c) => { c.pts.forEach((p) => { p.x = 0; p.v = 0 }); c.val.x = 0; c.dv.x = 0 })
      clock = 0; nextAuto = 3.6; userUntil = 0; timers.length = 0; last = 0
      pick(0)
      raf = requestAnimationFrame(loop)
    } else if (raf) { cancelAnimationFrame(raf); raf = 0 }
  }
}
