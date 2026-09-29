---
name: arena-moodboard
description: Build aesthetic moodboards from Are.na, plus the synthesis prose that makes them useful (descriptors, through-lines, setting descriptions). Use when the user wants moodboards, visual reference collection, aesthetic research, or asks to pull imagery from Are.na channels, explore an aesthetic, or develop a visual direction. Triggers on "moodboard", "are.na", "aesthetic", "visual reference", "collect images for", "find the look of", "art direction".
---

# Are.na Moodboard

Turn Are.na channels into a moodboard HTML file, then read the result back as
descriptors and setting prose. The board is the artifact; the synthesis is the
point.

## Before you start

The skill needs an Are.na personal access token in the environment variable
`ARENA_TOKEN`. Get one at https://www.are.na/settings/personal-access-tokens
(`read` scope is enough). If it is missing, stop and ask the user to set it —
do not proceed with a guessed or hardcoded token.

Verify auth before doing anything else:

```powershell
curl.exe -s -H "Authorization: Bearer $env:ARENA_TOKEN" "https://api.are.na/v3/me"
```

Expect a JSON user object. `403` means a bad or expired token. Remember the
`tier` field: free is 120 req/min, guest 30. Interactive work never approaches
this; bulk enumeration does, and is against Are.na's terms.

## The method

### 1. Find channels

Three ways in, in order of usefulness:

- **By group.** A group's channels are the richest seam. CARI
  (`consumer-aesthetics-research-institute`) has ~90 curated channels, each with
  a written thesis. Enumerate with `per=100`.
- **By traversal.** Given a block the user likes, fetch its connections. Every
  channel a block appears in is a lead whose name you would never have guessed.
  This is the highest-signal discovery method and the reason this skill exists.
- **By channel slug**, if the user names one.

Global search is **Premium-only** and returns `403` on free accounts. Do not
build a workflow that depends on it. Discovery is by traversal, not keyword.

### 2. Harvest images

Use `scripts/harvest.mjs` to fetch a channel's blocks and emit the image URLs,
titles, and credits as JSON.

```powershell
node scripts/harvest.mjs <channel-slug> [per]
```

Critical detail: **use `image.src`, never `small`/`medium`/`square`.** The
`original_` URL on CloudFront is the untouched source file and is why Are.na
images look sharp while Pinterest's do not. Serving a thumbnail variant throws
away the main advantage of the source.

Some blocks carry no image (`Text`, `Link`, `Attachment`) — skip them.

### 3. Curate

The harvest is raw. Your job is selection:

- Drop off-theme blocks. A channel is a curator's project, not a guarantee of
  coherence.
- Drop `Needs_images` placeholders and any URL that looks malformed. Watch for
  doubled characters in Fandom-style filenames.
- Aim for **5–10 images per mood** and **7 moods** unless the user says
  otherwise. Seven moods is the default because it forces genuine thematic
  separation rather than one theme split arbitrarily.

If a channel cannot supply 5 on-theme images, say so and pull a second channel
rather than padding with weak blocks.

### 4. Build the board

Write a single self-contained `.html` file. No external CSS, no JS, no build
step. Use the masonry technique:

```css
.grid{ columns:5 230px; column-gap:13px }
figure{ margin:0 0 13px; break-inside:avoid; overflow:hidden }
```

`columns:5 230px` plus `break-inside:avoid` gives the variable-height masonry
packing for free. See `reference/board-template.html` for the full styled
template — dark background, gradient title, hover filter, captioned tiles.

Every tile gets a caption with the **real title, year, and credited creator**
from the block metadata. This provenance is Are.na's other advantage over
image-search results; do not discard it.

### 5. Verify

Never deliver an unverified board. Run:

```powershell
node scripts/verify.mjs <board.html>
```

It HEAD-requests every image URL and reports `total=N bad=M`. **`bad` must be
0.** If not, remove or replace the offenders and re-run. A board with broken
tiles is worse than a smaller board.

### 6. Synthesize

Read the finished board back as prose. This is the half no existing moodboard
tool does, and it is what the user actually keeps:

- **Through-line** — one sentence naming what holds the set together.
- **Descriptors** — adjectives, textures, mood, as a usable vocabulary.
- **A setting description** — 3–5 short paragraphs placing a lone figure in the
  space the board describes.

Write the synthesis *after* the board, from what the images actually show. Do
not write it first and then find images to match; that produces a board that
illustrates an idea rather than one that reveals one.

## Reporting honestly

- State which channels the images came from and that you chose the selection.
- If a channel was thin, abandoned, or off-theme, say so.
- If you synthesized a unified aesthetic from a scattered set, say that too.
  Are.na channels are often several aesthetics in one; naming that is useful,
  not a criticism.
- Do not present the synthesis as found material. It is your reading.

## Reference

- `scripts/harvest.mjs` — channel → JSON of image URLs, titles, credits
- `scripts/verify.mjs` — HEAD-check every image in a board
- `reference/board-template.html` — styled board template
- `reference/api-notes.md` — endpoints, rate limits, gotchas
