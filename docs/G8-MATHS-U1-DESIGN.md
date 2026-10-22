# Grade 8 Mathematics — Unit 1: Rational Numbers — content design

Design spec for the book-design conversion of Grade 8 Maths Unit 1 (book pp. 2–40; the source PDF has 69 pages because ~30 are blank spacer pages). Written by a design session; a build session turns it into lesson JSON (content session) after the new blocks exist (engine session). Follow `CLAUDE.md`, `pipeline/convert-brief.md` and copy the shape of `content/g7/science/u1/*.json`.

Route: `#book/g8-maths-u1`. Chapter id `g8-maths-u1`, lesson ids `g8.maths.u1.s1-1-1` etc. Title: "Rational Numbers" / ሬሽናል ቁጥሮች (machine, speaker check). `free: true` (first chapter of the subject).

## 0. Teaching stance for this chapter

- **One mental model carries the whole unit: the number line.** Every section returns to it (place → compare → distance → add by hopping). The second model is the **fraction bar / grid** for operations. Students should leave able to *see* a rational number, not only compute with it.
- **Sign reasoning is always a separate first step** ("decide the sign, then work with absolute values"), exactly as the book does. The app makes this a two-tap habit: pick sign → enter size.
- Keep the book's examples, activities, exercises and names. Anything added is `"added": true` and uses Ethiopian context (birr, injera, Ras Dashen, Danakil, Lake Tana, CBE, teff).
- Ethiopian students mostly see `3/5` written as a vertical fraction. The app now stacks every `a/b` in text automatically; never force typed answers into a single format (see §2.6).

## 1. Lesson map

| § | Lesson title | Ideas (ids) | Minutes | Book exercise |
|---|---|---|---|---|
| 1.1 | The concept of rational numbers | `math.rational-number` | 8 | Group work 1.1 |
| 1.1.1 | Rational numbers on a number line | `math.fraction-revision`, `math.rational-on-numberline`, `math.opposites` | 12 | Exercise 1.1 |
| 1.1.2 | Relationship among ℕ, W, ℤ and ℚ | `math.number-sets-nested` | 8 | Exercise 1.2 |
| 1.1.3 | Absolute value of rational numbers | `math.absolute-value`, `math.absolute-value-equation` | 12 | Exercise 1.3 |
| 1.2.1 | Comparing rational numbers | `math.compare-decimals`, `math.compare-fractions`, `math.compare-numberline` | 12 | Activity 1.2, Exercise 1.4 |
| 1.2.2 | Ordering rational numbers | `math.order-rationals` | 8 | Exercise 1.5 |
| 1.3.1 | Addition of rational numbers | `math.add-same-denominator`, `math.add-different-denominator`, `math.add-sign-rules`, `math.addition-properties` | 14 | Activity 1.3, Exercise 1.6 |
| 1.3.2 | Subtraction of rational numbers | `math.subtract-rationals` | 10 | Activity 1.4, Exercise 1.7 |
| 1.3.3 | Multiplication of rational numbers | `math.multiply-rationals`, `math.multiply-sign-rules`, `math.multiplication-properties` | 14 | Activity 1.5, Exercise 1.8 |
| 1.3.4 | Division of rational numbers | `math.divide-rationals`, `math.reciprocal` | 12 | Activity 1.6, Exercise 1.9 |
| 1.4.1 | Sharing among friends | `math.sharing-fractions` | 6 | — (added practise) |
| 1.4.2 | Interest and loans | `math.simple-interest` | 10 | Exercise 1.10 |
| end | Summary + Review | — | 15 | Review Exercise (chapter test, no clues) |

Section chips in the sticky bar: `1.1 · 1.1.1 · 1.1.2 · 1.1.3 · 1.2.1 · 1.2.2 · 1.3.1 · 1.3.2 · 1.3.3 · 1.3.4 · 1.4.1 · 1.4.2 · ★`. Thirteen chips is tight at 360px: the engine should allow the chip strip to scroll horizontally and auto-centre the active chip.

**Refreshers (one level down, each = 1 `steps` + 1 graded `mcq`):**
`math.lcm` (used by 1.2.1, 1.3.1, 1.3.2), `math.equivalent-fractions` (1.2.1, 1.3.1), `math.mixed-improper` (1.1.1, 1.3.3, 1.3.4), `math.integer-signs` (1.1.3, 1.3.1), `math.percent-decimal` (1.4.2), `math.simplify-fraction` (1.3.3, 1.3.4). Declare them in the lesson that first needs them; later lessons repeat the same refresher object (they are small).

## 2. New engine blocks needed (engine session goes first)

All blocks are reusable, inline SVG, ≥44px targets, CSS-variable colours, report progress like existing games. Specs are the minimum; the engine session may simplify, not expand.

### 2.1 `numline` — the workhorse (six lessons)
```json
{"kind":"numline","step":"explore","title":"Place 2/5",
 "min":-3,"max":3,"ticks":1,"sub":5,
 "mode":"place|show|hop|distance",
 "targets":[{"v":"2/5","label":"2/5"}],
 "points":[{"v":"-3/2","label":"−3/2"}],
 "hops":[{"from":0,"by":6},{"from":6,"by":-3}],
 "ask":"Tap where 2/5 is.","why":"...","clue":"...","graded":true}
```
- `show`: draws labelled points; optional `opposites: true` draws mirror arcs around 0; optional `distance: [a,b]` draws an arc with its length. Tapping a point shows its label/info (counts as "explored").
- `place` (graded): student taps the line; the tap snaps to the nearest sub-tick (`sub` divisions per unit). Correct if it equals the target. On wrong: clue + the two integers the target lies between flash. Second wrong: show the answer point. Multiple targets = place them one after another.
- `hop`: animated arrows for integer addition (Activity 1.3); tap "Hop" to play each arrow; final point pulses. Not graded (explore) unless `ask` + `ans` given.
- `distance` (graded): student taps a point; the arc to 0 draws and its length shows. Used for absolute value.
- Values are strings in `a/b`, `-a/b`, `2 1/2`, or decimals; the engine parses them with the same parser as §2.6.
- Decided (owner, 2026-10-22): tap-to-place with snapping; no drag.

