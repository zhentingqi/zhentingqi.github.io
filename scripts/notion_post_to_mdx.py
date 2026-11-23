"""Convert the Notion page "Steps Towards Artificial Collective Intelligence" into its MDX blog post.

The text is carried over verbatim; only the markup changes. Used to re-sync the post after the
Notion page is edited:

  1. Fetch the page through the Notion connector with file URLs included, and save its `text`
     field to a file.
  2. python3 scripts/notion_post_to_mdx.py <saved text> \\
         content/blog/steps-towards-artificial-collective-intelligence.mdx \\
         steps-towards-artificial-collective-intelligence
  3. If any image or video changed, download it into public/blog/<slug>/ (videos are re-encoded
     with ffmpeg and get a <name>.poster.jpg).

The title, description, date, tags and affiliations below are specific to this post.
"""
import json
import re
import sys

src, dest, slug = sys.argv[1], sys.argv[2], sys.argv[3]
BASE = f"/blog/{slug}"

raw = open(src, encoding="utf-8").read()
body = raw[raw.index("<content>") + len("<content>"): raw.rindex("</content>")]

# ---- inline wrappers that carry no content -------------------------------------------------
body = re.sub(r'<span discussion-urls="[^"]*">', "", body)
body = re.sub(r'<span color="[^"]*">', "", body)
body = body.replace("</span>", "")

# Schematic diagrams read better at text width; plots and animations get the wide slot.
COLUMN_WIDTH = {
    "shape_1_fixed_workflow", "shape_2_parallel_agents", "shape_3_coordinator",
    "shape_4_message_passing", "shape_5_blackboard", "shape_6_bucket_brigade",
    "sharing_progress", "learning",
}

authors = []
# Affiliations given by the post's author; everyone not listed here is at MIT.
HARVARD = {"Zhenting Qi", "Yilun Du", "Guowei Xu"}


def plain(text):
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"</?[a-z]+>", "", text)
    text = text.replace("**", "").replace("\\$", "$")
    text = re.sub(r"\$([^$]*)\$", r"\1", text)
    return re.sub(r"\s+", " ", text).strip()


def caption_md(line):
    line = re.sub(r"</?i>", "", line).strip()
    line = re.sub(r"^Figure (\d+)\.", r"**Figure \1.**", line)
    line = re.sub(r"^Figure (\d+) \(", r"**Figure \1** (", line)
    return line


def media_block(kind, name, caption):
    stem = name.rsplit(".", 1)[0]
    wide = "" if stem in COLUMN_WIDTH else " wide"
    if kind == "image":
        alt = ""
        if caption:
            text = re.sub(r"^Figure \d+\S*\s*(\([^)]*\)\.?\s*)?", "", plain(caption))
            alt = text.split(". ")[0].rstrip(".")[:180]
        open_tag = f'<Figure src="{BASE}/{name}"{wide} numbered={{false}} alt={{{json.dumps(alt, ensure_ascii=False)}}}>'
        close_tag = "</Figure>"
    else:
        photo = " photo" if stem == "teaser" else ""
        open_tag = f'<Video src="{BASE}/{name}" poster="{BASE}/{stem}.poster.jpg" loop controls{wide}{photo} numbered={{false}}>'
        close_tag = "</Video>"
    if not caption:
        return [open_tag[:-1] + " />", ""]
    return [open_tag, "", caption_md(caption), "", close_tag, ""]


lines = body.split("\n")
out = []
i = 0
media_re = re.compile(r'^<(image|video) source="notion-file-block://[^"]*?name=([^"&]+)" />$')

