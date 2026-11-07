#!/usr/bin/env python3
"""Bundle the game as one HTML file for offline play and itch.io."""
import argparse
import base64
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


def data_uri(name, mime):
    data = base64.b64encode((ROOT / name).read_bytes()).decode("ascii")
    return f"data:{mime};base64,{data}"


def build():
    page = read("index.html")
    css = read("style.css").replace(
        "assets/PressStart2P.ttf", data_uri("assets/PressStart2P.ttf", "font/ttf")
    )
    font_license = read("assets/OFL.txt")
    page = page.replace('<link rel="stylesheet" href="style.css">', f"<style>\n/*\n{font_license}*/\n{css}</style>")
    page = page.replace("assets/hat.svg", data_uri("assets/hat.svg", "image/svg+xml"))
    scripts = []
    for name in ("lessons.js", "art.js", "sound.js", "game.js"):
        page = page.replace(f'  <script defer src="{name}"></script>\n', "")
        scripts.append(f"<script>\n{read(name)}</script>")
    return page.replace("</body>", "\n".join(scripts) + "\n</body>")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, nargs="?", default=ROOT / "dist" / "Cowboyboy.html")
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(build(), encoding="utf-8")
    print(args.output.resolve())


if __name__ == "__main__":
    main()