### 2.2 `fracbar` — one bar split into n parts
```json
{"kind":"fracbar","step":"explore","title":"5/8 + 2/8","parts":8,
 "shade":[{"n":5,"color":"a","label":"5/8"},{"n":2,"color":"b","label":"2/8"}],
 "mark":{"n":6,"label":"cross out 6/9"},
 "ask":"How many parts are shaded?","ans":"7/8","graded":true}
```
- Renders a horizontal bar; shaded parts fill in colour order; `mark` draws ✕ over the first n shaded parts (subtraction, Fig 1.17). In `play` mode the student taps parts to shade them, then answers `ask` as a blank. Also used with two stacked bars (`bars: [{parts:6,...},{parts:2,...}]`) for different denominators (Fig 1.16).

### 2.3 `grid` — area model for × and ÷
```json
{"kind":"grid","step":"explore","title":"3/4 × 1/2","cols":2,"rows":4,
 "shadeCols":1,"shadeRows":3,"ask":"What fraction is shaded with both colours?","ans":"3/8"}
```
- Columns shaded colour A, rows shaded colour B, overlap hatched; the counts animate in (2 columns → 4 rows → overlap). For division (`mode: "groups"`, Fig 1.21): `wholes: 4, part: "1/3", groupSize: "2/3"` draws 5 strips split in thirds, shades 4⅓, and on tap groups them in twos showing "6 groups + ½ of a group".

### 2.4 `nest` — nested sets ℕ ⊂ W ⊂ ℤ ⊂ ℚ
```json
{"kind":"nest","step":"explore","title":"Figure 1.11",
 "rings":[["ℚ","Rational numbers","Any a/b, b ≠ 0"],["ℤ","Integers","…, −2, −1, 0, 1, 2, …"],["W","Whole numbers","0, 1, 2, 3, …"],["ℕ","Natural numbers","1, 2, 3, …"]],
 "drop":[["−13","ℤ"],["1/7","ℚ"],["0","W"],["10","ℕ"]]}
```
- Four concentric circles (book colours: green, blue, red, yellow). Tap a ring → its info sheet. `drop` mode: number chips appear; the student taps a chip then a ring; correct if the innermost ring it belongs to. Explains "and therefore also in every bigger ring" (lights the outer rings).

### 2.5 `slider` — explore a formula (not graded)
```json
{"kind":"slider","step":"explore","title":"I = P × R × T",
 "vars":[{"k":"P","label":"Principal (Birr)","min":500,"max":30000,"step":500,"v":21100},
         {"k":"R","label":"Rate (% per year)","min":1,"max":20,"step":1,"v":15},
         {"k":"T","label":"Time (months)","min":1,"max":24,"step":1,"v":5}],
 "formula":"P*R/100*T/12","out":"Interest = Birr {v}","note":"T is in years: 5 months = 5/12 year."}
```
- Three range inputs, live result, "explored" when any slider moves. Reusable later for science (speed, density).

