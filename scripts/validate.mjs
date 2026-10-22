#!/usr/bin/env node
/* Validate lesson JSON under a folder against schema/lesson.schema.json plus the rules CLAUDE.md states.
   No dependencies. Usage: node scripts/validate.mjs content/   (exit 1 on any failure) */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.argv[2] || 'content';
const schema = JSON.parse(readFileSync(new URL('../schema/lesson.schema.json', import.meta.url)));
const KINDS = schema.$defs.screen.properties.kind.enum;
const STEPS = schema.$defs.screen.properties.step.enum;
const REQ = { mcq: ['opts', 'ans', 'why', 'clue'], tf: ['text', 'a', 'why', 'clue'], blank: ['ask', 'a', 'why', 'clue'], sort: ['bins', 'items'], match: ['pairs', 'why'], order: ['items', 'why'], name: ['defs'], steps: ['steps'], tap: ['items'], pick: ['pool', 'a', 'why'], guess: ['opts'], tiles: ['sizes', 'need'], read: ['paras'], picture: ['pic'], gallery: ['items'], people: ['people'], reveal: ['ask', 'answer'], tree: ['root'], venn: ['sets'], numline: ['min', 'max'], nest: ['rings'], slider: ['vars', 'formula'], figure: ['items'], grid: [], fracbar: [] };
// generators live in app.js between GEN-START and GEN-END; each item with "gen" is generated many times and checked
const appSrc = readFileSync(new URL('../app/app.js', import.meta.url), 'utf8'), qa = appSrc.indexOf('const Q = {'), qb = appSrc.indexOf('// a number label in SVG');
const { Q, numMatch, Gen } = new Function(appSrc.slice(qa, qb) + '; return { Q, numMatch, Gen };')();

const files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (f.endsWith('.json') && f !== 'index.json') files.push(p); } })(root);

