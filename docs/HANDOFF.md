# Meseret — handoff prompt for a new chat

Paste everything below the line into a new chat.

---

You are continuing work on **Meseret (መሰረት)** with me, Mhreteabe (founder, developer, working mostly from a tablet). Act as an expert across edtech, pedagogy, UX, architecture and startups. Motto: fast execution — remove bottlenecks with workarounds while keeping the structure intact. For design decisions, discuss with me before building; I'll say "build" when ready. Keep replies short and concrete.

## What Meseret is
"The textbook, made interactive." A PWA that turns Ethiopian MoE textbook chapters into interactive, colourful, book-familiar lessons for students (all grades; chapters released one at a time in school order). First chapter of every subject free; pricing anchored on the cost of a private tutor; two pilot schools ready to pay. Volunteer teachers review content in parallel (not a release gate). Many students are not fluent in English: the UI is Amharic-first, lessons stay in English (exam language) with Amharic glosses/explanations.

## Where things are
- Repo: github.com/mhreteabeTD/meseret (public). Live: https://mhreteabetd.github.io/meseret/ (GitHub Pages via `.github/workflows/pages.yml`; push to `main` deploys; the workflow runs the validator).
- Read `CLAUDE.md` in the repo first (rules every session follows: content vs engine sessions, lesson contract, teaching rules, language rules, engine rules, finish checklist).
- `app/` plain HTML/CSS/JS PWA, no framework/build. `app/app.js` (all views), `app/styles.css` (CSS variables, light/dark), `app/i18n/en.json` + `am.json` (all UI strings), `app/pictures.js` (39 inline-SVG science drawings: lab tools, hazard/protective signs, branches, etc.), `app/sw.js` (network-first, auto-reload on update).
- `content/index.json` chapter map; lessons `content/g{grade}/{subject}/u1/s{section}.json` (32 lessons: G9 Maths U1 ×18, G7 Science U1 ×8, G7 Social Studies U1 ×6). `schema/lesson.schema.json`; `node scripts/validate.mjs content/` must pass.
- `pipeline/convert-brief.md` (how to convert a chapter), `pipeline/pictures-brief.md` (picture ids and block shapes). Original chapter pages in `sources/`.
- Git commits as "Mhreteabe Tesfaye <mhreteabetesfaye71624@gmail.com>". In the cloud session, GraphQL was blocked: trigger workflows with `gh api -X POST repos/mhreteabeTD/meseret/actions/workflows/pages.yml/dispatches -f ref=main`; test with Playwright (Chromium at /opt/pw-browsers/chromium, `--headless=new`) at 360px width.

