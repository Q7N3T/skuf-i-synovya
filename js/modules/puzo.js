// «Пузо Карт»: пузометр (0–20 кружек, дальше — рывок до 300) → уровень карты и скидка; 3D-наклон и блик карты.
import { $, $$, reducedMotion, finePointer, sound, toast } from "./utils.js?v=202611201355"
import { openBooking } from "./booking.js?v=202611201355"

const LEVELS = [
  { min: 0, id: "bronze", name: "Бронза", disc: 5 },
  { min: 5, id: "gold", name: "Голда", disc: 10 },
  { min: 10, id: "platinum", name: "Платинум", disc: 15 },
  { min: 15, id: "legend", name: "Легенда", disc: 20 },
  { min: 300, id: "max", name: "Батя-Абсолют", disc: 50 },
]
// Шкала ползунка: позиции 0–20 — кружки как есть, позиция 30 — сразу 300.
// Между 20 и 30 ползунок не останавливается: защёлкивается на ближайший край (стрелками — шаг 20 ↔ 300).
const MAX_POS = 30
// Ползунок плавный (шаг 0,1). На отрезке 20 → 300 счётчик набегает вместе с ползунком,
// отпустили посередине — ползунок быстро и мягко доезжает до ближайшего края.
const toMugs = (pos) => (pos <= 20 ? Math.round(pos) : pos >= MAX_POS ? 300 : Math.round(20 + ((pos - 20) / (MAX_POS - 20)) * 280))

const CLIPS = {
  bronze: { src: "assets/video/bronze.mp4", poster: "assets/video/bronze.jpg", title: "Чика!", toast: "Уровень «Бронза»: на карте играет Артур Пирожков." },
  gold: { src: "assets/video/gold.mp4", poster: "assets/video/gold.jpg", title: "Скибиди!", toast: "Уровень «Голда»: на карте играет Little Big." },
  platinum: { src: "assets/video/platinum.mp4", poster: "assets/video/platinum.jpg", title: "Я звезда!", toast: "Уровень «Платинум»: на карте играет Артур Пирожков." },
  max: { src: "assets/video/legend300.mp4", poster: "assets/video/legend300.jpg", title: "Батя-Абсолют", toast: "300 кружек в месяц, скидка 50%. На карте — «Как Челентано»." },
}

export function initPuzo() {
  const slider = $("#puzometr")
  const card = $("#pcard")
  const out = $("#mugs")
  const rows = $$("#levels li")
  let current = null
  const clip = cardClip(card, () => current)

  const render = (v, byUser = false) => {
    const value = Math.round(Number(v))
    out.textContent = value
    const level = LEVELS.filter((l) => value >= l.min).at(-1)
    rows.forEach((li) => {
      const min = Number(li.dataset.min)
      li.classList.toggle("is-active", min === level.min)
      li.classList.toggle("is-passed", min < level.min)
    })
    if (current !== level.id) {
      if (byUser && level.id === "legend") {
        sound.legend()
        toast("Батя, ты в порядке?!", "Уровень «Легенда»: пузо к небу, скидка 20%.", 4200, "puzo")
      } else if (current === "legend") sound.stopLegend() // ушли с «Легенды» — звук замолкает
      current = level.id
      card.dataset.level = level.id
      $("#cardLvl").textContent = level.name
      $("#cardCtaLvl").textContent = level.name
      $("#cardDisc").textContent = `−${level.disc}%`
      if (window.gsap && !reducedMotion) window.gsap.fromTo("#pcardStage", { scale: 0.96 }, { scale: 1, duration: 0.6, ease: "back.out(3)" })
    }
    // клип уровня: стартует от действия посетителя — в том числе если он просто тронул пузометр на «Голде»
    if (CLIPS[level.id]) {
      if (byUser && (clip.current !== level.id || clip.previewing)) {
        clip.play(level.id)
        toast(CLIPS[level.id].title, CLIPS[level.id].toast, 4200, "puzo")
      }
    } else if (clip.current) clip.stop()
    slider.setAttribute("data-level", level.name)
    slider.querySelector("input, [role=slider]")?.setAttribute("aria-valuetext", `${value} ${value === 300 ? "кружек — уровень " + level.name : "кружек"}`)
    return level
  }
  render(8)
  let pos = 8, anim = 0
  // плавный доезд: easeOutCubic, обычный шаг — 0,16 с, рывок 20 ↔ 300 — 0,42 с
  const glide = (to, ms) => {
    cancelAnimationFrame(anim)
    const from = pos, t0 = performance.now()
    if (reducedMotion || from === to) { pos = to; slider.value = to; render(toMugs(to), true); return }
    const frame = (now) => {
      const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3)
      pos = from + (to - from) * e
      slider.value = Math.round(pos * 10) / 10
      if (k < 1) { out.textContent = toMugs(pos); anim = requestAnimationFrame(frame) } // по пути — только счётчик
      else { pos = to; slider.value = to; render(toMugs(to), true) } // уровень и клип — когда доехали
    }
    anim = requestAnimationFrame(frame)
  }
  // порог по направлению: тянешь вверх от 20 — хватит чуть зайти на рывок, тянешь вниз от 300 — чуть сдвинуть
  let dragFrom = pos
  const snapTarget = (p) => (p > 20 && p < MAX_POS ? (dragFrom >= MAX_POS ? (p < MAX_POS - 1 ? 20 : MAX_POS) : (p > 21 ? MAX_POS : 20)) : Math.round(p))
  slider.addEventListener("pointerdown", () => { dragFrom = pos }, true)

  // мышь и палец: ползунок едет свободно, счётчик — следом
  slider.addEventListener("valuechange", (e) => {
    cancelAnimationFrame(anim)
    pos = Number(e.detail.value)
    if (pos > 20 && pos < MAX_POS) out.textContent = toMugs(pos) // на рывке уровень не меняется, пока не доехали
    else render(toMugs(pos), true)
  })
  slider.addEventListener("valuecommit", (e) => {
    const p = Number(e.detail.value)
    requestAnimationFrame(() => {
      pos = p
      const to = snapTarget(p)
      glide(to, Math.abs(to - p) > 2 ? 420 : 160)
    })
  })

  // клавиатура: целые шаги, плавно; с 20 вправо — рывок до 300, с 300 влево — обратно на 20
  slider.addEventListener("keydown", (e) => {
    const cur = snapTarget(pos)
    const steps = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 5, PageDown: -5 }
    dragFrom = cur
    let to
    if (e.key in steps) {
      const d = steps[e.key]
      to = d > 0 && cur >= 20 ? MAX_POS : d < 0 && cur >= MAX_POS ? 20 : Math.max(0, Math.min(20, cur + d))
    } else if (e.key === "Home") to = 0
    else if (e.key === "End") to = MAX_POS
    else return
    e.preventDefault(); e.stopPropagation()
    glide(to, Math.abs(to - cur) > 2 ? 420 : 160)
  }, true)

  $("#cardCta").addEventListener("click", () => {
    const level = render(toMugs(snapTarget(pos)))
    openBooking({ service: "card", note: `Карта ${level.name}` })
  })

  tilt(card)
}