### 2.6 Maths answer checking (engine, used by `blank`)
Typed maths answers must accept equivalent forms. Add a `"num": true` flag on `blank`; the checker then parses the student's input and each accepted answer as a rational and compares values:
- `3/8`, `6/16`, `0.375`, `.375`, `3 / 8`, `−3/8`, `-3/8`, `- 3/8`, `2 1/2`, `2½`, `5/2`, `2.5`, `Birr 600`, `600 birr`, `600.00`, `60%`.
- Optional `"form": "lowest"` to insist on lowest terms (don't use it in Unit 1 except where the book says "reduce").
- Decimals compared to 2 d.p. when the accepted answer is a decimal; exact otherwise.
- Keep the existing `a` list as a fallback for word answers.
- Also add a **sign-then-size** input variant: `"input": "signed"` shows two big buttons `+ / −` then a numeric field. Used in 1.3.1–1.3.4 practise so the sign step is explicit.

### 2.7 Small things
- Horizontal-scrolling section chips (13 sections).
- Fraction renderer (built): any `3/5` in lesson text is drawn stacked automatically (a MutationObserver in app.js); write plain `3/5`, `2 1/2`, `−3/4` in content. No markup needed. textContent stays "3/5" so answers still compare.
- `tool: "numline"` as a scratch explorer (type any number, see it placed) beside the existing `factors` tool, only if WORK_TOOLS is re-enabled; otherwise skip.

## 3. Lesson-by-lesson design

Format per idea: **Hook → Read → Explore → Name → Check → Method → Practise**. "Read" summarises which book text goes in `read` blocks (keep faithful, ≤2 short sentences per paragraph, split into 1–4 blocks, a question after every 2–3 blocks). Key words listed get `am` glosses (machine, flagged).

### 1.1 The concept of rational numbers (book p. 2)
Key words: rational number, natural number, whole number, integer, fraction, numerator, denominator.

**Idea `math.rational-number`**
- Hook (`guess`, Group work 1.1 Q4, ungraded): "Solomon has 3 cats and 2 dogs and 22 Birr for toys. How much per pet?" opts: `4 Birr`, `4.40 Birr`, `22/5 Birr`, `5 Birr`. after: "22 ÷ 5 = 22/5 = 4.40 Birr. A number like 22/5 is a rational number."
- Read: Introduction (2 blocks): numbers you meet in life; you know ℕ, W, ℤ; now a set that contains them all.
- Explore (`tap`, added): three cards "Natural numbers smaller than 10", "A whole number that is not natural", "An integer that is not whole" → tap each to see an example (7; 0; −4). Covers Group work Q1.
- Name: Rational number — "A number that can be written as a/b where a and b are integers and b ≠ 0." (restore `b ≠ 0`, lost in the PDF extraction).
- Check (`mcq`): "Which set contains the other two?" opts Whole numbers / Integers / Natural numbers → Integers. (Group work Q2.)
- Practise: `pick` "Which of these are rational numbers? 3/4, −8/2, 0, 5" → all four (why: each can be written a/b). `tf` "22/5 is a rational number" → true. `blank` (num) "Solomon's 22 Birr shared by 5 pets gives ___ Birr each" → 4.4.
- Exercises: "Group work 1.1" — Q2 (mcq above re-used as exercise item), Q4 (blank). Q1, Q3 are discussion → skip.
- Test: 3 items (definition mcq, identify rational, a/b with b = 0 is not allowed — tf).

### 1.1.1 Rational numbers on a number line (pp. 3–7)
Key words: proper fraction, improper fraction, mixed fraction, number line, opposite.

**Idea `math.fraction-revision`** (requires nothing; is itself the refresher base)
- Hook (`guess`, Example 1.1 as a picture): "An injera is cut into 9 equal pieces. 7 are eaten. What fraction is eaten?" opts 7/9, 9/7, 2/9, 7/2. (added; book uses a DVD — keep the DVD in read text, injera in the hook.)
- Read: fraction = part of a whole; numerator top, denominator bottom (1 block). Example 1.2 green field 3/5 (1 block).
- Explore (`fracbar`, parts 5, shade 3, tap to reveal numerator/denominator labels).
- Name: Proper fraction (numerator < denominator), Improper fraction (numerator ≥ denominator), Mixed fraction (whole number + proper fraction).
- Check (`sort`): bins Proper / Improper / Mixed; items 3/7, 8/5, 2 2/5, 7/3, 1/2, 3 4/7.
- Method (`steps`, refresher-style): change 32/5 to a mixed fraction: 32 ÷ 5 = 6 remainder 2 → 6 2/5.
- Practise: `blank` (num) "27/10 = ___ (mixed)" a: `2 7/10`, 2.7. `blank` "7/3 = ___" → 2 1/3.

**Idea `math.rational-on-numberline`** (requires `math.mixed-improper`)
- Hook (`numline` show, Fig 1.4): integers marked, a point x between 2 and 3. `guess`: "What kind of number is x?" opts: natural / whole / integer / none of these → after: "It is between 2 and 3, so it is not an integer. It is a rational number."
- Read: Definition 1.1 + Example 1.3 (1 block); "Note: the set is ℚ" (tip); the three facts I–III for locating (1 block as a 3-row table).
- Explore (`numline` show, Fig 1.5–1.7 merged): points 2/5, 3/2, −3/4, −5/2 with labels; tap each → sheet with the book's sentence ("Between 1 and 2; divide into 2 parts; first mark").
- Name: Number line — "A line with 0 in the middle, positives to the right, negatives to the left."
- Check (`numline` place, graded): "Tap where 2/5 is" (sub 5, 0..1 zoom). Then "Tap where −3/4 is" (sub 4).
- Method (`steps`, Example 1.4b): 3/2 → 1 1/2 → between 1 and 2 → split into 2 → first mark.
- Practise: `mcq` "Between which integers is −9/5?" opts −1 and 0 / −2 and −1 / 1 and 2 / −3 and −2 → −2 and −1 (needs `math.mixed-improper`). `numline` place "5/6" (sub 6). `tf` "−8.85 lies to the left of −8.8" → true (Ex 1.1 Q5; why: further from 0 on the negative side).

**Idea `math.opposites`**
- Hook (`guess`): "Ras Dashen is about 4,550 m above sea level. The Danakil Depression is about 125 m below. Which is the opposite of +125?" opts −125 / 125 / −4550 / 0. (added.)
- Read: Note on opposites + "3/2 and −3/2 are opposites" (1 block).
- Explore (`numline` show, `opposites: true`, Fig 1.8): −3/2 and 3/2 mirrored; tap either to see the arc.
- Name: Opposite — "Two numbers the same distance from 0 on different sides."
- Check (`match`): pairs [4/5, −4/5], [−2/3, 2/3], [2 3/5, −2 3/5], [−3 4/7, 3 4/7] (Ex 1.1 Q6).
- Practise: `blank` (num) "The opposite of −7/2 is ___" → 7/2, 3.5, 3 1/2.

Exercises "Exercise 1.1" (answers): Q1 point B → d) 2 (mcq); Q2 a) 0 and 1, b) 1 and 2, c) −1 and 0, d) −2 and −1 (mcq ×2, pick two); Q3 a) 6 2/5, b) −2 7/10, c) 2 1/3 (blank num); Q4 → `numline` place for 5/6 and −5/6 (two items); Q5 tf true; Q6 match (above). Max 6 items → use Q1, Q2a, Q2d, Q3a, Q4(5/6), Q5.
Test: place a point, identify between-integers, name an opposite.

### 1.1.2 Relationship among ℕ, W, ℤ and ℚ (pp. 8–9)
Key words: set, element (∈), Venn diagram.

