# Handoff — Grade 9 and Grade 12 chapters (tester requests)

You are continuing work on **Meseret (መሰረት)**, an Amharic-first PWA that turns Ethiopian MoE textbook chapters into interactive lessons. Repo `github.com/mhreteabeTD/meseret`, live at `https://mhreteabetd.github.io/meseret/`. Owner: Mhreteabe (works from a tablet; wants short, concrete replies; fast execution). Another session builds Grade 7, and a third builds Grades 8 and 5, in parallel with you.

**Read first:** `CLAUDE.md`, then `docs/CHAPTER-BUILD.md` (how to get the books and build a chapter — follow it exactly), then `docs/G8-MATHS-U1-DESIGN.md`.

**Your list, in this order** (Units 1–2 each; the books are in the sources repo):
1. **G12 Maths U1, U2** — already transcribed: `meseret-sources/textbooks/g12/maths/u1/source.md` and `u2/source.md` (every answer worked; 63 `[review]` flags, some are real book errors — use the corrected version and keep a teacher note). Do not open the PDF.
2. G12 Physics, Chemistry, Biology U1, U2
3. G12 Geography, History, Economics U1, U2
4. G12 IT, Agriculture U1, U2
5. G9 Maths U1, U2 — note `g9-maths-u1` exists in an **old format** (not `view: "book"`); rebuild it in the book format and switch the index entry over when the new one passes the checks.
6. G9 Physics, Biology U1, U2
7. G9 English U1, U2
8. G9 Geography, History, Economics, Citizenship U1, U2
9. G9 IT, HPE, PVA (Performing & Visual Arts), Amharic U1, U2

Missing books (skip, tell the owner): **G9 Chemistry, G12 English**. The G9–10 teacher guides are in the sources repo (`guides/g9/...` in catalog.json) — use them for official answers and how to explain a step. The KEY exam book (`exams/raw/Key Exam Book 2009_2015`) has the Grade 12 national exams 2012/13–2015 EC with answers and explanations; use questions on each unit's topics for ★★★ items and the chapter test (`ref` like "ESSLCE 2015 Q14").

That is about 42 chapters. Ship each one as soon as it passes the checks; don't wait for the batch. Use parallel subagents for transcription (one per 25–30 pages) to go fast; build the lesson JSON yourself so the quality stays consistent with the template.

End every reply with **Done / Current / Next**.
