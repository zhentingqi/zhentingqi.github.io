# Blog design spec (direction B2, "Reading Room")

Blog posts live at `/blogs/<slug>/` inside the personal site, under the site's top bar. It is English-only, text-first, and
serif-led. The feel is a quiet university press page: cream paper, one dark crimson, hairline
rules, no cards, no shadows, no decorative motion.

## Principles

1. Reading comes first. One 620px column of serif text; everything else serves it.
2. Crimson is a signal, not a surface. It marks the kicker, note numbers, links, the progress
   line, and the one series in a chart that matters. Nothing is filled with it.
3. Media is part of the argument. Figures, video, and interactive figures sit in the flow with
   a numbered caption, and may span the text and margin columns when they need the width.
4. No ornament. 1px rules, no drop caps, no gradients, no entrance animation. Images and
   videos have 12px rounded corners; rules, code blocks and controls stay square.

## Color

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#FAF7F0` | `#171411` | Page background |
| `--surface` | `#F1ECE1` | `#211D19` | Code blocks, thumbnails, figure controls |
| `--ink` | `#1C1A17` | `#EAE4D9` | Body text, titles |
| `--muted` | `#6A645C` | `#A69E92` | Metadata, captions, margin notes |
| `--rule` | `#E0D9CC` | `#37312A` | Hairlines |
| `--crimson` | `#8E1B2B` | `#DD8A90` | Accent (see principle 2) |

Charts use ink for axes, muted for secondary series, and crimson for the series being discussed.
Raster figures keep a white plate in dark mode so plots from papers stay legible.

## Type

| Role | Font | Desktop | Phone |
|---|---|---|---|
| Body | STIX Two Text 400 | 19.5px / 1.6 | 18.5px / 1.6 |
| Post title | Newsreader 500 | 44px / 1.04 | 31px / 1.08 |
| Section heading (h2) | Newsreader 500 | 27px / 1.15 | 23px / 1.2 |
| Subheading (h3) | Newsreader 500 italic | 21px / 1.25 | 19px / 1.3 |
| UI, metadata, captions, notes | Instrument Sans 400/600 | 13px / 1.5 | 13px / 1.5 |
| Code | JetBrains Mono 400 | 13.5px / 1.6 | 13px / 1.6 |

The body face is the closest open-source match to Anthropic's blog serif (a proprietary face
that cannot be self-hosted); it runs slightly small on the body, so it is set one point larger
than the titles' scale would suggest. Chinese names and stray CJK fall back to the system Songti / Noto Serif CJK.

## Layout

- Page container: 880px, made of a 620px text column, a 40px gap, and a 220px margin column.
- From 1020px up, notes and citations sit in the margin column beside the sentence they
  belong to. Below that, the margin column disappears and a note opens in place when its
  number is tapped.
- A post with no notes or citations has nothing for the margin column, so its text is centered
  instead: a 730px column in the middle of the page, set in 20px type on wide screens.
- Figures and videos are set at the width of the text. `wide` is available for one that needs
  all 880px, but posts do not use it by default.
- Phone gutters are 20px. Display math, tables, and code scroll horizontally inside their own
  box; the page itself never scrolls sideways.

## Navigation

- The whole site has one top bar, pinned above every page: About, Publications, Blogs, and
  the theme toggle. It is rendered by the root layout, so it never changes or reloads.
- The home page holds three views under that bar and switches between them in place. About
  has the bio, research, news, and selected publications. Publications lists every paper.
  Blogs lists every post. The view is kept in the URL hash (`/#publications`, `/#blogs`).
- A post opens under the same bar, with Blogs marked. It has a kicker, title, standfirst,
  metadata, then an inline two-column contents block. A 2px crimson line at the top of the
  viewport shows reading progress. A Contents button fixed at the left (bottom-left on
  phones) opens the table of contents as a side panel with the current section marked; from
  1440px up the panel fits in the margin and can stay open.
- Footer of a post: references, tags, previous and next. Tag pages live at `/blogs/tags/`.
  There is no separate blog home: `/blogs/` forwards to the Blogs view. Old `/blog/...` addresses forward
  to their `/blogs/...` equivalents.

## Components available in posts

| Component | What it does |
|---|---|
| `<Sidenote>` | Numbered margin note |
| `<Cite k="key" />` | Numbered margin citation; also listed under References. Entries are read from `content/blog/references.bib` (BibTeX), which you create when the first post needs it |
| `<Figure src caption wide />` | Image with a numbered caption; size is read at build time so the page never shifts. Clicking it opens it enlarged |
| `<Video src caption loop />` | Video with controls; `loop` plays it muted like a GIF, with a pause button |
| `<FigureTabs>` | Several images in one numbered figure, switched by tabs |
| `<Callout label>` | A light grey, slightly smaller block. All callouts look the same; the small label (Definition, Takeaway, Comment) says which kind it is |
| Interactive figures | None yet. Put a client component in `src/components/blog/interactive/`, wrap it in `FigureShell`, and register it in `src/app/blogs/[slug]/page.tsx` |
| Fenced code, `$math$`, `$$math$$`, tables | Shiki, KaTeX, GFM |

## Writing a post

Add `content/blog/<slug>.mdx` and put its media in `public/blogs/<slug>/`.

```yaml
---
title: Why an auction can replace an orchestrator
description: One or two sentences, used as the standfirst, in lists, and in RSS.
date: 2026-11-12
type: paper          # note | paper | essay | project
tags: [multi-agent, mechanism design]
authors:                         # optional; shown under the title
  - { name: Ada Lovelace, affiliation: Harvard University }
  - { name: Alan Turing, affiliation: MIT }
cover: /blogs/<slug>/cover.png    # optional, shown when the post leads the home page
thumb: /blogs/<slug>/thumb.png    # optional, shown in lists
---
```

Headings are numbered automatically: `##` gets 1, 2, 3, `###` gets 1.1, and `####` gets 1.1.1.
Acknowledgements, Citation, References and appendices are left unnumbered. The contents block
lists the `##` headings, and the side panel lists all three levels. RSS is served at `/blogs/rss.xml`.
