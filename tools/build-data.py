#!/usr/bin/env python3
"""Собирает статическую разметку афиши и меню из data/afisha.json и data/menu.json.

Данные живут только в JSON. Этот скрипт вписывает их в index.html между метками
<!-- data:afisha --> … <!-- /data:afisha --> и <!-- data:menu --> … <!-- /data:menu -->.
Получается фолбэк без JavaScript; js/today.js и js/menu.js читают те же JSON.
Запуск из корня: python3 tools/build-data.py
"""
import html, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
N = " "
A = json.loads((ROOT / "data/afisha.json").read_text(encoding="utf-8"))
M = json.loads((ROOT / "data/menu.json").read_text(encoding="utf-8"))
T = json.loads((ROOT / "data/team.json").read_text(encoding="utf-8"))
e = lambda s: html.escape(str(s), quote=True)


def nb(s):
    """Неразрывные пробелы: после коротких слов и внутри «5 000 ₽»."""
    s = re.sub(r"(?<=\d) (?=\d{3}\b)", N, s)
    s = re.sub(r"(?<=\d) (?=₽|л\b|г\b|мин\b|шт\.|час)", N, s)
    s = re.sub(r"(?<![\wА-яЁё])([А-яЁёA-Za-z]{1,2}) ", lambda m: m.group(1) + N, s)
    return s


def rub(v):
    return nb(f"{v:,}".replace(",", " ") + " ₽") if isinstance(v, int) else nb(v)


# ------------------------------------------------------------------ афиша
def afisha():
    out = []
    for d in A["days"]:
        hot = " aday--hot" if d.get("hot") else ""
        ev = f'{d["dow"]} · {d["title"]}'
        out.append(f'''        <li class="aday{hot}" data-day="{d["day"]}">
          <p class="aday__dow mono"><span>{e(d["dow"])}</span><span class="aday__today">Сегодня</span></p>
          <h3 class="aday__title">{e(nb(d["title"]))}</h3>
          <p class="aday__desc">{e(nb(d["desc"]))}</p>
          <p class="aday__meta mono">{e(nb(d["time"]))} · {e(nb(d["price"]))}</p>
          <button class="aday__go" type="button" data-book="{d["book"]}" data-day="{d["day"]}" data-event="{e(ev)}" aria-label="Иду: {e(ev)}">Иду</button>
        </li>''')
    p = A["party"]
    return f'''      <ol class="afisha" id="afishaList">
{chr(10).join(out)}
      </ol>
      <div class="party" data-reveal>
        <p class="party__text">{e(nb(p["text"]))}</p>
        <button class="btn btn--amber" type="button" data-book="party">{e(p["button"])}</button>
      </div>'''


# ------------------------------------------------------------------ меню
def badge(b):
    if not b: return ""
    cls = " mbadge--zero" if b == "0%" else ""
    return f' <span class="mbadge{cls}">{e(b)}</span>'


def row(name, price_html, desc, meta="", b=None, lol=None, extra="", todo=False):
    lol_attr = f' data-lol="{e(lol)}"' if lol else ""
    t = " mrow--todo" if todo else ""
    meta_html = f'<span class="mrow__meta mono">{e(nb(meta))}</span>' if meta else ""
    return f'''          <li class="mrow{t}"{lol_attr}>
            <p class="mrow__line"><span class="mrow__name">{e(nb(name))}{badge(b)}</span><span class="mrow__dots" aria-hidden="true"></span>{price_html}</p>
            <p class="mrow__desc">{e(nb(desc))}{meta_html}{extra}</p>
          </li>'''


def beer():
    s = M["beer"]
    rows = []
    for it in s["items"]:
        if it["p05"] is None:
            price = '<span class="mrow__price mrow__price--soon">скоро</span>'
            meta = it["style"]
        else:
            price = (f'<span class="mrow__price mrow__price--two"><span aria-label="0,3 литра">{it["p03"]}</span>'
                     f'<span aria-label="0,5 литра">{it["p05"]}</span></span>')
            meta = f'{it["style"]} · {str(it["abv"]).replace(".", ",")}%'
        rows.append(row(it["name"], price, it["desc"], " · " + meta, it.get("badge"), todo=it["p05"] is None))
    return f'''        <section class="msec" id="menu-beer" aria-labelledby="menu-beer-h">
          <h3 class="msec__h" id="menu-beer-h">{s["title"]} <span class="msec__note mono">{e(nb(s["note"]))}</span></h3>
          <p class="mvol" aria-hidden="true"><span><b>0,3{N}л</b></span><span><b>0,5{N}л</b></span></p>
          <ul class="mlist mlist--beer">
{chr(10).join(rows)}
          </ul>
        </section>'''