while i < len(lines):
    line = lines[i]
    s = line.strip()

    # authors line (first non-empty text line)
    if not authors and s and not s.startswith("<"):
        authors = [a.strip() for a in s.split(",")]
        i += 1
        continue

    if s in ("<p>", "</p>", "<ul>", "</ul>", '<table-of-contents color="gray" />'):
        i += 1
        continue
    if s == "<p />":
        out.append("")
        i += 1
        continue

    m = media_re.match(s)
    if m:
        kind, name = m.group(1), m.group(2)
        j = i + 1
        while j < len(lines) and not lines[j].strip():
            j += 1
        caption = None
        if j < len(lines) and lines[j].strip().startswith("<i>Figure"):
            caption = lines[j].strip()
            i = j
        out.extend(media_block(kind, name, caption))
        i += 1
        continue

    m = re.match(r'^<callout color="(\w+)">$', s)
    if m:
        tone = "aside" if m.group(1).startswith("blue") else "key"
        label = re.sub(r"</?i>", "", lines[i + 1].strip())
        out.extend([f'<Callout label="{label}" tone="{tone}">', ""])
        i += 2
        continue
    if s == "</callout>":
        out.extend(["", "</Callout>", ""])
        i += 1
        continue

    if s == "<li>":
        item = []
        i += 1
        while lines[i].strip() != "</li>":
            if lines[i].strip():
                item.append(lines[i].strip())
            i += 1
        out.append("- " + " ".join(item))
        i += 1
        continue

    if s == "<h4>":
        title = re.sub(r"</?b>", "", lines[i + 1]).strip()
        out.extend(["", f"### {title}", ""])
        i += 3
        continue
    m = re.match(r"^####\s+(.*)$", s)
    if m:
        out.append("### " + re.sub(r"</?b>", "", m.group(1)).strip())
        i += 1
        continue

    if s.startswith("<table"):
        rows, row, cell = [], None, None
        i += 1
        while lines[i].strip() != "</table>":
            t = lines[i].strip()
            if t == "<tr>":
                row = []
            elif t == "</tr>":
                rows.append(row)
            elif t == "<td></td>":
                row.append("")
            elif t == "<td>":
                cell = []
            elif t == "</td>":
                row.append(" ".join(cell))
                cell = None
            elif cell is not None and t:
                cell.append(t)
            i += 1
        out.append("")
        out.append("| " + " | ".join(rows[0]) + " |")
        out.append("|" + "---|" * len(rows[0]))
        for r in rows[1:]:
            out.append("| " + " | ".join(r) + " |")
        out.append("")
        i += 1
        continue

    m = re.match(r'^<toggle heading="h1">$', s)
    if m:
        title = lines[i + 1].strip()
        j = i + 2
        refs = []
        while lines[j].strip() != "</toggle>":
            if lines[j].strip():
                refs.append(lines[j].strip())
            j += 1
        refs = [r.replace("[claude.dev](http://claude.dev)", "claude.dev") for r in refs]
        out.extend([f"## {title}", "", '<details className="ref-toggle">',
                    f"<summary>Show all {len(refs)} references</summary>", "", '<div className="ref-list">', ""])
        out.extend(refs)
        out.extend(["", "</div>", "", "</details>", ""])
        i = j + 1
        continue

    out.append(line)
    i += 1

text = "\n".join(out)

# ---- inline emphasis: move edge whitespace outside the markers -----------------------------
text = re.sub(r"<b>(\s*)(.*?)(\s*)</b>", lambda m: f"{m.group(1)}**{m.group(2)}**{m.group(3)}", text)
text = re.sub(r"<i>(\s*)(.*?)(\s*)</i>", lambda m: f"{m.group(1)}*{m.group(2)}*{m.group(3)}", text)
text = re.sub(r"<code>(.*?)</code>", r"`\1`", text)

# ---- citation block points at the blog, not the private Notion page ------------------------
text = text.replace("```txt", "```bibtex")
text = re.sub(r"url\s+= \{https://app\.notion\.com/p/[0-9a-f]+\}",
              f"url          = {{https://zhentingqi.github.io{BASE}/}}", text)

# ---- tidy whitespace -----------------------------------------------------------------------
text = "\n".join(l.rstrip() for l in text.split("\n"))
text = re.sub(r"\n{3,}", "\n\n", text).strip() + "\n"

front = "\n".join([
    "---",
    "title: Steps Towards Artificial Collective Intelligence",
    "description: Some multi-agent systems keep improving as agents are added and many do not. What sets the ceiling, what a team costs, how natural and human collectives scale, and how to test a claim that a system scales.",
    "date: 2026-11-23",
    "type: essay",
    "tags: [multi-agent, collective intelligence, scaling]",
    "authors:",
    *[f"  - {{ name: {a}, affiliation: {'Harvard University' if a in HARVARD else 'MIT'} }}" for a in authors],
    f"cover: {BASE}/cover.jpg",
    "---",
    "",
    "",
])
open(dest, "w", encoding="utf-8").write(front + text)

# ---- report --------------------------------------------------------------------------------
print("authors:", authors)
print("chars:", len(text), "figures:", text.count("<Figure "), "videos:", text.count("<Video "),
      "callouts:", text.count("<Callout "), "h2:", len(re.findall(r"^## ", text, re.M)), "h3:", len(re.findall(r"^### ", text, re.M)))
left = sorted(set(re.findall(r"</?[a-z][a-z0-9-]*", text)))
print("lowercase tags left:", left)
no_code = re.sub(r"```.*?```", "", text, flags=re.S)
no_math = re.sub(r"\$\$.*?\$\$", "", no_code, flags=re.S)
no_math = re.sub(r"(?<!\\)\$[^$\n]*?(?<!\\)\$", "", no_math)
braces = [l for l in no_math.split("\n") if ("{" in l or "}" in l) and not l.startswith(("<Figure", "<Video"))]
print("lines with braces outside math/code:", braces[:5])
print("stray < in prose:", [l[:80] for l in no_math.split("\n") if re.search(r"<(?![A-Za-z/])", l)][:5])
print("unescaped $ left:", [l[:100] for l in no_math.split("\n") if re.search(r"(?<!\\)\$", l)][:5])
