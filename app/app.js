/* Meseret app: shell, router, i18n, chapter map, lesson player, review, exams, reports. No framework. */
(() => {
'use strict';
const BASE = location.pathname.includes('/app/') ? '../' : '';
const $ = s => document.querySelector(s);
const app = $('#app'), top = $('#top'), topin = $('#topin'), tray = $('#tray'), msg = $('#msg'), go = $('#go'), nav = $('#nav'), navin = $('#navin'), sheetEl = $('#sheet');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- storage ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('meseret:' + k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } },
  set(k, v) { try { localStorage.setItem('meseret:' + k, JSON.stringify(v)); } catch (_) {} }
};
const S = { lang: store.get('lang', null), grade: store.get('grade', null), name: store.get('name', ''), code: store.get('code', ''), i18n: {}, index: null, lessons: {} };
if (S.lang) document.documentElement.lang = S.lang;

/* ---------- i18n ---------- */
let T = {};
async function loadLang(l) {
  S.lang = l; store.set('lang', l); document.documentElement.lang = l;
  if (!S.i18n[l]) { try { S.i18n[l] = await (await fetch(`i18n/${l}.json`)).json(); } catch (_) { S.i18n[l] = {}; } }
  if (!S.i18n.en) { try { S.i18n.en = await (await fetch('i18n/en.json')).json(); } catch (_) { S.i18n.en = {}; } }
  T = Object.assign({}, S.i18n.en, S.i18n[l]);
}
const t = (k, v = {}) => (T[k] || k).replace(/\{(\w+)\}/g, (_, n) => v[n] != null ? v[n] : '');
const L = obj => (obj && typeof obj === 'object') ? (obj[S.lang] || obj.en || '') : (obj || '');

/* ---------- content ---------- */
async function loadIndex() { if (!S.index) S.index = await (await fetch(BASE + 'content/index.json')).json(); return S.index; }
async function loadLesson(path) { if (!S.lessons[path]) S.lessons[path] = await (await fetch(BASE + 'content/' + path)).json(); return S.lessons[path]; }

/* ---------- events + mastery ---------- */
function logEvent(e) { const ev = store.get('events', []); ev.push(Object.assign({ at: Date.now() }, e)); if (ev.length > 2000) ev.splice(0, ev.length - 2000); store.set('events', ev); }
const DAY = 864e5, STEPS = [1, 3, 7, 21];
function bumpMastery(idea, ok) {
  const m = store.get('mastery', {}); const cur = m[idea] || { box: 0, due: 0, seen: 0 };
  cur.box = ok ? Math.min(cur.box + 1, STEPS.length - 1) : 0;
  cur.due = Date.now() + STEPS[cur.box] * DAY; cur.seen = Date.now(); m[idea] = cur; store.set('mastery', m);
}
function lessonProgress(path) { return store.get('lp', {})[path] || null; }
function setLessonProgress(path, v) { const lp = store.get('lp', {}); lp[path] = Object.assign(lp[path] || {}, v); store.set('lp', lp); }
function chapterProgress(id) { const c = S.index && S.index.chapters.find(x => x.id === id); const ls = c ? c.sections.filter(x => x.lesson) : []; if (!ls.length) return store.get('progress', {})[id] || null; const lp = store.get('lp', {}); const done = ls.filter(x => lp[x.lesson] && lp[x.lesson].done).length; const started = ls.some(x => lp[x.lesson]); return started ? { done, total: ls.length } : null; }
function markStudied() { const d = store.get('days', []); const k = new Date().toISOString().slice(0, 10); if (!d.includes(k)) { d.push(k); store.set('days', d.slice(-60)); } }