def simple(key, show_book=False):
    s = M[key]
    rows = []
    for it in s["items"]:
        price = f'<span class="mrow__price">{e(rub(it["price"]))}</span>'
        extra = ""
        if show_book and it.get("book"):
            extra = f' <button class="mrow__book" type="button" data-book="{it["book"]}" data-event="{e(it["name"])}">Забронировать</button>'
        rows.append(row(it["name"], price, it["desc"], " · " + it["size"], it.get("badge"), it.get("lol"), extra))
    return rows


def snacks():
    s = M["snacks"]
    return f'''        <section class="msec" id="menu-snacks" aria-labelledby="menu-snacks-h">
          <h3 class="msec__h" id="menu-snacks-h">{s["title"]}</h3>
          <ul class="mlist">
{chr(10).join(simple("snacks"))}
          </ul>
        </section>'''


def events():
    s = M["events"]
    return f'''        <section class="msec" id="menu-events" aria-labelledby="menu-events-h">
          <h3 class="msec__h" id="menu-events-h">{s["title"]} <span class="msec__note mono">караоке · приставки · праздники</span></h3>
          <ul class="mlist">
{chr(10).join(simple("events", True))}
          </ul>
        </section>'''


def sets():
    s = M["sets"]
    cards = []
    for it in s["items"]:
        off = round((1 - it["price"] / it["full"]) * 100)
        li = "".join(f"<li>{e(nb(x))}</li>" for x in it["list"])
        label = "Записаться" if it["book"] == "barber" else "Забронировать"
        cards.append(f'''          <article class="mset">
            <p class="mset__off mono" aria-label="Выгода {off} процентов">−{off}%</p>
            <h4 class="mset__name">{e(it["name"])}</h4>
            <p class="mset__time mono">{e(nb(it["time"]))}</p>
            <ul class="mset__list">{li}</ul>
            <p class="mset__desc">{e(nb(it["desc"]))}</p>
            <p class="mset__foot"><span class="mset__full mono"><s>{e(rub(it["full"]))}</s></span><span class="mset__price">{e(rub(it["price"]))}</span></p>
            <button class="mset__book" type="button" data-book="{it["book"]}" data-event="Сет {e(it["name"])}">{label}</button>
          </article>''')
    return f'''        <section class="msec" id="menu-sets" aria-labelledby="menu-sets-h">
          <h3 class="msec__h" id="menu-sets-h">{s["title"]} <span class="msec__note mono">дешевле, чем по{N}отдельности</span></h3>
          <div class="msets">
{chr(10).join(cards)}
          </div>
        </section>'''


def barber():
    s = M["barber"]
    return f'''        <section class="msec msec--barber" id="menu-barber" aria-labelledby="menu-barber-h">
          <h3 class="msec__h" id="menu-barber-h">{s["title"]}</h3>
          <p class="msec__lead">{e(nb(s["note"]))}</p>
          <ul class="mlist mlist--compact">
{chr(10).join(simple("barber"))}
          </ul>
          <button class="btn btn--ghost msec__cta" type="button" data-book="barber">Записаться на{N}стрижку</button>
        </section>'''


AD = '''        <aside class="mad" data-ad data-egg aria-label="Реклама">
          <p class="mad__cat mono">Реклама <span class="ad__new" aria-hidden="true">NEW!</span></p>
          <p class="mad__title">Отправь <b>ПУЗО</b> на <b>2007</b></p>
          <p class="mad__desc">и{N}получи полифонический рингтон «Батя зовёт». Стоимость SMS 0{N}₽, потому что SMS никуда не{N}уходит.</p>
          <p class="mad__foot"><span class="mono">16 тонов</span><button class="ad__play" type="button" id="ringtone">Послушать</button></p>
        </aside>'''.replace("{N}", N)


def menu():
    tabs = [("menu-beer", "Пиво"), ("menu-snacks", "Закуски"), ("menu-events", "Движ"), ("menu-sets", "Сеты"), ("menu-barber", "Барбершоп")]
    t = "\n".join(f'          <a class="mtab" href="#{i}" data-tab="{i.split("-")[1]}"{" aria-current=\"true\"" if k == 0 else ""}>{n}</a>'
                  for k, (i, n) in enumerate(tabs))
    return f'''      <nav class="mtabs" id="menuTabs" aria-label="Разделы меню">
        <div class="mtabs__row">
{t}
        </div>
      </nav>
      <div class="mcard">
{beer()}
{AD}
{snacks()}
{events()}
{sets()}
{barber()}
      </div>'''



