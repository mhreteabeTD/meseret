# Engine test sample (Amharic lessons, counting blocks)

`lesson.json` is NOT a real chapter. It exercises the Grade 1–6 engine: `lang: "am"`, `main: "am"`, Amharic key-word highlighting,
`grid` modes `tile` and `shape`, `cubes`, numeric answers, lesson-language pop-ups. It lives here, not in `content/`, so it never ships.

Run it after changing the player:
```
SITE=/tmp/site; rm -rf $SITE && mkdir -p $SITE && cp -r app/* $SITE/ && cp -r content $SITE/content
mkdir -p $SITE/content/g5/maths/u99 && cp eval/engine-g5-sample/lesson.json $SITE/content/g5/maths/u99/s1.json
# add to $SITE/content/index.json chapters: {"id":"g5-maths-u99","grade":5,"subject":"maths","unit":99,"title":{"en":"Engine sample","am":"የሞተር ናሙና"},"pages":"-","free":true,"view":"book","sections":[{"n":"1.1","title":"ስፋት","lesson":"g5/maths/u99/s1.json","minutes":5}]}
(cd $SITE && python3 -m http.server 8765 &)
OUT=/tmp/shots node eval/engine-g5-sample/smoke.js     # needs playwright + Chromium; expect no errors, overflow false, ትክክል trays
```
The headless browser has no Ethiopic font: copy `@fontsource/noto-sans-ethiopic` woff2 files next to `styles.css` and add an `@font-face` to see real glyphs in screenshots.
