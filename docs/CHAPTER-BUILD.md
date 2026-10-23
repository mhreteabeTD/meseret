# How to build a chapter (every session follows this)

The **G8 Maths Unit 1 book chapter is the template** (`#book/g8-maths-u1`, `content/g8/maths/u1/`). Non-maths chapters follow **G7 Science Unit 1** (`content/g7/science/u1/`), which is the same book format with read/name/mcq/match/sort blocks instead of maths figures. Read `CLAUDE.md` first; its rules always win.

## 1. Get the book (never ask the owner to upload)
Sources: `github.com/mhreteabeTD/meseret-sources` (private). It is ~4.3 GB, so clone without file contents:
```
git clone --filter=blob:none --no-checkout https://github.com/mhreteabeTD/meseret-sources /home/claude/meseret-sources
cd /home/claude/meseret-sources && git sparse-checkout init --no-cone && git sparse-checkout set /README.md /SOURCES.md /catalog.json /textbooks/g12/maths/ && git checkout main
```
`catalog.json` maps a logical name (`textbooks/g8/science/full.pdf`) to the real file(s) (big books are `…part1.pdf`, `…part2.pdf` in page order). Fetch one file: `git cat-file -p "origin/main:<real path>" > /tmp/book.pdf`.
- If `textbooks/g<n>/<subject>/u<k>/source.md` already exists (e.g. Grade 12 Maths U1–U2), use it and do not open the PDF.
- Find the unit's pages from the contents page. Many books are scans: render pages with `pdftoppm -r 110 -png` and read them as images. Text PDFs: `pypdf` text is fine for prose, but look at the page images for tables, figures and maths.

## 2. Transcribe once → `source.md`
Follow the rules in the sources repo `README.md`: faithful text, `(p.N)` page marks, every exercise/activity/review question with `**Answer:**` + `**Why:**` (all steps), `[review: …]` for anything unsure or a book error. Long units can be split across parallel subagents (25–30 pages each, then merge). Push it to `meseret-sources/textbooks/g<n>/<subject>/u<k>/source.md` with a `meta.json` (small files push fine; use `git add --sparse`). **Do not push PDFs or move big files there** (the repo is near its size limit; renames of big files fail).

## 3. Build the lessons
- One lesson file per book subsection: `content/g<n>/<subject>/u<k>/s<k>-<sec>.json` (e.g. `s2-1-3.json`), same keys as the template: `id, book, title, competency, minutes, keywords, ideas, exercises, test, notes, review, version`.
- Book structure kept: section numbers, key words, activities, examples, exercises by their book names (`ref`).
- Every graded item has `level` 1–3; each idea ends with one `step: "challenge"` item; section `test` has 5 items; maths/science computations use `gen` generators where one exists.
- Last lesson of the unit: summary, Review Exercise, and the **timed chapter test** exercise (`chapter_test: true`, 20 q / 25 min; Grades 1–6: 15 q / 20 min).
- Language: Grades 1–6 lessons are Amharic (`"lang": "am"`, see `docs/G5-MATHS-HANDOFF.md`); Grades 7–12 English. Language subjects (Amharic, English) teach the book's reading, vocabulary and grammar activities with the same blocks.
- **Engine freeze:** do not edit `app/`, `schema/` or `scripts/`. If a chapter truly needs a new block or generator, use the nearest existing block, note it in the review list, and tell the owner; engine changes happen in their own session.

## 4. Register the chapter
Add one entry to `content/index.json` → `chapters` (copy the shape of `g7-science-u1`: `id` like `g8-science-u2`, `grade, subject, unit, title {en, am}, pages, free: true, view: "book", sections[]`). If the subject key is missing from `subjects`, add it (`citizenship, cte, it, amharic, biology, chemistry, physics, geography, history, economics, agriculture, hpe, pva`) with `en`, `am` and a one-character icon. Several sessions edit this file: always `git pull --rebase` right before committing, and only touch your own entries.

## 5. Check and ship (per chapter, do not batch)
- `node scripts/validate.mjs content/` passes.
- Playwright at 360 px (Chromium `/opt/pw-browsers/chromium`, `--headless=new`, server via `run_in_background`): the chapter opens, no horizontal scroll, no console errors, practise + chapter test run; other chapters still load.
- Commit as "Mhreteabe Tesfaye <mhreteabetesfaye71624@gmail.com>", push to `main`, check `gh run list --workflow pages.yml`.
- Update the table in `docs/CONTENT-PLAN.md` (your row only).
- Tell the owner in 2–3 lines: chapter live, link `#book/<id>`, review flags for a teacher.

## Generators and blocks added for Grade 7 (2026-10-23)
- `gen` types: `int` (`op`: add, sub, mul, div, cmp, order; integers with sign-first answers), `sets` (`op`: union, inter, count, subsets, proper, elem), `lineq` (`form`: one, two, bracket, both, frac, eval; `y: true` for "y = …, when x = …"), `quad` (which quadrant; `place: true` → a coord item). Each has ★★★ shapes (missing number, spot the mistake, three terms, think-of-a-number, moved point).
- `coord` block: a coordinate grid. `min`/`max` (x), `ymin`/`ymax`, `points` [{x, y, name?, info?}] to explore, `lines` [{m, b} | {x} | {pts}], `quadrants: true`, graded `targets` [{x, y, name?}] (tap a grid point; it snaps). Points must be whole numbers inside the grid (validator checks).
