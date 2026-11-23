#!/usr/bin/env python3
"""Draws the link-preview image of a blog post (the picture X, Slack, iMessage... show for its URL).

    python3 scripts/make_social_card.py <slug> [--style art|paper] [--out FILE]

It writes public/blogs/<slug>/card.jpg, 1200x630. The post page uses that file as its
og:image / twitter:image when it exists, and falls back to the post's cover otherwise.

Two styles:
  art    the post's cover picture with the title and authors set over it (default when the
         post has a cover)
  paper  the blog's own look: cream paper, crimson rule, title, author photos

The title and authors come from the post's frontmatter and content/people.toml. The page is
laid out as HTML and photographed with headless Chrome, so it uses the blog's real typefaces
(loaded from Google Fonts; needs a network connection). Needs Google Chrome and PyYAML.
"""
import argparse
import html
import pathlib
import subprocess
import tempfile
import tomllib

import yaml

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TYPE_LABEL = {"note": "Research note", "paper": "Paper walkthrough", "essay": "Essay", "project": "Project log"}

FONTS = (
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    '<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600'
    '&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=block" rel="stylesheet">'
)

BASE_CSS = """
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 1200px; height: 630px; overflow: hidden; }
body { position: relative; font-family: 'Instrument Sans', sans-serif; -webkit-font-smoothing: antialiased; }
.rule { position: absolute; inset: 0 0 auto 0; height: 10px; background: #a51c30; }
.kicker { font-size: 22px; font-weight: 500; letter-spacing: 0.01em; }
h1 { font-family: 'Newsreader', serif; font-weight: 500; letter-spacing: -0.015em; text-wrap: balance; }
"""

ART_CSS = """
body { background: #05060f; color: #fff; }
.bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.shade { position: absolute; inset: 0; background:
  linear-gradient(90deg, rgba(5,6,15,0.94) 0%, rgba(5,6,15,0.82) 34%, rgba(5,6,15,0.35) 62%, rgba(5,6,15,0) 82%); }
.text { position: absolute; left: 72px; top: 0; bottom: 0; width: 620px;
  display: flex; flex-direction: column; justify-content: center; padding-bottom: 14px; }
.kicker { color: #e9a3a8; }
h1 { margin-top: 18px; font-size: 74px; line-height: 1.03; }
.authors { margin-top: 30px; font-size: 22px; line-height: 1.45; color: rgba(255,255,255,0.78); }
"""

PAPER_CSS = """
body { background: #faf7f0; color: #1c1a17; }
/* The bottom is kept clear: X prints its own label over the lower left corner of the picture. */
.text { position: absolute; inset: 0; padding: 78px 84px 112px; display: flex; flex-direction: column; }
.kicker { color: #a51c30; }
h1 { margin-top: 18px; font-size: 86px; line-height: 1.02; max-width: 980px; }
.people { margin-top: auto; display: flex; align-items: center; }
.people img, .people span.i { width: 58px; height: 58px; border-radius: 50%; margin-right: -12px;
  box-shadow: 0 0 0 4px #faf7f0; object-fit: cover; background: #ece7dc; }
.people span.i { display: inline-grid; place-items: center; font-size: 19px; font-weight: 600; color: #6b655c; }
.authors { margin-top: 20px; font-size: 23px; line-height: 1.45; color: #57514a; max-width: 1000px; }
.site { position: absolute; right: 84px; top: 82px; font-size: 20px; color: #8a8378; }
"""


def initials(name):
    parts = name.split()
    return (parts[0][:1] + (parts[-1][:1] if len(parts) > 1 else "")).upper()


def build_html(style, post, people, cover):
    title = html.escape(str(post["title"]))
    kicker = TYPE_LABEL.get(post.get("type"), "Research note")
    names = [a["name"] if isinstance(a, dict) else str(a) for a in post.get("authors", [])]
    authors = html.escape(", ".join(names))

    if style == "art":
        body = (
            f'<img class="bg" src="{cover.as_uri()}"><div class="shade"></div>'
            f'<div class="text"><p class="kicker">{kicker}</p><h1>{title}</h1><p class="authors">{authors}</p></div>'
        )
        css = ART_CSS
    else:
        faces = []
        for name in names:
            avatar = people.get(name, {}).get("avatar")
            if avatar:
                faces.append(f'<img src="{(ROOT / "public" / avatar.lstrip("/")).as_uri()}">')
            else:
                faces.append(f'<span class="i">{initials(name)}</span>')
        body = (
            '<div class="rule"></div><p class="site">zhentingqi.github.io</p>'
            f'<div class="text"><p class="kicker">{kicker}</p><h1>{title}</h1>'
            f'<div class="people">{"".join(faces)}</div><p class="authors">{authors}</p></div>'
        )
        css = PAPER_CSS
    return f"<!doctype html><html><head><meta charset='utf-8'>{FONTS}<style>{BASE_CSS}{css}</style></head><body>{body}</body></html>"


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("slug")
    parser.add_argument("--style", choices=["art", "paper"])
    parser.add_argument("--out", help="write here instead of public/blogs/<slug>/card.jpg")
    args = parser.parse_args()

    source = ROOT / "content" / "blog" / f"{args.slug}.mdx"
    post = yaml.safe_load(source.read_text(encoding="utf-8").split("---", 2)[1])
    people = {p["name"]: p for p in tomllib.loads((ROOT / "content" / "people.toml").read_text(encoding="utf-8")).get("people", [])}
    cover = ROOT / "public" / str(post.get("cover", "")).lstrip("/") if post.get("cover") else None
    style = args.style or ("art" if cover else "paper")
    if style == "art" and not (cover and cover.exists()):
        parser.error("the art style needs a `cover` in the post's frontmatter")

    out = pathlib.Path(args.out) if args.out else ROOT / "public" / "blogs" / args.slug / "card.jpg"
    with tempfile.TemporaryDirectory() as tmp:
        page = pathlib.Path(tmp) / "card.html"
        shot = pathlib.Path(tmp) / "card.png"
        page.write_text(build_html(style, post, people, cover), encoding="utf-8")
        subprocess.run(
            [
                CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                "--window-size=1200,630", "--virtual-time-budget=15000", f"--user-data-dir={tmp}/profile",
                f"--screenshot={shot}", page.as_uri(),
            ],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120,
        )
        subprocess.run(
            ["sips", "-s", "format", "jpeg", "-s", "formatOptions", "88", str(shot), "--out", str(out)],
            check=True, stdout=subprocess.DEVNULL,
        )
    print(f"{style} card -> {out} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