# ------------------------------------------------------------------ наши бати


def team():
    cards = []
    for p in T["people"]:
        i = p["id"]
        badges = "".join(f'<li><svg aria-hidden="true"><use href="#i-{b["icon"]}"/></svg>{e(nb(b["text"]))}</li>' for b in p["badges"])
        tap = e(nb(p["tap"])) if p["tap"] else f'<span class="anketa__todo">{e(nb(T["todo"]["tap"]))}</span>'
        kar = e(nb(p["karaoke"])) if p["karaoke"] else f'<span class="anketa__todo">{e(nb(T["todo"]["karaoke"]))}</span>'
        cards.append(f"""        <li class="bati__item" data-id="{i}">
          <div class="buddy" data-reveal>
            <button class="buddy__open" type="button" id="buddy-{i}" aria-expanded="false" aria-controls="anketa-{i}">
              <span class="buddy__frame"><img class="buddy__ava" src="{p["img"]}" width="264" height="303" alt="Пиксельный портрет: {e(p["name"])}" loading="lazy" decoding="async" /><span class="buddy__photo mono" aria-hidden="true">фото</span></span>
              <span class="buddy__text">
                <span class="buddy__name">{e(nb(p["name"]))}</span>
                <span class="buddy__role">{e(nb(p["role"]))}</span>
                <span class="buddy__online mono"><i class="dot" aria-hidden="true"></i>{e(p["online"])}</span>
                <span class="buddy__more mono" aria-hidden="true">Анкета <b>▾</b></span>
              </span>
            </button>
          </div>
          <section class="anketa" id="anketa-{i}" aria-labelledby="anketa-{i}-name" tabindex="-1">
            <div class="anketa__in">
              <div class="anketa__side">
                <span class="buddy__frame buddy__frame--big"><img class="buddy__ava" src="{p["img"]}" width="264" height="303" alt="" loading="lazy" decoding="async" /><span class="buddy__photo mono" aria-hidden="true">фото</span></span>
                <h3 class="anketa__name" id="anketa-{i}-name">{e(nb(p["name"]))}</h3>
                <p class="buddy__online mono"><i class="dot" aria-hidden="true"></i>{e(p["online"])}</p>
              </div>
              <div class="anketa__main">
                <p class="anketa__label mono">Статус</p>
                <p class="anketa__status">{e(nb(p["status"]))}</p>
                <dl class="anketa__fields">
                  <div><dt>Должность</dt><dd>{e(nb(p["role"]))}</dd></div>
                  <div><dt>Чем занят</dt><dd>{e(nb(p["bio"]))}</dd></div>
                  <div><dt>Любимое на{N}кране</dt><dd>{tap}</dd></div>
                  <div><dt>Хит в{N}караоке</dt><dd>{kar}</dd></div>
                  <div><dt>Был в{N}сети</dt><dd>{T["seen"]}</dd></div>
                </dl>
                <div class="anketa__foot">
                  <div class="anketa__badges"><p class="anketa__label mono">Значки за{N}заслуги</p><ul>{badges}</ul></div>
                  <button class="btn btn--amber" type="button" data-book="table" data-event="Позвать за{N}стол — {e(p["name"])}" aria-haspopup="dialog">Позвать за{N}стол</button>
                  <button class="anketa__close mono" type="button" data-close-anketa>Свернуть ▴</button>
                </div>
              </div>
            </div>
          </section>
        </li>""")
    return f"""      <ul class="bati" id="teamList">
{chr(10).join(cards)}
      </ul>"""

def put(src, name, body):
    a, b = f"<!-- data:{name} -->", f"<!-- /data:{name} -->"
    i, j = src.index(a) + len(a), src.index(b)
    return src[:i] + "\n" + body + "\n      " + src[j:]


if __name__ == "__main__":
    p = ROOT / "index.html"
    s = p.read_text(encoding="utf-8")
    s = put(s, "afisha", afisha())
    s = put(s, "menu", menu())
    s = put(s, "team", team())
    p.write_text(s, encoding="utf-8")
    print("ok: afisha", len(A["days"]), "дней; меню", sum(len(M[k]["items"]) for k in ("beer", "snacks", "events", "sets", "barber")), "позиций")
