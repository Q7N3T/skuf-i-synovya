// «Скуф FM»: плеер «Сейчас играет» из презентации — на сайте. Звук — настоящий, только по нажатию «Играть» или по клику на трек (без автозапуска).
// Если на странице заиграло видео со звуком, радио встаёт на паузу. Анимация идёт, только пока блок на экране.
import { initPlayer } from "./deck-ui.js?v=202611201616"

const root = document.getElementById("radioPlayer")
if (root) {
  const player = initPlayer(root, [
    {
      "title": "Районы-кварталы",
      "artist": "Звери",
      "duration": 199,
      "art": 0,
      "accent": "#f2a93b",
      "src": "assets/audio/zveri-rayony-kvartaly.mp3"
    },
    {
      "title": "Mr. Brightside",
      "artist": "The Killers",
      "duration": 217,
      "art": 1,
      "accent": "#4cd964",
      "src": "assets/audio/the-killers-mr-brightside.mp3"
    },
    {
      "title": "Крошка моя",
      "artist": "Руки Вверх!",
      "duration": 210,
      "art": 2,
      "accent": "#ff7a5c",
      "src": "assets/audio/ruki-vverh-kroshka-moya.mp3"
    },
    {
      "title": "Полковнику никто не пишет",
      "artist": "Би-2",
      "duration": 296,
      "art": 0,
      "accent": "#5b8cff",
      "src": "assets/audio/bi-2-polkovniku.mp3"
    },
    {
      "title": "Take Me Out",
      "artist": "Franz Ferdinand",
      "duration": 286,
      "art": 1,
      "accent": "#f2a93b",
      "src": "assets/audio/franz-ferdinand-take-me-out.mp3"
    },
    {
      "title": "Выхода нет",
      "artist": "Сплин",
      "duration": 228,
      "art": 2,
      "accent": "#4cd964",
      "src": "assets/audio/splin-vyhoda-net.mp3"
    },
    {
      "title": "WWW",
      "artist": "Ленинград",
      "duration": 167,
      "art": 0,
      "accent": "#ff7a5c",
      "src": "assets/audio/leningrad-www.mp3"
    },
    {
      "title": "Seven Nation Army",
      "artist": "The White Stripes",
      "duration": 239,
      "art": 1,
      "accent": "#5b8cff",
      "src": "assets/audio/white-stripes-seven-nation-army.mp3"
    },
    {
      "title": "Проститься",
      "artist": "Uma2rman",
      "duration": 302,
      "art": 2,
      "accent": "#f2a93b",
      "src": "assets/audio/uma2rman-prostitsya.mp3"
    },
    {
      "title": "Половинка",
      "artist": "Танцы Минус",
      "duration": 171,
      "art": 0,
      "accent": "#4cd964",
      "src": "assets/audio/tancy-minus-polovinka.mp3"
    },
    {
      "title": "Feel Good Inc.",
      "artist": "Gorillaz",
      "duration": 224,
      "art": 1,
      "accent": "#ff7a5c",
      "src": "assets/audio/gorillaz-feel-good-inc.mp3"
    },
    {
      "title": "Моя игра",
      "artist": "Баста",
      "duration": 271,
      "art": 2,
      "accent": "#5b8cff",
      "src": "assets/audio/basta-moya-igra.mp3"
    },
    {
      "title": "Ты узнаешь её",
      "artist": "Корни",
      "duration": 280,
      "art": 0,
      "accent": "#f2a93b",
      "src": "assets/audio/korni-ty-uznaesh-eyo.mp3"
    },
    {
      "title": "I Bet You Look Good on the Dancefloor",
      "artist": "Arctic Monkeys",
      "duration": 177,
      "art": 1,
      "accent": "#4cd964",
      "src": "assets/audio/arctic-monkeys-dancefloor.mp3"
    },
    {
      "title": "Хочешь?",
      "artist": "Земфира",
      "duration": 188,
      "art": 2,
      "accent": "#ff7a5c",
      "src": "assets/audio/zemfira-hochesh.mp3"
    },
    {
      "title": "Numb",
      "artist": "Linkin Park",
      "duration": 235,
      "art": 0,
      "accent": "#5b8cff",
      "src": "assets/audio/linkin-park-numb.mp3"
    },
    {
      "title": "Пей пиво",
      "artist": "Дискотека Авария",
      "duration": 65,
      "art": 1,
      "accent": "#f2a93b",
      "src": "assets/audio/diskoteka-avariya-pey-pivo.mp3"
    },
    {
      "title": "Hey Ya!",
      "artist": "OutKast",
      "duration": 289,
      "art": 2,
      "accent": "#4cd964",
      "src": "assets/audio/outkast-hey-ya.mp3"
    },
    {
      "title": "Club Foot",
      "artist": "Kasabian",
      "duration": 210,
      "art": 0,
      "accent": "#ff7a5c",
      "src": "assets/audio/kasabian-club-foot.mp3"
    }
  ])
  // плейлист: клик по строке — включить этот трек; активная строка подсвечена
  const picks = [...document.querySelectorAll(".radio__pick")]
  picks.forEach((b) => b.addEventListener("click", () => player.select(+b.dataset.track)))
  root.addEventListener("pl:track", (e) => picks.forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.track === e.detail.index))))
  document.addEventListener("play", (e) => { if (e.target instanceof HTMLVideoElement && !e.target.muted) player.pause() }, true)
  document.addEventListener("volumechange", (e) => { if (e.target instanceof HTMLVideoElement && !e.target.muted && !e.target.paused) player.pause() }, true)
  new IntersectionObserver(([e]) => (e.isIntersecting ? player.show() : player.hide()), { rootMargin: "100px" }).observe(root)
}
