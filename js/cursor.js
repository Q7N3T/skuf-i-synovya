// Курсор — банка пива. Сам курсор целиком в CSS (css/home.css): никакого элемента, который догоняет мышь,
// поэтому ничего не лагает. Здесь — только всплеск пены при клике: 2–4 пузырька, 300 мс, потом элемент удаляется.
const fine = matchMedia("(hover: hover) and (pointer: fine)").matches
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches

if (fine && !reduce) {
  addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return
    const pop = document.createElement("span")
    pop.className = "foam-pop"
    pop.setAttribute("aria-hidden", "true")
    pop.style.left = e.clientX + "px"
    pop.style.top = e.clientY + "px"
    const n = 2 + Math.floor(Math.random() * 3)
    for (let i = 0; i < n; i++) pop.append(document.createElement("i"))
    document.body.append(pop)
    pop.lastChild.addEventListener("animationend", () => pop.remove(), { once: true })
    setTimeout(() => pop.remove(), 600) // страховка, если анимацию прервали
  }, { passive: true })
}
