"""Сброс кеша браузера после обновления сайта.

GitHub Pages отдаёт файлы с кешем на 10 минут, а ES-модули браузер кеширует по точному адресу.
Если поменять JS без смены адреса, посетитель может получить новый HTML со старым кодом.
Скрипт ставит одну версию ?v=... на все локальные импорты в js/, на <script src="js/..."> и
<link href="css/..."> во всех HTML. Одинаковая версия везде — иначе один модуль загрузится дважды.

Запуск из корня репозитория:  python3 tools/bump-version.py
"""
import re, time, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
VER = time.strftime("%Y%m%d%H%M")

js_import = re.compile(r"""((?:\bimport\b[^"'()]*?\bfrom\s*|\bimport\s*\(\s*|^\s*import\s+)["'])(\.{1,2}/[^"'?]+\.js)(?:\?v=[\w.]+)?(["'])""", re.M)
html_asset = re.compile(r"""((?:src|href)=")((?:js|css)/[^"?]+\.(?:js|css))(?:\?v=[\w.]+)?(")""")

changed = []
for f in sorted((ROOT / "js").rglob("*.js")):
    s = f.read_text(encoding="utf-8")
    n = js_import.sub(lambda m: f"{m.group(1)}{m.group(2)}?v={VER}{m.group(3)}", s)
    if n != s: f.write_text(n, encoding="utf-8"); changed.append(f.relative_to(ROOT))
for f in sorted(ROOT.glob("*.html")):
    s = f.read_text(encoding="utf-8")
    n = html_asset.sub(lambda m: f"{m.group(1)}{m.group(2)}?v={VER}{m.group(3)}", s)
    if n != s: f.write_text(n, encoding="utf-8"); changed.append(f.relative_to(ROOT))
print(f"v={VER}:", ", ".join(map(str, changed)))
