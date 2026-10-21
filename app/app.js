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
function chapterProgress(id) { return store.get('progress', {})[id] || null; }
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
  const chapterCard = c => { const p = chapterProgress(c.id), sub = idx.subjects[c.subject] || {}; return `<a class="item" href="#chapter/${c.id}"><div class="icon" style="background:var(--accent-soft);color:var(--accent-deep)">${sub.icon || '•'}</div><div class="grow"><div class="t">${esc(L(sub))} · ${t('grade')} ${c.grade}</div><div class="s">${t('unit')} ${c.unit} · ${esc(L(c.title))}${p ? ` · ${t('lessons_read', { d: p.done, t: p.total })}` : ''}</div></div>${c.free ? `<span class="pill green">${t('free_chapter')}</span>` : ''}</a>`; };
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
  setNav(true); hideTray();
  setTop(`<a class="iconbtn" href="#home" aria-label="back">${svgIcon(BACK)}</a><div class="grow"><div class="eyebrow">${t('grade')} ${c.grade} · ${esc(L(idx.subjects[c.subject]))}</div><div class="display" style="font-size:18px">${t('unit')} ${c.unit} · ${esc(L(c.title))}</div></div>`);
  const p = chapterProgress(c.id);
  const rows = c.sections.map(s => {
    if (s.lesson) { const lp = lessonProgress(s.lesson); return `<a class="item ${lp && !lp.done ? 'current' : ''}" href="#lesson/${encodeURIComponent(s.lesson)}"><div class="dot ${lp && lp.done ? 'done' : lp ? 'now' : ''}">${lp && lp.done ? '✓' : ''}</div><div class="grow"><div class="t">${esc(s.n)} ${esc(s.title)}</div><div class="s">${t('interactive')} · ${s.minutes || 8} ${t('min')}${lp && lp.best != null ? ` · ${lp.best}` : ''}</div></div>${s.new ? `<span class="pill sky">${t('new')}</span>` : ''}</a>`; }
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


/* ---------- Work-it-out tools (scratch, calculator, idea explorer) ---------- */
const TOOLS = {
  scratch(key) {
    const el = document.createElement('div'); el.className = 'stack';
    el.innerHTML = `<canvas id="pad" width="640" height="440" style="width:100%;height:auto;background:var(--surface);border:2px solid var(--line);border-radius:14px;touch-action:none"></canvas><div class="row"><button class="opt center grow" id="pen" aria-pressed="true">✎</button><button class="opt center grow" id="eraser" aria-pressed="false">◻</button><button class="opt center grow" id="clear">✕</button></div>`;
    const c = el.querySelector('#pad'), ctx = c.getContext('2d'); let draw = false, erase = false, last = null;
    const saved = store.get('scratch', {})[key]; if (saved) { const im = new Image(); im.onload = () => ctx.drawImage(im, 0, 0); im.src = saved; }
    const pos = e => { const r = c.getBoundingClientRect(), t = e.touches ? e.touches[0] : e; return [(t.clientX - r.left) * c.width / r.width, (t.clientY - r.top) * c.height / r.height]; };
    const start = e => { draw = true; last = pos(e); e.preventDefault(); };
    const move = e => { if (!draw) return; const p = pos(e); ctx.strokeStyle = erase ? '#FFFFFF' : '#142019'; ctx.lineWidth = erase ? 28 : 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); last = p; e.preventDefault(); };
    const end = () => { if (!draw) return; draw = false; try { const all = store.get('scratch', {}); all[key] = c.toDataURL('image/png'); store.set('scratch', all); } catch (_) {} };
    c.addEventListener('pointerdown', start); c.addEventListener('pointermove', move); window.addEventListener('pointerup', end);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, c.width, c.height);
    el.querySelector('#pen').onclick = () => { erase = false; el.querySelector('#pen').setAttribute('aria-pressed', 'true'); el.querySelector('#eraser').setAttribute('aria-pressed', 'false'); };
    el.querySelector('#eraser').onclick = () => { erase = true; el.querySelector('#pen').setAttribute('aria-pressed', 'false'); el.querySelector('#eraser').setAttribute('aria-pressed', 'true'); };
    el.querySelector('#clear').onclick = () => { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, c.width, c.height); end(); };
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
  sheet(`<div style="width:40px;height:5px;border-radius:99px;background:var(--line);justify-self:center"></div><div class="row"><h2 class="display grow">${t('work_it_out')}</h2><button class="iconbtn" id="wclose" aria-label="${t('cancel')}">${svgIcon(CLOSE)}</button></div><div class="opts row3" id="wtabs">${tabs.map(([k, ic], i) => `<button class="opt center" data-tab="${k}" aria-pressed="${i === 0}">${ic} ${t('tool_' + k)}</button>`).join('')}</div><div id="wbody"></div><p class="small muted">${t('work_note')}</p>`);
  const body = $('#wbody'); const open = k => { body.replaceChildren(TOOLS[k](ctx.key)); $('#wtabs').querySelectorAll('.opt').forEach(b => b.setAttribute('aria-pressed', b.dataset.tab === k)); logEvent({ lesson: ctx.lesson, item: ctx.item, tool: k }); };
  $('#wtabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) open(b.dataset.tab); });
  $('#wclose').onclick = () => sheet(''); open(tabs[0][0]);
}

/* ---------- lesson player ---------- */
const factors = n => { const f = []; for (let d = 1; d <= n; d++) if (n % d === 0) f.push(d); return f; };
const primes = n => { const r = []; let d = 2; while (n > 1) { if (n % d === 0) { r.push(d); n /= d; } else d++; } return r; };
const norm = s => String(s).toLowerCase().replace(/[^\p{L}\p{N}.\s/-]/gu, '').replace(/\s+/g, ' ').trim();
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

function runPlayer(cfg) {
  setNav(false); tray.hidden = false;
  const screens = cfg.screens, SUM = screens.length;
  let order = screens.map((_, i) => i), pos = 0, cur = null, phase = 'answer', lastOk = null, review = false, firstTry = {}, missed = new Set(), round = {}, tries = {};
  const state = { guess: null }; const offered = {};
  function openRefresher(id) { const rf = cfg.refreshers[id]; logEvent({ lesson: cfg.id, refresher: id, item: order[pos] }); const saved = { app: [...app.childNodes], tray: tray.className, msg: msg.innerHTML, goText: go.textContent, goDis: go.disabled, phase, lastOk, cur, top: topin.innerHTML, work: $('#work').hidden };
    const extra = tray.querySelector('#rfb'); if (extra) extra.remove();
    runPlayer({ id: cfg.id + ':' + id, idea: id, title: rf.name, mode: 'refresher', screens: rf.screens, backRoute: null, resume: () => { app.replaceChildren(...saved.app); tray.className = saved.tray; msg.innerHTML = saved.msg; go.textContent = saved.goText; go.disabled = saved.goDis; phase = saved.phase; lastOk = saved.lastOk; cur = saved.cur; topin.innerHTML = saved.top; $('#work').hidden = saved.work; bindTop(order[pos]); go.onclick = onGo; window.scrollTo(0, 0); } }); }
  const div = html => { const d = document.createElement('div'); d.className = 'stack'; d.innerHTML = html; return d; };
  const head = s => `<span class="eyebrow sky">${esc(s._from || s.step || '')}</span>${s.title ? `<h1 class="display" tabindex="-1">${esc(s.title)}</h1>` : ''}${s.text ? `<p class="lead">${esc(s.text)}</p>` : ''}`;
  const choice = (s, opts, ans, row2) => {
    const el = div(head(s) + (s.ask ? `<p class="ask">${esc(s.ask)}</p>` : '') + `<div class="opts${row2 ? ' row2' : ''}" role="radiogroup">${opts.map(o => `<button class="opt" role="radio" aria-checked="false">${esc(o)}</button>`).join('')}</div>`);
    let pick = null;
    el.querySelector('.opts').addEventListener('click', e => { const b = e.target.closest('.opt'); if (!b || b.disabled || phase !== 'answer') return; pick = b; el.querySelectorAll('.opt').forEach(x => x.setAttribute('aria-checked', x === b)); update(); });
    return { el, label: t('check'), ready: () => !!pick, check() { const ok = pick.textContent === ans; pick.classList.add(ok ? 'ok' : 'no'); if (ok) el.querySelectorAll('.opt').forEach(x => x.disabled = true); else pick.disabled = true; return ok ? { ok: true, body: s.why } : { ok: false, body: s.clue }; }, retry() { pick = null; el.querySelectorAll('.opt').forEach(x => x.setAttribute('aria-checked', 'false')); } };
  };
  const R = {
    guess(s) { const f = s.figure || {}; const el = div(head(s) + (f.type === 'board' ? `<div class="fig">${boardSVG(f.w, f.h, 0)}</div>` : '') + `<p class="ask">${esc(s.ask || '')}</p><div class="opts row2" role="radiogroup">${s.opts.map(o => `<button class="opt center" role="radio" aria-checked="false">${esc(o)}</button>`).join('')}</div><p class="small muted">${t('guess_note')}</p>`);
      let pick = null; el.querySelector('.opts').addEventListener('click', e => { const b = e.target.closest('.opt'); if (!b || phase !== 'answer') return; pick = b; el.querySelectorAll('.opt').forEach(x => x.setAttribute('aria-checked', x === b)); update(); });
      return { el, label: t('lock_guess'), ready: () => !!pick, check() { state.guess = pick.textContent; el.querySelectorAll('.opt').forEach(x => x.disabled = true); return { ok: null, title: t('your_guess', { g: state.guess }), body: s.after }; } }; },
    tiles(s) { const f = s.figure || { w: 50, h: 20 }; const el = div(head(s) + `<div class="fig"><div class="board">${boardSVG(f.w, f.h, 0)}</div><div class="sizes" role="group">${s.sizes.map(z => `<button class="size" aria-pressed="false" data-s="${z}">${z} cm</button>`).join('')}</div><div class="result" aria-live="polite"><strong>${t('pick_size')}</strong>${t('try_more', { n: s.need })}</div></div>`);
      const tried = new Set(), res = el.querySelector('.result');
      el.querySelector('.sizes').addEventListener('click', e => { const b = e.target.closest('.size'); if (!b) return; const z = +b.dataset.s, fit = f.w % z === 0 && f.h % z === 0; tried.add(z); b.classList.add(fit ? 'fit' : 'gap'); el.querySelectorAll('.size').forEach(x => x.setAttribute('aria-pressed', x === b)); el.querySelector('.board').innerHTML = boardSVG(f.w, f.h, z); const left = Math.max(0, s.need - tried.size); res.innerHTML = (fit ? `<strong>${t('fits', { s: z, x: f.w / z, y: f.h / z, n: (f.w / z) * (f.h / z) })}</strong>${t('fits_why', { s: z, a: f.w, b: f.h })}` : `<strong>${t('gap', { s: z })}</strong>${t('gap_why', { s: z, n: f.w % z ? f.w : f.h })}`) + (left ? ' ' + t('try_more', { n: left }) : ''); update(); });
      return { el, label: t('continue'), ready: () => tried.size >= s.need }; },
    mcq(s) { return choice(s, s.opts, s.ans, false); },
    tf(s) { return choice(s, [t('true'), t('false')], s.a ? t('true') : t('false'), true); },
    name(s) { const f = s.figure || {}; let html = head(s);
      if (f.type === 'factors') { const fa = factors(f.a), fb = factors(f.b), common = fa.filter(x => fb.includes(x)), g = Math.max(...common); const row = (n, L) => `<div class="frow"><span>${t('factors_of', { n })}</span><div class="chips">${L.map(x => `<span class="chip" data-v="${x}">${x}</span>`).join('')}</div></div>`; html += `<div class="fig">${row(f.a, fa)}${row(f.b, fb)}<button class="inner" id="rv">${t('show_shared')}</button></div><div id="after" hidden></div>`;
        const el = div(html); let shown = false;
        el.querySelector('#rv').addEventListener('click', e => { shown = true; e.currentTarget.disabled = true; el.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', common.includes(+c.dataset.v))); const a = el.querySelector('#after'); a.innerHTML = `<div class="stack"><p class="ask">${t('shared', { list: common.join(', '), g })}</p>${s.defs.map(d => `<div class="defn"><b>${esc(d[0])}</b><span>${esc(d[1])}</span></div>`).join('')}${s.ask ? `<p>${t('biggest_square', { a: s.ask })} ${state.guess ? (state.guess === s.ask ? t('spot_on', { g: state.guess }) : t('not_quite_guess', { g: state.guess, a: s.ask })) : ''}</p>` : ''}${explainCard(s)}</div>`; a.hidden = false; update(); });
        return { el, label: t('continue'), ready: () => shown }; }
      html += s.defs.map(d => `<div class="defn"><b>${esc(d[0])}</b><span>${esc(d[1])}</span></div>`).join('') + explainCard(s);
      return { el: div(html), label: t('continue'), ready: () => true }; },
    pick(s) { const ans = s.a.map(String); const el = div(head(s) + `<div class="fig"><div class="chips" role="group">${s.pool.map(x => `<button class="chip" aria-pressed="false" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>`); const on = new Set();
      el.querySelector('.chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b || phase !== 'answer') return; const v = b.dataset.v; on.has(v) ? on.delete(v) : on.add(v); b.setAttribute('aria-pressed', on.has(v)); b.classList.remove('no'); update(); });
      return { el, label: t('check'), ready: () => on.size > 0, check() { const wrong = [...on].filter(v => !ans.includes(v)), missing = ans.filter(v => !on.has(v)); el.querySelectorAll('.chip').forEach(c => c.classList.toggle('no', wrong.includes(c.dataset.v))); if (!wrong.length && !missing.length) { el.querySelectorAll('.chip').forEach(c => { if (on.has(c.dataset.v)) c.classList.add('ok'); c.disabled = true; }); return { ok: true, body: s.why }; } if (wrong.length) return { ok: false, body: s.clue || t('wrong_pick', { n: wrong[0], a: '', b: '' }) }; return { ok: false, body: t('missing_pick') }; }, retry() {} }; },
    steps(s) { const f = s.figure || {}; const el = div(head(s) + `<div class="fig">${f.type === 'venn' ? `<div id="venn">${vennSVG(f.a, f.b, 0)}</div>` : ''}<ol class="steps" aria-live="polite"></ol><button class="inner" id="nx">${t('next_step')}</button></div>`); const ol = el.querySelector('.steps'), nb = el.querySelector('#nx'); let k = 0;
      const draw = () => { ol.innerHTML = s.steps.slice(0, k + 1).map(x => `<li>${esc(x)}</li>`).join(''); if (f.type === 'venn') el.querySelector('#venn').innerHTML = vennSVG(f.a, f.b, k); nb.disabled = k >= s.steps.length - 1; update(); };
      nb.addEventListener('click', () => { k++; draw(); }); draw();
      return { el, label: t('continue'), ready: () => k >= s.steps.length - 1 }; },
    blank(s) { const [a, b] = (s.ask || '___').split('___'); const el = div(head(s) + `<div class="fig"><p class="blank"><span>${esc(a)}</span><input id="bl" autocomplete="off" aria-label="${t('your_answer')}"><span>${esc(b || '')}</span></p><p class="small muted">${t('spelling_note')}</p></div>`); const inp = el.querySelector('#bl'); inp.addEventListener('input', update); inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !go.disabled) go.click(); });
      return { el, label: t('check'), ready: () => inp.value.trim() !== '', check() { const r = matchAnswer(inp.value, s.a.map(String)); inp.className = r.ok ? 'ok' : 'no'; inp.disabled = r.ok; return r.ok ? { ok: true, body: (r.near ? t('right_idea', { a: r.near }) + ' ' : '') + (s.why || '') } : { ok: false, body: s.clue }; }, retry() { inp.className = ''; inp.focus(); } }; },
    sort(s) { const el = div(head(s) + `<div class="fig"><p class="display" id="it" style="text-align:center;font-size:22px"></p><div class="opts" id="bins">${s.bins.map(b => `<button class="opt center">${esc(b)}</button>`).join('')}</div><p class="small muted" id="fb"></p></div>`); let i = 0, wrong = 0; const draw = () => { el.querySelector('#it').textContent = i < s.items.length ? s.items[i][0] : ''; };
      el.querySelector('#bins').addEventListener('click', e => { const b = e.target.closest('.opt'); if (!b || i >= s.items.length || phase !== 'answer') return; const [name, ans, why] = s.items[i]; const ok = b.textContent === ans; if (!ok) wrong++; el.querySelector('#fb').textContent = (ok ? '✓ ' : '✗ ') + `${name} → ${ans}. ${why || ''}`; i++; draw(); if (i >= s.items.length) { el.querySelector('#bins').querySelectorAll('.opt').forEach(x => x.disabled = true); } update(); }); draw();
      return { el, label: t('check'), ready: () => i >= s.items.length, check() { return wrong ? { ok: false, body: s.clue || `${wrong} / ${s.items.length}` } : { ok: true, body: s.why || '' }; }, retry() { i = 0; wrong = 0; el.querySelector('#bins').querySelectorAll('.opt').forEach(x => x.disabled = false); draw(); } }; },
    tap(s) { const el = div(head(s) + `<div class="fig"><div class="chips">${s.items.map((it, k) => `<button class="chip" data-k="${k}" aria-pressed="false">${esc(it[0])}</button>`).join('')}</div><div class="result" id="info">${esc(s.ask || '')}</div></div>` + explainCard(s)); const seen = new Set();
      el.querySelector('.chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; const k = +b.dataset.k; seen.add(k); el.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === b)); el.querySelector('#info').innerHTML = `<strong>${esc(s.items[k][0])}</strong>${esc(s.items[k][1])}`; update(); });
      return { el, label: t('continue'), ready: () => seen.size >= Math.min(s.need || s.items.length, s.items.length) }; },
    order(s) { const mixed = s.items.slice().sort(() => Math.random() - .5); const el = div(head(s) + `<div class="fig"><div class="chips" id="pool">${mixed.map(x => `<button class="chip" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div><ol class="steps" id="seq"></ol></div>`); let seq = [];
      el.querySelector('#pool').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b || phase !== 'answer') return; seq.push(b.dataset.v); b.disabled = true; el.querySelector('#seq').innerHTML = seq.map(x => `<li>${esc(x)}</li>`).join(''); update(); });
      return { el, label: t('check'), ready: () => seq.length === s.items.length, check() { const ok = seq.every((x, i) => x === s.items[i]); return ok ? { ok: true, body: s.why } : { ok: false, body: s.clue || s.why }; }, retry() { seq = []; el.querySelector('#seq').innerHTML = ''; el.querySelectorAll('#pool .chip').forEach(x => x.disabled = false); } }; },
    match(s) { const rights = s.pairs.map(p => p[1]).sort(() => Math.random() - .5); const el = div(head(s) + `<div class="fig"><div class="stack">${s.pairs.map((p, j) => `<label class="row"><span class="grow" style="font-weight:800">${esc(p[0])}</span><select data-j="${j}" style="min-height:44px;border-radius:10px;border:2px solid var(--line);background:var(--surface);max-width:55%"><option value="">…</option>${rights.map(r => `<option>${esc(r)}</option>`).join('')}</select></label>`).join('')}</div></div>`);
      el.addEventListener('change', update);
      return { el, label: t('check'), ready: () => [...el.querySelectorAll('select')].every(x => x.value), check() { const ok = [...el.querySelectorAll('select')].every(x => x.value === s.pairs[+x.dataset.j][1]); return ok ? { ok: true, body: s.why } : { ok: false, body: s.clue || s.why }; }, retry() {} }; },
    summary() { const graded = screens.map((x, i) => x.graded ? i : -1).filter(i => i >= 0); const right = graded.filter(i => firstTry[i]).length;
      const el = div(`<span class="eyebrow sky">${t('done')}</span><h1 class="display" tabindex="-1">${esc(cfg.title)}</h1><div class="score"><span class="big">${right} / ${graded.length}</span><span>${t('first_try')}</span></div><p>${missed.size ? t('replay_note', { n: missed.size }) : t('all_done')}</p>${cfg.learned ? `<div class="defn"><b>${t('learned')}</b><ul class="steps" style="padding-left:20px">${cfg.learned.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}${cfg.mode === 'learn' ? `<div class="card sky"><div class="small">${t('comes_back')}</div></div>` : ''}${cfg.backRoute ? `<a class="btn link" href="#${cfg.backRoute}">${t('back_chapter')}</a>` : ''}`);
      return { el, label: cfg.mode === 'refresher' ? t('back_to_question') : missed.size ? t('replay_n', { n: missed.size }) : t('start_again'), ready: () => true, summary: true }; }
  };
  const explainCard = s => { const ex = cfg.explain; if (!ex) return ''; const txt = (ex[S.lang] && ex[S.lang].text) || (ex.en && ex.en.text) || ''; return txt ? `<div class="explain"><button class="play" id="ex-play" aria-label="${t('explain_me')}"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l12 7-12 7z" fill="#fff"/></svg></button><div class="grow"><div style="font-weight:800">${t('explain_me')}</div><div class="small muted" id="ex-text">${esc(txt)}</div></div></div>` : ''; };

  function setTray(kind, title, body, label) { tray.className = 'tray' + (kind ? ' ' + kind : ''); msg.innerHTML = title ? `<strong>${esc(title)}</strong>${body ? `<span>${esc(body)}</span>` : ''}` : ''; go.textContent = label; }
  function update() { if (phase === 'answer' && cur) go.disabled = !cur.ready(); }
  function bindTop(k) { const rep = $('#rep'); if (rep) rep.onclick = () => reportSheet({ lesson: cfg.id || cfg.title, screen: k, label: `${cfg.title} · ${Math.min(pos + 1, order.length)}/${order.length}` }); const rb = $('#rback'); if (rb) rb.onclick = () => cfg.resume && cfg.resume(); }
  function show() {
    const k = order[pos], s = k === SUM ? { kind: 'summary' } : screens[k];
    cur = (R[s.kind] || R.name)(s); app.replaceChildren(cur.el);
    const ex = cur.el.querySelector('#ex-play'); if (ex) ex.onclick = () => speak(cur.el.querySelector('#ex-text').textContent);
    const rf = s.needs && cfg.refreshers && cfg.refreshers[s.needs];
    if (rf) { const a = document.createElement('button'); a.className = 'btn link'; a.style.justifySelf = 'start'; a.textContent = t('need_reminder', { n: rf.name }); a.onclick = () => openRefresher(s.needs); cur.el.appendChild(a); }
    const old = tray.querySelector('#rfb'); if (old) old.remove();
    phase = 'answer'; lastOk = null; setTray('', '', '', cur.label); update();
    const wb = $('#work'); wb.hidden = !(s.graded || s.kind === 'guess' || s.kind === 'tiles'); wb.onclick = () => workSheet({ key: `${cfg.id || cfg.title}:${k}`, lesson: cfg.id, item: k, tool: s.tool || cfg.tool });
    const pct = Math.round(pos / order.length * 100);
    setTop(`${cfg.backRoute ? `<a class="iconbtn" href="#${cfg.backRoute}" aria-label="close">${svgIcon(CLOSE)}</a>` : `<button class="iconbtn" id="rback" aria-label="back">${svgIcon(BACK)}</button>`}<span class="mode ${cfg.mode === 'review' || review ? 'review' : cfg.mode === 'book' || cfg.mode === 'test' ? 'book' : ''}">${cfg.mode === 'refresher' ? t('refresher') : review ? t('review') : cfg.mode === 'review' ? t('review') : cfg.mode === 'book' ? t('book_exercise') : cfg.mode === 'test' ? t('unit_test') : t('learn')}</span><div class="bar"><i style="width:${pct}%"></i></div><span class="count">${Math.min(pos + 1, order.length)} / ${order.length}</span><button class="iconbtn" id="rep" aria-label="${t('report')}">${svgIcon(FLAG)}</button>`);
    bindTop(k);
    window.scrollTo(0, 0); const h = cur.el.querySelector('h1'); if (h) h.focus({ preventScroll: true });
  }
  function onGo() {
    const k = order[pos], s = screens[k];
    if (cur.summary) { if (cfg.mode === 'refresher') { cfg.resume(); return; } if (missed.size) { order = [...missed].sort((a, b) => a - b).concat(SUM); review = true; } else { order = screens.map((_, i) => i).concat(SUM); firstTry = {}; review = false; state.guess = null; } pos = 0; round = {}; tries = {}; show(); return; }
    if (phase === 'feedback') { if (lastOk === false) { const old = tray.querySelector('#rfb'); if (old) old.remove(); phase = 'answer'; cur.retry && cur.retry(); setTray('', '', '', cur.label); update(); } else { pos++; show(); } return; }
    if (!cur.check) { pos++; show(); return; }
    const r = cur.check(); tries[k] = (tries[k] || 0) + 1;
    if (s.graded && !(k in round)) { round[k] = r.ok; if (!(k in firstTry)) firstTry[k] = r.ok; r.ok ? missed.delete(k) : missed.add(k); logEvent({ lesson: s._lesson || cfg.id, idea: s._idea || cfg.idea, item: k, correct: !!r.ok, attempt: tries[k], mode: cfg.mode }); }
    lastOk = r.ok; phase = 'feedback';
    const noClue = cfg.mode === 'test';
    if (r.ok === true) setTray('ok', t('correct'), r.body, t('continue'));
    else if (r.ok === false) { if (noClue) { lastOk = true; setTray('no', t('not_yet'), s.why || '', t('continue')); } else if (tries[k] >= 2 && s.worked) { lastOk = true; setTray('no', t('show_worked'), s.worked, t('continue')); } else { setTray('no', t('not_yet'), r.body, t('try_again')); const rf = s.needs && cfg.refreshers && cfg.refreshers[s.needs]; if (rf && !offered[k]) { offered[k] = true; msg.innerHTML += `<span class="small">${esc(t('offer_refresher', { n: rf.name }))}</span>`; const b = document.createElement('button'); b.className = 'btn ghost'; b.id = 'rfb'; b.textContent = t('yes_reminder'); b.onclick = () => openRefresher(s.needs); go.parentNode.insertBefore(b, go); go.textContent = t('no_continue'); } } }
    else setTray('info', r.title, r.body, t('continue'));
    go.disabled = false; go.focus();
    if (pos === order.length - 1 && cfg.onDone && !cfg._done) { cfg._done = true; const byIdea = {}; screens.forEach((x, i) => { if (x.graded) { const id = x._idea || cfg.idea; byIdea[id] = (byIdea[id] !== false) && !!firstTry[i]; } }); cfg.onDone({ byIdea, firstTry, missed }); }
  };
  go.onclick = onGo; order = order.concat(SUM); show();
}

async function viewLesson(path, mode, exIdx) {
  const ls = await loadLesson(path); const idea = ls.ideas[0];
  let screens, title, m = mode || 'learn';
  if (m === 'book') { const ex = ls.exercises[exIdx || 0]; screens = ex.items; title = ex.book_name; }
  else if (m === 'test') { screens = ls.test; title = `${t('unit_test')} · ${ls.title}`; }
  else { screens = ls.ideas.flatMap(i => i.screens.map(s => Object.assign({ _idea: i.id }, s))); title = ls.title; }
  const idx = await loadIndex(); const ch = idx.chapters.find(c => c.sections.some(s => s.lesson === path));
  store.set('last', { route: `lesson/${encodeURIComponent(path)}`, title: `${ls.book.section} · ${ls.title}`, sub: ch ? `${L(idx.subjects[ch.subject])} · ${t('grade')} ${ch.grade}` : '' });
  markStudied();
  runPlayer({ id: ls.id, idea: idea.id, title, mode: m, screens, tool: ls.tool || idea.tool, refreshers: ls.refreshers || {}, explain: m === 'learn' ? idea.explain : null, learned: m === 'learn' ? (ls.keywords || []).map(k => `${k.en}: ${k.def}`) : null, backRoute: ch ? 'chapter/' + ch.id : 'home',
    onDone: res => { if (m === 'learn') { const graded = screens.filter(s => s.graded).length, right = Object.values(res.firstTry).filter(Boolean).length; setLessonProgress(path, { done: true, best: `${right}/${graded}` }); Object.keys(res.byIdea).forEach(id => bumpMastery(id, res.byIdea[id])); } } });
}

/* ---------- router ---------- */
async function route() {
  sheet('');
  const h = location.hash.replace(/^#/, ''), [r, a, b] = h.split('/');
  if (!S.lang && r !== 'welcome') { await viewWelcome(); return; }
  if (!T.app) await loadLang(S.lang);
  if (S.lang && !S.grade && !['setup', 'welcome', 'settings'].includes(r) && r) { location.hash = 'setup'; return; }
  switch (r) {
    case '': case 'welcome': return S.lang && S.grade && r === '' ? viewHome() : viewWelcome();
    case 'setup': return viewSetup();
    case 'home': return viewHome();
    case 'chapter': return viewChapter(a);
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
if ('serviceWorker' in navigator) { try { navigator.serviceWorker.register('sw.js'); } catch (_) {} }
route();
})();