## Current design (trial on ONE chapter: Grade 7 Science Unit 1, route `#book/g7-science-u1`)
- **One colourful scrolling page per chapter** (no Next buttons), sticky section chips (1.1.1 …) that fill with progress, gradient hero header.
- **Top bar:** back · progress bar with % · ⏱ focus timer · ⭐ stars.
- **Progress counts only what the student did** (answered questions, finished games, explored figures, answered think-first) — never scrolling; skipped questions don't count.
- **Blocks (reusable, built once in app.js → `Blocks`):** `read` (short text, ≤2 short sentences per paragraph), tappable highlighted key words (bottom sheet with meaning + Amharic), short 💡 note tips (tap to expand; only student-useful notes — process/review notes live in the lesson's `notes`, never shown), `name` key-word cards, `guess` "Think first" (not graded), quick checks (`mcq`/`tf` tap-to-answer: clue on wrong, answer after 2nd wrong), games inline (`sort`, tap-to-pair `match`, `order`, `pick`), `picture`, `gallery` (tap a picture to see info), `people` (face cards; photos from Wikimedia/other URLs, initials fallback), interactive figures: `tree` (tap a box), `venn` (tap a circle/overlap), `tap` (tap buttons, optional pictures).
- **Celebrations:** stars (+10 first try, +5 second), confetti, floating "+10", 🔥 streak at 3, vibration, section-done banner (+20).
- **Skip:** only when stuck — typed/multi-step questions show Skip from the start; tap questions only after a wrong try. Skipped questions wait in the section's Practise.
- **End of each section:** 🎯 Practise set (remaining questions; replays only missed ones; step-by-step player) and the book's exercises.
- **Focus timer (Pomodoro-style):** 15/20/25 min focus → celebration + stars → 5-min break.
- **Select-to-translate (experimental):** select any lesson text → 🌐 Amharic button → machine translation (free Google gtx endpoint, MyMemory fallback, cached on the phone). Pluggable providers in `Translate.providers`.
- **Switched off:** scratch pad/calculator (`WORK_TOOLS = false`), "show answer" activity cards (not wanted).
- Other two chapters (G9 Maths, G7 Social) still use the older per-section scrolling reader; to be moved to the book design after the trial is approved.

## Decisions & preferences I've given
- Interactivity is a key component: use interactive figures wherever useful (like tapping branches of science). Visual-first, multimodal; text short.
- Keep the book's structure (section numbers, key words, exercises by book name). Students shouldn't see behind-the-scenes text.
- Modular design: every element is a reusable block so a feature (e.g., translation) added once applies everywhere.
- Use any real photo found for people; I'll flag problems.
- Teacher review and Amharic speaker review run in parallel; all Amharic is machine-made (`"machine": true`) and needs a speaker's check.

## Grade 8 Maths Unit 1 (built 2026-10-22)
- Spec: `docs/G8-MATHS-U1-DESIGN.md`. Whole unit live at `#book/g8-maths-u1` (13 sections incl. ★ summary, review, chapter test).
- New blocks: `numline`, `fracbar`, `grid`, `nest`, `slider`; numeric blanks (`num`), sign-first input (`input: signed`); fractions drawn stacked automatically.
- Fresh questions: `gen` on a screen → new numbers on practice replays and tests (rules in the spec). Book page and book exercises stay the book's.
- Students choose one or more grades in setup; home shows only those grades (`meseret:grades`).
- Tips (💡) are now always fully shown, not tappable.

## Next chapter: Grade 5 Mathematics (Amharic)
- Grades 1–6 books are in Amharic (all subjects); Grade 5 Maths is the first, and its engine work makes Amharic lessons a general capability (`"lang": "am"`).
- Full handoff with decisions: `docs/G5-MATHS-HANDOFF.md` (Amharic lessons, Amharic generators, Ask Meseret chat).
- Content design: `docs/G5-MATHS-U1-DESIGN.md` (lesson map, blocks, verified answers, book errors, build order).
- **Engine A done (2026-10-22):** lesson `lang`/`main`, lesson-language UI words (`LESSON_KEYS`), Amharic-first key words, am→en translate, Grades 1–12 in setup, `grid` modes `tile`/`shape`, `cubes`, Amharic-unit-tolerant numeric answers. Smoke test: `eval/engine-g5-sample/`. **Content 1 done (2026-10-22):** lessons 1.1–1.3 in `content/g5/maths/u1/` (Amharic, `machine: true` text awaiting a speaker's check), chapter `g5-maths-u1` in the index (free, book view). **Engine B + visual pass done (2026-10-22):** `figure` block (tap-to-reveal pictures), `ladder` block (unit ladder, powers 1–3 or custom units), `@rect:WxH` / `@obj:<name>` drawn pictures inside sort/match/mcq/tap, Amharic generators `area`/`count`/`volume`/`convert`/`litres`; match uses index-based right buttons (duplicate right labels OK, left items unique). **Content 2 done:** all of Unit 1 is in (`s1-1`…`s1-6`; chips 1.1 · 1.2 · 1.3 · 1.4 · 1.4.2 · 1.5 · ★; ★ = summary, recap, chapter test, review Q1–Q9). Book misprints are carried as `correction`/`review` notes. **Needs a human:** an Amharic speaker for every `machine` string; a teacher for the `review` notes; confirm the Grades 1–12 picker after reloading. **Next: Grade 5 Unit 2 design, or Amharic review of Unit 1.**

## Feedback (reports and ideas)
- 💬 Feedback & ideas on home and Settings, 🚩 at the end of every book section and in the player. One form (Feedback in app.js): type, message, optional screenshot and name/phone; where the student was is added automatically. Messages queue on the phone and send when online.
- **Live (2026-10-23):** goes to the owner's Google Sheet "Meseret Feedback" through `server/feedback-apps-script.gs` (Apps Script web app; URL in `FEEDBACK_URL` in app.js). Messages queue on the phone and send when online.
- Floating 💬 button on every lesson screen: attaches a picture of the screen and the context (grade, chapter, section, lesson ID, item ID, question text). Each row has an **Open ↗** link (`#book/<chapter>/item/<item id>`) that opens the app at that exact question, highlighted.
- If the Apps Script changes: paste it, then Deploy → Manage deployments → Edit → New version (keeps the same URL).

## Open items / next steps
- **TODO (on hold, owner): Ask Meseret AI chat.** Design is decided in `docs/G5-MATHS-HANDOFF.md` ("Ask Meseret"). Blocked on payment: the owner will create an Anthropic API key (Default workspace is fine), set up billing and a monthly spend limit, and a free Cloudflare Worker with the key as secret `ANTHROPIC_API_KEY`. Do not build it until the owner says so. Never put the key in the repo or the chat.
1. Get my feedback on the live Science trial and adjust.
2. Move G9 Maths U1 and G7 Social Studies U1 to the book design (visual-first rewrite, pictures, interactive figures, faces where relevant).
3. Possible full code split of app.js into modules (blocks/, views/, core/) — discuss first.
4. Later: sign-in (Google/Telegram, username fallback, class codes), payments, Afaan Oromoo, audio/video explanations, teacher/parent/admin dashboards, exams as a separate area, Supabase for events.
5. For a teacher: Gebisa Ejeta / Yalemtsehay / Tewolde photo sources, Yalemtsehay details, Science Exercise 1.3 Q2 (beaker vs cylinder), added safety "what to do" lines, extra tools gallery in 1.2.1.

Start by reading `CLAUDE.md` and `docs/HANDOFF.md` in the repo, then ask me what I want to do next.