**Idea `math.number-sets-nested`**
- Hook (`sort`, ungraded, added): bins ℕ / W / ℤ / ℚ-only; items −13, 1/7, 0, 10, −5/76, 3 → student guesses the *smallest* set each belongs to. after-text: "Check your answer in the figure below."
- Read: recall set, element, Venn diagram (1 block, 3 bullets); "a set inside a bigger set" paragraph (1 block).
- Explore (`nest`, Fig 1.11): tap rings; then `drop` mode with Example 1.5's numbers (−13 → ℤ, 1/7 → ℚ, −5/76 → ℚ, 10 → ℕ). Each correct drop lights all outer rings with "…so also whole? integer? rational ✓".
- Name: Set, Element, Venn diagram (book wording).
- Check (`mcq`, Example 1.6): "Can a number be rational and whole but not an integer?" → No, every whole number is an integer.
- Practise: `mcq` "Solomon says 0 belongs only to ℚ. What did he miss?" → "0 is also whole, integer and rational" (Ex 1.2 Q1 turned into a choice). `tf` "Every natural number is a whole number" → true. `tf` "The set of whole numbers and their opposites is called the integers" → true. `tf` "−3 2/7 is a negative integer" → false (why: it is a fraction, not an integer; it is a negative rational).
- Exercises "Exercise 1.2": Q1 (mcq), Q2 a–c (tf ×3).
- Test: 3 items (innermost set of 0; of −7; of 2/3).

### 1.1.3 Absolute value (pp. 9–13)
Key words: absolute value, origin, absolute value equation, solution.

**Idea `math.absolute-value`** (requires `math.integer-signs`)
- Hook (`guess`, Activity 1.1): "How far is 5 from 0? How far is −5 from 0?" opts: 5 and −5 / 5 and 5 / 0 / 10 → after: "Both are 5 units away. Distance has no sign."
- Explore (`numline` distance): tap −5, tap 5; arcs show 5 and 5.
- Read: distance-from-zero paragraph; Definition 1.2 as a 2-row table (x if x ≥ 0; −x if x < 0); Example 1.7 (|6|, |0|, |−15|) (2 blocks).
- Name: Absolute value — "The distance of a number from 0, written |x|. Never negative."
- Check (`mcq`): "|−15| = ?" opts 15 / −15 / 0 / 1/15 → 15 (clue: distance is never negative).
- Method (`steps`, Example 1.8b): −25 + 13 = −12 → −12 < 0 → |−12| = −(−12) = 12.
- Practise: `blank` (num) "|8 − 3| = ___" → 5; `blank` "|0 − 10| = ___" → 10; `blank` "|−13| − |−8| + |7| = ___" → 12 (Ex 1.3 Q3b; `worked`); `blank` "If x = −5, 5x − |x − 3| = ___" → −33 (Ex 1.3 Q4a; hardest, `worked`, skip from start).

**Idea `math.absolute-value-equation`**
- Hook (`numline` show, Fig 1.12): points −8 and 8 with arcs. `guess`: "How many numbers are 8 units from 0?" opts 1 / 2 / none / infinitely many.
- Read: Definition 1.3; the Note (two / one / no solution) as a table; Example 1.9 (2 blocks).
- Name: Absolute value equation — "An equation of the form |x| = a."
- Check (`sort`): bins "Two solutions" / "One solution" / "No solution"; items |x| = 13, |x| = 0, |x| = −6, |x| = 3/5, |x| = −1/2, |x| = 2.5.
- Practise: `pick` "Solutions of |x| = 8" pool −8, 8, 0, 16 → {−8, 8}. `pick` "Solutions of |x| = 3/5" → {3/5, −3/5}. `blank` (num) "All numbers with absolute value 3.5: ___ and ___" → accept "3.5 and −3.5" (two blanks or a pick).
- Exercises "Exercise 1.3": Q1 table → `match` pairs [−7, 7], [3/5, 3/5], [0, 0], [2 5/9, 2 5/9], [−2/3, 2/3] (as "x → |x|"); Q2a pick (±3.5); Q3a blank 10; Q3d blank 3; Q4b blank 9; Q5a pick (±8). Challenge Q6 → put a, d, e in the lesson's optional "Challenge" practise with `worked` (a: x = 6 or −14; d: 5x − 3 = ±5/2 → x = 11/10 or 1/10; e: x − 5 = ±11/3 → 26/3 or 4/3). Q6b reads "4|x+3| = 123" (answer not nice: x = 111/4 or −135/4) and Q6c "3 − 2|x − 5| = 9" has no solution — both likely typos; add `review` notes and leave them out.
- Test: evaluate |−3 + 6| − |−3| (= 0), number of solutions of |x| = −2, solutions of |x| = 7.

### 1.2.1 Comparing rational numbers (pp. 14–17)
Key words: compare, decimal, place value, equivalent fractions, LCM, cross-product.

**Idea `math.compare-decimals`**
- Hook (`guess`, added): "One night Debre Birhan was −2°C and Addis Ababa was 8°C. Which was colder?" → Debre Birhan (after: "−2 is to the left of 8 on the number line").
- Read: everyday comparing (win/loss, temperature, profit/loss); a/b → decimal by dividing; Note on comparing decimals place by place (2 blocks).
- Check (`mcq`, Example 1.10c): "45.667 ___ 45.684" opts < / > / = → <.
- Practise (Activity 1.2): `mcq` ×2: "0 ___ 15" (<); "−3 ___ −5" (>); `mcq` "6.7 ___ 6.89" (<). `tf` "6.53 < 6.053" → false.

**Idea `math.compare-fractions`** (requires `math.lcm`, `math.equivalent-fractions`)
- Hook (`fracbar` two bars, added): 3/5 vs 1/2 shaded; `guess` "Which is bigger?".
- Read: same denominator rule (Example 1.11); equivalent fractions note (fix: *m is a non-zero integer*, book says "rational number" — add `note` kind correction); Method 1 steps (LCM); Method 2 cross-product I–III (3 blocks; question between).
- Name: Equivalent fractions — "Fractions that mark the same point on the number line." Cross-product — "Compare a×d with b×c."
- Method (`steps`, Example 1.12a): LCM(5, 2) = 10 → 6/10 and 5/10 → 6 > 5 → 3/5 > 1/2.
- Check (`mcq`, Example 1.13a): "5/7 ___ 8/3 by cross-product: 5×3 = 15, 7×8 = 56, so" → <.
- Practise: `mcq` "11/16 ___ 7/8" → < (`needs: math.lcm`); `mcq` "−12/7 ___ 6/9" → <; `blank` (num) "Equivalent to 3/5 with denominator 10: ___/10" → 6; `tf` "12/8 = 10/15" → false.

