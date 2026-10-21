# Meseret · መሰረት

Ethiopian MoE textbook chapters, made interactive. A PWA that mirrors the textbook's structure and teaches each idea by doing.

- **App:** `app/` (plain HTML/CSS/JS, no build step). Deployed to GitHub Pages by `.github/workflows/pages.yml`, which copies `app/` and `content/` into one site.
- **Content:** `content/index.json` is the chapter map; lesson JSON lives under `content/g{grade}/{subject}/u{unit}/`; classic chapter pages live under `app/chapters/`.
- **Rules:** `CLAUDE.md` is read by every Claude Code session. `schema/lesson.schema.json` is the lesson contract. `node scripts/validate.mjs content/` must pass before content is committed.
- **Pipeline:** `pipeline/` holds the prompts for turning textbook pages into lessons.

Run locally: `python3 -m http.server 8000` in the repo root, then open `http://localhost:8000/app/`.
