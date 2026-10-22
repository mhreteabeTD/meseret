# Grade 5 Mathematics (Amharic) — Unit 1: ልኬት፣ ስፋት እና ይዘት — content design

Design spec for Grade 5 Maths Unit 1 (book pp. 1–25; source PDFs `grade-5-mathematics-new-curriculum-ch-1.pdf` = pp. 1–20 and `math-ch1-part2.pdf` = pp. 21–25; every page has content, none are spacers). Written by a design session. An **engine session** (§2) goes first, then **content sessions** (§3) turn this into lesson JSON. Follow `CLAUDE.md`, `docs/G5-MATHS-HANDOFF.md` (the Amharic decisions) and copy the shape of `content/g8/maths/u1/*.json`.

Route: `#book/g5-maths-u1`. Chapter id `g5-maths-u1`, lesson ids `g5.maths.u1.s1-1` … `s1-6`. Title: `{"am": "ልኬት፣ ስፋት እና ይዘት", "en": "Measurement, Area and Volume"}` (the Amharic is the book's own). `free: true`, `view: "book"`.

**This is the first Amharic chapter.** Every lesson carries `"lang": "am"` and `"main": "am"`; all student-facing text (read, asks, options, clues, why, steps, generator templates) is Amharic. Book text is copied faithfully (not `machine`). Anything Claude writes in Amharic (hooks, clues, added practise, generator templates, UI words) is `"machine": true` for a speaker's check.

## 0. Teaching stance for this chapter

- **One mental model carries the unit: counting unit squares and unit cubes.** Area = how many 1-unit squares cover it (ምስል 1.1–1.10). Volume = how many 1-unit cubes fill it (ምስል 1.11–1.17). Every formula arrives *after* the student has counted: count a row, count the rows, then "that is why ርዝመት × ወርድ". Nothing is stated as a rule before it is counted on screen.
- **Second model: the unit ladder.** Length km → m → cm → mm is a staircase; each step is ×1000 / ×100 / ×10 going down and ÷ going up. Area units step by the *square* of that (×10,000 for m² → cm²), volume by the *cube* (×1,000,000 for m³ → cm³). Students should *see* why 1 m² = 10,000 cm² (a 100 × 100 grid), not memorise it.
- **Grade 5 voice:** sentences under 12 words, one idea per block, big numbers written with thousands separators as the book does (`1,000,000`), Arabic digits, "." as decimal point. Units written as the book writes them: ሜ, ሳ.ሜ, ሚ.ሜ, ኪ.ሜ, ሜ², ሳ.ሜ², ሄክታር, ሜ³, ሳ.ሜ³, ሚ.ሜ³, ሊ, ሚ.ሊ.
- Keep the book's example and exercise names exactly: ምሳሌ 1 … ምሳሌ 12, ተግባር 1.1–1.4, የቡድን ስራ 1.1–1.5, መልመጃ 1ሀ–1መ, ፕሮጀክት 1, የምዕራፍ 1 የማጠቃለያ ጥያቄዎች. They go in `ref` (shown as 📖), never in the question text.
- Ethiopian context is already the book's (classroom floor, sports field, jerrycan, hospital blood bank, Abay Fekad school). Added hooks use injera, teff sacks, Addis Ababa classrooms, a Bole bakery, Lake Tana. Anything added is `"added": true`.

## 1. Lesson map

| § | Lesson (Amharic title from the book) | File | Ideas (ids) | Min | Book exercise |
|---|---|---|---|---|---|
| 1.1 | የዝርግ ወለል ስፋትን በካሬ እና ዝርግ ወረቀቶችን በመጠቀም ስፋት መለካት | `s1-1.json` | `math.area-unit-square`, `math.area-rectangle-count`, `math.area-formula` | 14 | ተግባር 1.1, ምሳሌ 1, መልመጃ 1ሀ |
| 1.2 | የወለል ስፋት በሳ.ሜ²፣ በሜ² እና በሄክታር መለካት | `s1-2.json` | `math.length-units`, `math.area-units` | 12 | ምሳሌ 2, ምሳሌ 3, ፕሮጀክት 1, የቡድን ስራ 1.1, መልመጃ 1ለ |
| 1.3 | ይዘትን በሳ.ሜ³፣ ሜ³ እና ሊትር መለካት | `s1-3.json` | `math.volume-unit-cube`, `math.volume-count-cubes`, `math.volume-formula`, `math.volume-units` | 14 | ተግባር 1.3, የቡድን ስራ 1.2, ምሳሌ 4, መልመጃ 1ሐ |
| 1.4 | የስፋትንና የይዘትን አሃዶች ከአንድ ምድብ ወደ ሌላው መቀያየር (1.4 + 1.4.1 area) | `s1-4.json` | `math.convert-length`, `math.convert-area` | 14 | ተግባር 1.4, ምሳሌ 5–8, የቡድን ስራ 1.3 |
| 1.4.2 | አንድን የይዘት ምድብ ወደ ሌላ የይዘት ምድብ መቀየር | `s1-4-2.json` | `math.convert-volume`, `math.litre-cm3` | 12 | ምሳሌ 9, የቡድን ስራ 1.4, መልመጃ 1መ |
| 1.5 | ስፋትንና ይዘትን መሰረት ያደረጉ መልመጃዎችን መስራት | `s1-5.json` | `math.volume-word-problems` | 12 | ምሳሌ 10–12, የቡድን ስራ 1.5 |
| ★ | ማጠቃለያ፣ የማጠቃለያ ጥያቄዎች እና የምዕራፍ ፈተና | `s1-6.json` | `math.area-volume-review` | 15 | የምዕራፍ 1 የማጠቃለያ ጥያቄዎች (test, no clues) |

Section chips: `1.1 · 1.2 · 1.3 · 1.4 · 1.4.2 · 1.5 · ★` (seven; fits 360 px). The book's 1.4.1 is folded into the 1.4 lesson because 1.4's own content is only ተግባር 1.4 (length) and 1.4.1 follows on the same page; the lesson's `name`/`ref` labels still say "1.4.1" where the book does.

**Refreshers (one level down, each = 1 `steps` + 1 graded `mcq`, Amharic, `machine`):**
`math.multiply-by-10-100-1000` (used by 1.2, 1.4, 1.4.2, 1.5: shifting digits when × or ÷ by 10, 100, 1000 — the whole unit rests on it), `math.multiply-three-numbers` (1.3, 1.5: 5 × 4 × 3 one step at a time), `math.count-rows` (1.1: an array of dots counted as rows × columns). Declare in the lesson that first needs them; later lessons repeat the same small object.

## 2. Engine work (engine session goes first)

### 2.1 Amharic lessons for all of Grades 1–6 (from the handoff — build, don't ask)
1. `"lang": "am"` on a lesson → the player sets `lang="am"` on every lesson block (CSS gives ~10% larger type and more line height) and takes the fixed words inside lessons from the **lesson** language, not the UI language: Quick check (ፈጣን ማረጋገጫ), Think first (መጀመሪያ አስብ), Worked example (የተሰራ ምሳሌ), Check (አረጋግጥ), Next step (ቀጣይ ደረጃ), Practise (ተለማመድ), Skip, Undo, true/false (እውነት/ሐሰት), the pop-ups (✓ ትክክል / ↻ ገና አይደለም፣ እንደገና ሞክር / 💡 መልሱ ይኸውና), `guess_note`, `match_hint`, `order_hint`, `pick_size`, number-line prompts, section-done banner text. Add any missing keys to `app/i18n/am.json` (`machine: true` list in the commit message for the speaker).
2. `"main": "am"` on a lesson → `name` cards show the Amharic term as the main word and `en` as the gloss (reverse of Grades 7+). Key-word highlight sheets likewise.
3. Generators take `lang` (from the lesson) and have Amharic sentence templates; numbers and maths unchanged (§2.4).
4. Select-to-translate: direction follows lesson language (am → en for these lessons).
5. Setup grade list: add Grades 1–6 (currently 7–12). Home shows only chosen grades (already built).
6. `blank` word answers: `a` lists hold spelling variants (ሀ/ሐ/ኀ, ሰ/ሠ, አ/ዐ, ጸ/ፀ); the 1–2 letter tolerance stays. This chapter has almost no word answers (units are typed as digits + a unit chip, §2.3), so this is mostly future-proofing.

### 2.2 New blocks (one line each, then build)
All inline SVG, ≥44 px targets, CSS variables, `intro`/`say` sentences on every ▶ step (one sentence per step, Grade-5 short), progress reported like other games. The engine session may simplify, not expand.

**`grid` mode `"tile"` — cover a rectangle with unit squares, one row at a time (the unit's main picture).**
```json
{"kind":"grid","mode":"tile","step":"explore","title":"ምስል 1.4","w":9,"h":7,"unit":"ምድብ",
 "intro":"ይህ ሬክታንግል ርዝመቱ 9 ምድብ፣ ወርዱ 7 ምድብ ነው።",
 "say":["አንድ ረድፍ 9 ትንንሽ ካሬዎች አሉት።","2 ረድፎች = 18 ካሬዎች።","…","7 ረድፎች = 63 ካሬዎች። ስለዚህ ስፋቱ 63 ካሬ ምድብ ነው።"],
 "ask":"ስንት ትንንሽ ካሬዎች አሉ?","ans":"63","graded":true}
```
- ▶ fills one row per tap; a running count sits under the grid ("3 ረድፍ × 9 = 27"); when `say` is shorter than `h` the engine repeats the row sentence with the right numbers. `graded: true` turns the last step into a `num` blank. `square: true` labels both sides equally. Used in 1.1, 1.2 (ምስል 1.10, 25 × 1 ሳ.ሜ²), 1.4.1 (100 × 100 = 10,000: the engine draws the grid at 10 × 10 with "each small square = 100 ሳ.ሜ²" when `w*h > 400`, see `big`), and `gen: area`.

**`grid` mode `"shape"` — count whole and half squares under a shape (መልመጃ 1ሀ Q3, ምስል 1.7).**
```json
{"kind":"grid","mode":"shape","cols":6,"rows":5,"poly":[[2,0],[0,2],[2,4],[4,2]],
 "ask":"ስንት ካሬ ምድብ ነው? (ሙሉና ግማሽ ካሬዎችን ቁጠር)","graded":true}
```
- Draws the polygon over the grid; the student taps a cell to mark it ◼ whole / ◩ half / blank (cycles), the counter shows "ሙሉ 4 + ግማሽ 8 = 8"; correct when the marked total equals the engine's own count (whole cells fully inside + half for cells cut by a diagonal). **The answer comes from the drawing, never from the book** (the book gives none). Shapes are drawn on the app's own grid, so any shape whose cells are whole or exact halves is safe; for the ellipse (ምስል 1.7 ረ) use `estimate: true` and accept the engine's whole-cell count ±2.

**`cubes` — a stack of unit cubes, built one layer at a time (new block; 1.3, 1.5, review Q9).**
```json
{"kind":"cubes","step":"explore","title":"ምስል 1.13","l":5,"w":4,"h":3,"unit":"ምድብ",
 "intro":"ይህ ሳጥን ርዝመቱ 5፣ ወርዱ 4፣ ከፍታው 3 ምድብ ነው።",
 "say":["አንድ ረድፍ 5 ኩቦች አሉት።","4 ረድፎች = 20 ኩቦች። ይህ አንድ ንብርብር ነው።","2 ንብርብሮች = 40 ኩቦች።","3 ንብርብሮች = 60 ኩቦች። ስለዚህ ይዘቱ 60 ኩቢክ ምድብ ነው።"],
 "ask":"ስንት ትንንሽ ኩቦች አሉ?","ans":"60","graded":true}
```
- Isometric SVG; ▶ step 1 draws one row, step 2 completes the bottom layer, then one layer per tap, the count under it ("2 ንብርብር × 20 = 40"). `cube: true` draws a cube (all sides equal). `layers: [[…]]` draws an irregular stack from a height map (for መልመጃ 1ሐ Q4ሀ and review Q9ሀ/መ: the engine counts the map; the book figure is only the inspiration). `graded` as in `tile`. Reused later for Grade 6 and Grade 7 volume.

**`ladder` — the unit staircase km · m · cm · mm with × / ÷ hops (new block; 1.2, 1.4, 1.4.2).**
```json
{"kind":"ladder","step":"explore","title":"የርዝመት ምድቦች","units":["ኪ.ሜ","ሜ","ሳ.ሜ","ሚ.ሜ"],"factors":[1000,100,10],
 "power":1,"from":"ሜ","to":"ሳ.ሜ","value":20,
 "intro":"ከትልቅ ወደ ትንሽ ምድብ ስንወርድ እናባዛለን።",
 "say":["1 ሜ = 100 ሳ.ሜ ነው።","ስለዚህ 20 ሜ = 20 × 100 ሳ.ሜ።","20 × 100 = 2,000። 20 ሜ = 2,000 ሳ.ሜ።"],
 "ask":"20 ሜ = ___ ሳ.ሜ","ans":"2000","graded":true}
```
- Four steps drawn as a staircase; a token slides from `from` to `to`; arrows show "× 100" going down and "÷ 100" going up. `power: 2` labels the steps ኪ.ሜ² · ሄክታር · ሜ² · ሳ.ሜ² · ሚ.ሜ² with factors 100 · 10,000 · 10,000 · 100; `power: 3` labels ኪ.ሜ³ · ሜ³ · ሳ.ሜ³ · ሚ.ሜ³ with 1,000,000,000 · 1,000,000 · 1,000, plus a side rung ሊ = 1,000 ሳ.ሜ³, ሚ.ሊ = 1 ሳ.ሜ³. In explore mode the student taps any unit to see "1 of this = … of the next". `graded` asks for the converted value as a `num` blank. Also the picture behind `gen: convert`.

**`slider` reuse (no change):** 1.2 explore `ስፋት = ርዝመት × ወርድ` with ርዝመት and ወርድ 1–12; 1.3 `ይዘት = ርዝመት × ወርድ × ከፍታ`.

### 2.3 Answer checking for this chapter
- All answers are numbers → every `blank` is `"num": true`. Accept `2000`, `2,000`, `2 000`, `2000 ሳ.ሜ`, `2000ሳ.ሜ`: the num parser must strip Ethiopic unit text and thousands separators (commas and spaces) before comparing. Decimals (`0.5`, `0.012`, `0.09`, `0.000108`) compare exactly to the digits given.
- Where the answer needs a unit chosen (ፕሮጀክት 1, መልመጃ 1ሐ Q1), use `mcq` with unit options, not a blank.
- `"form"` is never needed in this unit.

### 2.4 Generators (`gen`) for this chapter — all with Amharic templates (`machine`)
Add to `app.js` between `GEN-START`/`GEN-END`, each taking `lang`; the English template is kept too (future English-medium reuse). The validator runs each 60×.

| t | options | what it makes | example (am) |
|---|---|---|---|
| `area` | `shape: rect\|square\|any`, `unit: "ምድብ"\|"ሳ.ሜ"\|"ሜ"`, `max: 12`, `pic: true` draws a `tile` grid | rectangle/square area from sides | "ርዝመቱ 7 ሳ.ሜ፣ ወርዱ 4 ሳ.ሜ የሆነ ሬክታንግል ስፋቱ ___ ሳ.ሜ² ነው።" → 28 |
| `count` | `kind: squares\|cubes`, `max: 8`, picture always | count unit squares in a drawn rectangle / unit cubes in a drawn box (`tile`/`cubes` graded) | "ስንት ትንንሽ ኩቦች አሉ?" → 24 |
| `volume` | `shape: box\|cube`, `unit`, `max: 10`, `word: true` uses a word template (ሳጥን / ሻንጣ / የጫማ ሳጥን / የሻይ ካርቶን stacked in a shop) | l × w × h | "ርዝመቱ 5 ሜ፣ ወርዱ 6 ሜ፣ ቁመቱ 3 ሜ የሆነ ሳጥን ስንት ባለ 1 ሜ³ ኩቦችን ይይዛል?" → 90 |
| `convert` | `dim: 1\|2\|3`, `dir: down\|up\|any`, `units: [...]` to restrict (e.g. `["ሊ","ሚ.ሊ"]`), `nice: true` keeps answers whole | unit conversion within length / area / volume (incl. litre, ml, hectare) | "3 ኪ.ሜ² = ___ ሜ²" → 3000000; "5,000 ሳ.ሜ² = ___ ሜ²" → 0.5 |
| `litres` | `n: 2–8 bottles of 1\|2\|5 L`, asks total L, then ሳ.ሜ³, then ሜ³ | ምሳሌ 10 pattern | "6 ባለ 2 ሊትር ሃይላንዶች በሙሉ ___ ሊትር ነው።" → 12 |
| `op` (exists) | `op: mul`, whole numbers | arithmetic refresher items | — |

Rules (same as G8): the book page and book exercises show the book's own questions; Practise re-runs, missed-question replays and tests get new numbers; a retry right after a wrong answer keeps the numbers. Keep `convert` answers inside Grade 5 range: whole numbers up to 10 digits, decimals with at most 3 places after the point (the book itself uses 0.012 and 0.000108).

### 2.5 Small things
- `read.table` with Ethiopic headers must not wrap unit superscripts (`ሜ²`): render `²`/`³` as real superscript characters (they already are in the text).
- The ✓/↻/💡 pop-ups and the section-done banner take the lesson language.
- Section chip `1.4.2` is five characters; check the chip strip at 360 px.
- `sources/`: the two PDFs are not committed (16 MB); the owner attaches them to each content session.

## 3. Lesson-by-lesson design

Format per idea: **Hook → Read → Explore → Name → Check → Method → Practise**. "Read" says which book text goes in `read` blocks (copy the book's Amharic, ≤2 short sentences per paragraph, a question after every 2–3 blocks). Key words: Amharic main, `en` gloss. Answers below are verified by the design session (independently recomputed from the page); anything marked ⚠ carries a `review` note.

### 1.1 ስፋት በካሬ ምድብ (pp. 1–6)
Key words: ስፋት (area), ካሬ (square), ሬክታንግል (rectangle), ካሬ ምድብ (square unit), ርዝመት (length), ወርድ (width), ጂኦሜትሪ ምስል (geometric figure).

**Idea `math.area-unit-square`**
- Hook (`guess`, added, machine): "የክፍላችሁ ወለል በሰድር ተሸፍኗል። ስንት ሰድር እንዳለ እንዴት እናውቃለን?" opts: "እንገምታለን" / "አንድ በአንድ እንቆጥራለን" / "ረድፉን ቆጥረን በረድፍ ብዛት እናባዛለን" / "አናውቅም". after: "ሁለቱም ይሰራሉ። ዛሬ ፈጣኑን መንገድ እንማራለን።"
- Read: የምዕራፉ የመማር ውጤቶች as a 5-row `table` (one block, the book's own list); መግቢያ (1 block, 2 sentences); ማስታወሻ "የአንድ ካሬ ምድብ ስፋት መለኪያ ካሬ ምድብ ነው…" (1 block) with ምስል 1.1 as a `grid` tile 3 × 3 with one cell highlighted ("ይህ 1 ካሬ ምድብ ነው").
- Explore (`grid` tile, ምስል 1.1 square): 1 × 1 → "1 ምድብ × 1 ምድብ = 1 ካሬ ምድብ".
- Name: ካሬ ምድብ — "ጎኑ 1 ምድብ የሆነ ካሬ። ስፋት የሚለካው በዚህ ነው።" ስፋት — "አንድ ምስል የሚሸፍነው የካሬ ምድቦች ብዛት።" (አስተውሉ p. 2, book wording).
- Check (`tf`): "ስፋት ማለት ምስሉን የሚሸፍኑት የካሬ ምድቦች ብዛት ነው።" → እውነት.

**Idea `math.area-rectangle-count`** (requires `math.count-rows`)
- Hook (`guess`, ተግባር 1.1 Q1 picture, ምስል 1.2 shown as `tile` 8 × 8 un-filled): "በዚህ ካሬ ውስጥ ስንት ትንንሽ ካሬዎች ይኖራሉ?" opts 16 / 32 / 64 / 80. after: "ቁጥረን እናረጋግጥ።"
- Explore (`grid` tile 8 × 8, graded at the end): rows fill one by one, "8 ረድፎች × 8 = 64"; ask → 64. `ref: ተግባር 1.1 Q1`.
- Read: አስተውሉ p. 3 "ካሬ ማለት አራቱም ጎኖቹ እኩል… ሬክታንግል ማለት ሁለት ጥንድ…" (1 block) + ምስል 1.3 as a `picture` (two outlines with tick marks: `pictures.js` gets `square-ticks` and `rect-ticks`, or an inline SVG in the block).
- Name: ካሬ, ሬክታንግል (book wording).
- Check (`sort`): bins ካሬ / ሬክታንግል; items "ርዝመት 5፣ ወርድ 5", "ርዝመት 9፣ ወርድ 7", "ርዝመት 3፣ ወርድ 3", "ርዝመት 12፣ ወርድ 4".
- Explore 2 (`grid` tile 9 × 7, ምስል 1.4, graded): → 63. `ref: ተግባር 1.1 Q2`. Then `mcq` "የሬክታንግሉ ስፋት ከርዝመቱና ከወርዱ ጋር እንዴት ይዛመዳል?" opts "ርዝመት + ወርድ" / "ርዝመት × ወርድ" / "ርዝመት − ወርድ" → × (clue: "9 ረድፎች እያንዳንዳቸው 7… ወይም 7 ረድፎች እያንዳንዳቸው 9").

**Idea `math.area-formula`**
- Method (`steps`, ምሳሌ 1 Q1, ምስል 1.5): "ርዝመቱ 5 ምድብ የሆነ ካሬ እኩል በሆኑ ትንንሽ ካሬዎች ተከፍሏል" ▶ "25 ትንንሽ ካሬዎች አሉ" ▶ "የካሬው ስፋት = 25 ካሬ ምድብ" ▶ "= 5 ምድብ × 5 ምድብ". Then ምሳሌ 1 Q2 (ምስል 1.6, 6 × 4 = 24) as a second `steps`.
- Read: the two sentences from the solutions "የካሬው ስፋት = ርዝመት × ርዝመት", "የሬክታንግል ስፋት = ርዝመት × ወርድ" as a 2-row `table` (added summary of the book's own working, `added: true`).
- Name: ርዝመት, ወርድ.
- Explore (`slider`, added): ርዝመት 1–12, ወርድ 1–12, out "ስፋት = {v} ካሬ ምድብ"; the formula is live.
- Check (`blank` num, `gen: area` rect pic): "ርዝመቱ 7 ምድብ፣ ወርዱ 10 ምድብ። ስፋት = ___ ካሬ ምድብ" → 70 (መልመጃ 1ሀ Q1 ሀ).
- Practise: `blank` square side 8 → 64 (Q2 ሐ); `blank` 12 × 12 → 144 (Q1 ሐ); `grid` tile graded 9 × 9 → 81 (Q4 ሀ, ምስል 1.8); `grid` tile graded 5 × 3 → 15 (Q4 ለ); `grid` shape (Q3 ሀ, the diamond) → 8.
- Exercises "መልመጃ 1ሀ" (answers): Q1 ሀ 7 × 10 = 70, ለ 5 × 8 = 40, ሐ 12 × 12 = 144, መ 3 × 6 = 18; Q2 ሀ 100, ለ 49, ሐ 64, መ 9; Q3 (ምስል 1.7, counted on the grid: ⚠ the book prints no answers; design-session count, teacher to confirm) ሀ 8, ለ 4, ሐ 6, መ 14, ሠ 9, ረ ≈ 10 (estimate; accept 9–12), ሰ ≈ 40 (whole cells; count on the app's own drawing); Q4 ሀ 81, ለ 15. Max 6 items in the exercise block: Q1 ሀ, Q1 መ, Q2 ለ, Q3 ሀ (shape), Q3 ሠ (shape), Q4 ለ (tile). The rest go to Practise.
- Test: count squares in a drawn rectangle (`count`), area from sides (`area`), square from side (`area square`).

### 1.2 ስፋት በሳ.ሜ²፣ ሜ² እና ሄክታር (pp. 6–9)
Key words: መለኪያ ምድብ (unit of measurement), ኪሎ ሜትር (kilometre), ሜትር (metre), ሳንቲ ሜትር (centimetre), ሚሊ ሜትር (millimetre), ሜትር ካሬ (square metre), ሳንቲ ሜትር ካሬ (square centimetre), ሄክታር (hectare).

**Idea `math.length-units`** (requires `math.multiply-by-10-100-1000`)
- Hook (`guess`, added, machine): "ከአዲስ አበባ እስከ አዳማ ያለውን ርቀት በምን እንለካለን?" opts ሚ.ሜ / ሳ.ሜ / ሜ / ኪ.ሜ → ኪ.ሜ. after: "ረጅም ርቀት በኪ.ሜ፣ አጭር በሳ.ሜ ወይም ሚ.ሜ።"
- Read: አስተውሉ p. 6 "የርዝመት መለኪያ ምድቦች ያላቸው ዝምድና" as a 3-row table (1 ኪ.ሜ = 1000 ሜ; 1 ሜ = 100 ሳ.ሜ; 1 ሳ.ሜ = 10 ሚ.ሜ).
- Explore (`ladder` power 1, ምሳሌ 2 ሀ): 20 ሜ → ሳ.ሜ, 3 steps, graded → 2000.
- Method (`steps`, ምሳሌ 2 ለ and ሐ): "4.5 ኪ.ሜ = 4.5 × 1000 ሜ፣ ምክንያቱም 1 ኪ.ሜ = 1000 ሜ" ▶ "= 4500 ሜ"; "24000 ሚ.ሜ = 24000 ÷ 1000 ሜ፣ ምክንያቱም 1 ሜ = 1000 ሚ.ሜ" ▶ "= 24 ሜ" ("1 ሜ = 100 ሳ.ሜ = 1000 ሚ.ሜ" as a tip).
- Check (`mcq`): "ከሜ ወደ ሳ.ሜ ስንቀይር…" opts "በ100 እናባዛለን" / "በ100 እናካፍላለን" / "በ10 እናባዛለን" → × 100.
- Practise (`blank` num, `gen: convert dim 1`): 3 ሜ → 3000 ሚ.ሜ (ተግባር 1.4 Q1 ሀ, used early as practise, `ref`), 200 ሳ.ሜ → 2 ሜ (ተግባር 1.4 Q2 ሀ).

**Idea `math.area-units`**
- Hook (`guess`, ፕሮጀክት 1 ሀ): "የመማሪያ ክፍል በር ስፋት በምን ምድብ ቢለካ ይሻላል?" opts ኪ.ሜ² / ሄክታር / ሜ² / ሚ.ሜ² → ሜ². after: "ትልቅ ቦታ ሄክታር፣ ክፍል ሜ²፣ ትንንሽ ነገሮች ሳ.ሜ²።"
- Read: p. 6 "የስፋት ልኬት ምድብ የምንለካቸውን ዕቃዎች…" + the 5 units list as a table (ኪ.ሜ², ሄ, ሜ², ሳ.ሜ², ሚ.ሜ²) (1 block); p. 8 "የጠለላዊ ምስል ስፋት ስንለካ…" (1 block).
- Explore (`grid` tile 1 × 1 then 5 × 5, ምስል 1.9/1.10, ምሳሌ 3): "ጎኑ 1 ሳ.ሜ የሆነ ካሬ ስፋቱ 1 ሳ.ሜ² ነው" ▶ 25 small squares → "25 × 1 ሳ.ሜ² = 25 ሳ.ሜ²". Graded → 25.
- Name: ሜትር ካሬ — "ጎኑ 1 ሜ የሆነ ካሬ ስፋት" (ሜ²); ሳንቲ ሜትር ካሬ (ሳ.ሜ²); ሄክታር — "ጎኑ 100 ሜ የሆነ ካሬ ስፋት = 10,000 ሜ²".
- Read: አስተውሉ p. 8 as `steps` (every line): "1 ሜ² = 1 ሜ × 1 ሜ" ▶ "= 100 ሳ.ሜ × 100 ሳ.ሜ" ▶ "= 10,000 ሳ.ሜ²"; "1 ሄክታር = 100 ሜ × 100 ሜ = 10,000 ሜ²"; "1 ሳ.ሜ² = 10 ሚ.ሜ × 10 ሚ.ሜ = 100 ሚ.ሜ²". With a `grid` tile 10 × 10 `big` ("እያንዳንዱ ትንሽ ካሬ 100 ሳ.ሜ² ነው፤ 100 × 100 = 10,000").
- Check (`match`): ዕቃ ↔ ምድብ pairs from ፕሮጀክት 1: የመማሪያ ክፍል በር ↔ ሜ², የደብተራችሁ ገጽ ↔ ሳ.ሜ², የእንጦጦ ፓርክ ↔ ሄክታር, የብር ኖታ ↔ ሳ.ሜ², የላጲስ ገፅ ↔ ሚ.ሜ², የመኖሪያ ቤታችሁ ↔ ሜ² (⚠ "most suitable unit" has some judgement; keep the pairs where only one unit is sensible: 6 pairs above). ፕሮጀክት 1's other items (ሰ–ተ) go to a `tap` block: tap each object to see the suggested unit (explore, not graded).
- Method (`steps`, መልመጃ 1ለ Q3): "200 ሜ × 200 ሜ" ▶ "= 40,000 ሜ²" ▶ "1 ሄክታር = 10,000 ሜ²" ▶ "40,000 ÷ 10,000 = 4" ▶ "= 4 ሄክታር".
- Practise: `blank` "ርዝመቱ 3 ሳ.ሜ የሆነ ካሬ ስንት 1 ሳ.ሜ ካሬዎች አሉት?" → 9 (Q1 ለ, with a `tile` 3 × 3); `blank` "ስፋቱ ___ ሳ.ሜ²" → 9 (Q1 ሐ); `blank` 8 ሳ.ሜ square → 64 ሳ.ሜ² (Q2); `blank` 200 × 200 → 40000 ሜ² (Q3 ሀ); `blank` → 4 ሄክታር (Q3 ለ).
- የቡድን ስራ 1.1 (measure the sports field; ያልተለካ) → `read` block as a "ቤት ውስጥ ሞክሩ" tip with the three sub-questions; not graded. ተግባር 1.2 (measure your classroom) → same tip style.
- Exercises "መልመጃ 1ለ": Q1 ሀ (tile 3 × 3 explore), Q1 ለ 9, Q1 ሐ 9 ሳ.ሜ², Q2 64 ሳ.ሜ², Q3 ሀ 40,000 ሜ², Q3 ለ 4 ሄክታር.
- Test: pick the unit (mcq), square area in ሳ.ሜ² (`area`), length convert (`convert dim 1`).

### 1.3 ይዘት በሳ.ሜ³፣ ሜ³ እና ሊትር (pp. 9–13)
Key words: ይዘት (volume), ኩብ (cube), ኩቢክ ምድብ (cubic unit), ሬክታንግላዊ ፕሪዝም (rectangular prism), ከፍታ (height), ሜትር ኩቢክ (cubic metre), ሳንቲ ሜትር ኩቢክ (cubic centimetre), ሊትር (litre), ሚሊ ሊትር (millilitre).

**Idea `math.volume-unit-cube`**
- Hook (`guess`, ተግባር 1.3 made concrete, added, machine): "አንድ የውሃ ሃይላንድ፣ አንድ ባልዲ፣ አንድ ጀሪካን። የትኛው ብዙ ውሃ ይይዛል?" opts ሃይላንድ / ባልዲ / ጀሪካን / እኩል ነው → ጀሪካን (clue: "ትልቁ ዕቃ ብዙ ይይዛል")። after: "አንድ ነገር የሚይዘው ቦታ ይዘት ይባላል።"
- Read: ማስታወሻ p. 9 "ይዘት ማለት ማንኛውም ነገር ሊይዘው የሚችል ቦታ ልኬት ነው" + the two ✓ lines (1 block); "የአንድ ኩብ ይዘት = 1 ምድብ × 1 ምድብ × 1 ምድብ = 1 ኩቢክ ምድብ" (1 block, with ምስል 1.11 as `cubes` 1 × 1 × 1); p. 10 bullets "የይዘት ልኬት ምድብ…" + 6-unit list as a table.
- Name: ይዘት, ኩብ, ኩቢክ ምድብ (book wording).
- Check (`mcq`): "የአንድ ኩብ ይዘት…" opts "1 ካሬ ምድብ" / "1 ኩቢክ ምድብ" / "1 ምድብ" → ኩቢክ ምድብ.

**Idea `math.volume-count-cubes`** (requires `math.multiply-three-numbers`)
- Hook (`guess`, የቡድን ስራ 1.2 Q1, ምስል 1.12 shown as `cubes` cube 4 un-filled): "ጎኑ 4 ምድብ የሆነ ኩብ ስንት ትንንሽ ኩቦች አሉት?" opts 12 / 16 / 48 / 64.
- Explore (`cubes` cube 4, graded): one row 4 ▶ one layer 4 × 4 = 16 ▶ 2 layers 32 ▶ 3 layers 48 ▶ 4 layers 64. ask → 64. `ref: የቡድን ስራ 1.2 Q1`.
- Explore 2 (`cubes` 5 × 4 × 3, ምስል 1.13, graded): → 60. `ref: የቡድን ስራ 1.2 Q2`. Then `mcq` "የሳጥኑ ይዘት ከርዝመት፣ ወርድ እና ከፍታው ጋር እንዴት ይዛመዳል?" opts "+ + +" / "× × ×" / "× +" → "ርዝመት × ወርድ × ከፍታ".
- Practise: `cubes` graded 11 × 11 × 11 → ⚠ 1331 (Q3 ሀ; fine as `steps` not as a drawing — 1331 cubes is too many to draw: use `steps` "11 × 11 = 121" ▶ "121 × 11 = 1331" and a `cubes` 3 × 3 × 3 as the picture); `blank` 7 × 7 × 7 → 343 (Q3 ለ, `steps` worked); `cubes` graded 10 × 8 × 9 → 720 (Q3 ሐ; draw at scale 5 × 4 × 4 "each small cube = 8"? No: keep `blank` with `steps` 10 × 8 = 80 ▶ 80 × 9 = 720). Rule for the builder: **draw only up to 6 × 6 × 6; bigger boxes get `steps`.**

**Idea `math.volume-formula`**
- Read: አስተውሉ p. 11 as a 4-row table: "ኩብ ይዘት: ርዝመት × ወርድ × ከፍታ ተመሳሳይ ምድብ"; "ሬክታንግላዊ ፕሪዝም (ሳጥን)…"; "የፕሪዝም ይዘት (ይ) = የሶስቱ ጎኖች ርዝመት ብዜት"; "ኩብ ሁሉም ጎኖች እኩል ርዝመት አላቸው"; "ኩብ የጠጣር ምስሎችን ይዘት ለመለካት ምርጥ አሃድ ነው". ምስል 1.15 as a `picture` (two drawn solids, labels ር/ወ/ከ).
- Name: ሬክታንግላዊ ፕሪዝም (rectangular prism), ከፍታ (height).
- Explore (`slider`, added): ርዝመት, ወርድ, ከፍታ 1–10 → "ይዘት = {v} ኩቢክ ምድብ".
- Method (`steps`, ምሳሌ 4, ምስል 1.16 as `cubes` 6 × 3 × 2): "አንድ ረድፍ 6 ሳጥኖች" ▶ "3 ረድፎች = 6 × 3 = 18 ሳጥኖች (አንድ ንብርብር)" ▶ "2 ንብርብሮች = 18 × 2 = 36" ▶ "ስለዚህ 36 ሳጥኖች አሉት". (The book writes 6 × 3 × 2 = 36 in one line; show both products.)
- Check (`blank` num, `gen: volume`): "ርዝመቱ 5 ኩቦች፣ ወርዱ 5 ኩቦች፣ ቁመቱ 3 ኩቦች የሆነ ሳጥን ይዘቱ ___ ኩቦች" → 75 (መልመጃ 1ሐ Q3; `cubes` 5 × 5 × 3 as picture).
- Practise: `cubes` graded with `layers` for መልመጃ 1ሐ Q4 (⚠ book figures are inspiration only; the app draws its own stacks and counts them): Q4 ሀ an L-shape (height map `[[2,1,1,1,1]]` → 6), Q4 ለ 5 × 3 × 2 = 30, Q4 ሐ 5 × 5 × 5 = 125 (drawn: ≤ 6³). Note for a teacher: book figures read as ሀ ≈ 6–7, ለ 5 × 3 × 2 = 30 (or 5 × 2 × 3), ሐ ≈ 5 × 5 × 5 or 6 × 5 × 5; the app's own drawings are self-consistent.

**Idea `math.volume-units`**
- Read: the 6-unit list (ኪ.ሜ³, ሜ³, ሳ.ሜ³, ሚ.ሜ³, ሊ, ሚ.ሊ) with a one-line use for each (added, machine): ሚ.ሊ a spoon of medicine, ሊ a water bottle, ሳ.ሜ³ a sugar cube, ሜ³ a water tank.
- Name: ሊትር, ሚሊ ሊትር, ሜትር ኩቢክ, ሳንቲ ሜትር ኩቢክ.
- Check (`match`, መልመጃ 1ሐ Q1, the unambiguous ones): የውሃ ማጠራቀሚያ ታንከር ↔ ሜ³, የሳጥን ቅርጽ ያለው የምሳ እቃ ↔ ሳ.ሜ³, በሰኒ ውስጥ ያለ ቡና ↔ ሚ.ሊ, በጀሪካን ውስጥ ያለ ፈሳሽ ↔ ሊ, በሃላንድ ውስጥ ያለ ውሃ ↔ ሊ (⚠ ሚ.ሊ also fine; use ሊ), የመማሪያ ክፍል ይዘት ↔ ሜ³. The rest (ሐ ሳሙና ካርቶን, ሠ ልብስ ቁም ሳጥን, ረ ሆስፒታል ውሃ) → `tap` explore.
- Practise: `blank` ጀሪካን 20 ሊትር, 13 ሊትር ውስጥ → 7 ሊትር ያስፈልጋል (Q2, `steps` 20 − 13 = 7).
- Exercises "መልመጃ 1ሐ": Q1 (match), Q2 7, Q3 75, Q4 ሀ/ለ/ሐ (cubes, app-drawn).
- Test: count cubes (`count cubes`), box volume (`volume`), pick the unit (mcq).

### 1.4 ምድቦችን መቀየር — ርዝመትና ስፋት (pp. 13–16; book 1.4 + 1.4.1)
Key words: መቀየር (convert), ዝቅተኛ ምድብ (smaller unit), ከፍተኛ ምድብ (larger unit), ማባዛት (multiply), ማካፈል (divide).

**Idea `math.convert-length`** (requires `math.multiply-by-10-100-1000`)
- Hook (`guess`, added, machine): "ሩጫ 3 ኪ.ሜ ነው። በሜትር ስንት ነው?" opts 30 / 300 / 3000 / 30000 → 3000.
- Explore (`ladder` power 1, explore mode): tap each unit.
- Method (`steps`, ተግባር 1.4 Q1 ለ, the hardest: 3 ኪ.ሜ → ሳ.ሜ, two steps): "1 ኪ.ሜ = 1000 ሜ፤ 3 ኪ.ሜ = 3 × 1000 = 3000 ሜ" ▶ "1 ሜ = 100 ሳ.ሜ፤ 3000 ሜ = 3000 × 100 ሳ.ሜ" ▶ "= 300,000 ሳ.ሜ". And Q1 ሐ going up: "500 ሚ.ሜ = 500 ÷ 1000 ሜ" ▶ "= 0.5 ሜ".
- Check (`mcq`): "ከትንሽ ምድብ ወደ ትልቅ ስንቀይር…" → "እናካፍላለን".
- Practise (`blank` num, `gen: convert dim 1`): ተግባር 1.4 — Q1 ሀ 3 ሜ = 3000 ሚ.ሜ, Q1 ለ 300,000 ሳ.ሜ, Q1 ሐ 0.5 ሜ; Q2 ሀ 200 ሳ.ሜ = 2 ሜ, Q2 ለ 10,000 ሚ.ሜ = 10 ሜ, Q2 ሐ ⚠ "30,0000 ሳ.ሜ" (misprinted grouping; = 300,000 ሳ.ሜ) = 3 ኪ.ሜ, Q2 መ 150 ሚ.ሜ = 15 ሳ.ሜ.

**Idea `math.convert-area`**
- Hook (`guess`, added, machine): "1 ሜ² ስንት ሳ.ሜ² ነው?" opts 100 / 1,000 / 10,000 / 100,000 → 10,000. after: "100 × 100 ነው። ከታች እንየው።"
- Explore (`grid` tile 10 × 10 `big`, ምሳሌ 5): "1 ሜ = 100 ሳ.ሜ" ▶ "1 ሜ² = 1 ሜ × 1 ሜ = 100 ሳ.ሜ × 100 ሳ.ሜ" ▶ "= 10,000 ሳ.ሜ²".
- Read: ማስታወሻ p. 15 as a 5-row table (1 ኪ.ሜ² = 100 ሄክታር; 1 ኪ.ሜ² = 1,000,000 ሜ²; 1 ሄክታር = 10,000 ሜ²; 1 ሜ² = 10,000 ሳ.ሜ²; 1 ሜ² = 1,000,000 ሚ.ሜ²). Plus `ladder` power 2 explore.
- Method (`steps`, ምሳሌ 6 ሀ, every line as the book): "3 ኪ.ሜ² = 3 × 1 ኪ.ሜ²፤ ምክንያቱም 1 ኪ.ሜ² = 1 ኪ.ሜ × 1 ኪ.ሜ" ▶ "= 3 × (1,000 ሜ × 1,000 ሜ)" ▶ "= 3 × 1,000,000 ሜ²" ▶ "= 3,000,000 ሜ²". ምሳሌ 6 ለ (7 ሜ² = 70,000 ሳ.ሜ²) and ሐ (10 ሳ.ሜ² = 1,000 ሚ.ሜ²) as two more `steps` (ሐ: "1 ሳ.ሜ² = 10 ሚ.ሜ × 10 ሚ.ሜ = 100 ሚ.ሜ²" ▶ "10 × 100 = 1,000").
- Method 2 (`steps`, ምሳሌ 7, going up): "40,000 ሳ.ሜ² = 40,000 ÷ 10,000 ሜ²፤ ምክንያቱም 1 ሜ² = 10,000 ሳ.ሜ²" ▶ "= 4 ሜ²"; "6,000,000 ሜ² = 6,000,000 ÷ 1,000,000 ኪ.ሜ²" ▶ "= 6 ኪ.ሜ²".
- Check (`blank` num, ምሳሌ 8): "2 ሜ² = ___ ሳ.ሜ²" → 20000; "2 ሜ² = ___ ሚ.ሜ²" → 2000000 (`steps` both, the book's "ስለዚህ…" sentence as `why`).
- Practise (`blank` num, `gen: convert dim 2`): የቡድን ስራ 1.3 Q1 ሀ 8,000,000 ሚ.ሜ² = 8 ሜ², ለ 5,000 ሳ.ሜ² = 0.5 ሜ², ሐ 7,000,000 ሜ² = 700 ሄክታር; Q2 9 ሜ × 12 ሜ = 108 ሜ² ▶ ለ 108 ÷ 1,000,000 = 0.000108 ኪ.ሜ² (⚠ hard decimal for Grade 5; keep as the book has it, `worked`, skip-from-start) ▶ ሐ 108 × 10,000 = 1,080,000 ሳ.ሜ².
- Exercises: ተግባር 1.4 (6 of the 7 above) and የቡድን ስራ 1.3 (Q1 ሀ/ለ/ሐ, Q2 ሀ/ሐ; Q2 ለ in Practise only).
- Test: length convert, area convert down, area convert up.

### 1.4.2 የይዘት ምድቦችን መቀየር (pp. 16–18)
Key words: ሊትር (litre), ሚሊ ሊትር (millilitre), ኪሎ ሜትር ኩቢክ (cubic kilometre).

**Idea `math.convert-volume`**
- Hook (`guess`, added, machine): "1 ሜ³ ስንት ሳ.ሜ³ ነው?" opts 100 / 10,000 / 1,000,000 / 1,000,000,000 → 1,000,000. after: "100 × 100 × 100 ነው።"
- Explore (`cubes` 10 × 10 × 10 drawn as `big` at 5 × 5 × 5 with "each = 8"? No — simpler: `steps` with a `cubes` 3 × 3 × 3 beside it; the counting sentence does the work): "1 ሜ = 100 ሳ.ሜ" ▶ "1 ሜ³ = 100 ሳ.ሜ × 100 ሳ.ሜ × 100 ሳ.ሜ" ▶ "100 × 100 = 10,000" ▶ "10,000 × 100 = 1,000,000" ▶ "ስለዚህ 1 ሜ³ = 1,000,000 ሳ.ሜ³" (ማስታወሻ p. 17, book wording).
- Read: ማስታወሻ p. 17 as a 7-row table — **with the book's misprint fixed** (`correction`): 1 ሜ³ = 1,000,000 ሳ.ሜ³; 1 ሳ.ሜ³ = 1,000 ሚ.ሜ³; 1 ኪ.ሜ³ = 1,000,000,000 ሜ³; 1 ሊ = 1,000 ሚ.ሊ; 1 ሜ³ = 1,000 ሊ; **1 ሚ.ሊ = 1 ሳ.ሜ³** (book prints "1 ሚ.ሊ = 1,000 ሜ³", impossible); 1 ሊ = 1,000 ሳ.ሜ³. Plus `ladder` power 3 explore with the ሊ/ሚ.ሊ side rung.
- Method (`steps`, ምሳሌ 9): "3 ሳ.ሜ³ = 3 × 1 ሳ.ሜ³" ▶ "= 3 × 1,000 ሚ.ሜ³፤ ምክንያቱም 1 ሳ.ሜ³ = 1,000 ሚ.ሜ³" ▶ "= 3,000 ሚ.ሜ³"; "4 ሜ³ = 4 × 1,000,000 ሳ.ሜ³" ▶ "= 4,000,000 ሳ.ሜ³".
- Check (`mcq`, የቡድን ስራ 1.4 Q1): "ሳ.ሜ³ ወደ ሚ.ሜ³ ለመቀየር…" opts "በ10 እናባዛለን" / "በ100 እናባዛለን" / "በ1,000 እናባዛለን" / "በ1,000 እናካፍላለን" → × 1,000 (clue: "10 × 10 × 10").
- Practise (`blank` num, `gen: convert dim 3`): የቡድን ስራ 1.4 Q3 ሀ 2,000 ሊትር = 2 ሜ³, Q3 ለ 5,000,000 ሳ.ሜ³ = 5 ሜ³; መልመጃ 1መ Q3 ሀ 5 ሜ³ = 5,000 ሊ, ለ 6 ሳ.ሜ³ = 6,000 ሚ.ሜ³, ሐ 3,000,000 ሳ.ሜ³ = 3 ሜ³.

**Idea `math.litre-cm3`**
- Hook (`guess`, added, machine): "አንድ የ1 ሊትር ሃይላንድ ስንት ሚ.ሊ ነው?" opts 10 / 100 / 1,000 / 10,000 → 1,000.
- Read: "1 ሊ = 1,000 ሚ.ሊ፤ 1 ሚ.ሊ = 1 ሳ.ሜ³፤ ስለዚህ 1 ሊ = 1,000 ሳ.ሜ³" (1 block, book facts); "1 ሜ³ = 1,000 ሊ" (tip).
- Method (`steps`, የቡድን ስራ 1.4 Q2): "5 ሊትር ዘይት" ▶ "5 ሊ = 5 × 1,000 ሚ.ሊ = 5,000 ሚ.ሊ" ▶ "1 ሊ = 1/1000 ሜ³" ▶ "5 ሊ = 5 ÷ 1,000 ሜ³ = 0.005 ሜ³".
- Check (`match`): 1 ሊ ↔ 1,000 ሚ.ሊ; 1 ሚ.ሊ ↔ 1 ሳ.ሜ³; 1 ሜ³ ↔ 1,000 ሊ; 1 ሊ ↔ 1,000 ሳ.ሜ³.
- Practise (`blank`, `gen: convert units [ሊ, ሚ.ሊ, ሳ.ሜ³, ሜ³]`): 2 ሊ = 2,000 ሚ.ሊ; 3,000 ሳ.ሜ³ = 3 ሊ; 2,500 ሊ = 2.5 ሜ³.
- Exercises "መልመጃ 1መ": Q1 ሀ 5 ኪ.ሜ = 5,000 ሜ, ለ 100 ሜ = 10,000 ሳ.ሜ, ሐ 12,000 ሚ.ሜ = 1,200 ሳ.ሜ; Q2 ሀ 3 ኪ.ሜ² = 3,000,000 ሜ², ለ 30,000 ሳ.ሜ² = 3 ሜ², ሐ 50,000 ሄክታር = 500,000,000 ሜ²; Q3 (above). Pick 6: Q1 ለ, Q1 ሐ, Q2 ሀ, Q2 ለ, Q3 ሀ, Q3 ሐ; the rest to Practise.
- Test: ሊ ↔ ሚ.ሊ, ሜ³ ↔ ሊ, ሳ.ሜ³ ↔ ሚ.ሜ³.

### 1.5 ስፋትንና ይዘትን መሰረት ያደረጉ መልመጃዎች (pp. 18–21)
Key words: ሃይላንድ (water bottle), ባልዲ (bucket), ሳጥን (box).

**Idea `math.volume-word-problems`** (requires `math.multiply-three-numbers`)
- Hook (`guess`, ምሳሌ 10, ምስል 1.18 as `picture` of 6 bottles + a bucket): "6 ባለ 2 ሊትር ሃይላንዶች በሙሉ ስንት ሊትር ውሃ ነው?" opts 6 / 8 / 12 / 24 → 12.
- Method (`steps`, ምሳሌ 10, every line of the book): ሀ "እያንዳንዱ ሃይላንድ 2 ሊትር ይይዛል" ▶ "6 × 2 ሊትር = 12 ሊትር" ▶ "ስለዚህ 12 ሊትርና በላይ የሚይዝ ባልዲ ያስፈልጋታል"; ለ "12 ሊ = 12 × 1,000 ሳ.ሜ³፤ ምክንያቱም 1 ሊ = 1,000 ሳ.ሜ³" ▶ "= 12,000 ሳ.ሜ³"; ሐ "1 ሊ = 1/1000 ሜ³" ▶ "12 ሊ = 12/1000 ሜ³" ▶ "= 0.012 ሜ³".
- Check (`blank` num, `gen: litres`): "4 ባለ 5 ሊትር ጀሪካኖች በሙሉ ___ ሊትር" (added) → 20.
- Method 2 (`steps`, ምሳሌ 11, with `cubes` 4 × 5 × 2): "ርዝመቱ 4 ሳጥን" ▶ "4 × 5 = 20 ሳጥኖች በአንድ ንብርብር" ▶ "20 × 2 = 40" ▶ "40 የሳሙና ሳጥኖች".
- Method 3 (`steps`, ምሳሌ 12, **with the book's misprint fixed**, `correction`): "90 ሊ = 90 × 1,000 ሚ.ሊ" ▶ "= 90,000 ሚ.ሊ" (book prints 9,000); "90 ሊ = 90 × 1/1000 ሜ³" ▶ "= 90/1000 ሜ³ = 0.09 ሜ³" (correct in the book).
- Name: ባለ 2 ሊትር ሃይላንድ (context only; no `name` card needed — use key-word highlights).
- Practise (`gen: volume word`, `gen: litres`): የቡድን ስራ 1.5 items (below).
- Exercises "የቡድን ስራ 1.5" (answers): Q1 ሀ 3 × 6 = 18 ካሬ ምድብ, ለ 5 × 12 = 60; Q2 ሀ 8 × 8 = 64, ለ 25, ሐ 4, መ 100 (ሳ.ሜ² squares); Q3 ሀ 1,000 ሜ² = 0.1 ሄክታር, ለ 2,000 ሜ² = 0.002 ኪ.ሜ², ሐ 50 ሜ² = 500,000 ሳ.ሜ²; Q4 ሀ 5 × 6 × 3 = 90 ኩቦች, ለ 12 × 4 × 8 = 384; Q5 ሀ 5 ሳ.ሜ³ = 5,000 ሚ.ሜ³, ለ 0.7 ሜ³ = 700,000 ሳ.ሜ³, ሐ ⚠ "6,4000 ሳ.ሜ³" (misprinted grouping; read as 64,000 ሳ.ሜ³) = 0.064 ሜ³; Q6 ጎኑ 10 ሳ.ሜ የሆነ ኩብ: 10 × 10 × 10 = 1,000 ሳ.ሜ³ = 1,000 ሚ.ሊ = 1 ሊ (book asks ሚ.ሊ and ሳ.ሜ³ → 1,000 and 1,000). Exercise block: Q1 ለ, Q2 ሐ, Q3 ሀ, Q4 ሀ, Q5 ለ, Q6; Practise gets the rest with `gen`.
- Test: a bottles problem (`litres`), a stacked-boxes problem (`volume word`), a square-tiles problem (`area square`).

### ★ ማጠቃለያ + የማጠቃለያ ጥያቄዎች + የምዕራፍ ፈተና (pp. 22–25)
- `read` blocks from የምዕራፍ አንድ ማጠቃለያ (pp. 22–23): the 11 bullets compressed into three tables — ስፋት (unit square, area = count, ስፋት = ርዝመት × ወርድ, the 5 units), ይዘት (unit cube, ይ = ር × ወ × ከ, cube, the 6 units), ዝምድናዎች (the area and volume relation lists exactly as printed, p. 23). Keep "1,000 ሊ = 1 ሜ³".
- Interactive recap (`match`): ምድብ ↔ ምን ይለካል (ሳ.ሜ² ↔ ስፋት, ሳ.ሜ³ ↔ ይዘት, ሊ ↔ ይዘት (ፈሳሽ), ሄክታር ↔ ስፋት (መሬት), ኪ.ሜ ↔ ርዝመት).
- Interactive recap 2 (`ladder` power 2 and 3, explore).
- **Chapter test** (`test`, no clues, generated on every attempt from `area`, `count`, `volume`, `convert` dim 1/2/3, `litres` — 10 items), then the book's **የምዕራፍ 1 የማጠቃለያ ጥያቄዎች** as the review exercise (clues on, book numbers):
  - Q1 ሀ 3 × 4 = 12, ለ 4 × 7 = 28, ሐ 3 × 8 = 24, መ 9 × 10 = 90 (ካሬ ምድብ).
  - Q2 ሀ 16, ለ 144, ሐ 225, መ 49.
  - Q3 ሀ 500 ሳ.ሜ = 5 ሜ, ለ 20,000 ሚ.ሜ = 20 ሜ, ሐ 100,000 ሳ.ሜ = 1 ኪ.ሜ, መ 450 ሚ.ሜ = 45 ሳ.ሜ.
  - Q4 ሀ 2,000,000 ሚ.ሜ² = 2 ሜ², ለ 80,000 ሳ.ሜ² = 8 ሜ², ሐ 1,500 ሜ² = 0.15 ሄክታር, መ 5,000,000 ሜ² = 500 ሄክታር, ሠ ⚠ "6 ሚ.ሜ ወደ ሜ" (a length item inside the area question; = 0.006 ሜ; keep, `review`), ረ 4,000 ሜ² = 0.004 ኪ.ሜ².
  - Q5 (ወደ ሜ²) ሀ 1.5 ኪ.ሜ² = 1,500,000 ሜ², ለ 75,000 ሳ.ሜ² = 7.5 ሜ², ሐ 94 ሄክታር = 940,000 ሜ².
  - Q6 squares of side 2, 7, 10, 6 ሳ.ሜ → 4, 49, 100, 36 (ባለ 1 ሳ.ሜ² ካሬዎች).
  - Q7 ሀ 8 × 3 × 5 = 120 (ባለ 1 ሳ.ሜ³ ኩቦች), ለ 10 ሜ × 5 ሜ × 8 ሜ = 400 ሜ³ = 400,000,000 ሳ.ሜ³ (⚠ the question asks for 1 ሳ.ሜ³ cubes but gives metres; show both: 400 ሜ³ and 400,000,000; accept either with `why` explaining).
  - Q8 ሀ 5 ሳ.ሜ³ = 5,000 ሚ.ሜ³, ለ 10 ሜ³ = 10,000 ሊ, ሐ 0.7 ሜ³ = 700,000 ሳ.ሜ³, መ 8,000,000 ሳ.ሜ³ = 8 ሜ³.
  - Q9 (figures → `cubes` with the app's own stacks; book pictures read as ⚠ ሀ ≈ 13 (bottom 4 × 2 = 8, top 5), ለ 3 × 2 × 4 = 24, ሐ 4 × 3 × 3 = 36, መ L-shaped 2-high stack ≈ 20, ሠ 5 × 3 × 4 = 60): build ለ, ሐ, ሠ as `cubes` graded with those dimensions; ሀ and መ as `layers` height maps `[[2,1,1,1],[1,1,1,1]]` (= 9) and an L `[[2,2,2],[2,0,0],[2,0,0]]` (= 10) — self-consistent app drawings, `added: true`, teacher note that the book figures are ambiguous.
  Use Q1 ሀ, Q2 ሐ, Q3 ሐ, Q4 ለ, Q5 ለ, Q6 ለ, Q7 ሀ, Q8 ለ, Q9 ለ, Q9 ሠ as the 10 review items; the rest in "ተጨማሪ ልምምድ" with clues.

## 4. Book issues to carry as `notes`
1. ማስታወሻ p. 17: "1 ሚ.ሊ = 1,000 ሜ³" is wrong; it must be **1 ሚ.ሊ = 1 ሳ.ሜ³** (`correction`, shown correctly in the lesson).
2. ምሳሌ 12: "90 ሊ = 9,000 ሚ.ሊ" is wrong; **90,000 ሚ.ሊ** (`correction`; the ሜ³ line 0.09 is right).
3. ተግባር 1.4 Q2 ሐ "30,0000 ሳ.ሜ" and የቡድን ስራ 1.5 Q5 ሐ "6,4000 ሳ.ሜ³": thousands separators misplaced; read as 300,000 and 64,000 (`review`).
4. መልመጃ 1ሀ Q3 (ምስል 1.7) and መልመጃ 1ሐ Q4 (ምስል 1.17) and review Q9: the book prints no answers and the cube figures are ambiguous; the app draws its own shapes/stacks and grades its own count; design-session readings of the book figures are listed above (`review`).
5. Review Q4 ሠ "6 ሚ.ሜ ወደ ሜ" is a length conversion inside an area question (`review`; kept as is).
6. Review Q7 ለ asks for 1 ሳ.ሜ³ cubes in a box measured in ሜ; lesson shows 400 ሜ³ and 400,000,000 ሳ.ሜ³ (`review`).
7. ፕሮጀክት 1 and መልመጃ 1ሐ Q1 are judgement questions ("suitable unit"); only the unambiguous items are graded (`note`).
8. የቡድን ስራ 1.3 Q2 ለ gives 0.000108 ኪ.ሜ² — correct but a hard decimal for Grade 5; kept as `worked`, skip-from-start (`note`).
9. Page 11 top line is cut in the scan (the first line of የቡድን ስራ 1.2 Q2 ሀ); the question is reconstructed from Q1's pattern: "በተሰራው ሳጥን ውስጥ ስንት ትንንሽ ኩቦች ይገኛሉ?" (`review`).

## 5. Coverage expectations (finish checklist)
Every idea: hook ✓ · read ✓ · name ✓ · check ✓ · ≥2 practise ✓ · refreshers attached where `requires` is set. Every `blank` has `"num": true` and an `a` list with the plain number (and the decimal/whole form where both make sense: `0.5` and `1/2`). Every `grid`/`cubes`/`ladder` explore has one sentence per ▶ step. Every Claude-written Amharic string has `"machine": true`. The validator passes and every `gen` item survives 60 runs.

## 6. Build order (for the owner to approve)
1. **Engine session A** — Amharic lessons (§2.1: `lang`, `main`, lesson-language UI words in `am.json`, Grades 1–6 in setup, reverse translation) + `grid` modes `tile` and `shape` + `cubes`. Test at 360 px with a one-screen Amharic sample.
2. **Content session 1** — lessons 1.1, 1.2, 1.3. Ship; owner reviews the Amharic voice and the counting figures.
3. **Engine session B** — `ladder`, the five generators with Amharic templates, num parser accepting Ethiopic units and separators.
4. **Content session 2** — 1.4, 1.4.2, 1.5, ★ (summary, review, chapter test). `content/index.json` entry (`"view": "book"`, `"free": true`), validator, deploy, `docs/HANDOFF.md` update.

## 7. Prompt for the build session (copy below the line)

---
You are a build session for Meseret. Read `CLAUDE.md`, then `docs/G5-MATHS-HANDOFF.md` (Amharic decisions), then `docs/G5-MATHS-U1-DESIGN.md` (this spec), then `content/g8/maths/u1/s1-3-3.json` as the style reference. Source pages: the two attached PDFs (pp. 1–20 and 21–25); read the pages visually — text extraction scrambles Ethiopic. Do ONE job: the engine step or the content lessons named by the owner (section 6 of the spec). Lesson text is Amharic, copied from the book; mark everything you write yourself `"machine": true`. Keep the spec's ids, titles, hooks and verified answers; if the player lacks a block the spec uses, stop and say so. Finish with the validator, a coverage table, and **Done / Current / My one next action.**

## Status (2026-10-22, evening)
- Design written from all 25 book pages.
- **Engine A built** (this session): `lang`/`main` on lessons; lesson-language UI words (`LESSON_KEYS` in `app.js`, pick from `i18n/<lesson lang>.json`); Amharic key words first with English gloss (cards, highlights incl. 0–2 letter Amharic suffixes, sheet, learn list); reverse select-to-translate (am → en); Grades 1–12 in setup; `Gen.make(screen, seed, lang)` plumbing; `grid` modes `tile` and `shape`; `cubes` (box, cube, height-map `layers`); numeric answers accept Amharic unit text and `2,000` / `2 000`; schema + validator updated; smoke test in `eval/engine-g5-sample/`.
- Not yet: `ladder`, the five Amharic generators (`area`, `count`, `volume`, `convert`, `litres`) — Engine B. Content sessions follow.