/* 3D-наклон: за курсором на десктопе, по гироскопу на телефоне */
function tilt(card) {
  const { gsap } = window
  if (!gsap || reducedMotion) return
  // на узких экранах карта в покое стоит ровно — симметрично и не упирается в край
  const rest = innerWidth < 768 ? { "--rx": "0deg", "--ry": "0deg" } : { "--rx": "6deg", "--ry": "-12deg" }
  gsap.set(card, rest)
  const set = (x, y) => {
    gsap.to(card, { "--ry": `${(x - 0.5) * 28}deg`, "--rx": `${(0.5 - y) * 22}deg`, duration: 0.6, ease: "power3.out", overwrite: "auto" })
    card.style.setProperty("--mx", `${x * 100}%`)
    card.style.setProperty("--my", `${y * 100}%`)
  }
  const reset = () => gsap.to(card, { ...rest, duration: 1, ease: "expo.out" })

  if (finePointer) {
    const stage = $("#pcardStage")
    stage.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect()
      set(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)))
    })
    stage.addEventListener("pointerleave", reset)
  } else if ("DeviceOrientationEvent" in window) {
    let raf = 0
    addEventListener("deviceorientation", (e) => {
      if (e.gamma == null || raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const x = Math.min(1, Math.max(0, 0.5 + e.gamma / 60))
        const y = Math.min(1, Math.max(0, 0.5 + (e.beta - 45) / 80))
        set(x, y)
      })
    })
  }
}

/* Клип на карте («Бронза» — «Чика», «Голда» — Little Big, «Платинум» — «Я звезда»): поверхность карты, играет целиком и со звуком,
   карта наклоняется как обычно. Один <video>, источник меняется по уровню, позиция каждого клипа запоминается.
   Стартует только по действию посетителя, на паузе при смене уровня и скрытой вкладке.
   Кнопка — звук вкл/выкл (после конца — «ещё раз»), полоса внизу — перемотка: мышь, палец, стрелки ±5 с, Home/End. */
