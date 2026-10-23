# Content plan: first two chapters of every grade

Goal: units 1 and 2 of each grade live as interactive book chapters (`view: "book"`, `free: true`).
Sources live in **github.com/mhreteabeTD/meseret-sources**: read `SOURCES.md` and `catalog.json` there. Never ask the owner to upload a book again.

## Tester requests first (2026-10-23)
G7: Maths U1–3, Citizenship U1–3, CTE U1–3, Science U2–3, Social U2–3 (session A). G8 + G5 all subjects U1–2 (session B, `docs/HANDOFF-G8-G5.md`). G9 + G12 all subjects U1–2 (session C, `docs/HANDOFF-G9-G12.md`). How: `docs/CHAPTER-BUILD.md`.

## Order (after the tester list)
1. **Grade 12, Grade 8, Grade 6 first** (national/regional exam grades), then 7, 9–11, 5, 1–4.
2. Within a grade: **Maths first**, then English, then Science (Gen. Science 7–8; Physics, Chemistry, Biology 9–12), then the rest.

| Grade | Maths U1 | Maths U2 | Next subjects |
|---|---|---|---|
| 12 | **built** (`g12-maths-u1`) | todo | Physics, Chemistry, Biology U1–2 next; then Geography, History, Economics, IT, Agriculture. English: book missing |
| 8 | **built** | **built** | English, Gen. Science |
| 7 (session A) | **built** | **built** | built: maths U1, maths U2, maths U3, citizenship U1, citizenship U2, citizenship U3, cte U1, cte U2, cte U3, science U3, social U2, social U3 · todo: science U2 |
| 6 | todo | todo | English, Science (Amharic) |
| 5 | **built** | todo | |
| 9 | U1 older version exists (rebuild queued) | todo | Physics, Biology, English, Geography, History, Economics, Citizenship, IT, HPE, PVA, Amharic queued. Chemistry: book missing |

## Pipeline (each stage done once)
0. **Storage**: PDFs out of git into Releases (repo is at ~4.3 GB of a 5 GB comfort limit).
1. **Transcribe** (the only stage that opens a PDF): cut the unit's pages, write `meseret-sources/textbooks/g<n>/<subject>/u<k>/source.md` per the README rules: faithful text, page refs, every exercise answered with full steps, `[review: …]` when unsure.
2. **Exam map** (grades 12, 8, 6): questions from the exam books on this unit's topics go into `exams/<exam>/bank.json` with answer, explanation, `maps_to`, `key: paper|generated`, `verified`. Used for ★★★ items and the chapter test.
3. **Design**: one short lesson map in the G8 design doc format (sections, blocks, generators, ★★★ shapes). Batch per subject.
4. **Build**: lesson JSON from `source.md` + map, existing blocks only; generators for every computational idea; challenge per idea; section tests (5 items); timed chapter test (rule 13).
5. **Check**: validator, 360 px Playwright, other chapters still load; review list for a teacher (and an Amharic speaker for G1–6).

## Rules that keep it fast
- **Engine freeze during content work.** New blocks or engine changes only with the owner's OK, in their own commit.
- **One subject across grades**, so templates and generators get reused.
- **Parallel sessions by grade band** (1–6 Amharic · 7–8 · 9–12), each reading this file and `CLAUDE.md`.
- A session ends with: validated, deployed, `CONTENT-PLAN.md` table updated.
