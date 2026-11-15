// «Наши бати»: флип карточки по тапу/клику, «о-оу» по статусу. Аватарки — PNG 48×48 в assets/team.
import { $, $$, sound } from "./utils.js?v=202611151120"

export function initTeam() {
  $$(".member__card").forEach((card) => {
    const name = card.getAttribute("aria-label").split(". ")[0]
    card.addEventListener("click", () => {
      const on = card.getAttribute("aria-pressed") !== "true"
      card.setAttribute("aria-pressed", String(on))
      card.setAttribute("aria-label", `${name}. ${on ? "Скрыть статус" : "Показать статус"}`)
      if (on) sound.uhOh()
    })
  })

  const toggle = $("#soundToggle")
  customElements.whenDefined("ui-toggle").then(() => { toggle.pressed = sound.enabled })
  toggle.addEventListener("pressedchange", (e) => {
    sound.enabled = e.detail.value
    if (e.detail.value) sound.uhOh()
  })
}
