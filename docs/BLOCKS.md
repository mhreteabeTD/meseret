# New figure blocks (engine session, 2026-10-24)

Built after the owner's review of G8 Maths U2 ("more pictorial, more interactive"). All render on the book page and in Practise/tests; all are ≥44px touch targets and use CSS colour variables.

| kind | What it does | Fields |
|---|---|---|
| `sqtable` | The book's table of squares. `explore`: tap any cell, its row and column light up. `find`: ▶ walks row → column → cell for `x` (Example 2.7). `reverse`: ▶ finds `value` inside the table, slides left to the row and up to the column = √value; uses the nearest value if not exact (Examples 2.12–2.13). Graded (`graded`, `ans`): the student taps the cell for x = `ans`. | `mode`, `from`, `to` (rows, step 0.1), `x`, `value`, `row` (highlight), `ans`, `say[]`, `intro` |
| `factortree` | Prime factor tree that grows one split per ▶, lists the primes, then (`root` 2 or 3) shares them into equal groups and gives √n or ∛n. Graded with `ans` (a number box appears when the tree is done). | `n`, `root`, `ans`, `say[]`, `intro` |
| `oddsquare` | Odd-number patterns. Default: an n × n square built from L-shaped layers, 1 + 3 + … + (2n − 1) = n². `mode: "cube"`: row k holds the next k odd numbers; middle k², sum k³. | `n` (≤ 10), `mode`, `ans` |
| `slider` (extended) | Several results at once (`outs: [[label, formula, "{v} unit"], …]`) and a growing picture (`pic: "square" \| "cube"`, side = the first slider). | `vars`, `formula`, `outs`, `pic`, `note` |

Also new on any screen:
- `sqref: {from, to, row}` adds a "📊 Open the table · row r" button that opens the table of squares in a sheet with that row lit.
- `guess.best`: the good option(s). After the guess the student sees "✓ Good thinking!" or "Not quite. Here is why:" (still not graded).
- `why` / `after` / `say` text keeps line breaks: write step-by-step explanations one step per line.