function cardClip(card, levelNow) {
  const video = $("#platVideo"), muteBtn = $("#platMute"), seek = $("#platSeek"), unmute = $("#clipUnmute")
  const unmuteLabel = unmute.querySelector("[data-label]")
  const saved = {}
  let current = null
  let wanted = false, dragging = false, previewing = false
  // без автозапуска: уменьшенная анимация или экономия трафика — на карте кадр клипа и кнопка «Смотреть клип»
  const quiet = reducedMotion || !!navigator.connection?.saveData
  const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`
  const setMuted = (m) => {
    video.muted = m
    unmute.hidden = !m
    unmuteLabel.textContent = "Включить звук"
    muteBtn.setAttribute("aria-pressed", String(m))
    muteBtn.setAttribute("aria-label", m ? "Включить звук клипа" : "Выключить звук клипа")
  }
  const start = () => {
    video.play()?.catch(() => { setMuted(true); video.play().catch(() => {}) }) // звук запрещён браузером — играем без него
  }
  const paint = () => {
    const d = video.duration || 200, t = video.currentTime
    card.style.setProperty("--clip-progress", `${(t / d) * 100}%`)
    seek.setAttribute("aria-valuemax", String(Math.round(d)))
    seek.setAttribute("aria-valuenow", String(Math.round(t)))
    seek.setAttribute("aria-valuetext", `${fmt(t)} из ${fmt(d)}`)
  }
  const seekTo = (t) => {
    const d = video.duration || 0
    if (!d) return
    video.currentTime = Math.max(0, Math.min(d - 0.1, t))
    muteBtn.removeAttribute("data-ended")
    paint()
  }
  video.addEventListener("timeupdate", () => { if (!dragging) paint() })
  video.addEventListener("ended", () => muteBtn.setAttribute("data-ended", ""))
  video.addEventListener("play", () => muteBtn.removeAttribute("data-ended"))

  // «Включить звук» по центру карты или тап по самой карте, пока клип идёт без звука
  const withSound = (e) => {
    e?.stopPropagation()
    if (!current) return
    previewing = false
    wanted = true
    if (!video.src || video.dataset.clip !== current) load(current)
    muteBtn.hidden = false
    seek.hidden = false
    setMuted(false)
    start()
  }
  unmute.addEventListener("click", withSound)
  card.addEventListener("click", (e) => {
    if (current && (video.muted || video.paused) && !e.target.closest("button, [role=slider]")) withSound(e)
  })

  muteBtn.addEventListener("click", (e) => {
    e.stopPropagation()
    if (muteBtn.hasAttribute("data-ended")) { video.currentTime = 0; setMuted(false); start(); return }
    setMuted(!video.muted)
    if (video.paused && wanted) start()
  })

  // перетаскивание: указатель захватывается полосой, карта при этом не дёргается
  const ratio = (e) => { const r = seek.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) }
  seek.addEventListener("pointerdown", (e) => {
    e.stopPropagation()
    dragging = true
    seek.classList.add("is-drag")
    seek.setPointerCapture(e.pointerId)
    seekTo(ratio(e) * (video.duration || 0))
  })
  seek.addEventListener("pointermove", (e) => {
    if (!dragging) return
    e.stopPropagation()
    seekTo(ratio(e) * (video.duration || 0))
  })
  const endDrag = (e) => {
    if (!dragging) return
    dragging = false
    seek.classList.remove("is-drag")
    seek.releasePointerCapture?.(e.pointerId)
    if (wanted && video.paused) start()
  }
  seek.addEventListener("pointerup", endDrag)
  seek.addEventListener("pointercancel", endDrag)
  seek.addEventListener("click", (e) => e.stopPropagation())
  seek.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5 }[e.key]
    if (step) seekTo(video.currentTime + step)
    else if (e.key === "Home") seekTo(0)
    else if (e.key === "End") seekTo((video.duration || 0) - 1)
    else return
    e.preventDefault()
  })

  // карта появилась на экране — клип текущего уровня стартует без звука; ушла — тихий клип на паузе
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      const id = levelNow()
      if (!current && CLIPS[id]) api.preview(id)
      else if (current && video.paused && !video.ended && (wanted || previewing) && !quiet) start()
    } else if (video.muted && !video.paused) video.pause()
  }, { threshold: 0.45 }).observe(card)

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) video.pause()
    else if (wanted && !video.ended) start()
  })
  const load = (id) => {
    if (video.dataset.clip === id) return
    if (video.dataset.clip) saved[video.dataset.clip] = video.currentTime
    video.dataset.clip = id
    video.poster = CLIPS[id].poster
    video.src = CLIPS[id].src
    const at = saved[id] || 0
    if (at) video.addEventListener("loadedmetadata", () => { video.currentTime = at }, { once: true })
    card.style.setProperty("--clip-progress", "0%")
  }
  const api = {
    get current() { return current },
    get previewing() { return previewing },
    // тихий предпросмотр: клип идёт без звука, по центру — «Включить звук»
    preview(id) {
      current = id
      previewing = true
      card.dataset.video = "on"
      muteBtn.hidden = false
      seek.hidden = false
      if (quiet) {
        // только кадр клипа, видео не грузим
        video.dataset.clip = ""
        video.removeAttribute("src")
        video.poster = CLIPS[id].poster
        muteBtn.hidden = true
        seek.hidden = true
        unmute.hidden = false
        unmuteLabel.textContent = "Смотреть клип"
        return
      }
      load(id)
      setMuted(true)
      video.play().catch(() => {})
    },
    play(id) {
      current = id
      previewing = false
      wanted = true
      sound.stopLegend()
      load(id)
      card.dataset.video = "on"
      muteBtn.hidden = false
      seek.hidden = false
      muteBtn.removeAttribute("data-ended")
      if (video.ended) video.currentTime = 0
      setMuted(false)
      start()
    },
    stop() {
      current = null
      wanted = false
      previewing = false
      video.pause()
      delete card.dataset.video
      muteBtn.hidden = true
      seek.hidden = true
      unmute.hidden = true
    },
  }
  return api
}
