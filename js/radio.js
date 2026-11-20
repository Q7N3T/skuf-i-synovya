// «Скуф FM»: плеер «Сейчас играет» из презентации — на сайте. Звука нет: крутится пластинка,
// а трек открывается на Яндекс Музыке. Анимация идёт, только пока блок на экране.
import { initPlayer } from "./deck-ui.js?v=202611201353"

const root = document.getElementById("radioPlayer")
if (root) {
  const player = initPlayer(root, [
    {
      "title": "Районы-кварталы",
      "artist": "Звери",
      "duration": 224,
      "art": 0,
      "accent": "#f2a93b",
      "href": "https://music.yandex.ru/search?text=%D0%97%D0%B2%D0%B5%D1%80%D0%B8%20%D0%A0%D0%B0%D0%B9%D0%BE%D0%BD%D1%8B-%D0%BA%D0%B2%D0%B0%D1%80%D1%82%D0%B0%D0%BB%D1%8B"
    },
    {
      "title": "Mr. Brightside",
      "artist": "The Killers",
      "duration": 222,
      "art": 1,
      "accent": "#4cd964",
      "href": "https://music.yandex.ru/search?text=The%20Killers%20Mr.%20Brightside"
    },
    {
      "title": "Крошка моя",
      "artist": "Руки Вверх!",
      "duration": 237,
      "art": 2,
      "accent": "#ff7a5c",
      "href": "https://music.yandex.ru/search?text=%D0%A0%D1%83%D0%BA%D0%B8%20%D0%92%D0%B2%D0%B5%D1%80%D1%85%21%20%D0%9A%D1%80%D0%BE%D1%88%D0%BA%D0%B0%20%D0%BC%D0%BE%D1%8F"
    },
    {
      "title": "Seven Nation Army",
      "artist": "The White Stripes",
      "duration": 231,
      "art": 1,
      "accent": "#f2a93b",
      "href": "https://music.yandex.ru/search?text=The%20White%20Stripes%20Seven%20Nation%20Army"
    },
    {
      "title": "Полковнику никто не пишет",
      "artist": "Би-2",
      "duration": 284,
      "art": 0,
      "accent": "#5b8cff",
      "href": "https://music.yandex.ru/search?text=%D0%91%D0%B8-2%20%D0%9F%D0%BE%D0%BB%D0%BA%D0%BE%D0%B2%D0%BD%D0%B8%D0%BA%D1%83%20%D0%BD%D0%B8%D0%BA%D1%82%D0%BE%20%D0%BD%D0%B5%20%D0%BF%D0%B8%D1%88%D0%B5%D1%82"
    },
    {
      "title": "Feel Good Inc.",
      "artist": "Gorillaz",
      "duration": 221,
      "art": 2,
      "accent": "#4cd964",
      "href": "https://music.yandex.ru/search?text=Gorillaz%20Feel%20Good%20Inc."
    },
    {
      "title": "Выхода нет",
      "artist": "Сплин",
      "duration": 232,
      "art": 0,
      "accent": "#f2a93b",
      "href": "https://music.yandex.ru/search?text=%D0%A1%D0%BF%D0%BB%D0%B8%D0%BD%20%D0%92%D1%8B%D1%85%D0%BE%D0%B4%D0%B0%20%D0%BD%D0%B5%D1%82"
    },
    {
      "title": "Take Me Out",
      "artist": "Franz Ferdinand",
      "duration": 237,
      "art": 1,
      "accent": "#ff7a5c",
      "href": "https://music.yandex.ru/search?text=Franz%20Ferdinand%20Take%20Me%20Out"
    }
  ])
  // плейлист: клик по строке — включить этот трек; активная строка подсвечена
  const picks = [...document.querySelectorAll(".radio__pick")]
  picks.forEach((b) => b.addEventListener("click", () => player.select(+b.dataset.track)))
  root.addEventListener("pl:track", (e) => picks.forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.track === e.detail.index))))
  new IntersectionObserver(([e]) => (e.isIntersecting ? player.show() : player.hide()), { rootMargin: "100px" }).observe(root)
}
