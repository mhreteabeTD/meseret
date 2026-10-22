#!/usr/bin/env node
/* Validate lesson JSON under a folder against schema/lesson.schema.json plus the rules CLAUDE.md states.
   No dependencies. Usage: node scripts/validate.mjs content/   (exit 1 on any failure) */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.argv[2] || 'content';
const schema = JSON.parse(readFileSync(new URL('../schema/lesson.schema.json', import.meta.url)));
const KINDS = schema.$defs.screen.properties.kind.enum;
const STEPS = schema.$defs.screen.properties.step.enum;
const REQ = { mcq: ['opts', 'ans', 'why', 'clue'], tf: ['text', 'a', 'why', 'clue'], blank: ['ask', 'a', 'why', 'clue'], sort: ['bins', 'items'], match: ['pairs', 'why'], order: ['items', 'why'], name: ['defs'], steps: ['steps'], tap: ['items'], pick: ['pool', 'a', 'why'], guess: ['opts'], tiles: ['sizes', 'need'], read: ['paras'], picture: ['pic'], gallery: ['items'], people: ['people'], reveal: ['ask', 'answer'], tree: ['root'], venn: ['sets'] };

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
  const kw = new Set((L.keywords || []).map(k => k.en.toLowerCase()));
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
