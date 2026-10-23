# Meseret — rules every session reads

Meseret (መሰረት, "foundation") turns Ethiopian MoE textbook chapters into interactive lessons. One PWA plays lesson JSON; a pipeline produces that JSON from textbook pages. Read this file, then do ONE job per session.

## Repo layout
```
app/         the PWA (plain HTML/CSS/JS, no framework, no build step)
content/     lesson JSON by grade/subject/unit, plus content/index.json (the chapter map)
pipeline/    the prompts for each content stage (1-extract, 2-write, 3-check)
schema/      lesson.schema.json — the contract between pipeline and player
scripts/     validate.mjs (run before every content commit), later audio/publish/videos
eval/        reference lessons judged good; re-run prompts against them after a prompt change
docs/        product and architecture notes
```

## Two kinds of session, never mixed
- **Content session**: writes or edits files under `content/`. Never touches `app/`.
- **Engine session**: changes `app/`, `schema/`, `scripts/`. Never writes lesson content.
If a content job needs a screen kind the player lacks, stop and say so; do not fake it with another kind.

## The lesson contract
- One JSON file per textbook section: `content/g{grade}/{subject}/u{unit}/s{section-with-dashes}.json` (e.g. `content/g9/maths/u1/s1-1-4.json`).
- Every file validates against `schema/lesson.schema.json`. Run `node scripts/validate.mjs content/` before finishing. A session that cannot make it pass reports the failure; it never patches around it.
- IDs: lesson id `g9.maths.u1.s1-1-4`; idea ids are stable slugs `math.gcf`, `sci.lab-safety.acid-into-water`; item ids `{lesson id}.{n}`. IDs never change once published.
- Screen kinds the player renders (add a kind to the player first, then use it): `read`, `guess`, `tiles`, `sort`, `tap`, `steps`, `name`, `mcq`, `tf`, `blank`, `pick`, `match`, `order`.
- The player shows a lesson as ONE vertical scrolling page, like the textbook (no Next button between screens). Screens are blocks on that page; questions are answered inline. `read` blocks carry the book's own text (`paras`, optional `table`, `note`), so the page reads like the book.

## Teaching rules (non-negotiable)
1. Teach before testing. Order inside an idea: hook → explore → name it → check → practise.
2. Hook and explore come BEFORE any definition. The student predicts, then sees. Nothing in a hook is graded.
3. A wrong answer gets a clue, never the answer, never a scolding, never a diagnosis. Second wrong try: show the worked answer, then a similar item.
4. Practice checks (with clues) are separate from the end-of-chapter test (no clues).
5. Sentences under 15 words in lesson text; one idea per screen; define a term before using it.
6. Keep the book's structure: unit, section numbers, titles, key words, exercises by their book name. Content from the book stays faithful; anything added is marked `"added": true`.
7. Keep Ethiopian context: local names, places, birr, local examples. Prefer an Ethiopian example when adding one.
8. Blanks accept meaning, not exact spelling: give an `a` list of accepted answers; the player also tolerates 1–2 letter spelling slips.
9. Every idea lists what it `requires` (one level down only, e.g. `math.gcf` requires `math.prime-factorization`). For each requirement the lesson carries a `refreshers[id]` mini-lesson of 2–3 screens (one worked `steps`, one graded check). Screens that use the prerequisite carry `"needs": "<id>"`; the player shows a "Need a reminder?" link there and offers the refresher after a wrong answer.
10. Students can always "work it out": the player gives a scratch canvas and a calculator on every graded screen, and a lesson may name an explorer `tool` (today: `factors`). Tools let students test ideas; they never compute the answer to the question.
11. Facts, numbers and dates are checked against the pages and standard knowledge. Unsure → keep the book's version and add a note `{"kind":"review", ...}`. Never invent.

12. **Mixed difficulty.** Every graded item has `"level"`: 1 ★ basic (book level, one step), 2 ★★ standard (two steps, negatives, mixed numbers), 3 ★★★ challenge (missing number, spot the mistake, multi-step word problems). Each idea ends with one inline `"step": "challenge"` item (level 3, added). Generators take a level (`gen.level`; `Gen.make(s, seed, lang, level)`), and give each topic a ★★★ shape in `HARD`. Practise mixes the lesson's own items with extra generated ★★/★★★ items that adapt (2 right → up a level, 2 wrong → down); tests use a fixed ★/★★/★★★ rotation. ★★★ answers earn 15 stars.
13. **Timed chapter test.** The last lesson of every chapter has one exercise `{"book_name": …, "chapter_test": true, "count": N, "minutes": M, "items": []}`. It draws round-robin from every section's `test` items (plus any `items`), generates fresh numbers each time, rotates ★/★★/★★★, shows a countdown (5-minute warning, ends at 0) and a result card with a per-section breakdown and "go back to Practise in …". Grades 7–12: 20 questions / 25 min; Grades 1–6: 15 / 20 min. Section tests stay untimed with 5 items each (Grades 1–6: 3–5).

## Language rules
- **The lesson language follows the textbook, which follows the grade.** Grades 1–6: the book's language (Amharic for Addis Ababa and Amharic-region books; regional books later in Afaan Oromoo, Tigrinya, …). Grades 7–12: English (the exam's language). Every lesson sets `"lang"` (`"am"`, `"en"`, later `"om"`, …); the player shows lesson-internal words (Quick check, pop-ups, generator text) in the lesson language.
- Grades 1–6 lessons keep the book's own wording (no machine translation needed for book text); key words show the book's term first with the English term as a gloss (to prepare for English from Grade 7). Grades 7–12 lessons are English with `am` (and later `om`) glosses.
- Every key word has `am` (Amharic) and, when available, `om` (Afaan Oromoo) glosses; in Grades 1–6 lessons it also has `en`.
- Every idea has an `explain` object: short explanation text per language, used for audio. Write `en` always; `am` when you can; mark machine translations `"machine": true` for a speaker's review.
- All UI strings live in `app/i18n/*.json`, never hard-coded. Amharic and Oromo text needs ~10% larger type and more line height; the CSS handles it via `[lang]`.

## Engine rules
- Target: 360px-wide low-end Android, 3G. First load under 150 KB. No frameworks, no bundler, inline SVG only, no external images.
- Light theme with dark-mode tokens; every color is a CSS variable.
- Touch targets ≥ 44px; every tappable thing is a `<button>` or `<a>`.
- Wrap all `localStorage` in try/catch. Namespace keys `meseret:` and lesson ids.
- Every answer becomes an event `{student, lesson, idea, item, correct, attempt, ms, at}` through `app/events.js`. Offline queue first, Supabase later.

## Before you finish any session
- Engine: open `app/index.html` in a browser (or `npx serve app`), check 360px width, no horizontal scroll, no console errors.
- Content: `node scripts/validate.mjs content/` passes; coverage table in your reply (ideas × has hook / check / practise).
- Reply briefly: what changed, what you could not do, what needs a human (teacher review, Amharic check). End with **Done / Current / My one next action.**