/* ---------- ui helpers ---------- */
function toast(text) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = text; document.body.appendChild(d); setTimeout(() => d.remove(), 2600); }
function setNav(on) {
  nav.hidden = !on; if (!on) return;
  const items = [['home', 'learn', 'M4 11l8-7 8 7v9H4z'], ['review', 'review', 'M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4'], ['exams', 'exams', 'M5 3h14v18H5zM9 8h6M9 12h6M9 16h3']];
  const cur = location.hash.replace('#', '').split('/')[0] || 'home';
  navin.innerHTML = items.map(([r, k, d]) => `<a href="#${r}" class="${cur === r ? 'on' : ''}"><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>${t(k)}</a>`).join('');
}
function setTop(html) { top.hidden = !html; topin.innerHTML = html || ''; }
function hideTray() { tray.hidden = true; }
function sheet(html) { sheetEl.innerHTML = html ? `<div class="sheet" id="sheetbg"><div class="in">${html}</div></div>` : ''; if (html) $('#sheetbg').addEventListener('click', e => { if (e.target.id === 'sheetbg') sheet(''); }); }
function reportSheet(ctx) {
  const opts = ['report_wrong', 'report_unclear', 'report_spelling', 'report_broken'];
  sheet(`<div style="width:40px;height:5px;border-radius:99px;background:var(--line);justify-self:center"></div><h2 class="display">${t('report_q')}</h2><p class="small muted">${esc(ctx.label || '')}</p><div class="opts" role="group">${opts.map(k => `<button class="opt" data-k="${k}" aria-pressed="false">${t(k)}</button>`).join('')}</div><label class="stack"><span class="small" style="font-weight:800">${t('report_more')}</span><textarea id="rnote" rows="3"></textarea></label><button class="btn" id="rsend">${t('send')}</button><button class="btn link" id="rcancel">${t('cancel')}</button>`);
  let kind = null;
  sheetEl.querySelector('.opts').addEventListener('click', e => { const b = e.target.closest('.opt'); if (!b) return; kind = b.dataset.k; sheetEl.querySelectorAll('.opt').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  $('#rcancel').onclick = () => sheet('');
  $('#rsend').onclick = () => { const r = store.get('reports', []); r.push(Object.assign({ kind, note: $('#rnote').value, lang: S.lang, at: new Date().toISOString() }, ctx)); store.set('reports', r); sheet(''); toast(t('sent')); };
}
const svgIcon = d => `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const BACK = 'M15 6l-6 6 6 6', FLAG = 'M4 21V4h12l-1 4 1 4H4', CLOSE = 'M6 6l12 12M18 6L6 18';

/* ---------- views ---------- */
async function viewWelcome() {
  setNav(false); setTop(''); hideTray();
  const langs = [['am', 'አማርኛ', 'Amharic'], ['om', 'Afaan Oromoo', 'dhufaa jira'], ['en', 'English', 'English']];
  app.innerHTML = `<div class="stack" style="margin-top:24px"><div class="icon" style="background:var(--accent);color:#fff;font-family:var(--ethiopic);font-size:28px;width:56px;height:56px;border-radius:16px">መ</div><h1 class="display" style="font-size:34px">Meseret · መሰረት</h1></div>
  <div class="stack"><h2 class="display" style="font-family:var(--ethiopic);font-size:22px;font-weight:800">በየትኛው ቋንቋ እናስረዳህ?</h2><p class="small muted">Which language should we explain in? · Afaan kamiin siif ibsinu?</p></div>
  <div class="opts" role="group" aria-label="Language">${langs.map(([c, n, s]) => `<button class="opt" data-lang="${c}" ${c === 'om' ? 'disabled' : ''} style="display:flex;justify-content:space-between;align-items:center;font-size:19px;${c === 'am' ? 'font-family:var(--ethiopic)' : ''}"><span>${n}</span><span class="small muted" style="font-family:var(--body)">${c === 'om' ? `<span class="pill sun">${s}</span>` : s}</span></button>`).join('')}</div>
  <div class="card"><div style="font-family:var(--ethiopic);font-weight:800">የመጀመሪያው ምዕራፍ ነፃ ነው። መለያ አያስፈልግም።</div><div class="small muted">Chapter 1 is free. No account needed.</div><button class="btn" id="start" style="font-family:var(--ethiopic);font-size:19px">ጀምር ›</button></div>
  <div class="row"><button class="btn ghost" id="g">${svgIcon('M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 7v10M7 12h10')} Google</button><button class="btn ghost" id="tg">${svgIcon('M3 12l18-8-4 16-5-4-3 3v-5z')} Telegram</button></div>
  <button class="btn link" id="code" style="font-family:var(--ethiopic)">የክፍል ኮድ አለኝ · I have a class code</button>
  <p class="small muted" style="text-align:center">Works on any phone. A lesson uses less data than one photo.</p>`;
  let lang = S.lang || 'am';
  const mark = () => app.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang));
  mark();
  app.querySelector('.opts').addEventListener('click', e => { const b = e.target.closest('[data-lang]'); if (!b || b.disabled) return; lang = b.dataset.lang; mark(); });
  const next = async () => { await loadLang(lang); location.hash = S.grade ? 'home' : 'setup'; };
  $('#start').onclick = next;
  $('#g').onclick = $('#tg').onclick = async () => { await loadLang(lang); toast(t('signin_soon')); };
  $('#code').onclick = async () => { await loadLang(lang); const c = window.prompt ? window.prompt(t('class_code_prompt'), S.code || '') : null; if (c != null) { S.code = c.trim().toUpperCase(); store.set('code', S.code); } next(); };
}

async function viewSetup() {
  setNav(false); setTop(''); hideTray();
  const grades = [7, 8, 9, 10, 11, 12];
  app.innerHTML = `<div class="row"><div class="bar"><i style="width:66%"></i></div><span class="count">2 / 3</span></div>
  <div class="stack"><h1 class="display">${t('which_grade')}</h1><p class="small muted">${t('change_later')}</p></div>
  <div class="opts row3" role="group">${grades.map(g => `<button class="opt center" data-g="${g}" style="min-height:64px;font-size:22px">${g}</button>`).join('')}</div>
  <label class="stack"><span class="small" style="font-weight:800">${t('your_name')}</span><input id="nm" value="${esc(S.name)}" style="min-height:52px;padding:0 14px;border-radius:12px;border:2px solid var(--line);background:var(--surface)"></label>
  <div class="card"><div class="row"><button class="play" aria-label="play" id="hear"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l12 7-12 7z" fill="#fff"/></svg></button><div class="grow"><div style="font-weight:800">${t('explain_me')} · 0:35</div><div class="small muted">${t('lang_note')}</div></div></div></div>
  <button class="btn" id="next">${t('continue')} ›</button>`;
  let g = S.grade;
  const mark = () => app.querySelectorAll('[data-g]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.g === g));
  mark();
  app.querySelector('.opts').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (!b) return; g = +b.dataset.g; mark(); });
  $('#hear').onclick = () => speak(t('lang_note'));
  $('#next').onclick = () => { if (!g) { toast(t('which_grade')); return; } S.grade = g; store.set('grade', g); S.name = $('#nm').value.trim(); store.set('name', S.name); location.hash = 'home'; };
}

function speak(text) {
  try { if (!('speechSynthesis' in window)) return toast(text); const u = new SpeechSynthesisUtterance(text); u.lang = S.lang === 'am' ? 'am-ET' : 'en-GB'; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (_) { toast(text); }
}

function dueReview() {
  const m = store.get('mastery', {}), now = Date.now();
  return Object.keys(m).filter(k => m[k].due <= now);
}

async function viewHome() {
  const idx = await loadIndex(); setTop(''); hideTray(); setNav(true);
  const mine = idx.chapters.filter(c => c.grade === S.grade), others = idx.chapters.filter(c => c.grade !== S.grade);
  const last = store.get('last', null);
  const due = dueReview();
  const days = store.get('days', []); const week = []; for (let i = 6; i >= 0; i--) { const d = new Date(Date.now() - i * DAY).toISOString().slice(0, 10); week.push([['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(d).getDay()], days.includes(d)]); }
  const chapterCard = c => { const p = chapterProgress(c.id), sub = idx.subjects[c.subject] || {}; return `<a class="item" href="#${c.view === 'book' ? 'book' : 'chapter'}/${c.id}"><div class="icon" style="background:var(--accent-soft);color:var(--accent-deep)">${sub.icon || '•'}</div><div class="grow"><div class="t">${esc(L(sub))} · ${t('grade')} ${c.grade}</div><div class="s">${t('unit')} ${c.unit} · ${esc(L(c.title))}${p ? ` · ${t('lessons_read', { d: p.done, t: p.total })}` : ''}</div></div>${c.free ? `<span class="pill green">${t('free_chapter')}</span>` : ''}</a>`; };
  app.innerHTML = `<div class="row"><div class="grow"><div class="small muted" style="font-weight:700">${t('grade')} ${S.grade || ''}</div><h1 class="display">${t('hello')}${S.name ? ', ' + esc(S.name) : ''}</h1></div><a class="iconbtn" href="#settings" aria-label="${t('settings')}">${svgIcon('M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-1-3-2 .3-1.5-1.5.3-2-3-1-1 2h-2l-1-2-3 1 .3 2L5.6 8.3 3.6 8l-1 3 2 1v2l-2 1 1 3 2-.3 1.5 1.5-.3 2 3 1 1-2h2l1 2 3-1-.3-2 1.5-1.5 2 .3 1-3-2-1z')}</a></div>
  <div class="week">${week.map(([d, on]) => `<div>${d}<i class="${on ? 'on' : ''}"></i></div>`).join('')}</div>
  ${last ? `<a class="card accent" href="#${last.route}"><span class="eyebrow">${t('continue')}</span><span class="display" style="font-size:22px">${esc(last.title)}</span><span class="small">${esc(last.sub || '')}</span></a>` : ''}
  <a class="card" href="#review" style="text-decoration:none;color:inherit"><div class="row"><div class="icon" style="background:var(--sky-soft);color:var(--sky)">${svgIcon('M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4')}</div><div class="grow"><div style="font-weight:800">${t('today_review')}</div><div class="small muted">${due.length ? t('review_sub', { n: due.length }) : t('review_empty')}</div></div></div></a>
  <h2 class="display">${t('your_subjects')}</h2>
  <div class="list">${mine.length ? mine.map(chapterCard).join('') : `<div class="item"><div class="s">${t('no_lessons_yet')}</div></div>`}</div>
  ${others.length ? `<h2 class="display">${t('all_grades')}</h2><div class="list">${others.map(chapterCard).join('')}</div>` : ''}
  <h2 class="display">${t('coming')}</h2><div class="list">${idx.coming.map(c => `<div class="item"><div class="icon" style="background:var(--surface-2);color:var(--muted)">+</div><div class="grow"><div class="t muted">${esc(L(idx.subjects[c.subject] || { en: c.subject }))} · ${t('grade')} ${c.grade} · ${t('unit')} ${c.unit}</div><div class="s">${esc(L(c.title))}</div></div></div>`).join('')}</div>
  <p class="small muted">${t('install')}. ${t('install_how')}</p>`;
}

async function viewChapter(id) {
  const idx = await loadIndex(); const c = idx.chapters.find(x => x.id === id); if (!c) { location.hash = 'home'; return; }
  if (c.view === 'book') { location.replace('#book/' + c.id); return; }
  setNav(true); hideTray();
  setTop(`<a class="iconbtn" href="#home" aria-label="back">${svgIcon(BACK)}</a><div class="grow"><div class="eyebrow">${t('grade')} ${c.grade} · ${esc(L(idx.subjects[c.subject]))}</div><div class="display" style="font-size:18px">${t('unit')} ${c.unit} · ${esc(L(c.title))}</div></div>`);
  const p = chapterProgress(c.id);
  const rows = c.sections.map(s => {
    if (s.lesson) { const lp = lessonProgress(s.lesson); return `<a class="item ${(store.get('last', {}) || {}).route === 'lesson/' + encodeURIComponent(s.lesson) ? 'current' : ''}" href="#lesson/${encodeURIComponent(s.lesson)}"><div class="dot ${lp && lp.done ? 'done' : lp ? 'now' : ''}">${lp && lp.done ? '✓' : ''}</div><div class="grow"><div class="t">${esc(s.n)} ${esc(s.title)}</div><div class="s">${lp && lp.n && !lp.done ? t('progress_n', { d: Object.keys(lp.got || {}).length, n: lp.n }) : `${s.minutes || 8} ${t('min')}`}${lp && lp.best != null ? ` · ${lp.best}` : ''}</div>${lp && lp.n ? `<div class="mini"><i style="width:${Math.round(Object.keys(lp.got || {}).length / lp.n * 100)}%"></i></div>` : ''}</div>${s.new ? `<span class="pill sky">${t('new')}</span>` : ''}</a>`; }
    if (s.head) return `<div class="item head">${esc(s.n)} ${esc(s.title)}</div>`;
    const head = s.book ? `<div class="item head book">${t('from_book')}</div>` : '';
    return head + `<a class="item" href="${c.classic}#${s.anchor}"><div class="dot"></div><div class="grow"><div class="t">${esc(s.n)} ${esc(s.title)}</div><div class="s">${t('read_in_chapter')}</div></div></a>`;
  }).join('');
  app.innerHTML = `<div class="row small muted" style="font-weight:700"><span class="pill green">${t('free_chapter')}</span><span>${t('follows_book', { p: c.pages })}</span></div>
  <a class="btn" href="${c.classic}">${t('open_chapter')} ›</a>
  ${p ? `<p class="small muted">${t('lessons_read', { d: p.done, t: p.total })}</p>` : ''}
  <div class="list">${rows}</div>`;
  store.set('last', { route: 'chapter/' + c.id, title: `${t('unit')} ${c.unit} · ${L(c.title)}`, sub: `${L(idx.subjects[c.subject])} · ${t('grade')} ${c.grade}` });
}

async function viewReview() {
  setNav(true); hideTray(); setTop('');
  const idx = await loadIndex(); const due = dueReview();
  if (!due.length) { app.innerHTML = `<h1 class="display">${t('today_review')}</h1><div class="card"><p>${t('review_empty')}</p></div>`; return; }
  const items = [];
  for (const c of idx.chapters) for (const s of c.sections) if (s.lesson) { const ls = await loadLesson(s.lesson); for (const idea of ls.ideas) if (due.includes(idea.id)) for (const sc of idea.screens) if (sc.graded) items.push({ screen: sc, idea: idea.id, lesson: ls.id, from: `${L(idx.subjects[c.subject])} ${s.n}` }); }
  if (!items.length) { app.innerHTML = `<h1 class="display">${t('today_review')}</h1><div class="card"><p>${t('review_empty')}</p></div>`; return; }
  runPlayer({ title: t('today_review'), mode: 'review', screens: items.slice(0, 8).map(i => Object.assign({ _idea: i.idea, _lesson: i.lesson, _from: i.from }, i.screen)), backRoute: 'home', onDone: res => { Object.keys(res.byIdea).forEach(id => bumpMastery(id, res.byIdea[id])); } });
}

async function viewExams() {
  setNav(true); hideTray(); setTop('');
  const idx = await loadIndex();
  const rows = [];
  for (const c of idx.chapters) {
    rows.push(`<div class="item head book">${esc(L(idx.subjects[c.subject]))} · ${t('grade')} ${c.grade} · ${t('unit')} ${c.unit}</div>`);
    for (const s of c.sections) if (s.lesson) { const ls = await loadLesson(s.lesson); (ls.exercises || []).forEach((ex, k) => rows.push(`<a class="item" href="#exercise/${encodeURIComponent(s.lesson)}/${k}"><div class="dot"></div><div class="grow"><div class="t">${esc(ex.book_name)}</div><div class="s">${s.n} · ${ex.items.length} · ${t('book_exercise')}</div></div></a>`)); if (ls.test && ls.test.length) rows.push(`<a class="item" href="#test/${encodeURIComponent(s.lesson)}"><div class="dot"></div><div class="grow"><div class="t">${t('unit_test')} · ${esc(ls.title)}</div><div class="s">${ls.test.length} · ${t('test_note')}</div></div></a>`); }
    for (const s of c.sections) if (s.book) rows.push(`<a class="item" href="${c.classic}#${s.anchor}"><div class="dot"></div><div class="grow"><div class="t">${esc(s.title)}</div><div class="s">${t('read_in_chapter')}</div></div></a>`);
  }
  app.innerHTML = `<h1 class="display">${t('exams')}</h1><p class="muted">${t('exams_intro')}</p><div class="list">${rows.join('')}</div>`;
}

async function viewSettings() {
  setNav(true); hideTray(); setTop(`<a class="iconbtn" href="#home" aria-label="back">${svgIcon(BACK)}</a><div class="display" style="font-size:18px">${t('settings')}</div>`);
  app.innerHTML = `<div class="card"><div style="font-weight:800">${t('language')}</div><div class="opts row3"><button class="opt center" data-l="am" style="font-family:var(--ethiopic)">አማርኛ</button><button class="opt center" data-l="en">English</button><button class="opt center" disabled>Oromoo</button></div></div>
  <div class="card"><div style="font-weight:800">${t('grade')}</div><a class="btn ghost" href="#setup">${S.grade || '?'} ›</a></div>
  <div class="card"><div style="font-weight:800">${t('install')}</div><div class="small muted">${t('install_how')}</div></div>
  <p class="small muted">Meseret v0.1 · ${S.code ? 'Class ' + esc(S.code) : ''}</p>`;
  app.querySelectorAll('[data-l]').forEach(b => { b.setAttribute('aria-pressed', b.dataset.l === S.lang); b.onclick = async () => { await loadLang(b.dataset.l); viewSettings(); }; });
}


/* ---------- Work-it-out tools (scratch, calculator, idea explorer). Switched off for now; set WORK_TOOLS = true to bring them back. ---------- */
const WORK_TOOLS = false;
const TOOLS = {
  scratch(key) {
    const el = document.createElement('div'); el.className = 'scratch';
    const firstTime = !store.get('padHint', false);
    el.innerHTML = `<div class="padbar" role="toolbar">
      <button class="opt center" data-m="pen" aria-pressed="true" aria-label="${t('pad_pen')}">✎</button>
      <button class="opt center" data-m="erase" aria-pressed="false" aria-label="${t('pad_eraser')}">◌</button>
      <button class="opt center" data-m="hand" aria-pressed="false" aria-label="${t('pad_hand')}">✋</button>
      <button class="opt center" id="undo" aria-label="${t('pad_undo')}">↶</button>
      <button class="opt center" id="clear" aria-label="${t('pad_clear')}">✕</button></div>
      ${firstTime ? `<div class="padhint" id="padhint">${t('pad_hint')}</div>` : ''}
      <div class="padwrap" id="padwrap"><canvas id="pad"></canvas><button class="padmore" id="more">+ ${t('pad_more')}</button></div>`;
    const wrap = el.querySelector('#padwrap'), c = el.querySelector('#pad'), ctx = c.getContext('2d');
    const all = store.get('pads', {}); let strokes = (all[key] && all[key].s) || []; let H = Math.max((all[key] && all[key].h) || 0, 520);
    let mode = 'pen', cur = null; const ptrs = new Map(); let panY = null;
    const ink = () => getComputedStyle(document.documentElement).getPropertyValue('--fg').trim() || '#142019';
    const W = () => wrap.clientWidth || 320, dpr = Math.min(window.devicePixelRatio || 1, 2);
    function size() { c.width = W() * dpr; c.height = H * dpr; c.style.width = W() + 'px'; c.style.height = H + 'px'; redraw(); }
    function line(st) { if (st.p.length < 2 && st.p.length) { st.p.push([st.p[0][0] + .1, st.p[0][1]]); } ctx.globalCompositeOperation = st.e ? 'destination-out' : 'source-over'; ctx.strokeStyle = ink(); ctx.lineWidth = (st.e ? 22 : 3) * dpr; ctx.lineCap = ctx.lineJoin = 'round'; ctx.beginPath(); st.p.forEach(([x, y], i) => i ? ctx.lineTo(x * dpr, y * dpr) : ctx.moveTo(x * dpr, y * dpr)); ctx.stroke(); }
    function redraw() { ctx.clearRect(0, 0, c.width, c.height); strokes.forEach(line); ctx.globalCompositeOperation = 'source-over'; }
    function save() { try { const a = store.get('pads', {}); a[key] = { s: strokes.slice(-400), h: H }; store.set('pads', a); } catch (_) {} }
    function grow(n) { if (H >= 4000) return; H = Math.min(H + (n || 360), 4000); size(); save(); }
    const pt = e => { const r = c.getBoundingClientRect(); return [Math.round((e.clientX - r.left) * 10) / 10, Math.round((e.clientY - r.top) * 10) / 10]; };
    function hideHint() { const h = el.querySelector('#padhint'); if (h) { h.remove(); store.set('padHint', true); } }
    c.addEventListener('pointerdown', e => {
      c.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, e.clientY); hideHint();
      if (ptrs.size >= 2 || mode === 'hand') { if (cur) { strokes.pop(); cur = null; redraw(); } panY = avgY(); return; }
      cur = { e: mode === 'erase', p: [pt(e)] }; strokes.push(cur); line(cur); e.preventDefault();
    });
    c.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, e.clientY);
      if (panY != null) { const y = avgY(); wrap.scrollTop -= (y - panY); panY = y; return; }
      if (!cur) return; const p = pt(e), q = cur.p[cur.p.length - 1]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) < 1.5) return;
      cur.p.push(p); ctx.globalCompositeOperation = cur.e ? 'destination-out' : 'source-over'; ctx.strokeStyle = ink(); ctx.lineWidth = (cur.e ? 22 : 3) * dpr; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(q[0] * dpr, q[1] * dpr); ctx.lineTo(p[0] * dpr, p[1] * dpr); ctx.stroke();
      if (p[1] > H - 90) { grow(); }
      const vis = wrap.scrollTop + wrap.clientHeight; if (p[1] > vis - 40) wrap.scrollTop += 6;
    });
    const end = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2 && mode !== 'hand') panY = null; if (!ptrs.size) panY = null; if (cur && !ptrs.size) { cur = null; ctx.globalCompositeOperation = 'source-over'; save(); } };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
    function avgY() { let s = 0; ptrs.forEach(v => s += v); return s / ptrs.size; }
    el.querySelector('.padbar').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.m) { mode = b.dataset.m; el.querySelectorAll('[data-m]').forEach(x => x.setAttribute('aria-pressed', x === b)); c.style.cursor = mode === 'hand' ? 'grab' : 'crosshair'; return; }
      if (b.id === 'undo') { strokes.pop(); redraw(); save(); }
      if (b.id === 'clear') { if (b.dataset.armed) { strokes = []; H = 520; size(); save(); delete b.dataset.armed; b.textContent = '✕'; b.classList.remove('no'); } else { b.dataset.armed = 1; b.textContent = t('pad_sure'); b.classList.add('no'); setTimeout(() => { if (b.dataset.armed) { delete b.dataset.armed; b.textContent = '✕'; b.classList.remove('no'); } }, 2500); } }
    });
    el.querySelector('#more').onclick = () => { grow(); wrap.scrollTop = wrap.scrollHeight; };
    requestAnimationFrame(() => { size(); });
    return el;
  },
  calc() {
    const el = document.createElement('div'); el.className = 'stack';
    el.innerHTML = `<div class="result" style="font-size:22px;font-weight:800;text-align:right;min-height:2.4em;font-variant-numeric:tabular-nums" id="disp">0</div><div class="small muted" id="rem" style="text-align:right;min-height:1.4em"></div><div class="opts" style="grid-template-columns:repeat(4,minmax(0,1fr));gap:8px" id="keys">${['C','÷','×','⌫','7','8','9','−','4','5','6','+','1','2','3','=','0','.','(',')'].map(k => `<button class="opt center" data-k="${k}" style="min-height:52px;padding:0">${k}</button>`).join('')}</div>`;
    let expr = '';
    const disp = el.querySelector('#disp'), rem = el.querySelector('#rem');
    const show = () => { disp.textContent = expr || '0'; rem.textContent = ''; };
    el.querySelector('#keys').addEventListener('click', e => {
      const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k;
      if (k === 'C') expr = ''; else if (k === '⌫') expr = expr.slice(0, -1);
      else if (k === '=') { try { const js = expr.replace(/÷/g, '/').replace(/×/g, '*').replace(/−/g, '-'); if (!/^[0-9+\-*/().\s]+$/.test(js)) throw 0; const v = Function('"use strict";return (' + js + ')')(); disp.textContent = Number.isFinite(v) ? String(Math.round(v * 1e6) / 1e6) : '?'; const m = js.match(/^\s*(\d+)\s*\/\s*(\d+)\s*$/); rem.textContent = m && +m[2] ? `${m[1]} ÷ ${m[2]} = ${Math.floor(m[1] / m[2])} r ${m[1] % m[2]}` : ''; expr = Number.isFinite(v) ? String(Math.round(v * 1e6) / 1e6) : ''; return; } catch (_) { disp.textContent = '?'; return; } }
      else expr += k; show();
    });
    return el;
  },
  factors() {
    const el = document.createElement('div'); el.className = 'stack';
    el.innerHTML = `<p class="small muted">Type a number and see its factors. Type two and compare.</p><div class="row"><input id="fa" inputmode="numeric" placeholder="50" style="min-height:52px;width:50%;text-align:center;font-weight:800;font-size:20px;border-radius:12px;border:2px solid var(--line);background:var(--surface)"><input id="fb" inputmode="numeric" placeholder="20" style="min-height:52px;width:50%;text-align:center;font-weight:800;font-size:20px;border-radius:12px;border:2px solid var(--line);background:var(--surface)"></div><div id="out" class="stack"></div>`;
    const out = el.querySelector('#out');
    const row = (n, L, common) => `<div class="frow"><span>${n} → ${L.length} factors · primes: ${primes(n).join(' × ') || n}</span><div class="chips">${L.map(x => `<span class="chip ${common.includes(x) ? 'on' : ''}">${x}</span>`).join('')}</div></div>`;
    const upd = () => { const a = +el.querySelector('#fa').value, b = +el.querySelector('#fb').value; const fa = a > 0 && a < 10000 ? factors(a) : [], fb = b > 0 && b < 10000 ? factors(b) : []; const common = fa.filter(x => fb.includes(x)); out.innerHTML = (a > 0 ? row(a, fa, common) : '') + (b > 0 ? row(b, fb, common) : ''); };
    el.querySelectorAll('input').forEach(i => i.addEventListener('input', upd));
    return el;
  }
};
function workSheet(ctx) {
  const tabs = [['scratch', '✎'], ['calc', '123']]; if (ctx.tool && TOOLS[ctx.tool]) tabs.push([ctx.tool, '⚙']);
  closePanel();
  const el = document.createElement('div'); el.className = 'panel'; el.id = 'panel';
  el.innerHTML = `<div class="phead"><button class="iconbtn" id="pgrow" aria-label="resize" style="width:36px;height:36px">⤢</button><span class="pq">${esc(ctx.q || t('work_it_out'))}</span><button class="iconbtn" id="pclose" aria-label="${t('cancel')}" style="width:36px;height:36px">${svgIcon(CLOSE)}</button></div><div class="pbody"><div class="ptabs" id="wtabs">${tabs.map(([k, ic], i) => `<button class="opt center" data-tab="${k}" aria-pressed="${i === 0}">${ic} ${t('tool_' + k)}</button>`).join('')}</div><div id="wbody"></div></div>`;
  document.body.appendChild(el); document.body.classList.add('panel-open');
  const body = el.querySelector('#wbody'); const open = k => { body.replaceChildren(TOOLS[k](ctx.key)); el.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-pressed', b.dataset.tab === k)); logEvent({ lesson: ctx.lesson, item: ctx.item, tool: k }); };
  el.querySelector('#wtabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) open(b.dataset.tab); });
  el.querySelector('#pgrow').onclick = () => el.classList.toggle('tall');
  el.querySelector('#pclose').onclick = closePanel; open(tabs[0][0]);
}
function closePanel() { const p = $('#panel'); if (p) p.remove(); document.body.classList.remove('panel-open'); }

/* ---------- lesson player ---------- */
const factors = n => { const f = []; for (let d = 1; d <= n; d++) if (n % d === 0) f.push(d); return f; };
const primes = n => { const r = []; let d = 2; while (n > 1) { if (n % d === 0) { r.push(d); n /= d; } else d++; } return r; };
const norm = s => String(s).toLowerCase().replace(/[×*·]/g, 'x').replace(/[−–]/g, '-').replace(/[^\p{L}\p{N}.\s/^+=√x-]/gu, '').replace(/\s*([x^+=/])\s*/g, '$1').replace(/\s+/g, ' ').trim();
const WORDS = { zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10', eleven: '11', twelve: '12' };
function lev(a, b) { const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]); for (let j = 1; j <= n; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; }
function matchAnswer(given, accepted) {
  const g0 = norm(given), g = WORDS[g0] || g0; if (!g) return { ok: false };
  for (const a of accepted) { const a0 = norm(a), an = WORDS[a0] || a0; if (g === an) return { ok: true }; if (!isNaN(+g) && !isNaN(+an) && +g === +an) return { ok: true }; }
  for (const a of accepted) { const an = norm(a); if (an.length > 4 && lev(g, an) <= (an.length > 7 ? 2 : 1)) return { ok: true, near: a }; }
  return { ok: false };
}

function boardSVG(w, h, s) {
  const sc = 300 / w, W = 300, H = h * sc, x0 = 44, y0 = 10;
  let g = `<rect x="${x0}" y="${y0}" width="${W}" height="${H}" rx="3" style="fill:var(--surface-2);stroke:var(--muted)" stroke-width="1.5"/>`;
  if (s) { const nx = Math.floor(w / s), ny = Math.floor(h / s);
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) g += `<rect x="${x0 + i * s * sc + .5}" y="${y0 + j * s * sc + .5}" width="${s * sc - 1}" height="${s * sc - 1}" style="fill:${(i + j) % 2 ? 'var(--tile-a)' : 'var(--tile-b)'}"/>`;
    if (w % s) g += `<rect x="${x0 + nx * s * sc}" y="${y0}" width="${W - nx * s * sc}" height="${H}" style="fill:var(--bad-soft);stroke:var(--bad)" stroke-width="1.5"/>`;
    if (h % s) g += `<rect x="${x0}" y="${y0 + ny * s * sc}" width="${W}" height="${H - ny * s * sc}" style="fill:var(--bad-soft);stroke:var(--bad)" stroke-width="1.5"/>`;
  } else g += `<rect x="${x0 + 8}" y="${y0 + 8}" width="${Math.min(60, H - 16)}" height="${Math.min(60, H - 16)}" rx="3" style="fill:var(--sky-soft);stroke:var(--sky)" stroke-width="2" stroke-dasharray="6 4"/><text x="${x0 + 8 + Math.min(60, H - 16) / 2}" y="${y0 + 8 + Math.min(60, H - 16) / 2 + 9}" text-anchor="middle" font-size="26" font-weight="800" style="fill:var(--sky)">?</text>`;
  g += `<text x="${x0 + W / 2}" y="${y0 + H + 20}" text-anchor="middle" font-size="13" font-weight="700" style="fill:var(--muted)">${w} cm</text><text x="${x0 - 8}" y="${y0 + H / 2 + 5}" text-anchor="end" font-size="13" font-weight="700" style="fill:var(--muted)">${h} cm</text>`;
  return `<svg viewBox="0 0 360 ${y0 + H + 32}" role="img" aria-label="Board ${w} by ${h} cm">${g}</svg>`;
}
function vennSVG(a, b, k) {
  const pa = primes(a), pb = primes(b), both = [], oa = [], ob = pb.slice();
  pa.forEach(p => { const i = ob.indexOf(p); if (i >= 0) { both.push(p); ob.splice(i, 1); } else oa.push(p); });
  const T = (x, y, s, c) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="20" font-weight="800" style="fill:${c || 'var(--fg)'}">${s}</text>`;
  const col = (L, cx) => L.map((p, i) => T(cx, 90 + i * 28 - (L.length - 1) * 14, p)).join('');
  let g = `<defs><clipPath id="vL"><circle cx="125" cy="98" r="72"/></clipPath></defs><circle cx="125" cy="98" r="72" style="fill:var(--sky-soft);stroke:var(--sky)" stroke-width="2.5"/><circle cx="205" cy="98" r="72" style="fill:var(--sun-soft);stroke:var(--sun)" stroke-width="2.5" fill-opacity=".85"/><circle cx="205" cy="98" r="72" clip-path="url(#vL)" style="fill:${k >= 3 ? 'var(--hi)' : 'transparent'}"/><circle cx="125" cy="98" r="72" fill="none" style="stroke:var(--sky)" stroke-width="2.5"/>` + T(78, 18, a, 'var(--sky)') + T(252, 18, b, 'var(--sun-ink)');
  if (k >= 1) g += col(both, 165); if (k >= 2) g += col(oa, 95) + col(ob, 235);
  return `<svg viewBox="0 0 330 180" role="img" aria-label="Venn diagram of the prime factors of ${a} and ${b}">${g}</svg>`;
}

/* ---------- screen renderers (shared by the step player and the book reader) ---------- */
function makeR(env) {
  const div = html => { const d = document.createElement('div'); d.className = 'stack'; d.innerHTML = html; return d; };
  const head = s => `<span class="eyebrow sky">${esc(s._from || (['hook', 'explore', 'notice', 'check', 'practise'].includes(s.step) ? t('step_' + s.step) : ''))}</span>${s.title ? `<h1 class="display" tabindex="-1">${esc(s.title)}</h1>` : ''}${s.text ? `<p class="lead">${esc(s.text)}</p>` : ''}`;
  const choice = (s, opts, ans, row2) => {
    const el = div(head(s) + (s.ask ? `<p class="ask">${esc(s.ask)}</p>` : '') + `<div class="opts${row2 ? ' row2' : ''}" role="radiogroup">${opts.map(o => `<button class="opt" role="radio" aria-checked="false">${esc(o)}</button>`).join('')}</div>`);
    let pick = null;
    el.querySelector('.opts').addEventListener('click', e => { const b = e.target.closest('.opt'); if (!b || b.disabled || env.phase() !== 'answer') return; pick = b; el.querySelectorAll('.opt').forEach(x => x.setAttribute('aria-checked', x === b)); env.update(); });
    return { el, label: t('check'), ready: () => !!pick, check() { const ok = pick.textContent === ans; pick.classList.add(ok ? 'ok' : 'no'); if (ok) el.querySelectorAll('.opt').forEach(x => x.disabled = true); else pick.disabled = true; return ok ? { ok: true, body: s.why } : { ok: false, body: s.clue }; }, retry() { pick = null; el.querySelectorAll('.opt').forEach(x => x.setAttribute('aria-checked', 'false')); } };
  };
  const R = {
    guess(s) { const f = s.figure || {}; const el = div(head(s) + (f.type === 'board' ? `<div class="fig">${boardSVG(f.w, f.h, 0)}</div>` : '') + `<p class="ask">${esc(s.ask || '')}</p><div class="opts row2" role="radiogroup">${s.opts.map(o => `<button class="opt center" role="radio" aria-checked="false">${esc(o)}</button>`).join('')}</div><p class="small muted">${t('guess_note')}</p>`);
      let pick = null; el.querySelector('.opts').addEventListener('click', e => { const b = e.target.closest('.opt'); if (!b || env.phase() !== 'answer') return; pick = b; el.querySelectorAll('.opt').forEach(x => x.setAttribute('aria-checked', x === b)); env.update(); });
      return { el, label: t('lock_guess'), ready: () => !!pick, check() { env.state.guess = pick.textContent; el.querySelectorAll('.opt').forEach(x => x.disabled = true); return { ok: null, title: t('your_guess', { g: env.state.guess }), body: s.after }; } }; },
    tiles(s) { const f = s.figure || { w: 50, h: 20 }; const el = div(head(s) + `<div class="fig"><div class="board">${boardSVG(f.w, f.h, 0)}</div><div class="sizes" role="group">${s.sizes.map(z => `<button class="size" aria-pressed="false" data-s="${z}">${z} cm</button>`).join('')}</div><div class="result" aria-live="polite"><strong>${t('pick_size')}</strong>${t('try_more', { n: s.need })}</div></div>`);
      const tried = new Set(), res = el.querySelector('.result');
      el.querySelector('.sizes').addEventListener('click', e => { const b = e.target.closest('.size'); if (!b) return; const z = +b.dataset.s, fit = f.w % z === 0 && f.h % z === 0; tried.add(z); b.classList.add(fit ? 'fit' : 'gap'); el.querySelectorAll('.size').forEach(x => x.setAttribute('aria-pressed', x === b)); el.querySelector('.board').innerHTML = boardSVG(f.w, f.h, z); const left = Math.max(0, s.need - tried.size); res.innerHTML = (fit ? `<strong>${t('fits', { s: z, x: f.w / z, y: f.h / z, n: (f.w / z) * (f.h / z) })}</strong>${t('fits_why', { s: z, a: f.w, b: f.h })}` : `<strong>${t('gap', { s: z })}</strong>${t('gap_why', { s: z, n: f.w % z ? f.w : f.h })}`) + (left ? ' ' + t('try_more', { n: left }) : ''); env.update(); });
      return { el, label: t('continue'), ready: () => tried.size >= s.need }; },
    read(s) { return { el: div(head(s) + (s.paras || []).map(x => `<p>${esc(x)}</p>`).join('') + (s.defs || []).map(d => `<div class="defn"><b>${esc(d[0])}</b><span>${esc(d[1])}</span></div>`).join('') + (s.table ? `<div class="tbl"><table>${s.table.map((r, i) => `<tr>${r.map(c => i ? `<td>${esc(c)}</td>` : `<th>${esc(c)}</th>`).join('')}</tr>`).join('')}</table></div>` : '') + (s.note ? `<p class="note">${esc(s.note)}</p>` : '')), label: t('continue'), ready: () => true }; },
    mcq(s) { return choice(s, s.opts, s.ans, false); },
    tf(s) { return choice(s, [t('true'), t('false')], s.a ? t('true') : t('false'), true); },
    name(s) { const f = s.figure || {}; let html = head(s);
      if (f.type === 'factors') { const fa = factors(f.a), fb = factors(f.b), common = fa.filter(x => fb.includes(x)), g = Math.max(...common); const row = (n, L) => `<div class="frow"><span>${t('factors_of', { n })}</span><div class="chips">${L.map(x => `<span class="chip" data-v="${x}">${x}</span>`).join('')}</div></div>`; html += `<div class="fig">${row(f.a, fa)}${row(f.b, fb)}<button class="inner" id="rv">${t('show_shared')}</button></div><div id="after" hidden></div>`;
        const el = div(html); let shown = false;
        el.querySelector('#rv').addEventListener('click', e => { shown = true; e.currentTarget.disabled = true; el.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', common.includes(+c.dataset.v))); const a = el.querySelector('#after'); a.innerHTML = `<div class="stack"><p class="ask">${t('shared', { list: common.join(', '), g })}</p>${s.defs.map(d => `<div class="defn"><b>${esc(d[0])}</b><span>${esc(d[1])}</span></div>`).join('')}${s.ask ? `<p>${t('biggest_square', { a: s.ask })} ${env.state.guess ? (env.state.guess === s.ask ? t('spot_on', { g: env.state.guess }) : t('not_quite_guess', { g: env.state.guess, a: s.ask })) : ''}</p>` : ''}${explainCard(s)}</div>`; a.hidden = false; env.update(); });
        return { el, label: t('continue'), ready: () => shown }; }
      html += s.defs.map(d => `<div class="defn"><b>${esc(d[0])}</b><span>${esc(d[1])}</span></div>`).join('') + explainCard(s);
      return { el: div(html), label: t('continue'), ready: () => true }; },
    pick(s) { const ans = s.a.map(String); const el = div(head(s) + `<div class="fig"><div class="chips" role="group">${s.pool.map(x => `<button class="chip" aria-pressed="false" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>`); const on = new Set();
      el.querySelector('.chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b || env.phase() !== 'answer') return; const v = b.dataset.v; on.has(v) ? on.delete(v) : on.add(v); b.setAttribute('aria-pressed', on.has(v)); b.classList.remove('no'); env.update(); });
      return { el, label: t('check'), ready: () => on.size > 0, check() { const wrong = [...on].filter(v => !ans.includes(v)), missing = ans.filter(v => !on.has(v)); el.querySelectorAll('.chip').forEach(c => c.classList.toggle('no', wrong.includes(c.dataset.v))); if (!wrong.length && !missing.length) { el.querySelectorAll('.chip').forEach(c => { if (on.has(c.dataset.v)) c.classList.add('ok'); c.disabled = true; }); return { ok: true, body: s.why }; } if (wrong.length) return { ok: false, body: s.clue || t('wrong_pick', { n: wrong[0], a: '', b: '' }) }; return { ok: false, body: t('missing_pick') }; }, retry() {} }; },
    steps(s) { const f = s.figure || {}; const el = div(head(s) + `<div class="fig">${f.type === 'venn' ? `<div id="venn">${vennSVG(f.a, f.b, 0)}</div>` : ''}<ol class="steps" aria-live="polite"></ol><button class="inner" id="nx">${t('next_step')}</button></div>`); const ol = el.querySelector('.steps'), nb = el.querySelector('#nx'); let k = 0;
      const draw = () => { ol.innerHTML = s.steps.slice(0, k + 1).map(x => `<li>${esc(x)}</li>`).join(''); if (f.type === 'venn') el.querySelector('#venn').innerHTML = vennSVG(f.a, f.b, k); nb.disabled = k >= s.steps.length - 1; env.update(); };
      nb.addEventListener('click', () => { k++; draw(); }); draw();
      return { el, label: t('continue'), ready: () => k >= s.steps.length - 1 }; },
    blank(s) { const [a, b] = (s.ask || '___').split('___'); const el = div(head(s) + `<div class="fig"><p class="blank"><span>${esc(a)}</span><input id="bl" autocomplete="off" aria-label="${t('your_answer')}"><span>${esc(b || '')}</span></p><p class="small muted">${t('spelling_note')}</p></div>`); const inp = el.querySelector('#bl'); inp.addEventListener('input', () => env.update()); inp.addEventListener('keydown', e => { if (e.key === 'Enter') env.enter(); });
      return { el, label: t('check'), ready: () => inp.value.trim() !== '', check() { const r = matchAnswer(inp.value, s.a.map(String)); inp.className = r.ok ? 'ok' : 'no'; inp.disabled = r.ok; return r.ok ? { ok: true, body: (r.near ? t('right_idea', { a: r.near }) + ' ' : '') + (s.why || '') } : { ok: false, body: s.clue }; }, retry() { inp.className = ''; inp.focus(); } }; },
    sort(s) { const el = div(head(s) + `<div class="fig"><p class="display" id="it" style="text-align:center;font-size:22px"></p><div class="opts" id="bins">${s.bins.map(b => `<button class="opt center">${esc(b)}</button>`).join('')}</div><p class="small muted" id="fb"></p></div>`); let i = 0, wrong = 0; const draw = () => { el.querySelector('#it').textContent = i < s.items.length ? s.items[i][0] : ''; };
      el.querySelector('#bins').addEventListener('click', e => { const b = e.target.closest('.opt'); if (!b || i >= s.items.length || env.phase() !== 'answer') return; const [name, ans, why] = s.items[i]; const ok = b.textContent === ans; if (!ok) wrong++; el.querySelector('#fb').textContent = (ok ? '✓ ' : '✗ ') + `${name} → ${ans}. ${why || ''}`; i++; draw(); if (i >= s.items.length) { el.querySelector('#bins').querySelectorAll('.opt').forEach(x => x.disabled = true); } env.update(); }); draw();
      return { el, label: t('check'), ready: () => i >= s.items.length, check() { return wrong ? { ok: false, body: s.clue || `${wrong} / ${s.items.length}` } : { ok: true, body: s.why || '' }; }, retry() { i = 0; wrong = 0; el.querySelector('#bins').querySelectorAll('.opt').forEach(x => x.disabled = false); draw(); } }; },
    tap(s) { const el = div(head(s) + `<div class="fig"><div class="chips">${s.items.map((it, k) => `<button class="chip" data-k="${k}" aria-pressed="false">${esc(it[0])}</button>`).join('')}</div><div class="result" id="info">${esc(s.ask || '')}</div></div>` + explainCard(s)); const seen = new Set();
      el.querySelector('.chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; const k = +b.dataset.k; seen.add(k); el.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === b)); el.querySelector('#info').innerHTML = `<strong>${esc(s.items[k][0])}</strong>${esc(s.items[k][1])}`; env.update(); });
      return { el, label: t('continue'), ready: () => seen.size >= Math.min(s.need || s.items.length, s.items.length) }; },
    order(s) { const mixed = s.items.slice().sort(() => Math.random() - .5); const el = div(head(s) + `<div class="fig"><div class="chips" id="pool">${mixed.map(x => `<button class="chip" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div><ol class="steps" id="seq"></ol></div>`); let seq = [];
      el.querySelector('#pool').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b || env.phase() !== 'answer') return; seq.push(b.dataset.v); b.disabled = true; el.querySelector('#seq').innerHTML = seq.map(x => `<li>${esc(x)}</li>`).join(''); env.update(); });
      return { el, label: t('check'), ready: () => seq.length === s.items.length, check() { const ok = seq.every((x, i) => x === s.items[i]); return ok ? { ok: true, body: s.why } : { ok: false, body: s.clue || s.why }; }, retry() { seq = []; el.querySelector('#seq').innerHTML = ''; el.querySelectorAll('#pool .chip').forEach(x => x.disabled = false); } }; },
    match(s) { const rights = s.pairs.map(p => p[1]).sort(() => Math.random() - .5); const el = div(head(s) + `<div class="fig"><div class="stack">${s.pairs.map((p, j) => `<label class="row"><span class="grow" style="font-weight:800">${esc(p[0])}</span><select data-j="${j}" style="min-height:44px;border-radius:10px;border:2px solid var(--line);background:var(--surface);max-width:55%"><option value="">…</option>${rights.map(r => `<option>${esc(r)}</option>`).join('')}</select></label>`).join('')}</div></div>`);
      el.addEventListener('change', () => env.update());
      return { el, label: t('check'), ready: () => [...el.querySelectorAll('select')].every(x => x.value), check() { const ok = [...el.querySelectorAll('select')].every(x => x.value === s.pairs[+x.dataset.j][1]); return ok ? { ok: true, body: s.why } : { ok: false, body: s.clue || s.why }; }, retry() {} }; },
  };
  const explainCard = s => { const ex = s._explain || env.explain; if (!ex) return ''; const txt = (ex[S.lang] && ex[S.lang].text) || (ex.en && ex.en.text) || ''; return txt ? `<div class="explain"><button class="play" id="ex-play" aria-label="${t('explain_me')}"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l12 7-12 7z" fill="#fff"/></svg></button><div class="grow"><div style="font-weight:800">${t('explain_me')}</div><div class="small muted" id="ex-text">${esc(txt)}</div></div></div>` : ''; };

  return { R, div, explainCard };
}

function runPlayer(cfg) {
  setNav(false); tray.hidden = false;
  const screens = cfg.screens, SUM = screens.length;
  let order = screens.map((_, i) => i), pos = 0, cur = null, phase = 'answer', lastOk = null, review = false, firstTry = {}, missed = new Set(), round = {}, tries = {};
  const state = { guess: null }; const offered = {};
  function openRefresher(id) { const rf = cfg.refreshers[id]; logEvent({ lesson: cfg.id, refresher: id, item: order[pos] }); const saved = { app: [...app.childNodes], tray: tray.className, msg: msg.innerHTML, goText: go.textContent, goDis: go.disabled, phase, lastOk, cur, top: topin.innerHTML, work: $('#work').hidden };
    const extra = tray.querySelector('#rfb'); if (extra) extra.remove();
    runPlayer({ id: cfg.id + ':' + id, idea: id, title: rf.name, mode: 'refresher', screens: rf.screens, backRoute: null, resume: () => { app.replaceChildren(...saved.app); tray.className = saved.tray; msg.innerHTML = saved.msg; go.textContent = saved.goText; go.disabled = saved.goDis; phase = saved.phase; lastOk = saved.lastOk; cur = saved.cur; topin.innerHTML = saved.top; $('#work').hidden = saved.work; bindTop(order[pos]); go.onclick = onGo; window.scrollTo(0, 0); } }); }
  const { R, div, explainCard } = makeR({ phase: () => phase, update: () => update(), state, explain: cfg.explain, enter: () => { if (!go.disabled) go.click(); } });
  R.summary = () => { const graded = screens.map((x, i) => x.graded ? i : -1).filter(i => i >= 0); const right = graded.filter(i => firstTry[i]).length;
      const el = div(`<span class="eyebrow sky">${t('done')}</span><h1 class="display" tabindex="-1">${esc(cfg.title)}</h1><div class="score"><span class="big">${right} / ${graded.length}</span><span>${t('first_try')}</span></div><p>${missed.size ? t('replay_note', { n: missed.size }) : t('all_done')}</p>${cfg.learned ? `<div class="defn"><b>${t('learned')}</b><ul class="steps" style="padding-left:20px">${cfg.learned.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}${cfg.mode === 'learn' ? `<div class="card sky"><div class="small">${t('comes_back')}</div></div>` : ''}${cfg.backRoute ? `<a class="btn link" href="#${cfg.backRoute}">${t('back_chapter')}</a>` : ''}`);
      return { el, label: cfg.mode === 'refresher' ? t('back_to_question') : missed.size ? t('replay_n', { n: missed.size }) : cfg.resume ? t('back_to_book') : t('start_again'), ready: () => true, summary: true }; };
  function setTray(kind, title, body, label) { tray.className = 'tray' + (kind ? ' ' + kind : ''); msg.innerHTML = title ? `<strong>${esc(title)}</strong>${body ? `<span>${esc(body)}</span>` : ''}` : ''; go.textContent = label; }
  function update() { if (phase === 'answer' && cur) go.disabled = !cur.ready(); }
  function bindTop(k) { const rep = $('#rep'); if (rep) rep.onclick = () => reportSheet({ lesson: cfg.id || cfg.title, screen: k, label: `${cfg.title} · ${Math.min(pos + 1, order.length)}/${order.length}` }); const rb = $('#rback'); if (rb) rb.onclick = () => cfg.resume && cfg.resume(); }
  function show() {
    const k = order[pos], s = k === SUM ? { kind: 'summary' } : screens[k];
    cur = (R[s.kind] || R.name)(s); app.replaceChildren(cur.el);
    const ex = cur.el.querySelector('#ex-play'); if (ex) ex.onclick = () => speak(cur.el.querySelector('#ex-text').textContent);
    const rf = s.needs && cfg.refreshers && cfg.refreshers[s.needs];
    if (rf) { const a = document.createElement('button'); a.className = 'btn link'; a.style.justifySelf = 'start'; a.textContent = t('need_reminder', { n: rf.name }); a.onclick = () => openRefresher(s.needs); cur.el.appendChild(a); }
    const old = tray.querySelector('#rfb'); if (old) old.remove(); closePanel();
    phase = 'answer'; lastOk = null; setTray('', '', '', cur.label); update();
    const wb = $('#work'); wb.hidden = !WORK_TOOLS || !(s.graded || s.kind === 'guess' || s.kind === 'tiles');
    const osk = $('#skipb'); if (osk) osk.remove(); if (s.graded && order.length - pos > 2) { const sb = document.createElement('button'); sb.className = 'btn ghost'; sb.id = 'skipb'; sb.style.width = 'auto'; sb.textContent = t('skip'); sb.onclick = () => { order.splice(pos, 1); order.splice(order.length - 1, 0, k); show(); }; go.parentNode.insertBefore(sb, go); } wb.onclick = () => workSheet({ key: `${cfg.id || cfg.title}:${k}`, lesson: cfg.id, item: k, tool: s.tool || cfg.tool, q: (s.ask || s.text || s.title || '').replace(/\n/g, ' ') });
    const pct = Math.round(pos / order.length * 100);
    setTop(`${cfg.backRoute ? `<a class="iconbtn" href="#${cfg.backRoute}" aria-label="close">${svgIcon(CLOSE)}</a>` : `<button class="iconbtn" id="rback" aria-label="back">${svgIcon(BACK)}</button>`}<span class="mode ${cfg.mode === 'review' || review ? 'review' : cfg.mode === 'book' || cfg.mode === 'test' ? 'book' : ''}">${cfg.mode === 'refresher' ? t('refresher') : cfg.mode === 'practice' ? t('step_practise') : review ? t('review') : cfg.mode === 'review' ? t('review') : cfg.mode === 'book' ? t('book_exercise') : cfg.mode === 'test' ? t('unit_test') : t('learn')}</span><div class="bar"><i style="width:${pct}%"></i></div><span class="count">${Math.min(pos + 1, order.length)} / ${order.length}</span><button class="iconbtn" id="rep" aria-label="${t('report')}">${svgIcon(FLAG)}</button>`);
    bindTop(k);
    window.scrollTo(0, 0); const h = cur.el.querySelector('h1'); if (h) h.focus({ preventScroll: true });
  }
  function onGo() {
    const k = order[pos], s = screens[k];
    if (cur.summary) { if (cfg.mode === 'refresher' || (cfg.resume && !missed.size)) { cfg.resume(); return; } if (missed.size) { order = [...missed].sort((a, b) => a - b).concat(SUM); review = true; } else { order = screens.map((_, i) => i).concat(SUM); firstTry = {}; review = false; state.guess = null; } pos = 0; round = {}; tries = {}; show(); return; }
    if (phase === 'feedback') { if (lastOk === false) { const old = tray.querySelector('#rfb'); if (old) old.remove(); phase = 'answer'; cur.retry && cur.retry(); setTray('', '', '', cur.label); update(); } else { pos++; show(); } return; }
    if (!cur.check) { pos++; show(); return; }
    { const sb = $('#skipb'); if (sb) sb.remove(); }
    const r = cur.check(); tries[k] = (tries[k] || 0) + 1;
    if (s.graded && !(k in round)) { round[k] = r.ok; if (!(k in firstTry)) firstTry[k] = r.ok; r.ok ? missed.delete(k) : missed.add(k); logEvent({ lesson: s._lesson || cfg.id, idea: s._idea || cfg.idea, item: k, correct: !!r.ok, attempt: tries[k], mode: cfg.mode }); }
    lastOk = r.ok; phase = 'feedback';
    const noClue = cfg.mode === 'test';
    if (r.ok === true) { setTray('ok', t('correct'), r.body, t('continue')); if (cfg.cheer) { const rc = go.getBoundingClientRect(); burst(rc.left + rc.width / 2, rc.top); buzz(25); } }
    else if (r.ok === false) { if (noClue) { lastOk = true; setTray('no', t('not_yet'), s.why || '', t('continue')); } else if (tries[k] >= 2 && s.worked) { lastOk = true; setTray('no', t('show_worked'), s.worked, t('continue')); } else { setTray('no', t('not_yet'), r.body, t('try_again')); const rf = s.needs && cfg.refreshers && cfg.refreshers[s.needs]; if (rf && !offered[k]) { offered[k] = true; msg.innerHTML += `<span class="small">${esc(t('offer_refresher', { n: rf.name }))}</span>`; const b = document.createElement('button'); b.className = 'btn ghost'; b.id = 'rfb'; b.textContent = t('yes_reminder'); b.onclick = () => openRefresher(s.needs); go.parentNode.insertBefore(b, go); go.textContent = t('no_continue'); } } }
    else setTray('info', r.title, r.body, t('continue'));
    go.disabled = false; go.focus();
    if (pos === order.length - 1 && cfg.onDone && !cfg._done) { cfg._done = true; const byIdea = {}; screens.forEach((x, i) => { if (x.graded) { const id = x._idea || cfg.idea; byIdea[id] = (byIdea[id] !== false) && !!firstTry[i]; } }); cfg.onDone({ byIdea, firstTry, missed }); }
  };
  go.onclick = onGo; order = order.concat(SUM); show();
}

/* ---------- book reader: one scrolling page per section, questions inline ---------- */
async function viewLesson(path, mode, exIdx) {
  const ls = await loadLesson(path), idx = await loadIndex();
  const ch = idx.chapters.find(c => c.sections.some(x => x.lesson === path));
  const secs = ch ? ch.sections.filter(x => x.lesson) : [], si = secs.findIndex(x => x.lesson === path), nextSec = si >= 0 ? secs[si + 1] : null;
  const m = mode || 'learn', idea0 = ls.ideas[0];
  let blocks = [], title = ls.title;
  if (m === 'book') { const ex = ls.exercises[exIdx || 0]; blocks = ex.items.map(x => Object.assign({ _idea: idea0.id }, x)); title = ex.book_name; }
  else if (m === 'test') { blocks = ls.test.map(x => Object.assign({ _idea: idea0.id }, x)); title = `${t('unit_test')} · ${ls.title}`; }
  else ls.ideas.forEach(i => { if (ls.ideas.length > 1 && i.name) blocks.push({ kind: '_head', name: i.name }); i.screens.forEach(x => blocks.push(Object.assign({ _idea: i.id, _explain: i.explain }, x))); });
  const key = m === 'learn' ? path : `${path}#${m}${exIdx || ''}`;
  const saved = lessonProgress(key) || {}; const got = Object.assign({}, saved.got); const first = {};
  const state = { guess: null }; let tasks = 0, away = false;
  setNav(false); hideTray(); markStudied();
  if (m === 'learn') store.set('last', { route: `lesson/${encodeURIComponent(path)}`, title: `${ls.book.section} · ${ls.title}`, sub: ch ? `${L(idx.subjects[ch.subject])} · ${t('grade')} ${ch.grade}` : '' });
  const back = m === 'learn' ? (ch ? 'chapter/' + ch.id : 'home') : `lesson/${encodeURIComponent(path)}`;
  setTop(`<a class="iconbtn" href="#${m === 'learn' ? back : 'exams'}" aria-label="back">${svgIcon(BACK)}</a><span class="mode ${m === 'learn' ? '' : 'book'}">${m === 'book' ? t('book_exercise') : m === 'test' ? t('unit_test') : esc(ls.book.section)}</span><div class="bar"><i id="pbar"></i></div><span class="count" id="pcount"></span><button class="iconbtn" id="rep" aria-label="${t('report')}">${svgIcon(FLAG)}</button>`);
  const page = document.createElement('div'); page.className = 'reader';
  page.innerHTML = `<header class="stack"><span class="eyebrow">${ch ? `${t('grade')} ${ch.grade} · ${esc(L(idx.subjects[ch.subject]))} · ` : ''}${t('unit')} ${ls.book.unit}</span><h1 class="display">${m === 'learn' ? esc(ls.book.section) + ' ' : ''}${esc(title)}</h1>${m === 'learn' && ls.competency ? `<p class="muted">${esc(ls.competency)}</p>` : ''}${m === 'test' ? `<p class="muted">${t('test_note')}</p>` : ''}</header>`;
  app.replaceChildren(page);
  $('#rep').onclick = () => reportSheet({ lesson: ls.id, label: `${ls.book.section} · ${ls.title}` });
  function progress() { const d = Object.keys(got).length; $('#pbar').style.width = (tasks ? Math.round(d / tasks * 100) : 100) + '%'; $('#pcount').textContent = `${d} / ${tasks}`; }
  function persist(extra) { setLessonProgress(key, Object.assign({ got, n: tasks }, extra || {})); }
  function finish(i, ok) {
    if (!(i in got)) got[i] = ok !== false;
    progress(); persist();
    if (Object.keys(got).length >= tasks) complete();
  }
  function complete() {
    const graded = blocks.map((x, i) => x.graded ? i : -1).filter(i => i >= 0), right = graded.filter(i => first[i] !== false && got[i] !== false).length;
    persist({ done: true, best: `${right}/${graded.length}` });
    if (m === 'learn' && !complete.did) { complete.did = true; const by = {}; graded.forEach(i => { const id = blocks[i]._idea; by[id] = (by[id] !== false) && first[i] !== false; }); Object.keys(by).forEach(id => bumpMastery(id, by[id])); }
    const sc = page.querySelector('#score'); if (sc) { sc.hidden = false; sc.innerHTML = `<span class="big">${right} / ${graded.length}</span><span>${t('first_try')}</span>`; }
  }
  function openRefresher(id) {
    const rf = ls.refreshers && ls.refreshers[id]; if (!rf) return; logEvent({ lesson: ls.id, refresher: id });
    const keep = { app: [...app.childNodes], top: [...topin.childNodes], y: window.scrollY }; away = true; closePanel();
    runPlayer({ id: ls.id + ':' + id, idea: id, title: rf.name, mode: 'refresher', screens: rf.screens, backRoute: null, resume: () => { app.replaceChildren(...keep.app); topin.replaceChildren(...keep.top); top.hidden = false; hideTray(); setNav(false); away = false; requestAnimationFrame(() => window.scrollTo(0, keep.y)); } });
  }
  blocks.forEach((s, i) => {
    if (s.kind === '_head') { const h = document.createElement('h2'); h.className = 'display ideahead'; h.textContent = s.name; page.appendChild(h); return; }
    const wrap = document.createElement('section'); wrap.className = 'blk' + (s.step === 'hook' ? ' hook' : s.kind === 'name' || s.kind === 'read' ? ' plain' : '');
    let phase = 'answer', tries = 0, cur = null; const btn = document.createElement('button'), fb = document.createElement('div');
    const env = { phase: () => phase, state, explain: null, enter: () => { if (!btn.disabled && !btn.hidden) btn.click(); },
      update() { if (!cur) return; if (cur.check) btn.disabled = phase !== 'answer' || !cur.ready(); else if (phase === 'answer' && cur.ready() && interactive) { phase = 'done'; wrap.classList.add('done'); finish(i, true); } } };
    const RR = makeR(env).R; cur = (RR[s.kind] || RR.name)(s);
    const interactive = !!cur.check || !cur.ready();
    if (interactive) tasks++;
    wrap.appendChild(cur.el);
    const ex = cur.el.querySelector('#ex-play'); if (ex) ex.onclick = () => speak(cur.el.querySelector('#ex-text').textContent);
    const foot = document.createElement('div'); foot.className = 'blkfoot';
    const rf = s.needs && ls.refreshers && ls.refreshers[s.needs];
    if (rf) { const a = document.createElement('button'); a.className = 'btn link small'; a.textContent = t('need_reminder', { n: rf.name }); a.onclick = () => openRefresher(s.needs); foot.appendChild(a); }
    if (WORK_TOOLS && (s.graded || s.kind === 'guess')) { const w = document.createElement('button'); w.className = 'btn link small'; w.textContent = '✎ ' + t('work_it_out'); w.onclick = () => { workSheet({ key: `${ls.id}:${m}:${i}`, lesson: ls.id, item: i, tool: s.tool || ls.tool || idea0.tool, q: (s.ask || s.text || s.title || '').replace(/\n/g, ' ') }); requestAnimationFrame(() => wrap.scrollIntoView({ block: 'start', behavior: 'smooth' })); }; foot.appendChild(w); }
    fb.className = 'fb'; fb.setAttribute('aria-live', 'polite'); fb.hidden = true;
    const say = (kind, head, body) => { fb.hidden = false; fb.className = 'fb ' + kind; fb.innerHTML = `<strong>${esc(head || '')}</strong>${body ? `<span>${esc(body)}</span>` : ''}`; };
    if (cur.check) {
      btn.className = 'btn'; btn.textContent = cur.label; btn.disabled = true;
      btn.onclick = () => {
        if (phase === 'retry') { phase = 'answer'; fb.hidden = true; const o = fb.nextElementSibling; if (o && o.dataset.offer) o.remove(); cur.retry && cur.retry(); btn.textContent = cur.label; env.update(); return; }
        const r = cur.check(); tries++;
        if (s.graded) { if (tries === 1) first[i] = !!r.ok; logEvent({ lesson: ls.id, idea: s._idea, item: i, correct: !!r.ok, attempt: tries, mode: m }); }
        const end = (ok) => { phase = 'done'; btn.hidden = true; wrap.classList.add('done'); finish(i, ok); };
        if (r.ok === true) { say('ok', t('correct'), r.body); end(tries === 1); }
        else if (r.ok === null) { say('info', r.title, r.body); end(true); }
        else if (m === 'test') { say('no', t('not_yet'), s.why || ''); end(false); }
        else if (tries >= 2) { say('no', t('show_worked'), s.worked || s.why || ''); end(false); }
        else {
          say('no', t('not_yet'), r.body); phase = 'retry'; btn.textContent = t('try_again'); btn.disabled = false;
          if (rf) { const o = document.createElement('div'); o.className = 'offer'; o.dataset.offer = 1; o.innerHTML = `<span class="small">${esc(t('offer_refresher', { n: rf.name }))}</span>`; const y = document.createElement('button'); y.className = 'btn ghost'; y.textContent = t('yes_reminder'); y.onclick = () => openRefresher(s.needs); o.appendChild(y); fb.after(o); }
        }
      };
      wrap.appendChild(fb); wrap.appendChild(btn);
    } else wrap.appendChild(fb);
    if (foot.childNodes.length) wrap.appendChild(foot);
    if (i in got) wrap.classList.add('seen');
    page.appendChild(wrap);
    env.update();
  });
  // end of section: what you learned, then where to go next
  const end = document.createElement('section'); end.className = 'blk endblk';
  const exLinks = m === 'learn' ? (ls.exercises || []).map((ex, k) => `<a class="item" href="#exercise/${encodeURIComponent(path)}/${k}"><div class="dot"></div><div class="grow"><div class="t">${esc(ex.book_name)}</div><div class="s">${ex.items.length} · ${t('book_exercise')}</div></div></a>`).join('') + (ls.test && ls.test.length ? `<a class="item" href="#test/${encodeURIComponent(path)}"><div class="dot"></div><div class="grow"><div class="t">${t('unit_test')}</div><div class="s">${ls.test.length} · ${t('test_note')}</div></div></a>` : '') : '';
  end.innerHTML = `<span class="eyebrow sky">${t('done')}</span><div class="score" id="score" hidden></div>
    ${m === 'learn' && ls.keywords && ls.keywords.length ? `<div class="defn"><b>${t('learned')}</b><ul class="kw">${ls.keywords.map(k => `<li><strong>${esc(k.en)}</strong>${k.am ? ` <span class="kwam" lang="am">${esc(k.am)}</span>` : ''}<br><span class="small">${esc(k.def || '')}</span></li>`).join('')}</ul></div><div class="card sky"><div class="small">${t('comes_back')}</div></div>` : ''}
    ${exLinks ? `<div class="list">${exLinks}</div>` : ''}
    ${m === 'learn' && nextSec ? `<a class="btn" href="#lesson/${encodeURIComponent(nextSec.lesson)}">${t('next_section')}: ${esc(nextSec.n)} ${esc(nextSec.title)} ›</a>` : ''}
    <a class="btn ${m === 'learn' && nextSec ? 'ghost' : ''}" href="#${back}">${m === 'learn' ? t('back_chapter') : t('back_lesson')}</a>`;
  page.appendChild(end);
  progress(); if (tasks && Object.keys(got).length >= tasks) complete();
  if (saved.y && m === 'learn') requestAnimationFrame(() => window.scrollTo(0, saved.y)); else window.scrollTo(0, 0);
  let tm = null; const onScroll = () => { if (away || !page.isConnected) return; clearTimeout(tm); tm = setTimeout(() => { if (page.isConnected && !away) persist({ y: Math.round(window.scrollY) }); }, 400); };
  window.removeEventListener('scroll', viewLesson._scroll || (() => {})); viewLesson._scroll = onScroll; window.addEventListener('scroll', onScroll, { passive: true });
}

/* =====================================================================
   Book view: a whole chapter on one colourful scrolling page.
   Built from reusable pieces so a change in one place applies everywhere:
     Fx        celebrations (confetti, floating points, vibration)
     Focus     the study timer (focus block, then a short break)
     Translate select any lesson text → translation (pluggable providers)
     Text      every piece of lesson prose goes through Text(); text features plug in here
     Blocks    one builder per block kind (read, picture, gallery, people, name, guess, quick check, …)
   ===================================================================== */
const Fx = {
  calm() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; } },
  burst(x, y, big) {
    if (Fx.calm()) return; const cols = ['var(--accent)', 'var(--sun)', 'var(--sky)', 'var(--coral)', 'var(--violet)'];
    for (let i = 0; i < (big ? 30 : 14); i++) { const d = document.createElement('i'); d.className = 'conf' + (i % 3 ? '' : ' round'); const a = Math.random() * Math.PI * 2, r = (big ? 130 : 60) + Math.random() * (big ? 120 : 50);
      d.style.cssText = `left:${x}px;top:${y}px;background:${cols[i % 5]};--dx:${Math.cos(a) * r}px;--dy:${Math.sin(a) * r - 40}px;--rot:${Math.random() * 540}deg`; document.body.appendChild(d); setTimeout(() => d.remove(), 950); }
  },
  at(el, big) { const r = el.getBoundingClientRect(); Fx.burst(r.left + r.width / 2, r.top + Math.min(r.height / 2, 40), big); },
  float(el, text) { const r = el.getBoundingClientRect(); const f = document.createElement('div'); f.className = 'ptsfloat'; f.textContent = text; f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = r.top + 'px'; document.body.appendChild(f); setTimeout(() => f.remove(), 1100); },
  buzz(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} }
};
const burst = Fx.burst, buzz = Fx.buzz; // used by the step player

/* ---------- Focus: a simple study timer (Pomodoro-style) ---------- */
const Focus = {
  get() { return store.get('focus', null); },
  start(min) { store.set('focus', { phase: 'focus', min, end: Date.now() + min * 60e3 }); Focus.tick(); },
  stop() { store.set('focus', null); Focus.tick(); },
  label() { const f = Focus.get(); if (!f) return '⏱'; const s = Math.max(0, Math.round((f.end - Date.now()) / 1000)); return `${f.phase === 'break' ? '☕' : '⏱'} ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; },
  tick() {
    const f = Focus.get(), b = $('#focus');
    if (b) { b.textContent = Focus.label(); b.classList.toggle('on', !!f); b.classList.toggle('brk', !!f && f.phase === 'break'); }
    if (f && Date.now() >= f.end) {
      if (f.phase === 'focus') { store.set('focus', { phase: 'break', min: 5, end: Date.now() + 5 * 60e3 }); Focus.onDone && Focus.onDone(f.min); }
      else { store.set('focus', null); toast(t('focus_ready')); }
    }
  },
  sheet() {
    const f = Focus.get();
    if (f) { sheet(`<div class="focussheet"><div class="big">${Focus.label()}</div><p>${f.phase === 'break' ? t('focus_break_on') : t('focus_on')}</p><button class="btn ghost" id="fstop">${t('focus_stop')}</button></div>`); $('#fstop').onclick = () => { Focus.stop(); sheet(''); }; return; }
    sheet(`<div class="focussheet"><div class="big">⏱</div><h2 class="display">${t('focus_title')}</h2><p class="muted">${t('focus_how')}</p><div class="opts row3">${[15, 20, 25].map(m => `<button class="opt center" data-m="${m}">${m} ${t('min')}</button>`).join('')}</div></div>`);
    $('#sheet').querySelectorAll('[data-m]').forEach(b => b.onclick = () => { Focus.start(+b.dataset.m); sheet(''); toast(t('focus_go')); });
  }
};
setInterval(() => Focus.tick(), 1000);

/* ---------- Translate: select text, see it in Amharic. Providers are pluggable. ---------- */
const Translate = {
  to: 'am',
  providers: [
    async (q, tl) => { const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${tl}&dt=t&q=${encodeURIComponent(q)}`); const j = await r.json(); return j[0].map(x => x[0]).join(''); },
    async (q, tl) => { const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=en|${tl}`); const j = await r.json(); if (!j.responseData || !j.responseData.translatedText) throw 0; return j.responseData.translatedText; }
  ],
  async run(q, tl) {
    const key = tl + ':' + q, cache = store.get('tr', {}); if (cache[key]) return cache[key];
    for (const p of Translate.providers) { try { const out = await p(q, tl); if (out) { const c = store.get('tr', {}); const ks = Object.keys(c); if (ks.length > 300) delete c[ks[0]]; c[key] = out; store.set('tr', c); logEvent({ translate: tl, chars: q.length }); return out; } } catch (_) {} }
    throw new Error('offline');
  },
  async show(q) {
    q = q.replace(/\s+/g, ' ').trim().slice(0, 600); if (!q) return;
    sheet(`<div class="trsheet"><div class="trq">${esc(q)}</div><div class="tra" lang="${Translate.to}"><span class="spin"></span></div><p class="small muted">${t('tr_machine')}</p><button class="btn" id="trok">${t('continue')}</button></div>`);
    $('#trok').onclick = () => sheet('');
    try { const out = await Translate.run(q, Translate.to); const a = $('.tra'); if (a) a.textContent = out; }
    catch (_) { const a = $('.tra'); if (a) { a.textContent = t('tr_fail'); a.classList.add('muted'); } }
  },
  bind(root) { // a small floating button appears when the student selects lesson text
    let pill = $('#trpill'); if (!pill) { pill = document.createElement('button'); pill.id = 'trpill'; pill.className = 'trpill'; pill.hidden = true; document.body.appendChild(pill); }
    pill.textContent = '🌐 ' + t('tr_btn');
    pill.onpointerdown = e => e.preventDefault();
    pill.onclick = () => { const q = String(getSelection()); pill.hidden = true; Translate.show(q); };
    const upd = () => { const s = getSelection(); if (!root.isConnected || !s || s.isCollapsed || !String(s).trim()) { pill.hidden = true; return; } const n = s.anchorNode && (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement); if (!n || !n.closest('[data-text]') || !root.contains(n)) { pill.hidden = true; return; } const r = s.getRangeAt(0).getBoundingClientRect(); pill.hidden = false; const w = pill.offsetWidth || 150; pill.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px'; pill.style.top = Math.min(innerHeight - 64, r.bottom + 12) + 'px'; };
    document.removeEventListener('selectionchange', Translate._u || (() => {})); Translate._u = upd; document.addEventListener('selectionchange', upd);
  }
};

/* ---------- Text: every piece of lesson prose goes through here ---------- */
function Text(str, ctx, tag = 'p', cls = '') {
  let html = esc(str);
  if (ctx && ctx.kws) ctx.kws.forEach((k, j) => { if (ctx.used.has(j) || !k.en) return; const e = esc(k.en).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); const re = new RegExp(`(^|[^\\p{L}])(${e})(?![\\p{L}])`, 'iu'); const parts = html.split(/(<button[^>]*>[^<]*<\/button>)/); for (let q = 0; q < parts.length; q += 2) if (re.test(parts[q])) { parts[q] = parts[q].replace(re, `$1<button class="kwt" data-k="${j}">$2</button>`); ctx.used.add(j); break; } html = parts.join(''); });
  return `<${tag} class="${cls}" data-text>${html}</${tag}>`;
}
const pic = (id, label) => (window.PICS && window.PICS[id]) || `<svg viewBox="0 0 120 120" role="img" aria-label="${esc(label || id)}"><rect x="10" y="10" width="100" height="100" rx="20" style="fill:var(--surface-2)"/><text x="60" y="68" text-anchor="middle" font-size="14" style="fill:var(--muted)">${esc(label || id)}</text></svg>`;
const initials = n => n.replace(/^(Prof\.|Dr\.|Engineer)\s+/i, '').split(/\s+/).map(w => w[0]).slice(0, 2).join('');

/* ---------- Blocks: one builder per kind ---------- */
const Blocks = {
  read(s, ctx) { return h('rd', (s.title ? `<h3>${esc(s.title)}</h3>` : '') + (s.paras || []).map(p => Text(p, ctx)).join('') + (s.table ? `<div class="tbl"><table>${s.table.map((r, i) => `<tr>${r.map(x => i ? `<td data-text>${esc(x)}</td>` : `<th>${esc(x)}</th>`).join('')}</tr>`).join('')}</table></div>` : '') + (s.note ? Blocks.tip(s.note) : '')); },
  tip(note) { return `<button class="tip"><span>💡</span><span class="tx" data-text>${esc(note)}</span></button>`; },
  picture(s, ctx) { return h('picblk', `<div class="pic">${pic(s.pic, s.caption)}</div>${s.caption ? Text(s.caption, null, 'p', 'cap') : ''}${s.text ? Text(s.text, ctx) : ''}`); },
  gallery(s, ctx) {
    const el = h('gal', (s.title ? `<h3>${esc(s.title)}</h3>` : '') + (s.ask ? Text(s.ask, ctx, 'p', 'muted') : '') + `<div class="galgrid">${s.items.map((it, i) => `<button class="gi" data-i="${i}" aria-expanded="false"><span class="pic">${pic(it[0], it[1])}</span><span class="gn">${esc(it[1])}</span></button>`).join('')}</div><div class="ginfo" hidden data-text></div>`);
    const info = el.querySelector('.ginfo');
    el.querySelector('.galgrid').onclick = e => { const b = e.target.closest('.gi'); if (!b) return; const it = s.items[+b.dataset.i]; const on = b.getAttribute('aria-expanded') !== 'true'; el.querySelectorAll('.gi').forEach(x => x.setAttribute('aria-expanded', x === b && on)); info.hidden = !on; info.innerHTML = on ? `<b>${esc(it[1])}</b> ${esc(it[2] || '')}` : ''; };
    return el;
  },
  people(s, ctx) {
    return h('ppl', (s.title ? `<h3>${esc(s.title)}</h3>` : '') + `<div class="pplgrid">${s.people.map(p => `<div class="person"><div class="face">${p.img ? `<img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${esc(initials(p.name))}'}))">` : `<span>${esc(initials(p.name))}</span>`}</div><div class="pinfo"><b>${esc(p.name)}</b>${p.years || p.from ? `<small>${esc([p.years, p.from].filter(Boolean).join(' · '))}</small>` : ''}${Text(p.did, ctx)}</div></div>`).join('')}</div>`);
  },
  name(s, ctx) { return h('keys', s.defs.map(d => { const k = ctx.kws.find(x => x.en.toLowerCase() === d[0].toLowerCase()); return `<div class="kcard"><div class="kt">📘 ${esc(d[0])}${k && k.am ? ` <span class="kam" lang="am">${esc(k.am)}</span>` : ''}</div>${Text(d[1], null, 'div', 'kd')}</div>`; }).join('')); },
  guess(s, ctx) {
    const el = h('quiz think', `<div class="ql">🤔 ${t('step_hook')}</div>${Text(s.ask || s.text || '', null, 'p', 'qq')}${s.ask && s.text ? Text(s.text, null, 'p', 'small qctx') : ''}<div class="qo">${s.opts.map(o => `<button class="qb">${esc(o)}</button>`).join('')}</div><p class="qf" hidden data-text></p>`);
    el.querySelector('.qo').onclick = e => { const b = e.target.closest('.qb'); if (!b || el.dataset.done) return; el.dataset.done = 1; b.classList.add('pick', 'pop'); el.querySelectorAll('.qb').forEach(x => x.disabled = true); const f = el.querySelector('.qf'); f.hidden = !s.after; f.textContent = s.after || ''; ctx.seen(el); };
    return el;
  },
  choice(s, ctx) { // mcq / tf quick check: tap an answer and it is checked at once
    const opts = s.kind === 'tf' ? [t('true'), t('false')] : s.opts, ans = s.kind === 'tf' ? (s.a ? t('true') : t('false')) : s.ans; let tries = 0;
    const el = h('quiz', `<div class="ql">✏️ ${t('quick_check')}</div>${Text(s.kind === 'tf' ? s.text : (s.ask || s.text || s.title || ''), null, 'p', 'qq')}${s.kind !== 'tf' && s.ask && s.text ? Text(s.text, null, 'p', 'small qctx') : ''}<div class="qo ${s.kind === 'tf' ? 'two' : ''}">${opts.map(o => `<button class="qb">${esc(o)}</button>`).join('')}</div><p class="qf" hidden data-text></p>`);
    const f = el.querySelector('.qf'), say = (cls, txt) => { f.hidden = !txt; f.className = 'qf ' + cls; f.textContent = txt || ''; };
    const lock = () => el.querySelectorAll('.qb').forEach(x => { x.disabled = true; if (x.textContent === ans) x.classList.add('ok'); });
    ctx.question(el, s, { restore(v) { if (v === 's') return; lock(); say('ok', s.why); } });
    el.querySelector('.qo').onclick = e => { const b = e.target.closest('.qb'); if (!b || b.disabled || el.classList.contains('done')) return; tries++;
      const ok = b.textContent === ans; ctx.log(s, ok, tries);
      if (ok) { b.classList.add('ok', 'pop'); say('ok', s.why); lock(); ctx.right(b, s, tries); }
      else { b.classList.add('no', 'shake'); b.disabled = true; setTimeout(() => b.classList.remove('shake'), 500); ctx.wrong();
        if (tries >= 2) { say('no', `${t('answer_is')} ${ans}. ${s.worked || s.why || ''}`); lock(); ctx.done(el, s, 0); } else say('no', `${s.clue || t('not_yet')} ${t('try_again')}.`); } };
    return el;
  },
  answer(s, ctx) { // blank, pick, sort, order, match: shared renderers plus one Check button
    let phase = 'answer', tries = 0, cur = null; const btn = document.createElement('button'); btn.className = 'btn small'; btn.textContent = t('check'); const f = document.createElement('p'); f.className = 'qf'; f.hidden = true;
    const env = { phase: () => phase, state: {}, explain: null, enter: () => { if (!btn.disabled) btn.click(); }, update() { if (cur) btn.disabled = phase !== 'answer' || !cur.ready(); } };
    const RR = makeR(env).R; cur = (RR[s.kind] || RR.name)(Object.assign({}, s, { title: '', step: '' }));
    const el = h('quiz', `<div class="ql">✏️ ${t('quick_check')}</div>${s.title ? Text(s.title, null, 'p', 'qq') : ''}`); el.append(cur.el, f, btn); env.update();
    const say = (cls, txt) => { f.hidden = !txt; f.className = 'qf ' + cls; f.textContent = txt || ''; };
    ctx.question(el, s, { restore(v) { if (v === 's') return; btn.hidden = true; say('ok', '✓ ' + (s.why || '')); } });
    btn.onclick = () => { const r = cur.check(); tries++; ctx.log(s, !!r.ok, tries);
      if (r.ok) { phase = 'done'; btn.hidden = true; say('ok', r.body); ctx.right(btn, s, tries); }
      else { ctx.wrong(); if (tries >= 2) { const shown = s.kind === 'blank' ? s.a[0] : s.kind === 'pick' ? s.a.join(', ') : ''; phase = 'done'; btn.hidden = true; say('no', `${shown ? t('answer_is') + ' ' + shown + '. ' : ''}${s.worked || s.why || ''}`); ctx.done(el, s, 0); } else { say('no', `${r.body || t('not_yet')} ${t('try_again')}.`); cur.retry && cur.retry(); env.update(); } } };
    return el;
  },
  explore(s, ctx) { // ungraded sort / tap / steps / tiles
    const env = { phase: () => 'answer', state: {}, explain: null, enter() {}, update() {} };
    const RR = makeR(env).R, cur = (RR[s.kind] || RR.name)(Object.assign({}, s, { title: '', step: '' }));
    const el = h(s.kind === 'steps' ? 'quiz worked' : 'quiz think', `<div class="ql">${s.kind === 'steps' ? '🧩 ' + t('worked_example') : '🔍 ' + t('step_explore')}</div>${s.title ? Text(s.title, null, 'p', 'qq') : ''}`); el.appendChild(cur.el); return el;
  }
};
function h(cls, html) { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; return d; }
function renderBlock(s, ctx) {
  const fn = Blocks[s.kind] || ((s.kind === 'mcq' || s.kind === 'tf') && s.graded ? Blocks.choice : s.graded ? Blocks.answer : Blocks.explore);
  const el = fn(s, ctx); el.dataset.kind = s.kind; return el;
}

async function loadPictures() { if (window.PICS) return; await new Promise(r => { const sc = document.createElement('script'); sc.src = 'pictures.js'; sc.onload = sc.onerror = r; document.head.appendChild(sc); }); }

async function viewBook(id) {
  const idx = await loadIndex(); const c = idx.chapters.find(x => x.id === id); if (!c) { location.hash = 'home'; return; }
  const secs = c.sections.filter(x => x.lesson);
  const [lessons] = await Promise.all([Promise.all(secs.map(x => loadLesson(x.lesson))), loadPictures()]);
  setNav(false); hideTray(); markStudied();
  const all = store.get('bk', {}), B = all[id] = Object.assign({ got: {}, seen: {}, pts: 0, prac: {} }, all[id]); B.seen = B.seen || {};
  const save = () => { const a = store.get('bk', {}); a[id] = B; store.set('bk', a); };
  store.set('last', { route: 'book/' + id, title: `${t('unit')} ${c.unit} · ${L(c.title)}`, sub: `${L(idx.subjects[c.subject])} · ${t('grade')} ${c.grade}` });
  let streak = 0, away = false; const units = [], secUnits = secs.map(() => []);
  const hues = ['g', 's', 'y', 'c', 'v'], topOf = n => n.split('.').slice(0, 2).join('.'), tops = [...new Set(secs.map(x => topOf(x.n)))], hueOf = n => hues[tops.indexOf(topOf(n)) % 5];
  setTop(`<a class="iconbtn" href="#home" aria-label="back">${svgIcon(BACK)}</a><div class="prog"><div class="bar"><i id="pbar"></i></div><span id="ppct">0%</span></div><button class="focus" id="focus" aria-label="${t('focus_title')}">⏱</button><span class="pts" id="pts" aria-live="polite">⭐ <b>${B.pts}</b></span>`);
  $('#focus').onclick = () => Focus.sheet(); Focus.tick();
  Focus.onDone = min => { const pts = 15; B.pts += pts; save(); bumpPts(); sheet(`<div class="focussheet"><div class="big">🎉</div><h2 class="display">${t('focus_done', { m: min })}</h2><p>${t('focus_break')}</p><p class="pts">⭐ +${pts}</p><button class="btn" id="fok">${t('continue')}</button></div>`); $('#fok').onclick = () => sheet(''); Fx.burst(innerWidth / 2, innerHeight / 2, true); buzz([30, 60, 30]); };
  const page = document.createElement('div'); page.className = 'book';
  page.innerHTML = `<header class="hero h-${hueOf(secs[0].n)}"><div class="heroart" aria-hidden="true">${pic(c.subject === 'science' ? 'chemistry' : 'observe')}</div>
    <span class="eyebrow">${t('grade')} ${c.grade} · ${esc(L(idx.subjects[c.subject]))}</span><h1 class="display">${t('unit')} ${c.unit}<br>${esc(L(c.title))}</h1><p>${t('book_intro', { n: secs.length })}</p></header>
    <nav class="secnav" id="secnav">${secs.map((x, i) => `<a class="chip h-${hueOf(x.n)}" href="#book/${id}" data-go="${i}"><i></i><span>${esc(x.n)}</span></a>`).join('')}</nav>`;
  app.replaceChildren(page);
  function bumpPts() { const p = $('#pts'); if (!p) return; p.innerHTML = `⭐ <b>${B.pts}</b>`; p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); }
  function progress() {
    const done = u => u.q ? (u.key in B.got) : !!B.seen[u.key];
    const d = units.filter(done).length, pct = units.length ? Math.round(d / units.length * 100) : 0;
    $('#pbar').style.width = pct + '%'; $('#ppct').textContent = pct + '%';
    page.querySelectorAll('#secnav .chip').forEach((ch, i) => { const u = secUnits[i], p = u.length ? Math.round(u.filter(done).length / u.length * 100) : 0; ch.style.setProperty('--p', p + '%'); ch.classList.toggle('full', p === 100); });
  }

  secs.forEach((sec, si) => {
    const ls = lessons[si], kws = ls.keywords || [], hue = hueOf(sec.n);
    const box = document.createElement('section'); box.className = `sec h-${hue}`; box.id = 'sec' + si; box.dataset.i = si;
    box.innerHTML = `<h2 class="sechead"><span class="num">${esc(sec.n)}</span><span>${esc(ls.title)}</span></h2>`;
    const inline = [], practise = [];
    ls.ideas.forEach((idea, ii) => idea.screens.forEach((s, k) => { const sx = Object.assign({ _idea: idea.id, _key: `${sec.lesson}#${ii}.${k}` }, s); (s.graded && s.step !== 'check' && s.step !== 'notice' ? practise : inline).push(sx); }));
    const seenIdea = new Set(); const rows = inline.filter(s => { if (!s.graded) return true; if (seenIdea.has(s._idea)) { practise.unshift(s); return false; } seenIdea.add(s._idea); return true; });
    const qKeys = rows.filter(s => s.graded).map(s => s._key);
    const doneCheck = () => { const ban = box.querySelector('.secdone'); if (!ban || !qKeys.every(k => k in B.got) || box.classList.contains('complete')) return; box.classList.add('complete'); ban.hidden = false;
      if (!B.got['done:' + sec.lesson]) { B.got['done:' + sec.lesson] = 1; setLessonProgress(sec.lesson, { done: true }); const by = {}; qKeys.forEach(k => { const s = rows.find(r => r._key === k); by[s._idea] = (by[s._idea] !== false) && B.got[k] >= 10; }); Object.keys(by).forEach(i => bumpMastery(i, by[i])); B.pts += 20; save(); bumpPts(); Fx.at(ban, true); buzz([20, 40, 20]); } };
    const ctx = { kws, used: new Set(), hue,
      seen(el) {}, log(s, ok, attempt) { logEvent({ lesson: ls.id, idea: s._idea, item: s._key, correct: ok, attempt, mode: 'book' }); },
      question(el, s, api) { // shared behaviour for every question: skip, restore, finishing
        const sk = document.createElement('button'); sk.className = 'skip'; sk.textContent = t('skip') + ' ›'; el.appendChild(sk);
        sk.onclick = () => { if (s._key in B.got) return; B.got[s._key] = 's'; save(); sk.hidden = true; el.classList.add('skipped'); el.querySelector('.qf') && (el.querySelector('.qf').hidden = true); const n = document.createElement('p'); n.className = 'skipnote'; n.textContent = '↷ ' + t('skipped_note'); el.appendChild(n); if (!practise.includes(s)) practise.unshift(s); updPrac(); streak = 0; progress(); doneCheck(); };
        if (s._key in B.got) { const v = B.got[s._key]; sk.hidden = true; if (v === 's') { el.classList.add('skipped'); const n = document.createElement('p'); n.className = 'skipnote'; n.textContent = '↷ ' + t('skipped_note'); el.appendChild(n); if (!practise.includes(s)) practise.unshift(s); } else { el.classList.add('done'); api.restore(v); } }
      },
      right(target, s, tries) { const pts = tries === 1 ? 10 : 5; streak++; Fx.at(target); Fx.float(target, '+' + pts); buzz(25); B.pts += pts; bumpPts(); if (streak >= 3) Fx.float($('#pts'), `🔥 ${t('in_a_row', { n: streak })}`); ctx.done(target.closest('.quiz'), s, pts); },
      wrong() { streak = 0; buzz(60); },
      done(el, s, pts) { el.classList.add('done'); const sk = el.querySelector('.skip'); if (sk) sk.remove(); if (!(s._key in B.got) || B.got[s._key] === 's') { B.got[s._key] = pts; save(); } progress(); doneCheck(); }
    };
    rows.forEach(s => { const el = renderBlock(s, ctx); const u = { key: s._key, q: !!s.graded }; units.push(u); secUnits[si].push(u); if (!u.q) el.dataset.unit = s._key; box.appendChild(el); });
    box.querySelectorAll('.tip').forEach(b => b.onclick = () => b.classList.toggle('open'));
    box.querySelectorAll('.kwt').forEach(b => b.onclick = () => { const k = kws[+b.dataset.k]; sheet(`<div class="kcard big"><div class="kt">📘 ${esc(k.en)}</div>${k.am ? `<div class="kam" lang="am">${esc(k.am)}</div>` : ''}${k.om ? `<div class="kam" lang="om">${esc(k.om)}</div>` : ''}<div class="kd" data-text>${esc(k.def || '')}</div></div><button class="btn" id="kok">${t('continue')}</button>`); $('#kok').onclick = () => sheet(''); });
    // end of section: celebration, practise set, book exercises
    const end = document.createElement('div'); end.className = 'secend';
    end.innerHTML = `<div class="secdone" hidden>🎉 ${t('section_done', { s: esc(sec.n) })} <b>+20 ⭐</b></div><div class="prac"></div>${(ls.exercises || []).map((ex, k) => `<button class="pcard soft" data-a="ex" data-k="${k}"><span class="pi">📖</span><span class="grow"><b>${esc(ex.book_name)}</b><small>${t('book_exercise')} · ${ex.items.length}</small></span><span>›</span></button>`).join('')}`;
    function updPrac() { const pr = B.prac[sec.lesson]; end.querySelector('.prac').innerHTML = practise.length ? `<button class="pcard" data-a="prac"><span class="pi">🎯</span><span class="grow"><b>${t('practise_n', { n: practise.length })}</b><small>${pr ? `${t('best')} ${pr}` : t('practise_sub')}</small></span><span>›</span></button>` : ''; }
    updPrac();
    const runHere = cfg => { const keep = { app: [...app.childNodes], top: [...topin.childNodes], y: window.scrollY }; away = true;
      runPlayer(Object.assign({ backRoute: null, refreshers: ls.refreshers || {}, tool: ls.tool, cheer: true, resume: () => { app.replaceChildren(...keep.app); topin.replaceChildren(...keep.top); top.hidden = false; hideTray(); setNav(false); away = false; bumpPts(); Focus.tick(); requestAnimationFrame(() => window.scrollTo(0, keep.y)); } }, cfg)); };
    end.addEventListener('click', e => { const b = e.target.closest('.pcard'); if (!b) return;
      if (b.dataset.a === 'prac') runHere({ id: ls.id, title: `${sec.n} · ${ls.title}`, mode: 'practice', screens: practise, onDone: res => { const right = Object.values(res.firstTry).filter(Boolean).length; B.prac[sec.lesson] = `${right}/${practise.length}`; B.pts += right * 5; practise.forEach((s, i) => { if (B.got[s._key] === 's' && res.firstTry[i]) B.got[s._key] = 5; }); save(); Object.keys(res.byIdea).forEach(i => bumpMastery(i, res.byIdea[i])); updPrac(); } });
      else { const ex = ls.exercises[+b.dataset.k]; runHere({ id: ls.id, title: ex.book_name, mode: 'book', screens: ex.items }); } });
    box.appendChild(end); page.appendChild(box); doneCheck();
  });
  const fin = document.createElement('div'); fin.className = 'bookend'; fin.innerHTML = `<div class="display">⭐ ${t('book_points')}</div><a class="btn ghost" href="#exams">${t('exams')} ›</a>`; page.appendChild(fin);
  page.querySelectorAll('.tip').forEach(b => b.onclick = () => b.classList.toggle('open'));
  progress(); Translate.bind(page);
  page.querySelector('#secnav').addEventListener('click', e => { const a = e.target.closest('[data-go]'); if (!a) return; e.preventDefault(); $('#sec' + a.dataset.go).scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  try {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { page.querySelectorAll('#secnav .chip').forEach(ch => ch.classList.toggle('on', ch.dataset.go === en.target.dataset.i)); const on = page.querySelector('#secnav .chip.on'); if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' }); } }), { rootMargin: '-45% 0px -50% 0px' });
    page.querySelectorAll('.sec').forEach(s => io.observe(s));
    const seenIO = new IntersectionObserver(es => { let ch = false; es.forEach(en => { if (en.isIntersecting && !B.seen[en.target.dataset.unit]) { B.seen[en.target.dataset.unit] = 1; ch = true; seenIO.unobserve(en.target); } }); if (ch && !away) { save(); progress(); } }, { rootMargin: '0px 0px -35% 0px' });
    page.querySelectorAll('[data-unit]').forEach(el => { if (!B.seen[el.dataset.unit]) seenIO.observe(el); });
  } catch (_) {}
  if (B.y) requestAnimationFrame(() => window.scrollTo(0, B.y)); else window.scrollTo(0, 0);
  let tm; const onScroll = () => { if (away || !page.isConnected) return; clearTimeout(tm); tm = setTimeout(() => { if (page.isConnected && !away) { B.y = Math.round(window.scrollY); save(); } }, 400); };
  window.removeEventListener('scroll', viewBook._s || (() => {})); viewBook._s = onScroll; window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---------- router ---------- */
async function route() {
  sheet(''); closePanel();
  const h = location.hash.replace(/^#/, ''), [r, a, b] = h.split('/');
  if (!S.lang && r !== 'welcome') { await viewWelcome(); return; }
  if (!T.app) await loadLang(S.lang);
  if (S.lang && !S.grade && !['setup', 'welcome', 'settings'].includes(r) && r) { location.hash = 'setup'; return; }
  switch (r) {
    case '': case 'welcome': return S.lang && S.grade && r === '' ? viewHome() : viewWelcome();
    case 'setup': return viewSetup();
    case 'home': return viewHome();
    case 'chapter': return viewChapter(a);
    case 'book': return viewBook(a);
    case 'lesson': return viewLesson(decodeURIComponent(a), 'learn');
    case 'exercise': return viewLesson(decodeURIComponent(a), 'book', +b || 0);
    case 'test': return viewLesson(decodeURIComponent(a), 'test');
    case 'review': return viewReview();
    case 'exams': return viewExams();
    case 'settings': return viewSettings();
    default: return viewHome();
  }
}
window.addEventListener('hashchange', route);
window.addEventListener('online', () => {}); window.addEventListener('offline', () => toast(t('offline')));
if ('serviceWorker' in navigator) { try { const had = !!navigator.serviceWorker.controller; navigator.serviceWorker.register('sw.js').then(r => r.update()).catch(() => {}); let once = false; navigator.serviceWorker.addEventListener('controllerchange', () => { if (had && !once) { once = true; location.reload(); } }); } catch (_) {} }
route();
})();