**Idea `math.compare-numberline`**
- Explore (`numline` show, Fig 1.13): −1, −1/2, 0, 1/2, 1; tap two points → "the left one is smaller".
- Read: the four facts (positive > 0; negative < 0; positive > negative; among negatives, larger absolute value is smaller, −45 < −23) as a 4-row table.
- Check (`mcq`): "Which is smaller, −45 or −23?" → −45 (clue: which is further left?).
- Practise: `mcq` "Which is to the left: −9 or 13/5?" → −9; `mcq` "Which is to the left: −1/3 or −1.5?" → −1.5 (Ex 1.4 Q3d, Q3e). `tf` "|−3/5| < 3/5" → false (equal).
- Exercises "Exercise 1.4": Q1 a (true), b 23/5 > 32/5 (false), e 3 5/7 > 21/6 (true), g (false), h 3 4/7 = 25/7 (true); Q2 c "8/20 ___ 0.35" → > ; Q2 b "−21/12 ___ −28/16" → = (both −7/4). Q4 (figure k…z): `numline` show with letters, mcq "n ___ x" → <. Pick 6.
- Test: cross-product compare, decimal compare, negative compare.

### 1.2.2 Ordering rational numbers (pp. 18–19)
Key words: ascending order, descending order.

**Idea `math.order-rationals`** (requires `math.lcm`)
- Hook (`guess`, Ex 1.5 Q3 Samuel's table, shown as a `read` table): differences Rahel 3 1/4, Kassa −2.2, Alemitu 1.7, Munir −1 7/10. "Whose plant grew most?" → Rahel.
- Read: ordering = ascending or descending; "like miles and kilometres, put everything in the same unit" (1 block); Example 1.14 i-b worked (`steps`: LCM 90 → 54, 40, 210, 75, 55 → order numerators → 4/9 < 3/5 < 11/18 < 5/6 < 7/3).
- Name: Ascending (smallest to largest), Descending (largest to smallest).
- Check (`order`, Example 1.14 i-a): −45, −25, 18, 28, 30.
- Practise (`order` ×3): decimals 1.5, 1.53, 2.05, 2.5, 3.21; descending 45, 32, −15, −23; Samuel descending-to-ascending: −2.2, −1 7/10, 1.7, 3 1/4 (Ex 1.5 Q3b). `order` fractions ascending: 4/9, 3/5, 11/18, 5/6, 7/3 (after the steps).
- Exercises "Exercise 1.5": Q1b order 5.24, 8.13, 6.75, 12.42, −12.51 → −12.51 < 5.24 < 6.75 < 8.13 < 12.42; Q1a → −5 2/3 < 3/25 < 4/9 < 23/15 < 11/7; Q2a desc 23.86 > 15.02 > 13.72 > 13.05; Q2c desc 4.23 > 3 5/6 > 3.75 > 18/5 > 3.21; Q3a mcq Rahel; Q3b order.
- Test: one ascending (mixed forms), one descending, one "which is third smallest".

### 1.3.1 Addition of rational numbers (pp. 20–25)
Key words: sum, addend, common denominator, commutative, associative, additive identity (0), opposite.

**Idea `math.add-same-denominator`**
- Hook (`numline` hop, Activity 1.3): 6 + (−3): hop 6 right, 3 left, land on 3. Then student plays −9 + 5, 2 + (−4), 6 + (−6) (each a tap-to-play; `guess` before each: "Where will we land?").
- Explore (`fracbar`, Example 1.19): parts 8, shade 5 (a) + 2 (b) → ask "shaded parts?" → 7/8.
- Read: rule a/b + c/b = (a+c)/b (1 block); Example 1.15 a–d as `steps` (one line each).
- Name: Sum, Addend.
- Check (`blank` num): "3/5 + 6/5 = ___" → 9/5, 1 4/5, 1.8.
- Practise: `blank` "−3/4 + 11/4 = ___" → 2 (`worked`: (−3+11)/4 = 8/4). `blank` "8/7 + 5/7 + 6/7 = ___" → 19/7.

**Idea `math.add-different-denominator`** (requires `math.lcm`, `math.equivalent-fractions`)
- Explore (`fracbar` two bars, Example 1.20 / Fig 1.16): 1/6 and 1/2 → the half shown as 3/6 → 4/6 = 2/3.
- Read: the four steps (positive denominators, LCM, equivalent fractions, add numerators) as a numbered table; "Note: always reduce" as a tip.
- Method (`steps`, Example 1.16a): LCM(7, 4) = 28 → 12/28 + 35/28 → 47/28.
- Check (`mcq`): "LCM of 9, 6 and 4 is" opts 18 / 36 / 72 / 216 → 36 (`needs: math.lcm`).
- Practise: `blank` (num) "5/6 + 3/8 = ___" → 29/24 (Ex 1.6 Q1b, `worked`). `blank` "11/9 + 5/6 + 3/4 = ___" → 101/36.

**Idea `math.add-sign-rules`** (requires `math.integer-signs`)
- Hook (`guess`, added): "Abebe owes 8 Birr and then owes 11 more. Is the total a debt or a gain?" → debt (negative + negative = negative).
- Read: Rule 1 (both negative) and Rule 2 (different signs) each as a 3-step table (2 blocks).
- Method (`steps`, Example 1.18a): sign − because |−9/4| > |5/4| → 9/4 − 5/4 = 4/4 = 1 → answer −1.
- Check (`mcq`): "−5/6 + 3/4: the sign of the answer is" opts + / − / 0 → − (clue: which addend is further from 0?).
- Practise (`blank`, `input: "signed"`): "−8/6 + (−11/8) = ___" → −65/24 (`worked`); "−5/6 + 3/4 = ___" → −1/12; "−9 + 5 = ___" → −4.

**Idea `math.addition-properties`**
- Read: commutative, associative, 0, opposites as a 4-row table (1 block); Example 1.21 as `steps` (both groupings give 21/10).
- Check (`match`): pair property name ↔ example: a + b = b + a; a + (b + c) = (a + b) + c; a + 0 = a; a + (−a) = 0.
- Practise: `blank` (num) "3/5 + 2 3/5 = ___" → 16/5, 3 1/5, 3.2 (Ex 1.6 Q1c); `tf` "7/9 + (−7/9) = 0" → true.
- Exercises "Exercise 1.6": Q1a 34/5, Q1b 29/24, Q1c 16/5, Q1d 157/24 (6 13/24), Q1e 247/280 (|−1/40| + 6/7), Q2 26.95 °C (blank, "City temperature" — keep as the book's, Ethiopian enough).
- Test: same-denominator sum, different-denominator sum, signed sum.

### 1.3.2 Subtraction of rational numbers (pp. 26–28)
Key words: difference, inverse operation.

**Idea `math.subtract-rationals`** (requires `math.add-sign-rules`, `math.lcm`)
- Hook (`guess`, Activity 1.4 Q1): "Can you turn 7/9 − 4/3 into an addition?" opts 7/9 + 4/3 / 7/9 + (−4/3) / −7/9 + 4/3 / cannot → after: "Subtracting c/d means adding its opposite."
- Explore (`fracbar`, Example 1.23 / Fig 1.17): parts 9, shade 7, mark 6 → "unmarked shaded parts?" → 1/9.
- Read: "subtracting = adding the negative" + formula (1 block); Note (difference is always rational; addition and subtraction are inverses) (tip).
- Name: Difference, Inverse operations.
- Method (`steps`, Example 1.22a): 7/9 − 4/3 = 7/9 + (−12/9) = −5/9.
- Check (`mcq`): "Is subtraction commutative? Is 3/7 − 5/9 the same as 5/9 − 3/7?" → No (Activity 1.4 Q2).
- Practise (`blank` num, signed): "3/7 − (−5/9) = ___" → 62/63; "−1/12 − 9/8 = ___" → −29/24 (`worked`); word problem (Ex 1.7 Q3): "A rope is 23 m. Pieces 12/7 m and 7/4 m are cut off. Remaining length?" → 547/28 m ≈ 19.54 m (`worked`, skip from start).
- Exercises "Exercise 1.7": Q1a 4 5/6 − 2 3/4 = 25/12 (2 1/12); Q1b −8.75; Q1c 6/13 − |−7/13| = −1/13; Q1d |−5/7| − |3/4| = −1/28; Q1e −64.48; Q2a y − (2/7 + 5) with y = 9/4 → −85/28; Q4 basket: 58/3 − 18/7 − 11/9 = 979/63 kg (≈15.54). Pick 6.
- Test: two differences, one word problem.

### 1.3.3 Multiplication of rational numbers (pp. 28–32)
Key words: product, factor, lowest term, distributive, multiplicative identity (1).

**Idea `math.multiply-rationals`** (requires `math.simplify-fraction`, `math.mixed-improper`)
- Hook (`guess`, added): "Half of three-quarters of an injera is how much of the injera?" opts 3/8, 1/4, 3/4, 1/2.
- Explore (`grid`, Example 1.25 grid / Figs 1.18–1.20): 2 columns, 4 rows; shade 1 column, 3 rows; overlap 3 of 8 → 3/4 × 1/2 = 3/8.
- Read: rule (numerator × numerator, denominator × denominator, then reduce) (1 block); Example 1.25a/b as `steps`.
- Name: Product, Factor, Lowest term.
- Check (`blank` num): "5/7 × 8/11 = ___" → 40/77 (Activity 1.5a).
- Practise: `blank` "5/8 × 3/4 = ___" → 15/32; `blank` "3 2/5 × 2 4/7 = ___" → 306/35 (`worked`: 17/5 × 18/7; `needs: math.mixed-improper`); `grid` play "1/3 × 2/5" → 2/15 (Ex 1.8 Q3).

**Idea `math.multiply-sign-rules`**
- Hook (`sort`, ungraded): bins Positive / Negative / Zero; items 2/3 × 5/11, (−5/4) × (−7/3), −3 × 5, −7/9 × 0, (−1/2) × 3 → student predicts.
- Read: Table 1.1 as a `read` table; the three-step note (sign, absolute values, put sign) (2 blocks); Note on even/odd number of negative factors (tip).
- Method (`steps`, Example 1.26a): sign − → 4/9 × 5/2 = 20/18 = 10/9 → −10/9.
- Check (`mcq`): "(−2/5) × (−7/3) is" opts positive / negative / zero → positive.
- Practise (`blank`, signed): "3/7 × (−3/4) = ___" → −9/28; "−8/7 × (−3/5) = ___" → 24/35; "−2/3 × 5/4 × 3/2 = ___" → −5/4 (odd number of negatives, `worked`).

**Idea `math.multiplication-properties`**
- Read: five properties table (commutative, associative, distributive, 0, 1); Example 1.28c as `steps` (distributive: 6/35 + 8/15 = 74/105).
- Check (`match`): property ↔ example (5 pairs).
- Practise: word problem Example 1.29 reworked as `blank`: "Cloth costs Birr 162/4 per metre. Cost of 35/9 m?" → 157.5 (Birr 157.50). Ex 1.8 Q2: "A plane flies 1250 km in an hour. In 23/6 hours?" → 14375/3 km ≈ 4791.67 (`worked`).
- Exercises "Exercise 1.8": Q1a 15/32, b −9/28, c 24/35, d 182/15 (12 2/15), e −5/4, f −3(5x + 5) with x = 3/4 → −105/4; Q2 above. Pick 6.
- Test: product with signs, mixed-number product, a property name.

### 1.3.4 Division of rational numbers (pp. 32–35)
Key words: quotient, dividend, divisor, reciprocal.

**Idea `math.divide-rationals`** (requires `math.multiply-rationals`, `math.mixed-improper`)
- Hook (`guess`, Activity 1.6 Q1): "How many groups of 3/4 are in 12?" opts 9 / 16 / 36 / 4 → 16.
- Explore (`grid` groups, Example 1.30 / Fig 1.21): 4 1/3 in thirds, grouped by 2/3 → 6 groups + 1/2 → 13/2.
- Read: Note (quotient, dividend, divisor; a ÷ b also written a/b) (1 block); Rules for division (sign, then absolute values) (1 block, table); Note a/b ÷ c/d = a/b × d/c (1 block).
- Name: Quotient, Dividend, Divisor.
- Method (`steps`, Example 1.32a): 6/14 ÷ 3/7 = 6/14 × 7/3 = 42/42 = 1.
- Check (`mcq`): "−324 ÷ (−18) is" opts 18 / −18 / 1/18 → 18.
- Practise (`blank`, signed): "−3 ÷ 9/15 = ___" → −5 (`worked`); "−5/7 ÷ (−4) = ___" → 5/28; "5/8 ÷ 3/4 = ___" → 5/6.

**Idea `math.reciprocal`**
- Read: a/b × b/a = 1, so b/a is the reciprocal of a/b (1 block).
- Name: Reciprocal — "The number you multiply by to get 1. Flip the fraction."
- Check (`match`): 3/4 ↔ 4/3; −2/5 ↔ −5/2; 7 ↔ 1/7; 1 1/2 ↔ 2/3.
- Practise: word problem Ex 1.9 Q2 (localised: "Rahel made 3/4 kg of kolo. She puts 3/8 kg in each bag. How many bags?") → 2 (`worked`). Mark `"added": true` for the kolo/kg change and keep "pound" in a note? Simpler: keep the book's wording (trail mix, pound) in the exercise and use kolo only in practise.
- Exercises "Exercise 1.9": Q1a 5/6, b −7/10, c 8/15, d 2 3/5 ÷ (−4/3) = −39/20, Q2 2 bags. Activity 1.6 Q2: 3 3/5 ÷ 2/5 = 9.
- Test: a quotient with signs, a reciprocal, a "how many groups" problem.

### 1.4.1 Sharing among friends (p. 35–36)
Key words: share, equal parts.

**Idea `math.sharing-fractions`** (requires `math.divide-rationals`)
- Hook (`guess`, Example 1.33): "Four friends share one cake equally. Each gets" → 1/4.
- Explore (`fracbar`, Fig 1.22 as a bar): parts 5; mother takes 1 part; tap the remaining 4 parts → each splits into 3; highlight one brother's share: 1/5 + 1/15 = 4/15.
- Read: "Rational numbers are used in sharing and distributing" + the sugarcane problem text (2 blocks).
- Method (`steps`, Example 1.34): each brother takes 1/5 → the fifth piece ÷ 3 = 1/15 → 1/5 + 1/15 = 3/15 + 1/15 = 4/15.
- Check (`mcq`): "Why 1/15?" → "1/5 divided into 3 equal parts".
- Practise (added, Ethiopian): `blank` "Five friends share 2 injera equally. Each gets ___ injera" → 2/5. `blank` "Three brothers share 3/4 kg of coffee equally. Each gets ___ kg" → 1/4. `blank` (Review Q9) "Eleni baked 32 cupcakes and iced 24. Fraction iced?" → 3/4.
- Exercises: none in the book; the added practise set is the exercise ("Practice 1.4.1", `added: true`).
- Test: 2 items.

### 1.4.2 Interest and loans (pp. 36–37)
Key words: interest, principal, rate, time, simple interest, borrower, lender.

**Idea `math.simple-interest`** (requires `math.percent-decimal`)
- Hook (`guess`, added): "You lend a friend 100 Birr. She returns 110 Birr after a year. The extra 10 Birr is called" opts interest / principal / rate / profit → interest.
- Read: the definitions paragraph split into a 5-row table (Interest I, Principal P, Rate R, Time T, Simple interest) + I = PRT (2 blocks).
- Explore (`slider`): P, R, T with Abebe's numbers; students see the interest change. Tip: "T is in years. 5 months = 5/12 year."
- Name: Principal, Interest, Rate, Time, Simple interest.
- Method (`steps`, Example 1.35): P = 21100, R = 15% = 0.15, T = 5/12 → I = 21100 × 0.15 × 5/12 = 1318.75 Birr.
- Check (`mcq`): "In I = PRT, 8 months is T =" opts 8 / 8/12 / 12/8 / 0.8 → 8/12.
- Method 2 (`steps`, Example 1.36): P = I ÷ (R × T) = 250 ÷ (0.1 × 2.5) = 1000 Birr.
- Practise (`blank` num): Ex 1.10 Q1 "Birr 1200 at 10% for 5 years: interest = ___" → 600; Q2 "Principal giving Birr 637 at 7% in 2 years = ___" → 4550; Review Q10 "Birr 500 earns Birr 50 at 9.5%: time = ___ years" → 1.05 (accept 1.05, 1.053, "about 1 year"; `worked`).
- Exercises "Exercise 1.10": Q1 600, Q2 4550, Q3: rate = 1500 ÷ (6000 × 5/12) = 0.6 = 60% per year. The arithmetic is right but the rate is unrealistic → keep, add `{"kind":"review"}` note for a teacher.
- Test: compute I; compute P; convert months to years.

### Summary + Review (pp. 38–40)
- `read` blocks from "Summary for Unit 1" (9 points as a compact table, with the absolute-value definition table and sign tables).
- Interactive recap (`match`): sign rules ↔ results (neg + neg, neg × neg, pos ÷ neg, neg ÷ neg).
- **Chapter test** (`test`, no clues, unseen items first, then Review Exercise): Review Q1 a (false), b (true), c (true), d (false) as tf; Q2a pick ±7; Q2b |x − 5| = 4 → 9 or 1 (pick); Q2c → 1 or −4; Q2d → 7/3 or 1/3; Q2e no solution (mcq); Q3 → 5.75 (23/4); Q4a 113/28; Q4b −16/21; Q4c 809/140 (5.78); Q5a −5/56; Q5b −271/63; Q6a 17/28; Q6b 2.73; Q6c 9/2; Q7a −3/10; Q7b −135/92; Q7c 51/49; Q8a 44/35; Q8b 56/69; Q8c 45/833; Q9 3/4; Q10 ≈1.05 years. Use 10–12 of these; the rest stay in a "More practice" exercise with clues.

## 4. Book issues to carry as `notes`
1. Definition 1.1 and Summary point 1: the PDF extraction drops "b ≠ 0"; restore it (`correction`).
2. Equivalent fractions note: "m is a rational number different from 0" → m should be a non-zero integer (`correction`).
3. Ex 1.3 Q6b "4|x + 3| = 123" and Q6c "3 − 2|x − 5| = 9" (no solution) look like typos; omitted from graded items (`review`).
4. Ex 1.10 Q3 gives a 60% annual rate; arithmetic correct, context unrealistic (`review`).
5. Ex 1.2 Q2c "−3 2/7 belongs to negative integers" is false — intended as a false statement; keep (`note`).
6. Ex 1.9 Q2 uses pounds and trail mix; practise item localised to kolo/kg, exercise item kept as in the book (`note`).
7. Ex 1.4 Q2 printed layout is ambiguous; items used: a 15/9 < 18/9, b −21/12 = −28/16, c 8/20 > 0.35, d 3 5/6 < 3 7/8, e |−3/10| = 3/10, f 12/13 < 13/9 (`review`: confirm against a clean print).

## 5. Coverage expectations (for the finish checklist)
Every idea: hook ✓ · read ✓ · name ✓ · check ✓ · ≥2 practise ✓ · refreshers attached where `requires` is set. Every `blank` with a numeric answer carries `"num": true` and an `a` list with fraction, decimal and mixed forms.

## Status (2026-10-22, evening)
- Whole unit built: 1.1–1.4.2 plus ★ Summary, Review Exercise and a Chapter test. Route `#book/g8-maths-u1`.
- Engine A + B built: `numline` (place/show/hop/distance/opposites), `fracbar`, `grid` (area and groups), `nest`, `slider`, `"num": true` blanks, `"input": "signed"` (sign first), auto-stacked fractions.
- Fresh questions (`gen`): see "Generated questions" below.

## Content rules added by the owner (2026-10-22)
- Never skip a step in worked examples or explanations. Show each LCM conversion as (top × k)/(bottom × k) with why k, every simplification with the GCF used, every mixed → improper change as (whole × denominator + numerator)/denominator. Use judgement, but when in doubt, show it.
- Picture models go one small step at a time, each with a sentence (grid "intro" + "say").
- Book references (Example 1.31, Exercise 1.6 Q2, Q1 a) go in a separate "ref" field and show as a small 📖 label, never inside the question.
- After every answer the student sees a pop-up: ✓ Correct / ↻ Not yet, try again / 💡 Here is the answer.

## Generated questions (`gen`)
A screen may carry `"gen": {"t": "<generator>", ...}` (generators in app.js between GEN-START/GEN-END: place, between, mixed, opposite, abs, abseq, classify, compare, order, op (add/sub/mul/div, options same/mixed/signs/word), share, interest).
When they are used:
1. The book page itself always shows the book's own question (familiar, faithful).
2. Book exercises always stay the book's own questions.
3. Practise set: the first run uses the lesson's questions; every later run gets new numbers.
4. A missed question that comes back in the same run comes back with new numbers (same skill).
5. A retry right after a wrong answer keeps the same numbers, so the clue still fits.
6. Section tests and the Chapter test are generated on every attempt (the "unseen test"), no clues.
Safety: the validator generates every `gen` item 60 times and checks the answers parse, options are unique and number-line targets fit.

## 6. Build order (approved by owner, 2026-10-22)
1. Engine session A: `numline` (show/place/hop/distance), `num` answer checking, `{{frac}}` renderer, scrolling chips. Test at 360px.
2. Content session 1: lessons 1.1, 1.1.1, 1.1.2, 1.1.3 (number-line heavy). Ship; owner reviews.
3. Engine session B: `fracbar`, `grid`, `nest`, `slider`, `signed` input.
4. Content session 2: 1.2.1–1.3.2. Content session 3: 1.3.3–1.4.2 + summary/test.
5. Add chapter to `content/index.json`, validator passes, deploy.

## 7. Prompt for the build session (copy below the line)

---
You are a build session for Meseret. Read `CLAUDE.md`, then `docs/G8-MATHS-U1-DESIGN.md` (this spec), then `pipeline/convert-brief.md` and `content/g7/science/u1/s1-1-2.json` as the style reference. Source pages: the PDF `grade-8-mathematics-chapter-1.pdf` (read the pages visually — text extraction garbles fractions). Do ONE job: either the engine step named by the owner (section 6 of the spec) or the content lessons named by the owner. Keep the spec's ids, lesson titles, hooks and exercise answers; if the player lacks a block the spec uses, stop and say so. Finish with the validator, a coverage table, and **Done / Current / My one next action.**
