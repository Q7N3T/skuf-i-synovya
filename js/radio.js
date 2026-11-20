// «Скуф FM»: плеер «Сейчас играет» из презентации — на сайте. Звука пока нет: крутится пластинка. Анимация идёт, только пока блок на экране.
import { initPlayer } from "./deck-ui.js?v=202611201357"

const root = document.getElementById("radioPlayer")
if (root) {
  const player = initPlayer(root, [
    {
      "title": "Районы-кварталы",
      "artist": "Звери",
      "duration": 224,
      "art": 0,
      "accent": "#f2a93b"
    },
    {
      "title": "Mr. Brightside",
      "artist": "The Killers",
      "duration": 222,
      "art": 1,
      "accent": "#4cd964"
    },
    {
      "title": "Крошка моя",
      "artist": "Руки Вверх!",
      "duration": 237,
      "art": 2,
      "accent": "#ff7a5c"
    },
    {
      "title": "Полковнику никто не пишет",
      "artist": "Би-2",
      "duration": 284,
      "art": 0,
      "accent": "#5b8cff"
    },
    {
      "title": "Take Me Out",
      "artist": "Franz Ferdinand",
      "duration": 237,
      "art": 1,
      "accent": "#f2a93b"
    },
    {
      "title": "Выхода нет",
      "artist": "Сплин",
      "duration": 232,
      "art": 2,
      "accent": "#4cd964"
    },
    {
      "title": "WWW",
      "artist": "Ленинград",
      "duration": 196,
      "art": 0,
      "accent": "#ff7a5c"
    },
    {
      "title": "Seven Nation Army",
      "artist": "The White Stripes",
      "duration": 231,
      "art": 1,
      "accent": "#5b8cff"
    },
    {
      "title": "Проститься",
      "artist": "Uma2rman",
      "duration": 214,
      "art": 2,
      "accent": "#f2a93b"
    },
    {
      "title": "Половинка",
      "artist": "Танцы Минус",
      "duration": 236,
      "art": 0,
      "accent": "#4cd964"
    },
    {
      "title": "Feel Good Inc.",
      "artist": "Gorillaz",
      "duration": 221,
      "art": 1,
      "accent": "#ff7a5c"
    },
    {
      "title": "Моя игра",
      "artist": "Баста",
      "duration": 254,
      "art": 2,
      "accent": "#5b8cff"
    },
    {
      "title": "Ты узнаешь её",
      "artist": "Корни",
      "duration": 230,
      "art": 0,
      "accent": "#f2a93b"
    },
    {
      "title": "I Bet You Look Good on the Dancefloor",
      "artist": "Arctic Monkeys",
      "duration": 173,
      "art": 1,
      "accent": "#4cd964"
    },
    {
      "title": "Хочешь?",
      "artist": "Земфира",
      "duration": 254,
      "art": 2,
      "accent": "#ff7a5c"
    },
    {
      "title": "Numb",
      "artist": "Linkin Park",
      "duration": 185,
      "art": 0,
      "accent": "#5b8cff"
    },
    {
      "title": "Пей пиво",
      "artist": "Дискотека Авария",
      "duration": 214,
      "art": 1,
      "accent": "#f2a93b"
    },
    {
      "title": "Hey Ya!",
      "artist": "OutKast",
      "duration": 235,
      "art": 2,
      "accent": "#4cd964"
    },
    {
      "title": "Club Foot",
      "artist": "Kasabian",
      "duration": 215,
      "art": 0,
      "accent": "#ff7a5c"
    }
  ])
  // плейлист: клик по строке — включить этот трек; активная строка подсвечена
  const picks = [...document.querySelectorAll(".radio__pick")]
  picks.forEach((b) => b.addEventListener("click", () => player.select(+b.dataset.track)))
  root.addEventListener("pl:track", (e) => picks.forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.track === e.detail.index))))
  new IntersectionObserver(([e]) => (e.isIntersecting ? player.show() : player.hide()), { rootMargin: "100px" }).observe(root)
}