let fails = 0; const ids = new Set();
const report = [];
for (const file of files) {
  const errs = [], rel = relative(process.cwd(), file);
  let L; try { L = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { fails++; console.log(`✗ ${rel}: invalid JSON (${e.message})`); continue; }
  for (const k of schema.required) if (!(k in L)) errs.push(`missing "${k}"`);
  if (L.id && !/^g(kg|[0-9]{1,2})\.[a-z-]+\.u[0-9]+\.s[0-9]+(-[0-9]+)*$/.test(L.id)) errs.push(`bad id "${L.id}"`);
  if (ids.has(L.id)) errs.push(`duplicate lesson id ${L.id}`); ids.add(L.id);
  const expect = rel.replace(/^content\//, '').replace(/\.json$/, '').replace(/\//g, '.');
  if (L.id && L.id !== expect) errs.push(`id ${L.id} does not match path (${expect})`);
  const kw = new Set((L.keywords || []).flatMap(k => [k.en, k.am]).filter(Boolean).map(x => x.toLowerCase()));
  if (L.main && !(L.keywords || []).every(k => k[L.main])) errs.push(`main "${L.main}": every keyword needs an ${L.main} term`);
  if (L.lang && L.lang !== 'en' && !L.main) errs.push(`lang "${L.lang}" lessons set "main" (key-word language)`);
  (L.keywords || []).forEach(k => { if (!k.def) errs.push(`keyword "${k.en}" has no def`); if (!k.am) errs.push(`keyword "${k.en}" has no am gloss`); });
  const coverage = [];
  const checkScreen = (s, where) => {
    if (!KINDS.includes(s.kind)) errs.push(`${where}: unknown kind "${s.kind}"`);
    if (!STEPS.includes(s.step)) errs.push(`${where}: unknown step "${s.step}"`);
    for (const r of REQ[s.kind] || []) if (!(r in s)) errs.push(`${where}: ${s.kind} needs "${r}"`);
    if (s.kind === 'mcq' && s.opts && !s.opts.includes(s.ans)) errs.push(`${where}: ans "${s.ans}" is not one of the options`);
    if (s.kind === 'mcq' && s.opts && new Set(s.opts).size !== s.opts.length) errs.push(`${where}: duplicate options`);
    if (s.kind === 'blank' && s.ask && !s.ask.includes('___')) errs.push(`${where}: blank ask has no ___`);
    if (s.kind === 'blank' && !Array.isArray(s.a)) errs.push(`${where}: blank "a" must be a list of accepted answers`);
    if (s.kind === 'pick' && s.a && s.pool && !s.a.every(x => s.pool.map(String).includes(String(x)))) errs.push(`${where}: pick answers not all in pool`);
    if (s.kind === 'sort' && s.items && s.items.some(it => !s.bins.includes(it[1]))) errs.push(`${where}: sort item bin not in bins`);
    if (s.text && s.text.split(/[.!?]\s/).some(x => x.split(/\s+/).length > 28)) errs.push(`${where}: a sentence is over 28 words`);
    if (s.kind === 'match' && s.pairs && new Set(s.pairs.map(x => x[0])).size !== s.pairs.length) errs.push(`${where}: match left-hand items must be unique`);
    if (s.kind === 'ladder' && !s.power && !s.units) errs.push(`${where}: ladder needs power (1, 2 or 3) or units + factors`);
    if (s.kind === 'ladder' && s.graded && s.ans == null) errs.push(`${where}: graded ladder needs ans`);
    if (s.kind === 'figure' && (s.items || []).some(x => !x.f || !/^@(rect:\d+x\d+|obj:[a-z]+)$/.test(x.f))) errs.push(`${where}: figure items need f like @rect:5x5 or @obj:door`);
    if (s.kind === 'cubes' && !s.cube && !s.layers && !(s.l && s.w && s.h)) errs.push(`${where}: cubes needs l, w, h (or cube + l, or layers)`);
    if (s.kind === 'cubes' && s.graded && s.ans == null) errs.push(`${where}: graded cubes needs ans`);
    if (s.kind === 'cubes' && !s.layers && Math.max(s.l || 0, s.w || 0, s.h || 0) > 6) errs.push(`${where}: draw boxes up to 6 × 6 × 6 only; use steps for bigger ones`);
    if (s.kind === 'grid' && s.mode === 'tile' && !(s.w && s.h)) errs.push(`${where}: tile grid needs w and h`);
    if (s.kind === 'grid' && s.mode === 'tile' && s.graded && s.ans == null) errs.push(`${where}: graded tile grid needs ans`);
    if (s.kind === 'grid' && s.mode === 'shape' && !(s.cols && s.rows && (s.poly || s.ellipse))) errs.push(`${where}: shape grid needs cols, rows and poly (or ellipse)`);
    if (s.kind === 'numline' && s.graded && !(s.targets || []).length) errs.push(`${where}: graded numline needs targets`);
    if (s.kind === 'blank' && s.num && Array.isArray(s.a) && !s.a.some(x => /^[≈~]?\s*[−-]?[\d.]/.test(String(x)))) errs.push(`${where}: num blank has no numeric accepted answer`);
    if (s.gen) { if (!Gen.has(s)) errs.push(`${where}: unknown generator "${s.gen.t}"`); else for (let n = 0; n < 60; n++) { const g = Gen.make(s, n * 7919 + 1, L.lang), bad = m => { errs.push(`${where}: generator ${s.gen.t} seed ${n}: ${m}`); n = 99; };
      if (g.kind === 'blank' && (!g.ask || !g.ask.includes('___') || !g.a || !g.a.length)) bad('blank without ___ or answers');
      else if (g.kind === 'blank' && g.num && g.a.some(x => numMatch(String(x).replace(/^[≈~]/, ''), g.a) !== true)) bad('answers do not parse as the same number: ' + g.a.join(' | '));
      else if (g.kind === 'mcq' && (!g.opts.includes(g.ans) || new Set(g.opts).size !== g.opts.length)) bad('mcq answer missing or duplicate options: ' + g.opts.join(' | '));
      else if (g.kind === 'pick' && (!g.a.every(x => g.pool.includes(x)) || new Set(g.pool).size !== g.pool.length)) bad('pick answers not in pool or duplicates: ' + g.pool.join(' | '));
      else if (g.kind === 'order' && new Set(g.items).size !== g.items.length) bad('order items repeat');
      else if (g.kind === 'numline' && g.targets.some(x => { const q = Q.parse(x.v); return !q || Q.val(q) < g.min || Q.val(q) > g.max; })) bad('target off the line'); } }
    if (s.step === 'test' && s.clue) errs.push(`${where}: test items must not carry a clue`);
  };
  (L.ideas || []).forEach((idea, i) => {
    if (!/^[a-z]+(\.[a-z0-9-]+)+$/.test(idea.id || '')) errs.push(`idea ${i}: bad id "${idea.id}"`);
    if (!idea.explain || !idea.explain.en) errs.push(`idea ${idea.id}: missing explain.en`);
    const steps = idea.screens.map(s => s.step);
    const hasHook = steps.includes('hook') || steps.includes('explore'), hasName = steps.includes('name'), hasCheck = idea.screens.some(s => s.graded && ['check', 'notice'].includes(s.step)), hasPractise = idea.screens.some(s => s.graded && s.step === 'practise');
    const firstGraded = idea.screens.findIndex(s => s.graded), firstName = steps.indexOf('name');
    if (firstName >= 0 && firstGraded >= 0 && firstGraded < firstName && idea.screens[firstGraded].step !== 'notice') errs.push(`idea ${idea.id}: a graded item comes before "name it"`);
    coverage.push({ idea: idea.id, hook: hasHook, name: hasName, check: hasCheck, practise: hasPractise });
    if (!hasHook) errs.push(`idea ${idea.id}: no hook/explore`); if (!hasName) errs.push(`idea ${idea.id}: no name-it screen`); if (!hasCheck) errs.push(`idea ${idea.id}: no graded check`); if (!hasPractise) errs.push(`idea ${idea.id}: no practise item`);
    idea.screens.forEach((s, k) => checkScreen(s, `idea ${idea.id} screen ${k}`));
    idea.screens.forEach(s => (s.defs || []).forEach(d => { if (!kw.has(d[0].toLowerCase())) errs.push(`defined term "${d[0]}" is not in keywords`); }));
  });
  (L.exercises || []).forEach((ex, i) => ex.items.forEach((s, k) => checkScreen(s, `exercise ${i} item ${k}`)));
  (L.test || []).forEach((s, k) => checkScreen(s, `test item ${k}`));
  if (errs.length) { fails++; console.log(`✗ ${rel}\n  - ` + errs.join('\n  - ')); }
  else console.log(`✓ ${rel}  ideas=${(L.ideas || []).length} screens=${(L.ideas || []).reduce((n, i) => n + i.screens.length, 0)} exercises=${(L.exercises || []).length} test=${(L.test || []).length}`);
  report.push(...coverage.map(c => ({ file: rel, ...c })));
}
if (report.length) { console.log('\nCoverage (idea × hook / name / check / practise):'); for (const c of report) console.log(`  ${c.idea.padEnd(36)} ${c.hook ? '✓' : '✗'} ${c.name ? '✓' : '✗'} ${c.check ? '✓' : '✗'} ${c.practise ? '✓' : '✗'}`); }
console.log(`\n${files.length - fails}/${files.length} lesson files valid`);
process.exit(fails ? 1 : 0);
