# Brief: convert a classic chapter section into a lesson JSON

The app shows each lesson as ONE scrolling page that reads like the textbook, with the questions inline (no Next buttons). So the lesson must carry the book's text, not only questions. Students should feel they are reading their book, with a question every few paragraphs.

You are a content session (see CLAUDE.md: write only under `content/`). Read, in order:
1. `CLAUDE.md` (rules), 2. `schema/lesson.schema.json`, 3. `content/g9/maths/u1/s1-1-4.json` (the reference lesson: copy its style, length and shape), 4. `scripts/validate.mjs` (what will be checked).

Source: the classic chapter page under `sources/` (already rewritten from the textbook and fact-checked, with correction notes). Find your section by its heading (e.g. `<h3>1.1.2 ...`) and use ONLY its content plus its Activities, checks, exercises and "Show the answers". Keep every fact, key word, example, table and correction note. Never invent facts.

## Output
One file per section at `content/g{grade}/{subject}/u1/s{section-with-dashes}.json`, id `g{grade}.{subject}.u1.s{...}` (subject folder is exactly `maths`, `science` or `social`).

## Shape of a lesson
- `book`: { title, grade, subject, unit: 1, unit_title, section: "1.1.2", pages } (pages from the source eyebrow if known).
- `title`, `competency` (one sentence), `minutes` (5–12).
- `keywords`: every key word the section uses; each has `en`, `am` (Amharic gloss), `def` (≤ 25 words). Mark `"machine": true` on each (a speaker will review the Amharic). Every term defined on a `name` screen MUST be in `keywords` (exact same wording, case-insensitive).
- `ideas`: 1–3 per section. Idea id like `math.division-algorithm`, `sci.branches-of-science`, `soc.earth-rotation` (lowercase, dots, hyphens). Each idea has:
  - `explain`: `en.text` (≤ 60 words, plain), `am.text` with `"machine": true`.
  - `requires` (optional) + lesson-level `refreshers` for one-level-down prerequisites in maths (2 screens: a `steps` worked example + a graded `mcq` check), and `"needs": "<id>"` on screens that use it.
  - `screens` in this order: 
    1. hook (step "hook"): `guess` (opts, ask, after; NOT graded) or `sort`/`tap` with `"graded": false`. Use a real Ethiopian situation (birr, injera, Addis, Lake Tana, teff, school…). Book Activities make good hooks.
    2. optional `notice` (graded mcq) — what did you notice?
    2b. `read` blocks (step "read"): the book's explanation for this idea, in order — `title` (the book's sub-heading), `paras` (short paragraphs, 1–4 sentences each, faithful to the source), optional `table` ([[header…],[row…]]) for book tables, optional `note` for a correction or side note. Use 1–4 read blocks per idea; worked examples from the book go in `steps`. Put a check or practise item after every 2–3 read blocks so reading is never long without a question.
    3. `name` (step "name"): `defs` [[term, meaning], …] — the first place a term is defined.
    4. `check` (step "check", graded): `mcq` / `pick` / `tf` with `why` and `clue`.
    5. optional `method` (`steps`) when there is a procedure (worked example, one line per step).
    6. 2–4 `practise` items (graded), mixed kinds, at least one `blank` (with `ask` containing `___` and `a` = list of accepted answers incl. number words/formats) and one word problem. Every graded item has `why` and `clue`; the hardest gets `worked`.
- `exercises`: the book's exercises by their book name (e.g. "Exercise 1.3", "Activity 1.4"), each question as a graded `blank`/`mcq`/`tf` item with step "exercise", taken from the source with answers from "Show the answers". Skip open-ended discussion questions. Max 6 items per exercise.
- `test`: 3 items, step "test", graded, `"clue": ""`, covering the section.
- `notes`: copy the section's correction notes as `{kind: "correction" | "note" | "review", text}`.
- `review`: {"status": "validated"}, `version`: 1.
- Maths lessons: set `"tool": "factors"` only where factors/primes/GCF/LCM are involved.

## Screen kinds the player renders (no others)
read{paras,title?,table?,note?} · guess{opts,ask,after} · sort{bins,items:[[item,bin,why]]} · tap{items:[[name,info]],need?,ask?} · steps{steps:[...]} · name{defs} · mcq{opts,ans,why,clue,ask?} · tf{text,a(boolean),why,clue} · blank{ask with ___, a:[accepted],why,clue} · pick{pool,a,why,clue} · match{pairs:[[left,right]],why} · order{items in correct order,why}
Do NOT use `tiles` (it is a special whiteboard figure). `figure` is only for the reference lesson's board/venn/factors; omit it.

## Style
Sentences under 15 words, plain English for the grade. One idea per screen. Titles ≤ 6 words. mcq `ans` must exactly equal one option. A clue never gives the answer. Use × ÷ − √ and superscripts like the source.

## Finish
Run `node scripts/validate.mjs content/` and fix YOUR files until they pass (ignore files you did not write). Reply with: files written, ideas per file, anything you skipped or flagged.
