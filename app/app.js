/* Meseret app: shell, router, i18n, chapter map, lesson player, review, exams, reports. No framework. */
(() => {
'use strict';
const BASE = location.pathname.includes('/app/') ? '../' : '';
const $ = s => document.querySelector(s);
const app = $('#app'), top = $('#top'), topin = $('#topin'), tray = $('#tray'), msg = $('#msg'), go = $('#go'), nav = $('#nav'), navin = $('#navin'), sheetEl = $('#sheet');
document.addEventListener('click', e => { const o = e.target.closest('.opt, .qb'); if (!o) return; const v = o.textContent.trim(); if (!['<', '>', '='].includes(v)) return; let n = o; for (let k = 0; k < 6 && n; k++, n = n.parentElement) { const bx = n.querySelector && n.querySelector('.cmpbox'); if (bx) { bx.textContent = v; bx.classList.add('on'); break; } } });
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- storage ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('meseret:' + k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } },
  set(k, v) { try { localStorage.setItem('meseret:' + k, JSON.stringify(v)); } catch (_) {} }
};
const S = { lang: store.get('lang', null), grades: store.get('grades', null) || (store.get('grade', null) ? [store.get('grade', null)] : []), name: store.get('name', ''), code: store.get('code', ''), i18n: {}, index: null, lessons: {} };
if (S.lang) document.documentElement.lang = S.lang;

/* ---------- i18n ---------- */
let T = {};
async function loadLang(l) {
  S.lang = l; store.set('lang', l); document.documentElement.lang = l;
  if (!S.i18n[l]) { try { S.i18n[l] = await (await fetch(`i18n/${l}.json`)).json(); } catch (_) { S.i18n[l] = {}; } }
  if (!S.i18n.en) { try { S.i18n.en = await (await fetch('i18n/en.json')).json(); } catch (_) { S.i18n.en = {}; } }
  T = Object.assign({}, S.i18n.en, S.i18n[l]);
}
/* Lesson language: the words INSIDE a lesson (Quick check, pop-ups, prompts, Practise) follow the lesson's own
   language ("lang" on the lesson), not the UI language. Page chrome (back, timer, settings) keeps the UI language. */
let LL = null;
const LESSON_KEYS = new Set(['ladder_tap', 'continue', 'check', 'not_yet', 'try_again', 'true', 'false', 'tap_explore', 'next_step', 'skipped_note', 'skip', 'quick_check', 'answer_is', 'worked_example', 'undo', 'order_hint', 'match_hint', 'pick_size', 'guess_note', 'step_hook', 'step_explore', 'step_notice', 'step_check', 'step_practise', 'step_name', 'show_answer', 'section_done', 'practise_n', 'practise_sub', 'replay_note', 'replay_n', 'show_worked', 'retry', 'first_try', 'spot_on', 'right_idea', 'correct', 'your_guess', 'your_answer', 'wrong_pick', 'not_quite_guess', 'lock_guess', 'includes', 'activity', 'spelling_note', 'num_note', 'signed_note', 'v_retry', 'v_ok', 'v_answer', 'need_reminder', 'offer_refresher', 'yes_reminder', 'no_continue', 'refresher', 'book_exercise', 'unit_test', 'fresh_test', 'test_note', 'all_done', 'in_a_row', 'back_to_question', 'back_to_book', 'back_lesson', 'start_again', 'missing_pick', 'sign', 'remove', 'learned', 'comes_back', 'try_more', 'next_section', 'nl_place', 'nl_opposites', 'nl_move1', 'nl_move', 'nl_hop', 'nl_between', 'one_whole', 'row_w', 'layer_w', 'cells_w', 'cubes_w', 'whole_w', 'half_w', 'cell_hint', 'count_total', 'tr_btn_back', 'tile_answer']);
const t = (k, v = {}) => { const src = LL && LESSON_KEYS.has(k) && S.i18n[LL] && S.i18n[LL][k]; return (src || T[k] || k).replace(/\{(\w+)\}/g, (_, n) => v[n] != null ? v[n] : ''); };
async function loadDict(l) { if (l && !S.i18n[l]) { try { S.i18n[l] = await (await fetch(`i18n/${l}.json`)).json(); } catch (_) { S.i18n[l] = {}; } } }
// switch the lesson language on/off (also tags the app container so the Ethiopic type rules apply)
function setLessonLang(l) { LL = l || null; const a = document.getElementById('app'); if (a) { if (LL) a.setAttribute('lang', LL); else a.removeAttribute('lang'); } }
const L = obj => (obj && typeof obj === 'object') ? (obj[S.lang] || obj.en || '') : (obj || '');

/* ---------- content ---------- */
async function loadIndex() { if (!S.index) S.index = await (await fetch(BASE + 'content/index.json')).json(); return S.index; }
async function loadLesson(path) { if (!S.lessons[path]) S.lessons[path] = await (await fetch(BASE + 'content/' + path)).json(); return S.lessons[path]; }

/* ---------- events + mastery ---------- */
/* ---------- Analytics: an anonymous student id and the events that show retention, engagement and learning ----------
   No name, phone or location. Events are batched and sent to Supabase (server/analytics.sql) when online; see Analytics below. */
const SID = (() => { let id = store.get('sid', null); if (!id) { id = 's_' + Array.from(crypto.getRandomValues(new Uint8Array(10)), b => b.toString(16).padStart(2, '0')).join(''); store.set('sid', id); store.set('first', new Date().toISOString().slice(0, 10)); } return id; })();
function logEvent(e) { const ev = store.get('events', []); ev.push(Object.assign({ at: Date.now() }, e)); if (ev.length > 2000) ev.splice(0, ev.length - 2000); store.set('events', ev);
  const q = store.get('evq', []); q.push(Object.assign({ at: Date.now() }, e)); if (q.length > 500) q.splice(0, q.length - 500); store.set('evq', q); if (q.length >= 40) Analytics.flush(); }
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
/* ---------- Feedback: reports and ideas reach the team (Google Sheet via Apps Script, server/feedback-apps-script.gs) ----------
   Every message is queued on the phone first and sent when online, so nothing is lost offline. */
const ANALYTICS = { url: store.get('anurl', '') || 'https://ungalmkalfrxkunvkxiz.supabase.co', key: store.get('ankey', '') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZ2FsbWthbGZyeGt1bnZreGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3NDI4MTAsImV4cCI6MjEwODMxODgxMH0.Wcp1pGzqDmnht59CjZvLb-XiEFNJpM5-J83-ByWRDtY' }; // Supabase project URL and anon key go here
const Analytics = {
  busy: false, last: 0,
  async flush(force) { if (!ANALYTICS.url || !navigator.onLine || Analytics.busy) return; const q = store.get('evq', []); if (!q.length || (!force && Date.now() - Analytics.last < 60000)) return; Analytics.busy = true;
    try { const batch = q.slice(0, 200), rows = batch.map(e => ({ sid: SID, at: new Date(e.at).toISOString(), kind: e.kind || (e.correct != null ? 'answer' : e.feedback ? 'feedback' : e.install ? 'install' : e.refresher ? 'refresher' : e.translate ? 'translate' : e.tool ? 'tool' : 'event'), lesson: e.lesson || null, item: e.item != null ? String(e.item) : null, data: e, grades: (S.grades || []).join(','), lang: S.lang, code: S.code || null, version: APP_VERSION }));
      const r = await fetch(ANALYTICS.url + '/rest/v1/events', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: ANALYTICS.key, Authorization: 'Bearer ' + ANALYTICS.key, Prefer: 'return=minimal' }, body: JSON.stringify(rows) });
      if (r.ok || r.status === 409) { store.set('evq', store.get('evq', []).slice(batch.length)); Analytics.last = Date.now(); if (store.get('evq', []).length) setTimeout(() => Analytics.flush(true), 500); } }
    catch (_) {} finally { Analytics.busy = false; } },
  session() { const now = Date.now(), lastSeen = store.get('seen', 0); if (now - lastSeen > 30 * 60000) { const n = store.get('sessions', 0) + 1; store.set('sessions', n); logEvent({ kind: 'session', n, first: store.get('first', null), days: store.get('days', []).length, installed: Install.installed(), sw: screen.width, ua: (navigator.userAgent || '').slice(0, 120) }); } store.set('seen', now); }
};
const FEEDBACK_URL = store.get('fburl', '') || 'https://script.google.com/macros/s/AKfycby7tvA6JjQxUCDW7wkeyDhdNgNsIhh4m9TP_wFtdtbsaWiQSvSPOUtmCdG04qKAxUkh/exec'; // paste the Apps Script Web app URL between the last quotes (…/exec); 'fburl' in storage is for testing only
const APP_VERSION = '0.2';
const Feedback = {
  link: (chapterId, item) => chapterId ? `${location.origin}${location.pathname}#book/${chapterId}${item ? '/item/' + encodeURIComponent(item) : ''}` : '',
  where: ctx => [ctx.chapter, ctx.section, ctx.label, ctx.lesson && `lesson ${ctx.lesson}`, ctx.item && `item ${ctx.item}${ctx.generated ? ' (new numbers)' : ''}`, ctx.link && `open: ${ctx.link}`].filter(Boolean).join(' · '),
  device() { const ua = navigator.userAgent || ''; const m = ua.match(/\(([^)]+)\)/); return `${m ? m[1].split(';').slice(0, 3).join(';') : ''} · ${innerWidth}×${innerHeight}${Install.installed() ? ' · installed' : ''}`.slice(0, 200); },
  busy: false,
  async flush() { if (!FEEDBACK_URL || !navigator.onLine || Feedback.busy) return; Feedback.busy = true;
    try { let q; while ((q = store.get('fbq', [])).length) { const r = q[0]; try { await fetch(FEEDBACK_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(r) }); } catch (_) { break; }
        store.set('fbq', store.get('fbq', []).filter(x => x.at !== r.at || x.message !== r.message)); } } finally { Feedback.busy = false; } },
  send(r) { const q = store.get('fbq', []); q.push(r); store.set('fbq', q.slice(-50)); Feedback.flush(); },
  shrink(file) { return new Promise(res => { const img = new Image(), url = URL.createObjectURL(file); img.onload = () => { const k = Math.min(1, 900 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', .7)); }; img.onerror = () => res(''); img.src = url; }); },
  // ctx: { lesson, chapter, section, label, question } — filled in automatically from where the student is
  open(ctx = {}) {
    const lessonKinds = ['report_wrong', 'report_unclear', 'report_spelling', 'report_broken'], general = ['fb_problem', 'fb_idea', 'fb_question', 'fb_praise'], kinds = ctx.lesson ? lessonKinds.concat(['fb_idea']) : general;
    sheet(`<div class="stack fbsheet"><div style="width:40px;height:5px;border-radius:99px;background:var(--line);justify-self:center"></div><h2 class="display">${ctx.lesson ? t('report_q') : '💬 ' + t('fb_title')}</h2>${Feedback.where(ctx) ? `<p class="small muted">${esc(Feedback.where(ctx))}</p>` : `<p class="small muted">${t('fb_sub')}</p>`}
      <div class="opts" role="group">${kinds.map(k => `<button class="opt" data-k="${k}" aria-pressed="false">${t(k)}</button>`).join('')}</div>
      <label class="stack"><span class="small" style="font-weight:800">${t('report_more')}</span><textarea id="fbmsg" rows="4" maxlength="3000" style="padding:10px 12px;border-radius:12px;border:2px solid var(--line);background:var(--surface);color:var(--fg);font:inherit"></textarea></label>
      <div class="fbshot" id="fbshotbox" ${ctx.shot ? '' : 'hidden'}><img id="fbimg" alt="${t('fb_shot')}" ${ctx.shot ? `src="${ctx.shot}"` : ''}><div class="stack"><span class="small" style="font-weight:800">📸 ${t('fb_screen')}</span><button class="btn ghost small" id="fbnoshot">✕ ${t('fb_remove')}</button></div></div>
      <div class="row" id="fbpicrow" ${ctx.shot ? 'hidden' : ''}><label class="btn ghost small fbpic">📷 ${t('fb_shot')}<input type="file" accept="image/*" id="fbfile" hidden></label><span class="small muted" id="fbshotok"></span></div>
      <label class="stack"><span class="small" style="font-weight:800">${t('fb_contact')}</span><input id="fbcontact" maxlength="120" value="${esc(store.get('fbcontact', ''))}" style="min-height:48px;padding:0 12px;border-radius:12px;border:2px solid var(--line);background:var(--surface);color:var(--fg)"></label>
      <div class="row"><button class="btn ghost" id="fbcancel">${t('cancel')}</button><button class="btn" id="fbsend">${t('send')}</button></div></div>`);
    let kind = null, shot = ctx.shot || '';
    $('#fbnoshot').onclick = () => { shot = ''; $('#fbshotbox').hidden = true; $('#fbpicrow').hidden = false; };
    sheetEl.querySelector('.opts').addEventListener('click', e => { const b = e.target.closest('.opt'); if (!b) return; kind = b.dataset.k; sheetEl.querySelectorAll('.opt').forEach(x => x.setAttribute('aria-pressed', x === b)); });
    $('#fbfile').onchange = async e => { const f = e.target.files && e.target.files[0]; if (!f) return; $('#fbshotok').textContent = '…'; shot = await Feedback.shrink(f); $('#fbshotok').textContent = shot ? '✓ ' + t('fb_shot_ok') : ''; };
    $('#fbcancel').onclick = () => sheet('');
    $('#fbsend').onclick = () => { const message = $('#fbmsg').value.trim(), contact = $('#fbcontact').value.trim();
      if (!kind && !message) { toast(t('fb_empty')); return; }
      store.set('fbcontact', contact);
      const r = { app: 'meseret', at: new Date().toISOString(), type: kind ? (T[kind] && S.i18n.en && S.i18n.en[kind]) || kind : 'Message', message, where: Feedback.where(ctx), question: (ctx.question || '').slice(0, 500), link: ctx.link || '', grades: (S.grades || []).join(','), lang: S.lang, contact, device: Feedback.device(), version: APP_VERSION, shot };
      Feedback.send(r); logEvent({ feedback: kind || 'message', lesson: ctx.lesson }); sheet(''); toast(t('sent')); };
  }
};
function reportSheet(ctx) { Feedback.open(ctx); } // older call sites
/* Snap: a picture of what the student sees right now (the page redrawn into an image, no library).
   Works in Chrome/Android; where the browser refuses, it returns '' and the form opens without a picture. */
const Snap = {
  css: null,
  async take() {
    try {
      if (Snap.css == null) { try { Snap.css = await (await fetch('styles.css')).text(); } catch (_) { Snap.css = ''; } }
      const W = innerWidth, H = innerHeight, cs = getComputedStyle(document.documentElement), bs = getComputedStyle(document.body);
      const q = x => String(x).replace(/"/g, "'"), vars = q([...new Set(Snap.css.match(/--[\w-]+(?=\s*:)/g) || [])].map(v => `${v}:${cs.getPropertyValue(v).trim()}`).join(';'));
      // anchor on the first block at the top of the screen: drop everything above it, so font differences above can't shift the picture
      const appEl = document.getElementById('app'), topH = (document.getElementById('top') || { getBoundingClientRect: () => ({ bottom: 0 }) }).getBoundingClientRect().bottom;
      const blocks = [...appEl.querySelectorAll('*')].filter(e => { const pr = e.parentElement; return pr && (pr === appEl || pr.classList.contains('book') || pr.classList.contains('sec') || pr.classList.contains('reader')) && !e.classList.contains('sec') && !e.classList.contains('book'); });
      const A = blocks.find(e => { const r = e.getBoundingClientRect(), pos = getComputedStyle(e).position; return pos !== 'sticky' && pos !== 'fixed' && r.bottom > topH + 8 && r.height > 0; });
      const path = []; if (A) for (let n = A; n && n !== document.body; n = n.parentElement) path.unshift([...n.parentElement.children].indexOf(n));
      const clone = document.body.cloneNode(true); clone.querySelectorAll('script,.fbfab,.verdict,#sheet,.toast').forEach(n => n.remove());
      const a = document.body.querySelectorAll('input,textarea'), b = clone.querySelectorAll('input,textarea'); a.forEach((x, i) => { if (b[i]) b[i].setAttribute('value', x.value); });
      let shift = -scrollY;
      if (A) { let cn = clone; const chain = []; path.forEach(i => { cn = cn.children[i]; chain.push(cn); });
        chain.forEach(n => { if (n.closest && n.closest('#app') && n.id !== 'app') { let p = n.previousElementSibling; while (p) { const q2 = p.previousElementSibling; p.remove(); p = q2; } } });
        let pad = 0; for (let n = A.parentElement; n && n !== document.body; n = n.parentElement) { const st = getComputedStyle(n); pad += parseFloat(st.paddingTop) + parseFloat(st.borderTopWidth); if (n === appEl) { pad += parseFloat(st.marginTop); break; } }
        shift = A.getBoundingClientRect().top - parseFloat(getComputedStyle(A).marginTop) - pad; }
      const wrap = document.createElement('div'); wrap.className = document.body.className; [...clone.childNodes].forEach(n => wrap.appendChild(n));
      wrap.querySelectorAll('img').forEach(i => { if (!/^data:/.test(i.getAttribute('src') || '')) i.removeAttribute('src'); }); // outside pictures would block the capture
      const html = new XMLSerializer().serializeToString(wrap), font = q(`font-family:${bs.fontFamily};color:${bs.color};font-size:${bs.fontSize};line-height:${bs.lineHeight}`);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject x="0" y="0" width="${W}" height="${H}"><div xmlns="http://www.w3.org/1999/xhtml" lang="${document.documentElement.lang || ''}" style="${vars};${font};width:${W}px;height:${H}px;overflow:hidden;position:relative;background:${bs.backgroundColor}"><style>${Snap.css}</style><div style="position:absolute;left:0;top:${shift}px;width:${W}px">${html}</div></div></foreignObject></svg>`;
      const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); await img.decode();
      const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(img, 0, 0); return c.toDataURL('image/jpeg', .72);
    } catch (_) { return ''; }
  }
};
// one floating button on every lesson screen: tap → picture of the screen + where the student is → feedback form
const FAB = {
  el: null,
  show(on) { if (!FAB.el) { FAB.el = document.createElement('button'); FAB.el.className = 'fbfab'; FAB.el.setAttribute('aria-label', t('report')); FAB.el.innerHTML = '<span aria-hidden="true">💬</span>';
      FAB.el.onclick = async () => { FAB.el.disabled = true; const ctx = (Feedback.here || (() => ({})))(); const shot = await Snap.take(); FAB.el.disabled = false; Feedback.open(Object.assign(ctx, { shot, quick: true })); }; document.body.appendChild(FAB.el); }
    FAB.el.setAttribute('aria-label', t('report')); FAB.el.hidden = !on; }
};
window.addEventListener('online', () => Feedback.flush());
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
  const next = async () => { await loadLang(lang); location.hash = S.grades.length ? 'home' : 'setup'; };
  $('#start').onclick = next;
  $('#g').onclick = $('#tg').onclick = async () => { await loadLang(lang); toast(t('signin_soon')); };
  $('#code').onclick = async () => { await loadLang(lang); const c = window.prompt ? window.prompt(t('class_code_prompt'), S.code || '') : null; if (c != null) { S.code = c.trim().toUpperCase(); store.set('code', S.code); } next(); };
}

async function viewSetup() {
  setNav(false); setTop(''); hideTray();
  const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  app.innerHTML = `<div class="row"><div class="bar"><i style="width:66%"></i></div><span class="count">2 / 3</span></div>
  <div class="stack"><h1 class="display">${t('which_grade')}</h1><p class="small muted">${t('grades_many')} ${t('change_later')}</p></div>
  <div class="opts row3" role="group">${grades.map(g => `<button class="opt center" data-g="${g}" style="min-height:64px;font-size:22px">${g}</button>`).join('')}</div>
  <label class="stack"><span class="small" style="font-weight:800">${t('your_name')}</span><input id="nm" value="${esc(S.name)}" style="min-height:52px;padding:0 14px;border-radius:12px;border:2px solid var(--line);background:var(--surface)"></label>
  <div class="card"><div class="row"><button class="play" aria-label="play" id="hear"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l12 7-12 7z" fill="#fff"/></svg></button><div class="grow"><div style="font-weight:800">${t('explain_me')} · 0:35</div><div class="small muted">${t('lang_note')}</div></div></div></div>
  <button class="btn" id="next">${t('continue')} ›</button>`;
  const g = new Set(S.grades);
  const mark = () => app.querySelectorAll('[data-g]').forEach(b => b.setAttribute('aria-pressed', g.has(+b.dataset.g)));
  mark();
  app.querySelector('.opts').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (!b) return; const v = +b.dataset.g; g.has(v) ? g.delete(v) : g.add(v); mark(); });
  $('#hear').onclick = () => speak(t('lang_note'));
  $('#next').onclick = () => { if (!g.size) { toast(t('which_grade')); return; } S.grades = [...g].sort((a, b) => a - b); store.set('grades', S.grades); S.name = $('#nm').value.trim(); store.set('name', S.name); location.hash = 'home'; };
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
  const mine = idx.chapters.filter(c => S.grades.includes(c.grade)), others = [];
  const last = store.get('last', null);
  const due = dueReview();
  const days = store.get('days', []); const week = []; for (let i = 6; i >= 0; i--) { const d = new Date(Date.now() - i * DAY).toISOString().slice(0, 10); week.push([['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(d).getDay()], days.includes(d)]); }
  const chapterCard = c => { const p = chapterProgress(c.id), sub = idx.subjects[c.subject] || {}; return `<a class="item" href="#${c.view === 'book' ? 'book' : 'chapter'}/${c.id}"><div class="icon" style="background:var(--accent-soft);color:var(--accent-deep)">${sub.icon || '•'}</div><div class="grow"><div class="t">${esc(L(sub))} · ${t('grade')} ${c.grade}</div><div class="s">${t('unit')} ${c.unit} · ${esc(L(c.title))}${p ? ` · ${t('lessons_read', { d: p.done, t: p.total })}` : ''}</div></div>${c.free ? `<span class="pill green">${t('free_chapter')}</span>` : ''}</a>`; };
  app.innerHTML = `<div class="row"><div class="grow"><div class="small muted" style="font-weight:700">${t('grade')} ${S.grades.join(' · ')}</div><h1 class="display">${t('hello')}${S.name ? ', ' + esc(S.name) : ''}</h1></div><a class="iconbtn" href="#settings" aria-label="${t('settings')}">${svgIcon('M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-1-3-2 .3-1.5-1.5.3-2-3-1-1 2h-2l-1-2-3 1 .3 2L5.6 8.3 3.6 8l-1 3 2 1v2l-2 1 1 3 2-.3 1.5 1.5-.3 2 3 1 1-2h2l1 2 3-1-.3-2 1.5-1.5 2 .3 1-3-2-1z')}</a></div>
  <div class="week">${week.map(([d, on]) => `<div>${d}<i class="${on ? 'on' : ''}"></i></div>`).join('')}</div>
  ${!last ? Install.card(true) : ''}${last ? `<a class="card accent" href="#${last.route}"><span class="eyebrow">${t('continue')}</span><span class="display" style="font-size:22px">${esc(last.title)}</span><span class="small">${esc(last.sub || '')}</span></a>` : ''}
  <a class="card" href="#review" style="text-decoration:none;color:inherit"><div class="row"><div class="icon" style="background:var(--sky-soft);color:var(--sky)">${svgIcon('M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4')}</div><div class="grow"><div style="font-weight:800">${t('today_review')}</div><div class="small muted">${due.length ? t('review_sub', { n: due.length }) : t('review_empty')}</div></div></div></a>
  <h2 class="display">${t('your_subjects')}</h2>
  <div class="list">${mine.length ? mine.map(chapterCard).join('') : `<div class="item"><div class="s">${t('no_lessons_yet')}</div></div>`}</div>
  ${others.length ? `<h2 class="display">${t('all_grades')}</h2><div class="list">${others.map(chapterCard).join('')}</div>` : ''}
  <h2 class="display">${t('coming')}</h2><div class="list">${idx.coming.filter(c => S.grades.includes(c.grade)).map(c => `<div class="item"><div class="icon" style="background:var(--surface-2);color:var(--muted)">+</div><div class="grow"><div class="t muted">${esc(L(idx.subjects[c.subject] || { en: c.subject }))} · ${t('grade')} ${c.grade} · ${t('unit')} ${c.unit}</div><div class="s">${esc(L(c.title))}</div></div></div>`).join('')}</div>
  ${last ? Install.card(true) : ''}
  <button class="card fbcard" id="fbhome"><span class="instic">💬</span><span class="grow"><b>${t('fb_title')}</b><small class="muted">${t('fb_sub')}</small></span><span>›</span></button>`;
  Install.bind(app); $('#fbhome').onclick = () => Feedback.open({});
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
  <div class="card"><div style="font-weight:800">${t('grade')}</div><a class="btn ghost" href="#setup">${S.grades.join(', ') || '?'} ›</a></div>
  ${Install.installed() ? `<div class="card"><div style="font-weight:800">✓ ${t('install_done')}</div></div>` : Install.card(false)}
  <button class="card fbcard" id="fbset"><span class="instic">💬</span><span class="grow"><b>${t('fb_title')}</b><small class="muted">${t('fb_sub')}</small></span><span>›</span></button>
  <p class="small muted">Meseret v${APP_VERSION} · ${S.code ? 'Class ' + esc(S.code) : ''}</p>`;
  Install.bind(app); $('#fbset').onclick = () => Feedback.open({});
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

/* ---------- Q: rational numbers (parse "3/8", "-2 1/2", "0.375", "60%") ---------- */
const Q = {
  gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; },
  mk(n, d) { if (d < 0) { n = -n; d = -d; } const g = Q.gcd(n, d); return { n: n / g, d: d / g }; },
  dec(s) { const neg = s.startsWith('-'); s = s.replace('-', ''); const [i, f = ''] = s.split('.'); const d = 10 ** f.length; return Q.mk((neg ? -1 : 1) * ((+i || 0) * d + (+f || 0)), d); },
  parse(str) {
    if (str == null) return null;
    let s = String(str).replace(/[\u1200-\u139F\u2D80-\u2DDF][\u1200-\u139F\u2D80-\u2DDF.²³]*/g, ' ').replace(/(\d) (?=\d{3}(?![\d/]))/g, '$1').replace(/[−–—]/g, '-').replace(/½/g, ' 1/2').replace(/¼/g, ' 1/4').replace(/¾/g, ' 3/4').replace(/,/g, '').replace(/[^0-9./%\s-]/g, ' ').replace(/-\s+/g, '-').replace(/\s*\/\s*/g, '/').trim().replace(/\s+/g, ' ');
    let pct = false; if (s.endsWith('%')) { pct = true; s = s.slice(0, -1).trim(); }
    let m, r = null;
    if ((m = s.match(/^(-?)(\d+) (\d+)\/(\d+)$/))) { const d = +m[4]; if (!d) return null; r = Q.mk((m[1] ? -1 : 1) * (+m[2] * d + +m[3]), d); }
    else if ((m = s.match(/^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/))) { const a = Q.dec(m[1]), b = Q.dec(m[2]); if (!b.n) return null; r = Q.mk(a.n * b.d, a.d * b.n); }
    else if (/^-?\d*\.?\d+$/.test(s)) r = Q.dec(s);
    if (r && pct) r = Q.mk(r.n, r.d * 100);
    return r;
  },
  val: q => q.n / q.d,
};
// numeric blanks: equal value in any form; an accepted answer starting with ≈ accepts anything that rounds to it
function numMatch(given, accepted) {
  const g = Q.parse(given); if (!g) return null;
  for (const a of accepted) { const approx = /^[≈~]/.test(String(a)), q = Q.parse(String(a).replace(/^[≈~]/, '')); if (!q) continue;
    if (approx) { const dp = (String(a).match(/\.(\d+)/) || [0, ''])[1].length; if (Math.abs(Q.val(g) - Q.val(q)) <= 0.5 * 10 ** -dp + 1e-9) return true; }
    else if (g.n === q.n && g.d === q.d) return true; }
  return false;
}
/* GEN-START ---------- Gen: fresh practice questions from a formula ----------
   A screen may carry "gen": {"t": "<generator>", ...options}. The screen's own text is the book's version.
   When a student replays practice, retries a missed question, or takes a test, Gen.make(screen) returns the
   same kind of question with new numbers (exact answers, worked steps). Book exercises always stay the book's. */
const Gen = (() => {
  const rng = seed => () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let r = Math.random;
  const int = (a, b) => a + Math.floor(r() * (b - a + 1)), pick = a => a[int(0, a.length - 1)], sgn = () => r() < .5 ? -1 : 1;
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = int(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const M = x => String(x).replace(/-/g, '−');
  const nf = n => { const v = Math.round(n * 1e9) / 1e9, [i, d] = String(v).split('.'); return i.replace(/\B(?=(\d{3})+$)/g, ',') + (d ? '.' + d : ''); };
  const fq = q => M(q.d === 1 ? `${q.n}` : `${q.n}/${q.d}`);
  const fmix = q => { if (q.d === 1 || Math.abs(q.n) < q.d) return fq(q); const w = Math.trunc(Math.abs(q.n) / q.d), n = Math.abs(q.n) % q.d; return M(`${q.n < 0 ? '-' : ''}${w} ${n}/${q.d}`); };
  const par = q => q.n < 0 ? `(${fmix(q)})` : fmix(q);
  const add = (a, b) => Q.mk(a.n * b.d + b.n * a.d, a.d * b.d), mul = (a, b) => Q.mk(a.n * b.n, a.d * b.d), neg = a => Q.mk(-a.n, a.d), div = (a, b) => Q.mk(a.n * b.d, a.d * b.n);
  const lcm = (a, b) => a / Q.gcd(a, b) * b;
  const proper = (dens = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12]) => { const d = pick(dens); let n = int(1, d - 1); while (Q.gcd(n, d) !== 1) n = int(1, d - 1); return Q.mk(n, d); };
  const forms = q => { const L = [fq(q), fmix(q)]; const v = Q.val(q); if (Math.abs(v * 1000 - Math.round(v * 1000)) < 1e-9) L.push(String(+v.toFixed(3))); return [...new Set(L)]; };
  const pair = k => `${M(k)} and ${M(k + 1)}`;
  const NAMES = ['Abebe', 'Almaz', 'Kebede', 'Hiwot', 'Tigist', 'Dawit', 'Selam', 'Yonas', 'Meron', 'Bekele'];
  const T = {
    place(o) { const d = pick(o.dens || [2, 3, 4, 5, 6]); let n; do n = int(1, d * (o.improper ? 3 : 1) - 1); while (n % d === 0 || Q.gcd(n, d) !== 1); const q = Q.mk(n * (o.signs ? sgn() : 1), d), lo = Math.floor(Q.val(q));
      return { kind: 'numline', min: lo - 1, max: lo + 2, sub: q.d, targets: [{ v: fq(q), label: fq(q) }], ask: `Tap where ${fq(q)} goes.`, why: `${fmix(q) !== fq(q) ? `${fq(q)} = ${fmix(q)}. ` : ''}It lies between ${pair(lo)}.`, clue: q.n < 0 ? 'Negative numbers are left of 0.' : 'Split each unit into equal parts.' }; },
    between() { const d = pick([2, 3, 4, 5, 7]); let n; do n = int(1, d * 3); while (n % d === 0); const q = Q.mk(n * sgn(), d), lo = Math.floor(Q.val(q));
      const opts = shuffle([pair(lo), ...shuffle([pair(lo - 1), pair(lo + 1), pair(lo + 2)]).slice(0, 2), pair(-lo - 1) === pair(lo) ? pair(lo - 2) : pair(-lo - 1)]);
      return { kind: 'mcq', text: `Between which two integers does ${fq(q)} lie?`, opts: [...new Set(opts)], ans: pair(lo), why: `${fmix(q) !== fq(q) ? `${fq(q)} = ${fmix(q)}. ` : ''}So it lies between ${pair(lo)}.`, clue: 'Change it to a mixed fraction first.' }; },
    mixed() { const d = pick([2, 3, 4, 5, 6, 7, 8, 9, 10]); let n; do n = int(d + 1, d * 7); while (n % d === 0); const q = Q.mk(n, d);
      return { kind: 'blank', num: false, ask: `As a mixed fraction, ${fq(q)} = ___`, a: [fmix(q)], why: `${q.n} ÷ ${q.d} = ${Math.trunc(q.n / q.d)} remainder ${q.n % q.d}. So ${fq(q)} = ${fmix(q)}.`, clue: `Divide ${q.n} by ${q.d}. The remainder is the new numerator.` }; },
    opposite() { const q = Q.mk(int(1, 30) * sgn(), pick([1, 2, 3, 4, 5, 7])); return { kind: 'blank', num: true, ask: `The opposite of ${fmix(q)} is ___`, a: forms(neg(q)), why: `Change the sign: the opposite of ${fmix(q)} is ${fmix(neg(q))}.`, clue: 'Same distance from 0, other side.' }; },
    abs(o) { if ((o.form || pick(['in', 'in', 'sum'])) === 'in') { const a = int(-30, 30), b = int(1, 30), plus = r() < .5, v = plus ? a + b : a - b;
        return { kind: 'blank', num: true, ask: `|${M(a)} ${plus ? '+' : '−'} ${b}| = ___`, a: [String(Math.abs(v))], why: `${M(a)} ${plus ? '+' : '−'} ${b} = ${M(v)}, and |${M(v)}| = ${Math.abs(v)}.`, clue: 'Work inside the bars first.' }; }
      const a = int(-20, 20), b = int(-20, 20), c = int(-20, 20), v = Math.abs(a) - Math.abs(b) + Math.abs(c);
      return { kind: 'blank', num: true, ask: `|${M(a)}| − |${M(b)}| + |${M(c)}| = ___`, a: [String(v)], why: `${Math.abs(a)} − ${Math.abs(b)} + ${Math.abs(c)} = ${M(v)}.`, clue: 'Find each absolute value first.' }; },
    abseq(o) { const a = int(2, 15);
      if (o.shift) { const c = int(1, 9) * sgn(), s1 = a - c, s2 = -a - c, lhs = `|x ${c < 0 ? '−' : '+'} ${Math.abs(c)}|`; const pool = shuffle([s1, s2, ...shuffle([...new Set([a, -a, c, -c, a + c])].filter(x => x !== s1 && x !== s2)).slice(0, 3)]).map(M);
        return { kind: 'pick', text: `Tap all solutions of ${lhs} = ${a}.`, pool, a: [M(s1), M(s2)], why: `The inside is ${a} or −${a}. So x = ${M(s1)} or x = ${M(s2)}.`, clue: `x ${c < 0 ? '−' : '+'} ${Math.abs(c)} must be ${a} or −${a}.` }; }
      if (r() < .25) return { kind: 'mcq', text: `How many solutions does |x| = −${a} have?`, opts: ['0', '1', '2'], ans: '0', why: 'A distance is never negative, so there is no solution.', clue: 'Can a distance be negative?' };
      const q = r() < .4 ? proper([2, 3, 4, 5, 7]) : Q.mk(a, 1); const pool = shuffle([fq(q), fq(neg(q)), '0', fq(mul(q, Q.mk(2, 1)))]);
      return { kind: 'pick', text: `Tap all solutions of |x| = ${fq(q)}.`, pool, a: [fq(q), fq(neg(q))], why: `${fq(q)} and ${fq(neg(q))} are both ${fq(q)} from 0.`, clue: 'One on each side of 0.' }; },
    classify() { const k = int(0, 3), v = [String(int(1, 40)), '0', M(-int(1, 40)), fq(Q.mk(int(1, 9) * sgn(), pick([3, 7, 11])))][k]; const S = ['ℕ', 'W', 'ℤ', 'ℚ'], why = ['A counting number is in every set.', '0 is whole but not natural.', 'A negative integer is in ℤ and ℚ.', 'A fraction that is not an integer is only in ℚ.'][k];
      return { kind: 'mcq', text: `What is the smallest set that contains ${v}?`, opts: S, ans: S[k], why, clue: 'Is it a fraction? Is it negative? Is it 0?' }; },
    compare(o) { const kind = o.kind || pick(['frac', 'frac', 'neg', 'dec']); let A, B, fa, fb, why;
      if (kind === 'dec') { const x = int(100, 999) / 100, y = +(x + pick([-1, 1]) * pick([0.01, 0.1, 0.05, 0.09, 1])).toFixed(2); fa = String(x); fb = String(y); A = Q.parse(fa); B = Q.parse(fb); why = 'Compare the integer parts, then tenths, then hundredths.'; }
      else { A = proper([2, 3, 4, 5, 6, 7, 8, 9]); let Bd, Bn; if (r() < .2) { const k = int(2, 4); Bn = A.n * k; Bd = A.d * k; } else { const b = proper([2, 3, 4, 5, 6, 7, 8, 9]); Bn = b.n; Bd = b.d; }
        if (kind === 'neg') { A = neg(A); if (r() < .6) Bn = -Bn; }
        B = Q.mk(Bn, Bd); fa = fq(A); fb = M(`${Bn}/${Bd}`); why = `Cross-multiply: ${M(A.n)} × ${Bd} = ${M(A.n * Bd)} and ${A.d} × ${M(Bn)} = ${M(A.d * Bn)}.`; }
      const c = A.n * B.d - B.n * A.d, ans = c < 0 ? '<' : c > 0 ? '>' : '=';
      return { kind: 'mcq', text: `Which sign is correct? ${fa} ? ${fb}`, opts: ['<', '>', '='], ans, why: `${why} So ${fa} ${ans} ${fb}.`, clue: kind === 'dec' ? 'Compare place by place, left to right.' : 'Cross-multiply, or use a common denominator.' }; },
    order(o) { const desc = o.desc != null ? o.desc : r() < .5; const qs = [];
      while (qs.length < (o.n || 4)) { const q = r() < .35 ? Q.mk(int(-60, 99), 10) : Q.mk(int(1, 23) * (o.signs === false ? 1 : sgn()), pick([2, 3, 4, 5, 6, 8])); if (!qs.some(x => x.n * q.d === q.n * x.d)) qs.push(q); }
      const lab = qs.map(q => q.d === 10 || q.d === 5 || q.d === 1 ? M(+Q.val(q).toFixed(2)) : fmix(q)); const srt = qs.map((q, i) => [Q.val(q), lab[i]]).sort((a, b) => desc ? b[0] - a[0] : a[0] - b[0]).map(x => x[1]);
      return { kind: 'order', text: `Tap them in ${desc ? 'descending order (largest first)' : 'ascending order (smallest first)'}.`, items: srt, why: srt.join(desc ? ' > ' : ' < '), clue: 'Change them to decimals or to a common denominator.' }; },
    op(o) { const t = o.op || 'add', dens = o.dens || [2, 3, 4, 5, 6, 8, 9, 10, 12];
      let a = proper(dens), b;
      if (o.same) { let n; do n = int(1, a.d * 2); while (Q.gcd(n, a.d) !== 1); b = Q.mk(n, a.d); } else b = proper(dens);
      if (o.mixed) { a = add(a, Q.mk(int(1, 3), 1)); if (r() < .5) b = add(b, Q.mk(int(1, 2), 1)); }
      if (o.signs) { if (r() < .6) a = neg(a); if (r() < .5) b = neg(b); }
      if (o.word && t === 'div') { b = proper([2, 3, 4, 5, 8]); a = mul(b, Q.mk(int(2, 8), 1)); }
      if (o.word && t === 'sub' && Q.val(a) < Q.val(b)) [a, b] = [b, a];
      if (o.word && t === 'sub' && Q.val(a) === Q.val(b)) a = add(a, Q.mk(1, 1));
      const A = a, B = b, sym = { add: '+', sub: '−', mul: '×', div: '÷' }[t];
      const res = t === 'add' ? add(A, B) : t === 'sub' ? add(A, neg(B)) : t === 'mul' ? mul(A, B) : div(A, B);
      const imp = q => `${fmix(q)} = (${M(Math.trunc(Math.abs(q.n) / q.d))} × ${q.d} + ${Math.abs(q.n) % q.d})/${q.d} = ${fq(Q.mk(Math.abs(q.n), q.d))}`;
      const lines = [A, B].filter(q => fmix(q) !== fq(q)).map(q => `Change to an improper fraction: ${imp(q)}${q.n < 0 ? ', so ' + fmix(q) + ' = ' + fq(q) : ''}.`);
      const simp = (N, D) => { const g = Q.gcd(N, D); return g > 1 ? ` Simplify: the GCF of ${Math.abs(N)} and ${D} is ${g}. ${Math.abs(N)} ÷ ${g} = ${Math.abs(N) / g} and ${D} ÷ ${g} = ${D / g}, so ${M(N)}/${D} = ${fq(Q.mk(N, D))}.` : ''; };
      const scale = (q, L) => L === q.d ? '' : ` ${L} ÷ ${q.d} = ${L / q.d}, so ${fq(q)} = (${M(q.n)} × ${L / q.d})/(${q.d} × ${L / q.d}) = ${M(q.n * L / q.d)}/${L}.`;
      if (t === 'add' || t === 'sub') { const B2 = t === 'sub' ? neg(B) : B, L = lcm(A.d, B2.d), N = A.n * L / A.d + B2.n * L / B2.d;
        if (t === 'sub') lines.push(`Subtracting ${fq(B)} means adding its opposite, ${fq(B2)}.`);
        if (A.d !== B2.d) lines.push(`The denominators are ${A.d} and ${B2.d}. Their LCM is ${L}.${scale(A, L)}${scale(B2, L)}`);
        lines.push(`Now add the numerators: ${M(A.n * L / A.d)} + ${B2.n * L / B2.d < 0 ? '(' + M(B2.n * L / B2.d) + ')' : B2.n * L / B2.d} = ${M(N)}. So the sum is ${M(N)}/${L}.${simp(N, L)}`); }
      if (t === 'mul') { const N = A.n * B.n, D = A.d * B.d; lines.push(`Sign: ${(A.n < 0) === (B.n < 0) ? 'same signs, so the answer is positive' : 'different signs, so the answer is negative'}.`, `Multiply the tops: ${Math.abs(A.n)} × ${Math.abs(B.n)} = ${Math.abs(N)}. Multiply the bottoms: ${A.d} × ${B.d} = ${D}. That gives ${M(N)}/${D}.${simp(N, D)}`); }
      if (t === 'div') { const R = Q.mk(B.d, B.n), N = A.n * R.n, D = A.d * R.d; lines.push(`To divide, multiply by the reciprocal. Flip ${fq(B)} to get ${fq(R)}.`, `${fq(A)} × ${fq(R)}: tops ${M(A.n)} × ${M(R.n)} = ${M(N)}, bottoms ${A.d} × ${R.d} = ${D}. That gives ${M(N)}/${D}.${simp(N, D)}`); }
      if (fmix(res) !== fq(res)) lines.push(`As a mixed fraction: ${fmix(res)}.`);
      let ask = `${fmix(A)} ${sym} ${par(B)} = ___`;
      if (o.word) { const nm = pick(NAMES); ask = { add: `${nm} walked ${fmix(A)} km to school and ${fmix(B)} km to the market. Total distance = ___ km`, sub: `A rope is ${fmix(A)} m long. ${nm} cuts off ${fmix(B)} m. Length left = ___ m`, mul: `${nm} buys ${fmix(A)} kg of teff. One kg costs ${fmix(B)} hundred Birr. Cost = ___ hundred Birr`, div: `${nm} has ${fmix(A)} kg of coffee. Each bag holds ${fmix(B)} kg. Number of bags = ___` }[t]; }
      return { kind: 'blank', num: true, ask, a: forms(res), why: lines.join(' '), worked: lines.join(' '), clue: { add: 'Use a common denominator, then add the numerators.', sub: 'Add the opposite of the second number.', mul: 'Decide the sign, then multiply tops and bottoms.', div: 'Multiply by the reciprocal of the divisor.' }[t] }; },
    share() { const k = pick([3, 4, 5, 6]), n = pick([2, 3, 4]), rest = Q.mk(k - 1, k), each = div(rest, Q.mk(n, 1)), nm = pick(NAMES);
      return { kind: 'blank', num: true, ask: `${nm}'s mother takes 1/${k} of a sugarcane. ${n} brothers share the rest equally. Each brother gets ___ of the sugarcane.`, a: forms(each), why: `The whole is 1 = ${k}/${k}. After the mother takes 1/${k}, ${k}/${k} − 1/${k} = ${k - 1}/${k} is left. Share it: ${k - 1}/${k} ÷ ${n} = ${k - 1}/${k} × 1/${n} = ${k - 1}/${k * n}${Q.gcd(k - 1, k * n) > 1 ? ` = ${fq(each)} (divide top and bottom by ${Q.gcd(k - 1, k * n)})` : ''}.`, clue: 'Find what is left first, then divide it equally.' }; },
    interest(o) { const find = o.find || pick(['I', 'I', 'P', 'T', 'R']), nm = pick(NAMES), bank = pick(['CBE', 'a bank', 'a saving association']), P = int(5, 60) * 100, R = int(4, 15), months = find === 'I' && r() < .5, T = months ? int(3, 11) : int(1, 5), Ty = months ? T / 12 : T;
      const I = Math.round(P * R / 100 * Ty * 100) / 100, Ts = months ? `${T}/12` : `${T}`, ex = Math.abs(P * R / 100 * Ty - I) < 1e-9 ? String(I) : '≈' + I.toFixed(2);
      if (find === 'I') return { kind: 'blank', num: true, ask: `${nm} borrows Birr ${P} from ${bank} at ${R}% simple interest for ${T} ${months ? 'months' : T > 1 ? 'years' : 'year'}. Interest = Birr ___`, a: [ex], why: `Change the rate: ${R}% = ${R} ÷ 100 = ${R / 100}.${months ? ` Change the time: ${T} months = ${T}/12 year.` : ''} I = P × R × T = ${P} × ${R / 100} × ${Ts} = ${I}.`, clue: months ? 'T is in years: divide the months by 12.' : 'Use I = P × R × T with R as a decimal.' };
      if (find === 'P') return { kind: 'blank', num: true, ask: `What principal earns Birr ${I} interest in ${T} year${T > 1 ? 's' : ''} at ${R}%? P = Birr ___`, a: [String(P)], why: `P = I ÷ (R × T) = ${I} ÷ (${R / 100} × ${T}) = ${P}.`, clue: 'P = I ÷ (R × T).' };
      if (find === 'T') return { kind: 'blank', num: true, ask: `Birr ${P} earns Birr ${I} simple interest at ${R}% per year. Time = ___ years`, a: [String(T)], why: `T = I ÷ (P × R) = ${I} ÷ (${P} × ${R / 100}) = ${T}.`, clue: 'T = I ÷ (P × R).' };
      return { kind: 'blank', num: true, ask: `Birr ${P} earns Birr ${I} simple interest in ${T} year${T > 1 ? 's' : ''}. Rate = ___ %`, a: [String(R)], why: `R = I ÷ (P × T) = ${I} ÷ (${P} × ${T}) = ${R / 100} = ${R}%.`, clue: 'R = I ÷ (P × T), then change to a percent.' }; },

    /* ---- Grade 5 Unit 1: area, counting, volume, unit conversion. Amharic (am) and English templates ---- */
    area(o) { const am = o.lang === 'am', u = o.unit || 'ምድብ', max = o.max || 12, sq = o.shape === 'square' || (o.shape !== 'rect' && r() < .3);
      const a = int(2, max); let b = a; if (!sq) { b = int(2, max); while (b === a) b = int(2, max); } const l = Math.max(a, b), w = Math.min(a, b), area = l * w;
      const u2 = am ? { 'ምድብ': 'ካሬ ምድብ', 'ሳ.ሜ': 'ሳ.ሜ²', 'ሜ': 'ሜ²' }[u] : { 'ምድብ': 'square units', 'ሳ.ሜ': 'cm²', 'ሜ': 'm²' }[u], uw = am ? u : { 'ምድብ': 'units', 'ሳ.ሜ': 'cm', 'ሜ': 'm' }[u];
      const why = sq ? `${a} × ${a} = ${area} ${u2}` + (am ? '።' : '.') : `${l} × ${w} = ${area} ${u2}` + (am ? '።' : '.'), clue = am ? (sq ? 'ርዝመት × ርዝመት።' : 'ርዝመት × ወርድ።') : (sq ? 'Side × side.' : 'Length × width.');
      if (o.pic && u === 'ምድብ' && l <= 12) return { kind: 'grid', mode: 'tile', graded: true, w: sq ? a : l, h: sq ? a : w, unit: uw, ask: am ? 'ስፋቱ ስንት ካሬ ምድብ ነው?' : 'How many square units is the area?', intro: am ? 'ረድፍ በረድፍ ሙላ፤ ከዚያ ቁጥሩን ጻፍ።' : 'Fill row by row, then type the number.', ans: String(area), why, clue, machine: true };
      const ask = am ? (sq ? `የጎን ርዝመቱ ${a} ${uw} የሆነ ካሬ ስፋት ___ ${u2} ነው።` : `ርዝመቱ ${l} ${uw}፣ ወርዱ ${w} ${uw} የሆነ ሬክታንግል ስፋት ___ ${u2} ነው።`)
        : (sq ? `A square has sides of ${a} ${uw}. Area = ___ ${u2}` : `A rectangle is ${l} ${uw} long and ${w} ${uw} wide. Area = ___ ${u2}`);
      return { kind: 'blank', num: true, ask, a: [String(area)], why, clue, machine: true }; },
    count(o) { const am = o.lang === 'am', cubes = o.kind === 'cubes', max = Math.min(o.max || 8, cubes ? 6 : 12);
      if (!cubes) { const w = int(3, max), h = int(2, Math.min(max, 8)); return { kind: 'grid', mode: 'tile', graded: true, w, h, unit: am ? 'ምድብ' : 'units', ask: am ? 'ስንት ትንንሽ ካሬዎች አሉ?' : 'How many small squares are there?', intro: am ? 'ረድፍ በረድፍ ሙላ።' : 'Fill row by row.', ans: String(w * h), why: `${h} × ${w} = ${w * h}` + (am ? '።' : '.'), clue: am ? `${h} ረድፎች፣ እያንዳንዳቸው ${w} ካሬ።` : `${h} rows with ${w} squares each.`, machine: true }; }
      const l = int(2, max), w = int(2, Math.min(max, 5)), h = int(2, Math.min(max, 4));
      return { kind: 'cubes', graded: true, l, w, h, unit: am ? 'ምድብ' : 'units', ask: am ? 'ስንት ትንንሽ ኩቦች አሉ?' : 'How many small cubes are there?', intro: am ? `ርዝመቱ ${l}፣ ወርዱ ${w}፣ ከፍታው ${h} ምድብ ነው።` : `Length ${l}, width ${w}, height ${h}.`, ans: String(l * w * h), why: `${l} × ${w} × ${h} = ${l * w * h}` + (am ? '።' : '.'), clue: am ? `አንድ ንብርብር ${l} × ${w} = ${l * w} ኩቦች አሉት።` : `One layer has ${l} × ${w} = ${l * w} cubes.`, machine: true }; },
    volume(o) { const am = o.lang === 'am', u = o.unit || 'ምድብ', max = o.max || 10, cube = o.shape === 'cube';
      const u3 = am ? { 'ምድብ': 'ኩቢክ ምድብ', 'ሳ.ሜ': 'ሳ.ሜ³', 'ሜ': 'ሜ³' }[u] : { 'ምድብ': 'cubic units', 'ሳ.ሜ': 'cm³', 'ሜ': 'm³' }[u], uw = am ? u : { 'ምድብ': 'units', 'ሳ.ሜ': 'cm', 'ሜ': 'm' }[u], dot = am ? '።' : '.';
      const l = int(2, max), w = cube ? l : int(2, max), h = cube ? l : int(2, Math.min(max, 6)), V = l * w * h;
      if (o.word) { const item = pick(am ? ['የሳሙና ሳጥኖች', 'የጫማ ሳጥኖች', 'የሻይ ካርቶኖች'] : ['soap boxes', 'shoe boxes', 'tea cartons']);
        return { kind: 'blank', num: true, ask: am ? `${item} በ${l} ረድፍ ርዝመት፣ በ${w} ረድፍ ወርድ፣ በ${h} ንብርብር ተደራርበዋል። በሙሉ ___ ሳጥኖች አሉ።` : `${item} are stacked ${l} long, ${w} wide and ${h} layers high. There are ___ in all.`, a: [String(V)], why: `${l} × ${w} = ${l * w}፤ ${l * w} × ${h} = ${V}` + dot, clue: am ? 'አንድ ንብርብር ርዝመት × ወርድ ነው። ከዚያ በንብርብሮች ብዛት አባዛ።' : 'One layer is length × width. Then multiply by the layers.', machine: true }; }
      const ask = am ? (cube ? `የጎን ርዝመቱ ${l} ${uw} የሆነ ኩብ ይዘት ___ ${u3} ነው።` : `ርዝመቱ ${l} ${uw}፣ ወርዱ ${w} ${uw}፣ ከፍታው ${h} ${uw} የሆነ ሳጥን ይዘት ___ ${u3} ነው።`)
        : (cube ? `A cube has sides of ${l} ${uw}. Volume = ___ ${u3}` : `A box is ${l} ${uw} long, ${w} ${uw} wide and ${h} ${uw} high. Volume = ___ ${u3}`);
      return { kind: 'blank', num: true, ask, a: [String(V)], why: `${l} × ${w} = ${l * w}፤ ${l * w} × ${h} = ${V}` + dot, clue: am ? 'ርዝመት × ወርድ × ከፍታ። መጀመሪያ ሁለቱን አባዛ።' : 'Length × width × height. Multiply two first.', machine: true }; },
    convert(o) { const am = o.lang === 'am', dim = o.dim || 1, dot = am ? '።' : '.';
      const TB = { 1: [['ኪ.ሜ', 0], ['ሜ', 3], ['ሳ.ሜ', 5], ['ሚ.ሜ', 6]], 2: [['ኪ.ሜ²', 0], ['ሄክታር', 2], ['ሜ²', 6], ['ሳ.ሜ²', 10], ['ሚ.ሜ²', 12]], 3: [['ኪ.ሜ³', 0], ['ሜ³', 9], ['ሊ', 12], ['ሳ.ሜ³', 15], ['ሚ.ሊ', 15], ['ሚ.ሜ³', 18]] }[dim];
      let pool = TB.filter(x => !o.units || o.units.includes(x[0])); if (dim === 3 && !o.units) pool = pool.filter(x => x[0] !== 'ሊ' && x[0] !== 'ሚ.ሊ');
      for (let tries = 0; tries < 60; tries++) { const A = pick(pool), B = pick(pool), diff = B[1] - A[1]; if (!diff) continue; const down = diff > 0, k = Math.abs(diff);
        if (o.dir === 'down' && !down) continue; if (o.dir === 'up' && down) continue; if (k > 9) continue;
        const nice = down ? pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 25, 50]) : pick(o.nice ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 25, 50] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 25, 50, .5, 2.5, 1.5, .25]);
        const v = down ? nice : Math.round(nice * Math.pow(10, k)), ans = down ? Math.round(nice * Math.pow(10, k)) : nice;
        if (v >= 1e10 || ans >= 1e10 || (ans < 1 && ans < .001) || v < 1 || v !== Math.round(v * 1000) / 1000) continue;
        const ten = Math.pow(10, k), why = down ? `1 ${A[0]} = ${nf(ten)} ${B[0]}፤ ${nf(v)} × ${nf(ten)} = ${nf(ans)}` + dot : `1 ${B[0]} = ${nf(ten)} ${A[0]}፤ ${nf(v)} ÷ ${nf(ten)} = ${nf(ans)}` + dot;
        const clue = am ? (down ? 'ከትልቅ ወደ ትንሽ ምድብ ስንቀይር እናባዛለን።' : 'ከትንሽ ወደ ትልቅ ምድብ ስንቀይር እናካፍላለን።') : (down ? 'Big unit to small unit: multiply.' : 'Small unit to big unit: divide.');
        if (o.ladder && dim !== 3 && !o.units && Math.abs(TB.indexOf(B) - TB.indexOf(A)) <= 3) return { kind: 'ladder', graded: true, power: dim, from: A[0], to: B[0], value: v, ask: `${nf(v)} ${A[0]} = ___ ${B[0]}`, ans: String(ans), why, clue, machine: true };
        return { kind: 'blank', num: true, ask: `${nf(v)} ${A[0]} = ___ ${B[0]}`, a: [String(ans), nf(ans)], why, clue, machine: true }; }
      return { kind: 'blank', num: true, ask: '1 ሜ = ___ ሳ.ሜ', a: ['100'], why: '1 ሜ = 100 ሳ.ሜ' + dot, clue: am ? 'ከትልቅ ወደ ትንሽ እናባዛለን።' : 'Multiply.', machine: true }; },
    litres(o) { const am = o.lang === 'am', k = pick([1, 2, 5]), n = int(2, 8), L = n * k, dot = am ? '።' : '.', thing = pick(am ? [['ሃይላንዶች', 'ሃይላንድ'], ['ጀሪካኖች', 'ጀሪካን'], ['ባልዲዎች', 'ባልዲ']] : [['bottles', 'bottle'], ['jerrycans', 'jerrycan'], ['buckets', 'bucket']]), st = o.step || 'l';
      const base = am ? `${n} ባለ ${k} ሊትር ${thing[0]}` : `${n} ${thing[0]} of ${k} litres`;
      if (st === 'cm3') return { kind: 'blank', num: true, ask: am ? `${base} በሙሉ ___ ሳ.ሜ³ ይይዛሉ።` : `${base} hold ___ cm³ in all.`, a: [String(L * 1000), nf(L * 1000)], why: `${n} × ${k} = ${L} ሊ፤ ${L} × 1,000 = ${nf(L * 1000)} ሳ.ሜ³` + dot, clue: am ? '1 ሊ = 1,000 ሳ.ሜ³። መጀመሪያ ሊትሩን ደምር።' : '1 litre = 1,000 cm³. Find the litres first.', machine: true };
      if (st === 'm3') return { kind: 'blank', num: true, ask: am ? `${base} በሙሉ ___ ሜ³ ይይዛሉ።` : `${base} hold ___ m³ in all.`, a: [String(L / 1000)], why: `${n} × ${k} = ${L} ሊ፤ ${L} ÷ 1,000 = ${L / 1000} ሜ³` + dot, clue: am ? '1 ሊ = 1/1000 ሜ³። ሊትሩን በ1,000 አካፍል።' : '1 litre = 1/1000 m³. Divide the litres by 1,000.', machine: true };
      return { kind: 'blank', num: true, ask: am ? `${base} በሙሉ ___ ሊትር ነው።` : `${base} hold ___ litres in all.`, a: [String(L)], why: `${n} × ${k} = ${L}` + dot, clue: am ? 'ብዛቱን በአንዱ ሊትር አባዛ።' : 'Multiply the number by the litres of one.', machine: true }; },
  };
  /* ---- difficulty levels: ★ basic (book level), ★★ standard, ★★★ challenge ----
     LV[t](level) returns option overrides; HARD[t] makes a ★★★ question of a different shape (missing number, spot the mistake, multi-step). */
  const LV = {
    place: L => [{ dens: [2, 3, 4, 5], signs: false, improper: false }, { dens: [2, 3, 4, 5, 6], signs: true, improper: true }, { dens: [6, 7, 8, 9, 10], signs: true, improper: true }][L - 1],
    compare: L => ({ kind: ['dec', 'frac', 'neg'][L - 1] }),
    order: L => [{ n: 3, signs: false }, { n: 4 }, { n: 5 }][L - 1],
    op: L => [{ same: true, signs: false, mixed: false }, { same: false, signs: true, mixed: false }, { same: false, signs: true, mixed: true }][L - 1],
    abs: L => ({ form: L === 1 ? 'in' : 'sum' }),
    abseq: L => (L === 3 ? { shift: true } : {}),
    interest: L => (L === 1 ? { find: 'I' } : L === 2 ? { find: pick(['P', 'T', 'I']) } : {}),
  };
  const NM = () => pick(NAMES);
  const HARD = {
    op(o) { const t = o.op || 'add', kind = o.word ? 'mistake' : pick(['missing', 'mistake']);
      let A = proper([2, 3, 4, 5, 6, 8]), B = proper([2, 3, 4, 5, 6, 8]); if (r() < .6) A = neg(A); if (r() < .4) B = neg(B); if (r() < .4) A = add(A, Q.mk(A.n < 0 ? -1 : 1, 1));
      const sym = { add: '+', sub: '−', mul: '×', div: '÷' }[t], R = t === 'add' ? add(A, B) : t === 'sub' ? add(A, neg(B)) : t === 'mul' ? mul(A, B) : div(A, B);
      if (kind === 'missing') {
        const L = lcm(A.d, R.d);
        const q = { add: [`___ + ${par(B)} = ${fq(R)}`, A, `Undo the addition: subtract ${par(B)} from ${fq(R)}. ${fq(R)} − ${par(B)} = ${fq(A)}.`],
                    sub: [`${fmix(A)} − ___ = ${fq(R)}`, B, `The missing number is what you take away: ${fmix(A)} − ${fq(R)} = ${fq(B)}.`],
                    mul: [`${fmix(A)} × ___ = ${fq(R)}`, B, `Undo the multiplication: divide. ${fq(R)} ÷ ${par(A)} = ${fq(R)} × ${fq(Q.mk(A.d, A.n))} = ${fq(B)}.`],
                    div: [`___ ÷ ${par(B)} = ${fq(R)}`, A, `Undo the division: multiply. ${fq(R)} × ${par(B)} = ${fq(A)}.`] }[t];
        return { kind: 'blank', num: true, ask: `Find the missing number: ${q[0]}`, a: forms(q[1]), why: `${q[2]} Check: put ${fq(q[1])} back in and the two sides are equal.`, worked: `${q[2]} Check: put ${fq(q[1])} back in and the two sides are equal.`, clue: t === 'add' || t === 'sub' ? 'Undo the operation with its opposite.' : 'Multiplication and division undo each other.' }; }
      const W = { add: Q.mk(A.n + B.n, A.d + B.d), sub: add(A, B), mul: div(A, B), div: mul(A, B) }[t], why = { add: `He added the tops and the bottoms. That is never allowed: first make the denominators the same (LCM), then add only the numerators.`, sub: `He added ${fq(B)} instead of subtracting it. Subtracting means adding the opposite: ${fmix(A)} + ${par(neg(B))}.`, mul: `He divided instead of multiplying. To multiply, multiply the tops and multiply the bottoms.`, div: `He forgot to flip the divisor. Dividing by ${fq(B)} means multiplying by ${fq(Q.mk(B.d, B.n))}.` }[t];
      if (W.n * R.d === R.n * W.d) return HARD.op(Object.assign({}, o, { word: false, _k: 'missing' }));
      const nm = NM(), right = `No, it should be ${fq(R)}`, wrong2 = `No, it should be ${fq(R.n === 0 ? Q.mk(1, 1) : neg(R))}`;
      return { kind: 'mcq', text: `${nm} worked out ${fmix(A)} ${sym} ${par(B)} and got ${fq(W)}. Is ${nm} right?`, opts: shuffle([`Yes, ${fq(W)} is right`, right, wrong2]), ans: right, why: `${why} The correct answer is ${fq(R)}.`, clue: 'Work it out yourself first, then compare.' }; },
    place(o) { return T.place(Object.assign({}, o, LV.place(3))); },
    between() { const d = pick([6, 7, 8, 9]); let n; do n = int(d + 1, d * 6); while (n % d === 0); const q = Q.mk(-n, d), lo = Math.floor(Q.val(q));
      return { kind: 'mcq', text: `Between which two integers does ${fq(q)} lie?`, opts: shuffle([pair(lo), pair(lo + 1), pair(lo - 1), pair(-lo - 1)].filter((x, i, a) => a.indexOf(x) === i)), ans: pair(lo), why: `${fq(q)} = ${fmix(q)} (${n} ÷ ${d} = ${Math.trunc(n / d)} remainder ${n % d}). A negative number lies left of 0, so it lies between ${pair(lo)}.`, clue: 'Change it to a mixed number. Careful with the minus sign.' }; },
    compare() { const w = int(1, 3), a = proper([4, 5, 8]), mixd = add(Q.mk(w, 1), a), dec = +(Q.val(mixd) + pick([-0.05, 0.05, -0.1, 0.1, 0])).toFixed(2), A = neg(mixd), B = Q.parse(String(-dec)), c = A.n * B.d - B.n * A.d, ans = c < 0 ? '<' : c > 0 ? '>' : '=';
      return { kind: 'mcq', text: `Which sign is correct? ${fmix(A)} ? ${M(-dec)}`, opts: ['<', '>', '='], ans, why: `${fmix(neg(A))} = ${+Q.val(neg(A)).toFixed(3)} as a decimal. Compare the sizes: ${+Q.val(neg(A)).toFixed(3)} and ${dec}. Both are negative, so the one with the bigger size is smaller. So ${fmix(A)} ${ans} ${M(-dec)}.`, clue: 'Change the mixed number to a decimal. With negatives, bigger size means smaller number.' }; },
    abs() { const x = int(-9, 9) || -4, a = int(2, 5), b = int(1, 9), v = Math.abs(a * x - b) - Math.abs(x);
      return { kind: 'blank', num: true, ask: `If x = ${M(x)}, then |${a}x − ${b}| − |x| = ___`, a: [String(v)], why: `${a}x = ${a} × ${par(Q.mk(x, 1))} = ${M(a * x)}. ${M(a * x)} − ${b} = ${M(a * x - b)}, so |${a}x − ${b}| = ${Math.abs(a * x - b)}. |x| = |${M(x)}| = ${Math.abs(x)}. ${Math.abs(a * x - b)} − ${Math.abs(x)} = ${M(v)}.`, worked: `${a}x = ${M(a * x)}; ${M(a * x)} − ${b} = ${M(a * x - b)}; |${M(a * x - b)}| = ${Math.abs(a * x - b)}; |${M(x)}| = ${Math.abs(x)}; ${Math.abs(a * x - b)} − ${Math.abs(x)} = ${M(v)}.`, clue: 'Put the number in for x. Work inside the bars first.' }; },
    abseq(o) { return T.abseq(Object.assign({}, o, { shift: true })); },
    opposite() { const q = Q.mk(int(1, 12) * sgn(), pick([2, 3, 4, 5, 7])); return { kind: 'blank', num: true, ask: `−(−(${fmix(q)})) = ___`, a: forms(q), why: `The opposite of ${fmix(q)} is ${fmix(neg(q))}. The opposite of that is ${fmix(q)} again. Two opposites cancel.`, clue: 'Work from the inside: take the opposite twice.' }; },
    mixed() { const d = pick([3, 4, 5, 6, 7, 8, 9]), w = int(2, 9); let n = int(1, d - 1); while (Q.gcd(n, d) !== 1) n = int(1, d - 1); const q = Q.mk(w * d + n, d);
      return { kind: 'blank', num: false, ask: `As an improper fraction, ${w} ${n}/${d} = ___`, a: [fq(q)], why: `${w} wholes = ${w} × ${d} = ${w * d} parts of ${d}. Add the ${n}: ${w * d} + ${n} = ${w * d + n}. So ${w} ${n}/${d} = ${fq(q)}.`, clue: 'Whole × denominator + numerator, over the same denominator.' }; },
    classify() { const pickOne = pick([['−8/4', 2, '−8/4 = −2, an integer. So it is in ℤ and ℚ.'], ['0/5', 1, '0/5 = 0, a whole number.'], ['12/3', 0, '12/3 = 4, a natural number.'], ['−0.5', 3, '−0.5 = −1/2, not an integer.'], ['6/4', 3, '6/4 = 3/2, not an integer.']]);
      return { kind: 'mcq', text: `Simplify first! What is the smallest set that contains ${pickOne[0]}?`, opts: ['ℕ', 'W', 'ℤ', 'ℚ'], ans: ['ℕ', 'W', 'ℤ', 'ℚ'][pickOne[1]], why: pickOne[2], clue: 'Divide the top by the bottom first. Is the result an integer?' }; },
    share() { const k = pick([3, 4, 5]), m = pick([2, 3]), n = pick([2, 3, 4]), nm = NM(), rest1 = Q.mk(k - 1, k), fatherPart = mul(rest1, Q.mk(1, m)), rest2 = add(rest1, neg(fatherPart)), each = div(rest2, Q.mk(n, 1));
      return { kind: 'blank', num: true, ask: `${nm}'s mother takes 1/${k} of a cake. The father takes 1/${m} of what is left. ${n} children share the rest equally. Each child gets ___ of the cake.`, a: forms(each), why: `After the mother: 1 − 1/${k} = ${fq(rest1)}. The father takes 1/${m} of ${fq(rest1)} = ${fq(fatherPart)}. Left: ${fq(rest1)} − ${fq(fatherPart)} = ${fq(rest2)}. Each child: ${fq(rest2)} ÷ ${n} = ${fq(each)}.`, worked: `1 − 1/${k} = ${fq(rest1)}; 1/${m} × ${fq(rest1)} = ${fq(fatherPart)}; ${fq(rest1)} − ${fq(fatherPart)} = ${fq(rest2)}; ${fq(rest2)} ÷ ${n} = ${fq(each)}.`, clue: 'Go one step at a time: what is left after each person?' }; },
    interest() { const nm = NM(), P = int(10, 60) * 100, R = int(5, 15), T2 = int(2, 4), I = P * R / 100 * T2, A = P + I;
      return { kind: 'blank', num: true, ask: `${nm} saves Birr ${P} at ${R}% simple interest per year. How much money will ${nm} have after ${T2} years (savings + interest)? Birr ___`, a: [String(A)], why: `First the interest: I = P × R × T = ${P} × ${R / 100} × ${T2} = ${I}. Then add it to the savings: ${P} + ${I} = ${A}.`, worked: `I = ${P} × ${R / 100} × ${T2} = ${I}; total = ${P} + ${I} = ${A}.`, clue: 'Find the interest first, then add the savings.' }; },
  };
  const api = {
    has: s => !!(s && s.gen && T[s.gen.t]),
    list: () => Object.keys(T),
    make(s, seed, lang, level) { if (!api.has(s)) return s; r = seed == null ? Math.random : rng(seed);
      try { const L = level || s.gen.level || 0, t = s.gen.t, o = Object.assign({ lang: lang || (typeof LL !== 'undefined' && LL) || 'en' }, s.gen, L && LV[t] ? LV[t](L) : {});
        const v = L === 3 && HARD[t] && (!LV[t] || r() < .7) ? HARD[t](o, s) : T[t](o, s); if (L) v.level = L; const out = Object.assign({}, s, { title: s.title ? s.title.replace(/^(Example|Exercise|Activity|Group work)[^:]*:\s*/i, '') : s.title }, v, { _gen: true });
        ['ask', 'text', 'worked', 'opts', 'ans', 'pool', 'items', 'targets', 'min', 'max', 'sub', 'num'].forEach(k => { if (!(k in v)) delete out[k]; });
        if (['grid', 'cubes', 'ladder', 'blank'].includes(v.kind) && ['area', 'count', 'volume', 'convert', 'litres'].includes(s.gen.t)) ['say', 'intro', 'w', 'h', 'l', 'cube', 'layers', 'from', 'to', 'value', 'mode', 'unit', 'a', 'poly', 'cols', 'rows', 'graded'].forEach(k => { if (!(k in v)) delete out[k]; }); delete out.ref; return out; }
      catch (e) { return s; } finally { r = Math.random; } },
  };
  return api;
})();
/* GEN-END */

// a number label in SVG: fractions are drawn stacked, like the book
function svgNum(x, y, str, col, size = 13) {
  const m = String(str).match(/^([−-])?(\d+ )?(\d+)\/(\d+)$/);
  const st = `style="fill:${col || 'var(--fg)'}" font-weight="800" text-anchor="middle"`;
  if (!m) return `<text x="${x}" y="${y}" font-size="${size}" ${st}>${esc(str)}</text>`;
  const w = Math.max(m[3].length, m[4].length) * size * .58 + 4, sign = m[1] ? '−' : '', whole = m[2] ? m[2].trim() : '';
  const pre = sign + whole, px = pre ? x - (pre.length * size * .32) : x, fx = pre ? px + pre.length * size * .32 + w / 2 + 1 : x;
  return (pre ? `<text x="${px}" y="${y - 2}" font-size="${size}" ${st}>${pre}</text>` : '') + `<text x="${fx}" y="${y - 9}" font-size="${size - 2}" ${st}>${m[3]}</text><line x1="${fx - w / 2}" x2="${fx + w / 2}" y1="${y - 5}" y2="${y - 5}" style="stroke:${col || 'var(--fg)'}" stroke-width="1.5"/><text x="${fx}" y="${y + 7}" font-size="${size - 2}" ${st}>${m[4]}</text>`;
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
  const head = s => `<span class="eyebrow sky">${esc(s._from || (['hook', 'explore', 'notice', 'check', 'practise'].includes(s.step) ? t('step_' + s.step) : ''))}</span>${s.graded && s.level ? levelTag(s) : ''}${s.ref ? `<span class="ref">📖 ${esc(s.ref)}</span>` : ''}${s.title ? `<h1 class="display" tabindex="-1">${esc(s.title)}</h1>` : ''}${s.text ? `<p class="lead">${esc(s.text)}</p>` : ''}`;
  const choice = (s, opts, ans, row2) => {
    const el = div(head(s) + (s.ask ? `<p class="ask">${esc(s.ask)}</p>` : '') + `<div class="opts${row2 ? ' row2' : ''}" role="radiogroup">${opts.map(o => `<button class="opt" role="radio" aria-checked="false" data-v="${esc(o)}">${fig(o)}</button>`).join('')}</div>`);
    let pick = null;
    el.querySelector('.opts').addEventListener('click', e => { const b = e.target.closest('.opt'); if (!b || b.disabled || env.phase() !== 'answer') return; pick = b; el.querySelectorAll('.opt').forEach(x => x.setAttribute('aria-checked', x === b)); env.update(); });
    return { el, label: t('check'), ready: () => !!pick, check() { const ok = pick.dataset.v === ans; pick.classList.add(ok ? 'ok' : 'no'); if (ok) el.querySelectorAll('.opt').forEach(x => x.disabled = true); else pick.disabled = true; return ok ? { ok: true, body: s.why } : { ok: false, body: s.clue }; }, retry() { pick = null; el.querySelectorAll('.opt').forEach(x => x.setAttribute('aria-checked', 'false')); } };
  };
  /* ---- counting figures (Grade 5 Unit 1): tile a rectangle, count whole/half squares, stack unit cubes ---- */
  // one number input under a counting figure; used when the screen is graded ("ans")
  const countInput = (el, s) => { const row = document.createElement('p'); row.className = 'blank'; row.hidden = true; row.innerHTML = `<span>${esc(t('tile_answer'))}</span><input class="cin" inputmode="decimal" autocomplete="off" aria-label="${esc(t('your_answer'))}">`;
    el.querySelector('.fig').appendChild(row); const inp = row.querySelector('input'); inp.addEventListener('input', () => env.update()); inp.addEventListener('keydown', e => { if (e.key === 'Enter') env.enter(); });
    return { show() { row.hidden = false; }, val: () => inp.value, filled: () => inp.value.trim() !== '',
      verdict(ok) { inp.classList.remove('ok', 'no'); inp.classList.add(ok ? 'ok' : 'no'); inp.disabled = ok; }, retry() { inp.classList.remove('ok', 'no'); inp.focus(); } }; };
  const gradedResult = (s, ci, ready) => ({ label: t('check'), ready: () => ready() && ci.filled(),
    check() { const nm = numMatch(ci.val(), [String(s.ans)]); const ok = nm === true; ci.verdict(ok); return ok ? { ok: true, body: s.why || '' } : { ok: false, body: s.clue || '' }; }, retry() { ci.retry(); } });
  const sideLabel = (x, y, str, anchor = 'middle') => `<text x="${x}" y="${y}" font-size="13" font-weight="800" text-anchor="${anchor}" style="fill:var(--muted)">${esc(str)}</text>`;

  // grid mode "tile": ▶ fills the rectangle one row at a time; the count runs under it. ("big" shows 10 × 10 blocks for huge grids)
  const tileG = s => {
    const W = s.w, H = s.h, big = W * H > 400 || s.big, dw = big ? Math.min(W, 10) : W, dh = big ? Math.min(H, 10) : H, per = (W / dw) * (H / dh), rowCells = W * H / dh;
    const cs = Math.max(8, Math.min(34, Math.floor(250 / dw), Math.floor(210 / dh))), x0 = 70, y0 = 26, VH = y0 + cs * dh + 22, unit = s.unit || '';
    const say = s.say || []; let k = 0; const graded = s.graded && s.ans != null;
    const el = div(head(s) + (s.ask ? `<p class="ask">${esc(s.ask)}</p>` : '') + `<div class="fig grd"><svg viewBox="0 0 340 ${VH}" role="img" aria-label="${esc(s.title || `${W} × ${H}`)}"></svg><p class="small gp"></p><p class="cnt" aria-live="polite"></p><button class="inner" id="gnx">▶ ${t('next_step')}</button></div>`);
    const svg = el.querySelector('svg'), tip = el.querySelector('.gp'), cnt = el.querySelector('.cnt'), nx = el.querySelector('#gnx'), ci = graded ? countInput(el, s) : null;
    const draw = () => { let g = sideLabel(x0 + cs * dw / 2, 16, `${W}${unit ? ' ' + unit : ''}`) + sideLabel(x0 - 6, y0 + cs * dh / 2 + 4, `${H}${unit ? ' ' + unit : ''}`, 'end');
      for (let r = 0; r < dh; r++) for (let c = 0; c < dw; c++) { const on = r < k, cur = r === k - 1;
        g += `<rect x="${x0 + c * cs}" y="${y0 + r * cs}" width="${cs}" height="${cs}" style="fill:${on ? (cur ? 'var(--sun)' : 'var(--sky)') : 'var(--surface-2)'};stroke:var(--fg)" fill-opacity="${on ? .55 : 1}" stroke-opacity=".55" stroke-width="1"/>`;
        if (on && c === 0 && cs >= 18) g += `<text x="${x0 + cs / 2}" y="${y0 + r * cs + cs / 2 + 5}" font-size="12" font-weight="800" text-anchor="middle" style="fill:var(--fg)">${r + 1}</text>`; }
      g += `<rect x="${x0}" y="${y0}" width="${cs * dw}" height="${cs * dh}" fill="none" style="stroke:var(--fg)" stroke-width="2"/>`;
      if (big) g += sideLabel(x0 + cs * dw / 2, y0 + cs * dh + 16, `▢ = ${per}${s.perUnit ? ' ' + s.perUnit : ''}`);
      svg.innerHTML = g;
      tip.textContent = k ? (say[k - 1] || '') : (s.intro || '');
      cnt.textContent = k ? (big ? `${k} × ${rowCells} = ${k * rowCells}` : `${k} ${t('row_w')} × ${W} = ${k * W}`) : '';
      nx.disabled = k >= dh; if (k >= dh && ci) ci.show(); };
    nx.onclick = () => { if (k < dh) k++; draw(); env.update(); };
    draw();
    return Object.assign({ el }, graded ? gradedResult(s, ci, () => k >= dh) : { label: t('continue'), ready: () => k >= dh });
  };

  // grid mode "shape": count whole and half squares under a shape. The answer is the shape's own area, never typed from the book.
  const shapeG = s => {
    const C = s.cols, R_ = s.rows, cs = Math.max(14, Math.min(34, Math.floor(300 / C), Math.floor(230 / R_))), x0 = Math.round((340 - cs * C) / 2), y0 = 6, VH = y0 + cs * R_ + 8;
    const inside = s.ellipse ? (x, y) => ((x - s.ellipse[0]) / s.ellipse[2]) ** 2 + ((y - s.ellipse[1]) / s.ellipse[3]) ** 2 <= 1
      : (x, y) => { let c = false; const P = s.poly; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { if (((P[i][1] > y) !== (P[j][1] > y)) && (x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0])) c = !c; } return c; };
    let area = 0; if (s.ellipse) area = Math.PI * s.ellipse[2] * s.ellipse[3]; else { const P = s.poly; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; area += a[0] * b[1] - b[0] * a[1]; } area = Math.abs(area) / 2; }
    const tol = s.tol != null ? s.tol : (s.ellipse || s.estimate ? 2 : 0), mark = Array(C * R_).fill(0); let touched = false;
    const el = div(head(s) + (s.ask ? `<p class="ask">${esc(s.ask)}</p>` : '') + `<div class="fig grd shp"><svg viewBox="0 0 340 ${VH}" role="img" aria-label="${esc(s.title || 'shape on a grid')}"></svg><p class="cnt" aria-live="polite"></p><p class="small muted">${esc(t('cell_hint'))}</p></div>`);
    const svg = el.querySelector('svg'), cnt = el.querySelector('.cnt');
    const total = () => { const a = mark.filter(m => m === 1).length, b = mark.filter(m => m === 2).length; return [a, b, a + b / 2]; };
    const draw = () => { let g = '';
      for (let r = 0; r < R_; r++) for (let c = 0; c < C; c++) { const m = mark[r * C + c], x = x0 + c * cs, y = y0 + r * cs;
        g += `<rect data-i="${r * C + c}" x="${x}" y="${y}" width="${cs}" height="${cs}" style="fill:${m === 1 ? 'var(--accent)' : m === 2 ? 'var(--sun)' : 'var(--surface-2)'};stroke:var(--fg);cursor:pointer" fill-opacity="${m ? .55 : .35}" stroke-opacity=".45" stroke-width="1"/>`;
        if (m && cs >= 18) g += `<text x="${x + cs / 2}" y="${y + cs / 2 + 5}" font-size="13" font-weight="800" text-anchor="middle" style="fill:var(--fg);pointer-events:none">${m === 1 ? '1' : '½'}</text>`; }
      const pts = s.ellipse ? '' : s.poly.map(p => `${x0 + p[0] * cs},${y0 + p[1] * cs}`).join(' ');
      g += s.ellipse ? `<ellipse cx="${x0 + s.ellipse[0] * cs}" cy="${y0 + s.ellipse[1] * cs}" rx="${s.ellipse[2] * cs}" ry="${s.ellipse[3] * cs}" fill="none" style="stroke:var(--coral);pointer-events:none" stroke-width="3"/>` : `<polygon points="${pts}" fill="none" style="stroke:var(--coral);pointer-events:none" stroke-width="3" stroke-linejoin="round"/>`;
      svg.innerHTML = g; const [a, b, tot] = total(); cnt.textContent = `${t('whole_w')} ${a} + ${t('half_w')} ${b} × ½ = ${tot}`; };
    svg.addEventListener('click', e => { const c = e.target.closest('[data-i]'); if (!c || env.phase() !== 'answer') return; const i = +c.dataset.i; mark[i] = (mark[i] + 1) % 3; touched = true; draw(); env.update(); });
    draw();
    const ok = () => Math.abs(total()[2] - area) <= tol + 1e-9;
    return { el, label: s.graded ? t('check') : t('continue'), ready: () => touched,
      check: s.graded ? () => ok() ? { ok: true, body: s.why || '' } : { ok: false, body: s.clue || '' } : undefined, retry() {} };
  };

  // ladder: the unit staircase (km · m · cm · mm, or the area / volume versions). Explore: tap a rung. Convert: ▶ hops one rung at a time.
  const LAD = { 1: [['ኪ.ሜ', 'ሜ', 'ሳ.ሜ', 'ሚ.ሜ'], [1000, 100, 10]], 2: [['ኪ.ሜ²', 'ሄክታር', 'ሜ²', 'ሳ.ሜ²', 'ሚ.ሜ²'], [100, 10000, 10000, 100]], 3: [['ኪ.ሜ³', 'ሜ³', 'ሳ.ሜ³', 'ሚ.ሜ³'], [1e9, 1e6, 1000]] };
  const nf = n => { const v = Math.round(n * 1e9) / 1e9, [i, d] = String(v).split('.'); return i.replace(/\B(?=(\d{3})+$)/g, ',') + (d ? '.' + d : ''); };
  const ladderG = s => {
    const [dU, dF] = LAD[s.power || 1] || LAD[1], U = s.units || dU, F = s.factors || dF, n = U.length;
    const fi = s.from != null ? U.indexOf(s.from) : -1, ti = s.to != null ? U.indexOf(s.to) : -1, conv = fi >= 0 && ti >= 0 && fi !== ti, dir = ti > fi ? 1 : -1, hops = conv ? Math.abs(ti - fi) : 0;
    const vals = [s.value]; for (let j = 0; j < hops; j++) { const a = fi + dir * j; vals.push(dir > 0 ? vals[j] * F[a] : vals[j] / F[a - 1]); }
    const say = s.say || [], graded = s.graded && s.ans != null; let k = 0, sel = -1; const picked = new Set();
    const wide = F.some(f => nf(f).length > 9), RH = 30, GAP = 24, VH = 12 + n * RH + (n - 1) * GAP + 8, x0 = wide ? 118 : 100, rw = wide ? 104 : 150, lf = wide ? 10.5 : 13;
    const el = div(head(s) + (s.ask ? `<p class="ask">${esc(s.ask)}</p>` : '') + `<div class="fig grd lad"><svg viewBox="0 0 340 ${VH}" role="img" aria-label="${esc(s.title || U.join(' · '))}"></svg><p class="small gp"></p>${s.power === 3 && s.litre !== false && !s.units ? `<p class="small muted">1 ሜ³ = 1,000 ሊ · 1 ሊ = 1,000 ሳ.ሜ³ · 1 ሚ.ሊ = 1 ሳ.ሜ³</p>` : ''}${conv ? `<button class="inner" id="gnx">▶ ${t('next_step')}</button>` : ''}</div>`);
    const svg = el.querySelector('svg'), tip = el.querySelector('.gp'), nx = el.querySelector('#gnx'), ci = graded ? countInput(el, s) : null;
    const at = i => { const j = (i - fi) * dir; return conv && j >= 0 && j <= k ? vals[j] : null; };
    const draw = () => { let g = '';
      for (let i = 0; i < n; i++) { const y = 12 + i * (RH + GAP), v = at(i), now = conv && i === fi + dir * k, hot = now ? 'var(--sun)' : v != null ? 'var(--sky-soft, var(--sky))' : sel === i ? 'var(--sun-soft, var(--sun))' : 'var(--surface-2)';
        g += `<g data-i="${i}" style="cursor:pointer"><rect x="${x0}" y="${y}" width="${rw}" height="${RH}" rx="8" style="fill:${hot};stroke:var(--fg)" stroke-width="${now ? 3 : 1.5}"/><text x="${x0 + rw / 2}" y="${y + 20}" font-size="${v != null ? 15 : 14}" font-weight="800" text-anchor="middle" style="fill:var(--fg)">${v != null ? esc(nf(v) + ' ' + U[i]) : esc(U[i])}</text></g>`;
        if (i < n - 1) { const my = y + RH + GAP / 2 + 5; g += `<text x="${x0 - 8}" y="${my}" font-size="${lf}" font-weight="800" text-anchor="end" style="fill:var(--coral)">↓ ×${wide ? "" : " "}${nf(F[i])}</text><text x="${x0 + rw + 8}" y="${my}" font-size="${lf}" font-weight="800" style="fill:var(--sky)">↑ ÷${wide ? "" : " "}${nf(F[i])}</text>`; } }
      svg.innerHTML = g;
      if (conv) { const a = fi + dir * (k - 1), f = dir > 0 ? F[a] : F[a - 1]; tip.textContent = k ? (say[k - 1] || (dir > 0 ? `${nf(vals[k - 1])} ${U[a]} × ${nf(f)} = ${nf(vals[k])} ${U[a + 1]}` : `${nf(vals[k - 1])} ${U[a]} ÷ ${nf(f)} = ${nf(vals[k])} ${U[a - 1]}`)) : (s.intro || ''); nx.disabled = k >= hops; if (k >= hops && ci) ci.show(); }
      else if (sel >= 0) tip.textContent = [sel < n - 1 ? `1 ${U[sel]} = ${nf(F[sel])} ${U[sel + 1]}` : '', sel > 0 ? `${nf(F[sel - 1])} ${U[sel]} = 1 ${U[sel - 1]}` : ''].filter(Boolean).join(' · ');
      else tip.textContent = s.intro || t('ladder_tap'); };
    svg.addEventListener('click', e => { const c = e.target.closest('[data-i]'); if (!c || conv) return; sel = +c.dataset.i; picked.add(sel); draw(); env.update(); });
    if (nx) nx.onclick = () => { if (k < hops) k++; draw(); env.update(); };
    draw();
    const done = () => conv ? k >= hops : picked.size >= (s.need != null ? s.need : 2);
    return Object.assign({ el }, graded ? gradedResult(s, ci, done) : { label: t('continue'), ready: done });
  };

  // cubes: a stack of unit cubes built one row, then one layer at a time (oblique drawing, like the book's boxes)
  const cubesG = s => {
    const L = s.l, Wd = s.cube ? s.l : (s.w || 1), Ht = s.cube ? s.l : (s.h || 1), map = s.layers || null;
    const rows = map ? map.length : Wd, cols = map ? Math.max(...map.map(r => r.length)) : L, maxH = map ? Math.max(...map.flat()) : Ht;
    const hgt = (j, i) => map ? ((map[j] || [])[i] || 0) : Ht;
    const steps = [{ lv: 1, row: true }, ...Array.from({ length: maxH }, (_, q) => ({ lv: q + 1 }))]; const n = steps.length;
    const u = Math.min(40, 270 / (cols + .5 * rows), 190 / (maxH + .5 * rows)), dx = .5 * u, dy = .5 * u, bw = cols * u + rows * dx, bh = maxH * u + rows * dy, ox = (340 - bw) / 2, oy = 8 + bh; // oy = y of the front-bottom edge
    const graded = s.graded && s.ans != null, say = s.say || []; let k = 0;
    const el = div(head(s) + (s.ask ? `<p class="ask">${esc(s.ask)}</p>` : '') + `<div class="fig grd"><svg viewBox="0 0 340 ${Math.round(bh + 16)}" role="img" aria-label="${esc(s.title || 'cubes')}"></svg><p class="small gp"></p><p class="cnt" aria-live="polite"></p><button class="inner" id="gnx">▶ ${t('next_step')}</button></div>`);
    const svg = el.querySelector('svg'), tip = el.querySelector('.gp'), cnt = el.querySelector('.cnt'), nx = el.querySelector('#gnx'), ci = graded ? countInput(el, s) : null;
    const COL = ['var(--sky)', 'var(--sun)', 'var(--coral)', 'var(--accent)', 'var(--violet)', 'var(--sky)'];
    const showCube = (j, i, z) => { const st = k === 0 ? -1 : k - 1, sp = steps[st]; if (!sp) return false; if (z + 1 < sp.lv) return true; if (z + 1 > sp.lv) return false; return sp.row ? j === 0 : true; };
    const poly = (pts, fill, op, extra = '') => `<polygon points="${pts.map(p => p.join(',')).join(' ')}" style="fill:${fill}" fill-opacity="${op}" stroke="var(--fg)" stroke-opacity=".55" stroke-width="1" ${extra}/>`;
    const draw = () => { let g = '', count = 0;
      if (!map) { const x = ox, y = oy, w = cols * u, h = Ht * u; g += `<path d="M${x} ${y}h${w}v${-h}h${-w}zM${x + w} ${y}l${rows * dx} ${-rows * dy}v${-h}l${-rows * dx} ${rows * dy}M${x} ${y - h}l${rows * dx} ${-rows * dy}h${w}" fill="none" style="stroke:var(--muted)" stroke-width="1.5" stroke-dasharray="4 4"/>`; }
      for (let j = rows - 1; j >= 0; j--) for (let z = 0; z < maxH; z++) for (let i = 0; i < cols; i++) { if (z >= hgt(j, i) || !showCube(j, i, z)) continue; count++;
        const x = ox + i * u + j * dx, y = oy - z * u - j * dy, c = COL[z % COL.length];
        g += poly([[x, y], [x + u, y], [x + u, y - u], [x, y - u]], c, .85) + poly([[x, y - u], [x + u, y - u], [x + u + dx, y - u - dy], [x + dx, y - u - dy]], '#fff', .5) + poly([[x + u, y], [x + u + dx, y - dy], [x + u + dx, y - u - dy], [x + u, y - u]], '#000', .22); }
      svg.innerHTML = g; tip.textContent = k ? (say[k - 1] || '') : (s.intro || '');
      const sp = steps[k - 1]; cnt.textContent = !k ? '' : map ? `${t('count_total')}: ${count}` : sp.row ? `${L} ${t('cubes_w')}` : sp.lv === 1 ? `${Wd} ${t('row_w')} × ${L} = ${Wd * L}` : `${sp.lv} ${t('layer_w')} × ${Wd * L} = ${sp.lv * Wd * L}`;
      nx.disabled = k >= n; if (k >= n && ci) ci.show(); };
    nx.onclick = () => { if (k < n) k++; draw(); env.update(); };
    draw();
    return Object.assign({ el }, graded ? gradedResult(s, ci, () => k >= n) : { label: t('continue'), ready: () => k >= n });
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
    blank(s) { const [a, b] = (s.ask || '___').split('___'), signed = s.input === 'signed'; let sign = '';
      const el = div(head(s) + `<div class="fig"><p class="blank"><span>${esc(a)}</span>${signed ? `<span class="sgn" role="group" aria-label="${t('sign')}"><button type="button" data-s="+">+</button><button type="button" data-s="−">−</button></span>` : ''}<input id="bl" autocomplete="off" aria-label="${t('your_answer')}"><span>${esc(b || '')}</span></p><p class="small muted">${s.num ? t(signed ? 'signed_note' : 'num_note') : t('spelling_note')}</p></div>`); const inp = el.querySelector('#bl'); inp.addEventListener('input', () => env.update()); inp.addEventListener('keydown', e => { if (e.key === 'Enter') env.enter(); });
      if (signed) el.querySelector('.sgn').onclick = e => { const bt = e.target.closest('button'); if (!bt || inp.disabled) return; sign = bt.dataset.s; el.querySelectorAll('.sgn button').forEach(x => x.setAttribute('aria-pressed', x === bt)); env.update(); };
      const val = () => signed ? (sign === '−' ? '-' : '') + inp.value.trim().replace(/^[+−-]\s*/, '') : inp.value;
      return { el, label: t('check'), ready: () => inp.value.trim() !== '' && (!signed || !!sign), check() { const nm = s.num ? numMatch(val(), s.a.map(String)) : null; const r = nm === true ? { ok: true } : nm === false ? { ok: false } : matchAnswer(val(), s.a.map(String)); inp.className = r.ok ? 'ok' : 'no'; inp.disabled = r.ok; return r.ok ? { ok: true, body: (r.near ? t('right_idea', { a: r.near }) + ' ' : '') + (s.why || '') } : { ok: false, body: s.clue }; }, retry() { inp.className = ''; inp.focus(); } }; },
    sort(s) { const el = div(head(s) + `<div class="fig"><p class="display" id="it" style="text-align:center;font-size:22px"></p><div class="opts" id="bins">${s.bins.map(b => `<button class="opt center">${esc(b)}</button>`).join('')}</div><p class="small muted" id="fb"></p></div>`); let i = 0, wrong = 0; const draw = () => { el.querySelector('#it').innerHTML = i < s.items.length ? fig(s.items[i][0]) : ''; };
      el.querySelector('#bins').addEventListener('click', e => { const b = e.target.closest('.opt'); if (!b || i >= s.items.length || env.phase() !== 'answer') return; const [name, ans, why] = s.items[i]; const ok = b.textContent === ans; if (!ok) wrong++; el.querySelector('#fb').textContent = (ok ? '✓ ' : '✗ ') + `${String(name)[0] === '@' ? '' : name + ' → '}${ans}. ${why || ''}`; i++; draw(); if (i >= s.items.length) { el.querySelector('#bins').querySelectorAll('.opt').forEach(x => x.disabled = true); } env.update(); }); draw();
      return { el, label: t('check'), ready: () => i >= s.items.length, check() { return wrong ? { ok: false, body: s.clue || `${wrong} / ${s.items.length}` } : { ok: true, body: s.why || '' }; }, retry() { i = 0; wrong = 0; el.querySelector('#bins').querySelectorAll('.opt').forEach(x => x.disabled = false); draw(); } }; },
    tap(s) { const el = div(head(s) + `<div class="fig"><div class="chips">${s.items.map((it, k) => `<button class="chip" data-k="${k}" aria-pressed="false">${fig(it[0])}</button>`).join('')}</div><div class="result" id="info">${esc(s.ask || '')}</div></div>` + explainCard(s)); const seen = new Set();
      el.querySelector('.chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; const k = +b.dataset.k; seen.add(k); el.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === b)); el.querySelector('#info').innerHTML = `${String(s.items[k][0])[0] === '@' ? '' : `<strong>${esc(s.items[k][0])}</strong>`}${esc(s.items[k][1])}`; env.update(); });
      return { el, label: t('continue'), ready: () => seen.size >= Math.min(s.need || s.items.length, s.items.length) }; },
    order(s) { const mixed = s.items.slice().sort(() => Math.random() - .5); const el = div(head(s) + `<div class="fig"><div class="chips" id="pool">${mixed.map(x => `<button class="chip" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div><ol class="steps oseq" id="seq"></ol><button class="btn ghost small undo" id="undo" hidden>↶ ${t('undo')}</button><p class="small muted">${t('order_hint')}</p></div>`); let seq = [];
      const pool = el.querySelector('#pool'), ol = el.querySelector('#seq'), un = el.querySelector('#undo');
      const draw = () => { ol.innerHTML = seq.map((x, i) => `<li><button class="oit" data-i="${i}" aria-label="${t('remove')} ${esc(x)}">${esc(x)} <span class="x" aria-hidden="true">✕</span></button></li>`).join(''); pool.querySelectorAll('.chip').forEach(c => c.disabled = seq.includes(c.dataset.v)); un.hidden = !seq.length || env.phase() !== 'answer'; env.update(); };
      pool.addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b || b.disabled || env.phase() !== 'answer') return; seq.push(b.dataset.v); draw(); });
      ol.addEventListener('click', e => { const b = e.target.closest('.oit'); if (!b || env.phase() !== 'answer') return; seq.splice(+b.dataset.i, 1); draw(); });
      un.onclick = () => { if (env.phase() !== 'answer') return; seq.pop(); draw(); };
      return { el, label: t('check'), ready: () => seq.length === s.items.length, check() { const ok = seq.every((x, i) => x === s.items[i]); if (ok) { un.hidden = true; ol.querySelectorAll('.oit').forEach(x => x.disabled = true); } return ok ? { ok: true, body: s.why } : { ok: false, body: s.clue || s.why }; }, retry() { draw(); } }; },
    match(s) { const rights = s.pairs.map((p, j) => [p[1], j]).sort(() => Math.random() - .5); const el = div(head(s) + `<div class="fig"><p class="small muted">${t('match_hint')}</p><div class="pairs"><div class="pcol">${s.pairs.map((p, j) => `<button class="pl" data-j="${j}">${fig(p[0])}</button>`).join('')}</div><div class="pcol">${rights.map(([r, j]) => `<button class="pr" data-x="${j}" data-r="${esc(r)}">${fig(r)}</button>`).join('')}</div></div></div>`);
      const pair = {}, cols = ['g', 's', 'y', 'c', 'v', 'g', 's', 'y']; let sel = null;
      const paint = () => { el.querySelectorAll('.pl').forEach(b => { const j = +b.dataset.j, r = pair[j]; b.className = 'pl' + (sel === j ? ' sel' : '') + (r != null ? ' on h-' + cols[j] : ''); }); el.querySelectorAll('.pr').forEach(b => { const j = Object.keys(pair).find(k => pair[k] === +b.dataset.x); b.className = 'pr' + (j != null ? ' on h-' + cols[+j] : ''); }); env.update(); };
      el.querySelector('.pairs').addEventListener('click', e => { if (env.phase() !== 'answer') return; const l = e.target.closest('.pl'), r = e.target.closest('.pr');
        if (l) { const j = +l.dataset.j; if (pair[j] != null && sel !== j) delete pair[j]; sel = j; paint(); }
        if (r && sel != null) { Object.keys(pair).forEach(k => { if (pair[k] === +r.dataset.x) delete pair[k]; }); pair[sel] = +r.dataset.x; const next = s.pairs.findIndex((_, j) => pair[j] == null); sel = next >= 0 ? next : null; paint(); } });
      sel = 0; setTimeout(paint);
      return { el, label: t('check'), ready: () => s.pairs.every((_, j) => pair[j] != null), check() { const val = j => pair[j] != null ? s.pairs[pair[j]][1] : null, bad = s.pairs.map((p, j) => val(j) === p[1] ? -1 : j).filter(j => j >= 0); if (!bad.length) { el.querySelectorAll('.pl,.pr').forEach(b => b.disabled = true); return { ok: true, body: s.why }; } bad.forEach(j => { const b = el.querySelector(`.pl[data-j="${j}"]`); b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 500); }); return { ok: false, body: s.clue || s.why }; }, retry() { s.pairs.forEach((p, j) => { if (pair[j] == null || s.pairs[pair[j]][1] !== p[1]) delete pair[j]; }); sel = s.pairs.findIndex((_, j) => pair[j] == null); paint(); } }; },
    fracbar(s) { // fraction bars. Explore: ▶ shows each shading step (Fig 1.16, 1.17). Graded ("need"): tap parts to shade that many.
      const bars = s.bars || [{ parts: s.parts, shade: s.shade || [], mark: s.mark }], graded = s.need != null, on = new Set(); let k = 0;
      const steps = []; bars.forEach((b, bi) => (b.shade || []).forEach((_, si) => steps.push([bi, si]))); bars.forEach((b, bi) => { if (b.mark) steps.push([bi, 'm']); });
      const C = { a: 'var(--sky)', b: 'var(--accent)', c: 'var(--sun)', d: 'var(--coral)' }, H = bars.length * 74 + 6;
      const el = div(head(s) + (s.ask ? `<p class="ask">${esc(s.ask)}</p>` : '') + `<div class="fig fbar"><svg viewBox="0 0 340 ${H}" role="img" aria-label="${esc(s.title || 'fraction bar')}"></svg>${!graded && steps.length ? `<button class="inner" id="fbnx">▶ ${t('next_step')}</button>` : ''}<p class="small muted fbp"></p></div>`);
      const svg = el.querySelector('svg'), tip = el.querySelector('.fbp');
      const draw = () => { let g = '';
        bars.forEach((b, bi) => { const y = 6 + bi * 74, w = 320 / b.parts; let start = 0; const fill = Array(b.parts).fill(null);
          (b.shade || []).forEach((sh, si) => { if (graded || steps.findIndex(x => x[0] === bi && x[1] === si) < k) for (let j = start; j < start + sh.n && j < b.parts; j++) fill[j] = C[sh.color || 'a']; start += sh.n; });
          const marked = b.mark && steps.findIndex(x => x[0] === bi && x[1] === 'm') < k ? b.mark.n : 0;
          for (let j = 0; j < b.parts; j++) { const f = graded ? (on.has(bi + ':' + j) ? C.a : null) : fill[j], x = 10 + j * w;
            g += `<rect data-c="${bi}:${j}" x="${x + 1}" y="${y}" width="${w - 2}" height="46" rx="4" style="fill:${f || 'var(--surface-2)'};stroke:var(--line);cursor:${graded ? 'pointer' : 'default'}" fill-opacity="${f ? .75 : 1}" stroke-width="1.5"/>`;
            if (w >= 24) g += `<text x="${x + w / 2}" y="${y + 64}" font-size="11" text-anchor="middle" style="fill:var(--muted)">1/${b.parts}</text>`;
            if (j < marked) g += `<path d="M${x + w / 2 - 8} ${y + 15}l16 16M${x + w / 2 + 8} ${y + 15}l-16 16" style="stroke:var(--bad)" stroke-width="3.5" stroke-linecap="round"/>`; } });
        svg.innerHTML = g;
        if (graded) tip.textContent = `${on.size} / ${bars[0].parts}`;
        else { const said = steps.slice(0, k).map(([bi, si]) => si === 'm' ? bars[bi].mark.label : bars[bi].shade[si].label).filter(Boolean); tip.textContent = k >= steps.length && s.after ? s.after : said.join(' · '); } };
      if (graded) svg.addEventListener('click', e => { const c = e.target.closest('[data-c]'); if (!c || env.phase() !== 'answer') return; on.has(c.dataset.c) ? on.delete(c.dataset.c) : on.add(c.dataset.c); draw(); env.update(); });
      const nx = el.querySelector('#fbnx'); if (nx) nx.onclick = () => { if (k < steps.length) k++; nx.disabled = k >= steps.length; draw(); env.update(); };
      draw();
      return { el, label: graded ? t('check') : t('continue'), ready: () => graded ? on.size > 0 : k >= steps.length,
        check: graded ? () => on.size === s.need ? { ok: true, body: s.why } : { ok: false, body: s.clue || `${on.size} / ${bars[0].parts}` } : undefined, retry() {} };
    },
    grid(s) { // area model for × (Fig 1.18–1.20) and grouping for ÷ (Fig 1.21). ▶ reveals one small step at a time; "say" explains each step, "intro" the start.
      if (s.mode === 'tile') return tileG(s); if (s.mode === 'shape') return shapeG(s);
      const say = s.say || [], groups = s.mode === 'groups'; let k = 0; const n = Math.max(groups ? 4 : 3, say.length);
      const rowsG = groups ? Math.ceil((s.wholes * s.d + s.part) / s.d) : 0;
      const el = div(head(s) + (s.ask ? `<p class="ask">${esc(s.ask)}</p>` : '') + `<div class="fig grd"><svg viewBox="0 0 340 ${groups ? 46 * rowsG + 34 : 240}" role="img" aria-label="${esc(s.title || 'grid model')}"></svg><p class="small gp"></p><button class="inner" id="gnx">▶ ${t('next_step')}</button></div>`);
      const svg = el.querySelector('svg'), tip = el.querySelector('.gp');
      const draw = () => { let g = '';
        if (!groups) { const W = 200, x0 = 70, y0 = 6, cw = W / s.cols, rh = W / s.rows;
          if (k === 0) g += `<rect x="${x0}" y="${y0}" width="${W}" height="${W}" style="fill:var(--surface-2);stroke:var(--fg)" stroke-width="2"/><text x="${x0 + W / 2}" y="${y0 + W / 2 + 6}" font-size="18" font-weight="800" text-anchor="middle" style="fill:var(--muted)"><tspan>${t('one_whole')}</tspan></text>`;
          else for (let i = 0; i < s.cols; i++) for (let j = 0; j < s.rows; j++) { const inC = i < s.shadeCols, inR = j < s.shadeRows;
            const rowsOn = k >= 2, x = x0 + i * cw, y = y0 + j * rh;
            g += `<rect x="${x}" y="${y}" width="${cw}" height="${rh}" style="fill:var(--surface-2);stroke:var(--fg)" stroke-width="${rowsOn ? 1.5 : 0}"/>`;
            if (inC) g += `<rect x="${x}" y="${y}" width="${cw}" height="${rh}" style="fill:var(--sky)" fill-opacity=".45"/>`;
            if (inR && rowsOn) g += `<rect x="${x}" y="${y}" width="${cw}" height="${rh}" style="fill:var(--sun)" fill-opacity=".5"/>`;
            if (inC && inR && k >= 3) g += `<rect x="${x + 3}" y="${y + 3}" width="${cw - 6}" height="${rh - 6}" fill="none" style="stroke:var(--coral)" stroke-width="3.5" rx="3"/><text x="${x + cw / 2}" y="${y + rh / 2 + 6}" font-size="15" font-weight="800" text-anchor="middle" style="fill:var(--coral)">${j + 1}</text>`; }
          if (k >= 1) { g += `<rect x="${x0}" y="${y0}" width="${W}" height="${W}" fill="none" style="stroke:var(--fg)" stroke-width="2"/>`; for (let i = 1; i < s.cols; i++) g += `<line x1="${x0 + i * cw}" x2="${x0 + i * cw}" y1="${y0}" y2="${y0 + W}" style="stroke:var(--fg)" stroke-width="1.5"/>`; g += svgNum(x0 + s.shadeCols * cw / 2, 230, `${s.shadeCols}/${s.cols}`, 'var(--sky)', 15); }
          if (k >= 2) g += svgNum(x0 - 26, y0 + s.shadeRows * rh / 2 + 4, `${s.shadeRows}/${s.rows}`, 'var(--sun-deep)', 15);
          if (k >= 3) g += svgNum(x0 + W + 36, y0 + W / 2 + 4, `${s.shadeCols * s.shadeRows}/${s.cols * s.rows}`, 'var(--coral)', 17); }
        else { const d = s.d, cells = s.wholes * d + s.part, cw = Math.min(56, 220 / d), x0 = 340 - 20 - cw * d, gsz = s.group, gc = ['var(--sky)', 'var(--sun)'];
          for (let rr = 0; rr < rowsG; rr++) { const y = 6 + rr * 46; g += `<text x="${x0 - 10}" y="${y + 26}" font-size="13" font-weight="700" text-anchor="end" style="fill:var(--muted)">${t('one_whole')}</text>`;
            for (let j = 0; j < d; j++) { const i = rr * d + j, shaded = i < cells && k >= 2, gi = Math.floor(i / gsz), full = (gi + 1) * gsz <= cells;
              const col = !shaded ? 'var(--surface-2)' : k >= 3 ? (full ? gc[gi % 2] : 'var(--coral)') : 'var(--accent)';
              g += `<rect x="${x0 + j * cw + 1}" y="${y}" width="${cw - 2}" height="40" rx="4" style="fill:${col};stroke:var(--line)" fill-opacity="${shaded ? .75 : 1}" stroke-width="1.5"/>`;
              if (k >= 1 && !(k >= 3 && shaded)) g += svgNum(x0 + j * cw + cw / 2, y + 24, `1/${d}`, shaded ? '#fff' : 'var(--muted)', 12);
              if (k >= 3 && shaded && i % gsz === 0) g += `<text x="${x0 + j * cw + cw / 2}" y="${y + 26}" font-size="14" font-weight="800" text-anchor="middle" style="fill:var(--fg)">${full ? '#' + (gi + 1) : (k >= 4 ? '½' : '?')}</text>`; } }
          if (k >= 2) g += `<text x="170" y="${46 * rowsG + 26}" font-size="14" font-weight="800" text-anchor="middle" style="fill:var(--accent-deep)">${cells} × 1/${d} = ${s.wholes} ${s.part}/${d}</text>`; }
        svg.innerHTML = g; tip.textContent = k ? (say[k - 1] || '') : (s.intro || ''); el.querySelector('#gnx').disabled = k >= n; };
      el.querySelector('#gnx').onclick = () => { if (k < n) k++; draw(); env.update(); };
      draw();
      return { el, label: t('continue'), ready: () => k >= n };
    },
    cubes(s) { return cubesG(s); },
    ladder(s) { return ladderG(s); },
    figure(s) { // a row of drawn pictures (shapes or everyday objects). Tap one to read about it. Not graded.
      const it = s.items || [], need = s.need || 0, seen = new Set();
      const el = div(head(s) + (s.ask ? `<p class="ask">${esc(s.ask)}</p>` : '') + `<div class="fig"><div class="figrow" role="group">${it.map((x, k) => `<button class="figbtn" data-k="${k}" aria-pressed="false">${miniFig(x.f) || ''}${x.cap ? `<span class="cap">${esc(x.cap)}</span>` : ''}${x.chip ? `<span class="pill">${esc(x.chip)}</span>` : ''}</button>`).join('')}</div><div class="result" id="info" ${s.note ? '' : 'hidden'}>${esc(s.note || '')}</div></div>`);
      el.querySelector('.figrow').addEventListener('click', e => { const b = e.target.closest('.figbtn'); if (!b) return; const k = +b.dataset.k; seen.add(k); el.querySelectorAll('.figbtn').forEach(x => x.setAttribute('aria-pressed', x === b)); const inf = el.querySelector('#info'); if (it[k].info) { inf.hidden = false; inf.textContent = it[k].info; } env.update(); });
      return { el, label: t('continue'), ready: () => seen.size >= Math.min(need, it.length) };
    },
    nest(s) { // nested sets ℕ ⊂ W ⊂ ℤ ⊂ ℚ (Fig 1.11): tap a ring, or tap a number to see every set it belongs to
      const rings = s.rings, nums = s.numbers || [], cols = ['var(--accent)', 'var(--sky)', 'var(--coral)', 'var(--sun)'], seen = new Set(); let lit = -1, cur = null;
      const el = div(head(s) + (s.ask ? `<p class="ask">${esc(s.ask)}</p>` : '') + `<div class="fig nest"><svg viewBox="0 0 300 250" role="img" aria-label="${esc(s.title || 'nested sets')}"></svg>${nums.length ? `<div class="vchips">${nums.map((x, i) => `<button class="vchip" data-n="${i}">${esc(x[0])}</button>`).join('')}</div>` : ''}<div class="ginfo" hidden data-text></div></div>`);
      const svg = el.querySelector('svg'), info = el.querySelector('.ginfo');
      const R = i => 118 - i * 26, cy = i => 244 - R(i);
      const draw = () => { svg.innerHTML = rings.map((rg, i) => `<circle data-r="${i}" cx="150" cy="${cy(i)}" r="${R(i)}" style="fill:${cols[i % 4]};stroke:${cols[i % 4]};cursor:pointer" fill-opacity="${lit < 0 ? .55 : i <= lit ? .75 : .12}" stroke-width="${i <= lit ? 3 : 1.5}"/><text x="150" y="${cy(i) - R(i) + 20}" font-size="17" font-weight="800" text-anchor="middle" style="fill:var(--fg);pointer-events:none">${esc(rg[0])}</text>`).join('');
        el.querySelectorAll('.vchip').forEach(b => b.classList.toggle('on', +b.dataset.n === cur)); };
      const show = html => { info.hidden = false; info.innerHTML = html; info.classList.remove('pop'); void info.offsetWidth; info.classList.add('pop'); env.update(); };
      svg.addEventListener('click', e => { const c = e.target.closest('[data-r]'); if (!c) return; const i = +c.dataset.r; lit = i; cur = null; seen.add('r' + i); draw(); show(`<b>${esc(rings[i][0])} ${esc(rings[i][1])}</b> ${esc(rings[i][2] || '')}`); });
      const chips = el.querySelector('.vchips'); if (chips) chips.onclick = e => { const b = e.target.closest('.vchip'); if (!b) return; const i = +b.dataset.n, inner = nums[i][1]; lit = inner; cur = i; seen.add('n' + i); draw();
        show(`<b>${esc(nums[i][0])}</b> ∈ ${rings.slice(0, inner + 1).reverse().map(x => esc(x[0])).join(', ')}. ${esc(nums[i][2] || '')}`); };
      draw();
      return { el, label: t('continue'), ready: () => seen.size >= Math.min(s.need || 3, nums.length + rings.length) };
    },
    slider(s) { // explore a formula with sliders (I = PRT). Not graded.
      const vars = s.vars, f = new Function(...vars.map(v => v.k), `return (${s.formula});`); let moved = false;
      const el = div(head(s) + (s.ask ? `<p class="ask">${esc(s.ask)}</p>` : '') + `<div class="fig sld">${vars.map((v, i) => `<label class="sl"><span>${esc(v.label)}</span><b id="sv${i}">${v.v}</b><input type="range" min="${v.min}" max="${v.max}" step="${v.step || 1}" value="${v.v}" data-i="${i}"></label>`).join('')}<div class="sout" aria-live="polite"></div>${s.note ? `<p class="small muted">${esc(s.note)}</p>` : ''}</div>`);
      const calc = () => { const vals = vars.map((v, i) => +el.querySelector(`input[data-i="${i}"]`).value); vars.forEach((_, i) => el.querySelector('#sv' + i).textContent = vals[i]); const out = f(...vals); el.querySelector('.sout').textContent = (s.out || '{v}').replace('{v}', (Math.round(out * 100) / 100).toLocaleString('en-US')); };
      el.querySelectorAll('input').forEach(inp => inp.addEventListener('input', () => { moved = true; calc(); env.update(); }));
      calc();
      return { el, label: t('continue'), ready: () => moved };
    },
    numline(s) { // number line: show points (tap to explore), place targets (graded, tap snaps to the nearest mark), or hop (arrows for adding)
      const num = v => { const q = Q.parse(v); return q ? Q.val(q) : +v; }, fmt = v => v < 0 ? '−' + -v : String(v);
      const pts = (s.points || []).map(p => Object.assign({ x: num(p.v), label: p.label || String(p.v) }, p)), tgs = (s.targets || []).map(p => Object.assign({ x: num(p.v), label: p.label || String(p.v) }, p)), hops = s.hops || [];
      const mode = tgs.length ? 'place' : hops.length ? 'hop' : 'show', min = s.min, max = s.max, sub = s.sub || 1, x0 = 24, x1 = 316, Y = mode === 'hop' ? 92 : s.distance ? 84 : 62, H = mode === 'hop' ? 128 : s.distance ? 126 : 104, ux = (x1 - x0) / (max - min), X = v => x0 + (v - min) * ux;
      const placed = [], seen = new Set(); let sel = -1, hk = 0, tries = 0, marks = [], last = 0, reveal = false;
      const el = div(head(s) + (s.ask ? `<p class="ask">${esc(s.ask)}</p>` : '') + `<div class="fig nl"><svg viewBox="0 0 340 ${H}" class="nlsvg" role="img" aria-label="${esc(s.title || s.ask || 'number line')}"></svg>${mode === 'show' && pts.length ? `<div class="vchips">${pts.map((p, k) => `<button class="vchip" data-k="${k}">${esc(p.label)}</button>`).join('')}</div>` : ''}${mode === 'hop' ? `<button class="inner" id="hop">▶ ${t('nl_hop')}</button>` : ''}<p class="small muted nlp"></p><div class="ginfo" hidden data-text></div></div>`);
      const svg = el.querySelector('svg'), info = el.querySelector('.ginfo'), tip = el.querySelector('.nlp');
      const dot = (v, col, r = 7, dash) => `<circle cx="${X(v)}" cy="${Y}" r="${r}" style="fill:${dash ? 'none' : col};stroke:${col}" stroke-width="${dash ? 3 : 2}" ${dash ? 'stroke-dasharray="4 3"' : ''}/>`;
      const draw = () => {
        let g = `<line x1="6" x2="334" y1="${Y}" y2="${Y}" style="stroke:var(--fg)" stroke-width="2"/><path d="M4 ${Y}l9 -5v10zM336 ${Y}l-9 -5v10z" style="fill:var(--fg)"/>`;
        const n = max - min, every = n > 12 ? 2 : 1, below = pts.filter(p => mode === 'show' && !Number.isInteger(p.x)).map(p => X(p.x));
        if (ux / sub >= 5) for (let k = 1; k < n * sub; k++) if (k % sub) g += `<line x1="${X(min + k / sub)}" x2="${X(min + k / sub)}" y1="${Y - 5}" y2="${Y + 5}" style="stroke:var(--muted)" stroke-width="1.3"/>`;
        for (let v = Math.ceil(min); v <= max; v++) { g += `<line x1="${X(v)}" x2="${X(v)}" y1="${Y - 9}" y2="${Y + 9}" style="stroke:var(--fg)" stroke-width="2"/>`; if ((v - Math.ceil(min)) % every === 0 && !below.some(x => Math.abs(x - X(v)) < 15)) g += `<text x="${X(v)}" y="${Y + 28}" font-size="14" font-weight="700" text-anchor="middle" style="fill:var(--muted)">${fmt(v)}</text>`; }
        if (s.opposites) pts.forEach(p => { if (p.x > 0 && pts.some(q => Math.abs(q.x + p.x) < 1e-9)) { const yb = Y - 40; g += `<path d="M${X(-p.x)} ${Y - 10}V${yb}H${X(p.x)}V${Y - 10}" fill="none" style="stroke:var(--coral)" stroke-width="2.5"/><text x="${X(0)}" y="${yb - 6}" font-size="12" font-weight="800" text-anchor="middle" style="fill:var(--coral)">${t('nl_opposites')}</text>`; } });
        if (mode === 'show') pts.forEach((p, k) => { const on = k === sel;
          if (on && s.distance && p.x !== 0) { const a = X(0), b = X(p.x), top = Y - 12 - Math.min(40, Math.abs(b - a) * .35); g += `<path d="M${a} ${Y - 8}Q${(a + b) / 2} ${2 * top - Y + 8} ${b} ${Y - 8}" fill="none" style="stroke:var(--coral)" stroke-width="2.5" stroke-dasharray="5 4"/>` + svgNum((a + b) / 2, top - 6, (p.label || '').replace(/^[−-]/, ''), 'var(--coral)', 13); }
          g += dot(p.x, on ? 'var(--coral)' : 'var(--sky)', on ? 9 : 7) + (Number.isInteger(p.x) ? '' : svgNum(X(p.x), Y + 30, p.label, on ? 'var(--coral)' : 'var(--sky)', 14)); });
        if (mode === 'place') tgs.forEach((tg, k) => { if (reveal && marks[k] === 'no') g += dot(tg.x, 'var(--accent)', 10, true) + svgNum(X(tg.x), Y + 30, tg.label, 'var(--accent)', 14);
          if (placed[k] == null) return; const col = marks[k] === 'ok' ? 'var(--accent)' : marks[k] === 'no' ? 'var(--bad)' : 'var(--coral)'; g += `<path d="M${X(placed[k])} ${Y - 9}l-7 -12h14z" style="fill:${col}"/>` + dot(placed[k], col, 6) + svgNum(X(placed[k]), Y - 30, tg.label, col, 13); });
        if (mode === 'hop') { if (hops.length) g += dot(num(hops[0].from), 'var(--sky)', 6);
          hops.slice(0, hk).forEach((hp, k) => { const a = num(hp.from), by = num(hp.by), b = a + by, xa = X(a), xb = X(b), hh = k % 2 ? 50 : 30, col = by < 0 ? 'var(--coral)' : 'var(--accent)', dir = xb > xa ? -1 : 1;
            g += `<path d="M${xa} ${Y - 6}Q${(xa + xb) / 2} ${Y - 6 - 2 * hh} ${xb} ${Y - 6}" fill="none" style="stroke:${col}" stroke-width="3"/><path d="M${xb} ${Y - 5}l${dir * 4} -11l${dir * 7} 6z" style="fill:${col}"/><text x="${(xa + xb) / 2}" y="${Y - 12 - hh}" font-size="14" font-weight="800" text-anchor="middle" style="fill:${col}">${by < 0 ? '−' + -by : '+' + by}</text>` + dot(b, k === hk - 1 ? 'var(--coral)' : 'var(--muted)', k === hk - 1 ? 8 : 5); }); }
        svg.innerHTML = g; el.querySelectorAll('.vchip').forEach(b => b.classList.toggle('on', +b.dataset.k === sel));
      };
      const prompt = () => { if (mode !== 'place') return; const i = tgs.findIndex((_, k) => placed[k] == null || marks[k] === 'no'); tip.textContent = i >= 0 ? (tgs.length > 1 || marks.includes('no') ? t('nl_place', { x: tgs[i].label }) : '') : (tgs.length > 1 ? t('nl_move') : t('nl_move1')); };
      const pick = k => { sel = k; seen.add(k); draw(); const p = pts[k]; info.hidden = false; info.innerHTML = `<b>${s.distance ? `|${esc(p.label)}| = ${esc((p.label || '').replace(/^[−-]/, ''))}.` : esc(p.label)}</b> ${esc(p.info || '')}`; info.classList.remove('pop'); void info.offsetWidth; info.classList.add('pop'); env.update(); };
      svg.addEventListener('click', e => { const ctm = svg.getScreenCTM(); if (!ctm) return; const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const px = pt.matrixTransform(ctm.inverse()).x;
        if (mode === 'place') { if (env.phase() !== 'answer' || marks.length && marks.every(m => m === 'ok')) return; const v = Math.max(min, Math.min(max, Math.round((px - x0) / ux * sub) / sub + min)); let i = tgs.findIndex((_, k) => placed[k] == null || marks[k] === 'no'); if (i < 0) i = last; placed[i] = v; last = i; marks[i] = undefined; draw(); prompt(); env.update(); }
        else if (mode === 'show') { let best = -1, bd = 26; pts.forEach((q, k) => { const d = Math.abs(X(q.x) - px); if (d < bd) { bd = d; best = k; } }); if (best >= 0) pick(best); } });
      const chips = el.querySelector('.vchips'); if (chips) chips.onclick = e => { const b = e.target.closest('.vchip'); if (b) pick(+b.dataset.k); };
      const hb = el.querySelector('#hop'); if (hb) hb.onclick = () => { if (hk >= hops.length) return; hk++; draw(); if (hk >= hops.length) { hb.disabled = true; const hp = hops[hops.length - 1]; info.hidden = false; info.innerHTML = s.after ? esc(s.after) : `<b>${fmt(num(hp.from) + num(hp.by))}</b>`; } env.update(); };
      draw(); prompt();
      const fails = () => tgs.map((g, k) => placed[k] != null && Math.abs(placed[k] - g.x) < 1e-6 ? -1 : k).filter(k => k >= 0);
      return { el, label: mode === 'place' ? t('check') : t('continue'),
        ready: () => mode === 'place' ? tgs.every((_, k) => placed[k] != null && marks[k] !== 'no') : mode === 'hop' ? hk >= hops.length : pts.length ? seen.size >= Math.min(s.need || 2, pts.length) : true,
        check: mode !== 'place' ? undefined : () => { tries++; const bad = fails(); marks = tgs.map((_, k) => bad.includes(k) ? 'no' : 'ok'); if (!bad.length) { draw(); tip.textContent = ''; return { ok: true, body: s.why }; } if (tries >= 2) reveal = true; draw(); const lo = Math.floor(tgs[bad[0]].x); return { ok: false, body: `${s.clue ? s.clue + ' ' : ''}${tries < 2 ? t('nl_between', { x: tgs[bad[0]].label, a: fmt(lo), b: fmt(lo + 1) }) : ''}`.trim() }; },
        retry() { prompt(); } };
    },
  };
  const explainCard = s => { const ex = s._explain || env.explain; if (!ex) return ''; const txt = (ex[S.lang] && ex[S.lang].text) || (ex.en && ex.en.text) || ''; return txt ? `<div class="explain"><button class="play" id="ex-play" aria-label="${t('explain_me')}"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l12 7-12 7z" fill="#fff"/></svg></button><div class="grow"><div style="font-weight:800">${t('explain_me')}</div><div class="small muted" id="ex-text">${esc(txt)}</div></div></div>` : ''; };

  return { R, div, explainCard };
}

function runPlayer(cfg) {
  setNav(false); tray.hidden = false;
  const screens = cfg.screens.slice(), SUM = screens.length;
  let order = screens.map((_, i) => i), pos = 0, cur = null, phase = 'answer', lastOk = null, review = false, firstTry = {}, missed = new Set(), round = {}, tries = {};
  const state = { guess: null }; const offered = {}; let lvl = cfg.startLevel || 2, recent = [];
  function openRefresher(id) { const rf = cfg.refreshers[id]; logEvent({ lesson: cfg.id, refresher: id, item: order[pos] }); const saved = { app: [...app.childNodes], tray: tray.className, msg: msg.innerHTML, goText: go.textContent, goDis: go.disabled, phase, lastOk, cur, top: topin.innerHTML, work: $('#work').hidden };
    const extra = tray.querySelector('#rfb'); if (extra) extra.remove();
    runPlayer({ id: cfg.id + ':' + id, idea: id, title: rf.name, mode: 'refresher', screens: rf.screens, backRoute: null, resume: () => { app.replaceChildren(...saved.app); tray.className = saved.tray; msg.innerHTML = saved.msg; go.textContent = saved.goText; go.disabled = saved.goDis; phase = saved.phase; lastOk = saved.lastOk; cur = saved.cur; topin.innerHTML = saved.top; $('#work').hidden = saved.work; bindTop(order[pos]); go.onclick = onGo; window.scrollTo(0, 0); } }); }
  const { R, div, explainCard } = makeR({ phase: () => phase, update: () => update(), state, explain: cfg.explain, enter: () => { if (!go.disabled) go.click(); } });
  R.summary = () => { const graded = screens.map((x, i) => x.graded ? i : -1).filter(i => i >= 0); const right = graded.filter(i => firstTry[i]).length;
      const secs = {}; graded.forEach(i => { const k = screens[i]._sec; if (!k) return; secs[k] = secs[k] || { n: 0, r: 0, title: screens[i]._secTitle, lesson: screens[i]._lesson }; secs[k].n++; if (firstTry[i]) secs[k].r++; });
      const mins = cfg._t0 ? Math.round((Date.now() - cfg._t0) / 6000) / 10 : 0, pct = graded.length ? Math.round(100 * right / graded.length) : 0, weak = Object.keys(secs).filter(k => secs[k].r / secs[k].n < .6);
      const bySec = Object.keys(secs).length > 1 ? `<div class="defn"><b>${t('by_section')}</b><div class="secres">${Object.keys(secs).map(k => `<div class="sr ${secs[k].r / secs[k].n >= .6 ? 'ok' : 'weak'}"><span class="srn">${esc(k)}</span><span class="grow">${esc(secs[k].title || '')}</span><b>${secs[k].r} / ${secs[k].n}</b></div>`).join('')}</div>${weak.length ? `<p class="small">${t('go_back_to', { s: weak.join(', ') })}</p>` : `<p class="small">${t('all_strong')}</p>`}</div>` : '';
      const el = div(`<span class="eyebrow sky">${t('done')}</span><h1 class="display" tabindex="-1">${esc(cfg.title)}</h1><div class="score"><span class="big">${right} / ${graded.length}</span><span>${cfg.mode === 'test' ? `${pct}%${mins ? ` · ${mins} ${t('min')}` : ''}${cfg.timeUp ? ` · ${t('time_up')}` : ''}` : t('first_try')}</span></div>${bySec}<p>${cfg.mode === 'test' ? '' : missed.size ? t('replay_note', { n: missed.size }) : t('all_done')}</p>${cfg.learned ? `<div class="defn"><b>${t('learned')}</b><ul class="steps" style="padding-left:20px">${cfg.learned.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}${cfg.mode === 'learn' ? `<div class="card sky"><div class="small">${t('comes_back')}</div></div>` : ''}${cfg.backRoute ? `<a class="btn link" href="#${cfg.backRoute}">${t('back_chapter')}</a>` : ''}`);
      return { el, label: cfg.mode === 'refresher' ? t('back_to_question') : cfg.mode === 'test' && cfg.resume ? t('back_to_book') : missed.size ? t('replay_n', { n: missed.size }) : cfg.resume ? t('back_to_book') : t('start_again'), ready: () => true, summary: true }; };
  function setTray(kind, title, body, label) { tray.className = 'tray' + (kind ? ' ' + kind : ''); msg.innerHTML = title ? `<strong>${esc(title)}</strong>${body ? `<span>${esc(body)}</span>` : ''}` : ''; go.textContent = label; }
  function update() { if (phase === 'answer' && cur) go.disabled = !cur.ready(); }
  function bindTop(k) { const rep = $('#rep'); if (rep) rep.onclick = () => Feedback.open(Feedback.here ? Feedback.here() : {}); const rb = $('#rback'); if (rb) rb.onclick = () => { if (cfg._clock) clearInterval(cfg._clock); cfg.resume && cfg.resume(); }; }
  function addSkip() { const k = order[pos], s = screens[k] || {}; const osk = $('#skipb'); if (osk) osk.remove(); if (s.graded && order.length - pos > 2 && (!['mcq', 'tf'].includes(s.kind) || tries[k])) { const sb = document.createElement('button'); sb.className = 'btn ghost'; sb.id = 'skipb'; sb.style.width = 'auto'; sb.textContent = t('skip'); sb.onclick = () => { order.splice(pos, 1); order.splice(order.length - 1, 0, k); show(); }; go.parentNode.insertBefore(sb, go); } }
  function show() {
    Feedback.here = () => { const sc = screens[order[pos]] || {}; return Object.assign({}, cfg.where || {}, { lesson: (cfg.id || '').split(':')[0], label: `${cfg.where ? '' : cfg.title + ' · '}${cfg.mode === 'practice' ? t('step_practise') : cfg.mode === 'test' ? t('unit_test') : cfg.mode === 'book' ? cfg.title : cfg.mode} ${Math.min(pos + 1, order.length)}/${order.length}`, item: sc.id || '', generated: !!sc._gen, link: cfg.where && cfg.where.chapterId ? Feedback.link(cfg.where.chapterId, sc.id) : '', question: [sc.ask, sc.text, sc.title].filter(Boolean).join(' | ') }); }; FAB.show(true);
    const k0 = order[pos]; if (cfg.adapt && k0 !== SUM && screens[k0] && screens[k0]._adapt && !screens[k0]._shown) screens[k0] = Object.assign(Gen.make(screens[k0], null, null, lvl), { _adapt: true, _shown: true });
    const k = order[pos], s = k === SUM ? { kind: 'summary' } : screens[k];
    if (s.kind === 'summary') document.querySelectorAll('.verdict').forEach(v => v.remove());
    if (s.kind === 'summary' && cfg.onDone && !cfg._done) { cfg._done = true; const byIdea = {}; screens.forEach((x, i) => { if (x.graded) { const id = x._idea || cfg.idea; byIdea[id] = (byIdea[id] !== false) && !!firstTry[i]; } }); cfg.onDone({ byIdea, firstTry, missed }); }
    if (cur && cur.summary === undefined && s.kind === 'summary' && !cfg._logged) { cfg._logged = true; const g = screens.map((x, i) => x.graded ? i : -1).filter(i => i >= 0); logEvent({ kind: cfg.mode + '_done', lesson: cfg.id, n: g.length, right: g.filter(i => firstTry[i]).length, ms: Date.now() - (cfg._t0 || Date.now()), byLevel: g.reduce((o, i) => { const L = screens[i].level || 1; o[L] = (o[L] || 0) + (firstTry[i] ? 1 : 0); o['n' + L] = (o['n' + L] || 0) + 1; return o; }, {}) }); }
    cur = (R[s.kind] || R.name)(s); app.replaceChildren(cur.el);
    const ex = cur.el.querySelector('#ex-play'); if (ex) ex.onclick = () => speak(cur.el.querySelector('#ex-text').textContent);
    const rf = s.needs && cfg.refreshers && cfg.refreshers[s.needs];
    if (rf) { const a = document.createElement('button'); a.className = 'btn link'; a.style.justifySelf = 'start'; a.textContent = t('need_reminder', { n: rf.name }); a.onclick = () => openRefresher(s.needs); cur.el.appendChild(a); }
    const old = tray.querySelector('#rfb'); if (old) old.remove(); closePanel();
    phase = 'answer'; lastOk = null; setTray('', '', '', cur.label); update();
    const wb = $('#work'); wb.hidden = !WORK_TOOLS || !(s.graded || s.kind === 'guess' || s.kind === 'tiles');
    addSkip(); wb.onclick = () => workSheet({ key: `${cfg.id || cfg.title}:${k}`, lesson: cfg.id, item: k, tool: s.tool || cfg.tool, q: (s.ask || s.text || s.title || '').replace(/\n/g, ' ') });
    const pct = Math.round(pos / Math.max(1, order.length - 1) * 100);
    setTop(`${cfg.backRoute ? `<a class="iconbtn" href="#${cfg.backRoute}" aria-label="close">${svgIcon(CLOSE)}</a>` : `<button class="iconbtn" id="rback" aria-label="back">${svgIcon(BACK)}</button>`}<span class="mode ${cfg.mode === 'review' || review ? 'review' : cfg.mode === 'book' || cfg.mode === 'test' ? 'book' : ''}">${cfg.mode === 'refresher' ? t('refresher') : cfg.mode === 'practice' ? t('step_practise') : review ? t('review') : cfg.mode === 'review' ? t('review') : cfg.mode === 'book' ? '📝 ' + t('book_exercise') : cfg.mode === 'test' ? (cfg.minutes ? '🏁' : '🏁 ' + t('unit_test')) : t('learn')}</span><div class="bar"><i style="width:${pct}%"></i></div><span class="count">${Math.min(pos + 1, order.length - 1)} / ${order.length - 1}</span>${cfg.minutes ? `<span class="clock" id="clock"></span>` : ''}<button class="iconbtn" id="rep" aria-label="${t('report')}">${svgIcon(FLAG)}</button>`);
    bindTop(k);
    window.scrollTo(0, 0); const h = cur.el.querySelector('h1'); if (h) h.focus({ preventScroll: true });
  }
  function onGo() {
    const k = order[pos], s = screens[k];
    if (cur.summary) { if (cfg._clock) clearInterval(cfg._clock); if (cfg.mode === 'refresher' || (cfg.resume && !missed.size) || (cfg.mode === 'test' && cfg.resume)) { cfg.resume(); return; } if (missed.size) { if (cfg.vary) missed.forEach(k => { screens[k] = Object.assign(Gen.make(screens[k], null, null, screens[k].level), { _adapt: false }); }); order = [...missed].sort((a, b) => a - b).concat(SUM); review = true; } else { if (cfg.vary) screens.forEach((x, k) => { screens[k] = x._adapt ? Object.assign({}, x, { _shown: false }) : Gen.make(x, null, null, x.level); }); order = screens.map((_, i) => i).concat(SUM); firstTry = {}; review = false; state.guess = null; } pos = 0; round = {}; tries = {}; show(); return; }
    if (phase === 'feedback') { if (lastOk === false) { const old = tray.querySelector('#rfb'); if (old) old.remove(); phase = 'answer'; cur.retry && cur.retry(); setTray('', '', '', cur.label); update(); addSkip(); } else { pos++; show(); } return; }
    if (!cur.check) { pos++; show(); return; }
    { const sb = $('#skipb'); if (sb) sb.remove(); }
    const r = cur.check(); tries[k] = (tries[k] || 0) + 1;
    if (s.graded && !(k in round)) { if (cfg.adapt && s._adapt) { recent.push(!!r.ok); const two = recent.slice(-2); if (two.length === 2 && two[0] === two[1]) { lvl = Math.max(1, Math.min(3, lvl + (two[0] ? 1 : -1))); recent = []; cfg.onLevel && cfg.onLevel(lvl); } } round[k] = r.ok; if (!(k in firstTry)) firstTry[k] = r.ok; r.ok ? missed.delete(k) : missed.add(k); logEvent({ lesson: s._lesson || cfg.id, idea: s._idea || cfg.idea, item: k, correct: !!r.ok, attempt: tries[k], mode: cfg.mode }); }
    lastOk = r.ok; phase = 'feedback';
    const noClue = cfg.mode === 'test';
    if (r.ok === true) { Fx.verdict('ok'); setTray('ok', t('correct'), r.body, t('continue')); if (cfg.cheer) { const rc = go.getBoundingClientRect(); burst(rc.left + rc.width / 2, rc.top); buzz(25); } }
    else if (r.ok === false) { Fx.verdict(noClue || tries[k] >= 2 ? 'answer' : 'retry'); if (noClue) { lastOk = true; setTray('no', t('not_yet'), s.why || '', t('continue')); } else if (tries[k] >= 2) { lastOk = true; const shown = s.kind === 'blank' ? s.a[0] : s.kind === 'pick' ? s.a.join(', ') : s.kind === 'mcq' ? s.ans : s.kind === 'tf' ? (s.a ? t('true') : t('false')) : ''; setTray('no', t('show_worked'), answerLine(shown, s), t('continue')); } else { setTray('no', t('not_yet'), r.body, t('try_again')); const rf = s.needs && cfg.refreshers && cfg.refreshers[s.needs]; if (rf && !offered[k]) { offered[k] = true; msg.innerHTML += `<span class="small">${esc(t('offer_refresher', { n: rf.name }))}</span>`; const b = document.createElement('button'); b.className = 'btn ghost'; b.id = 'rfb'; b.textContent = t('yes_reminder'); b.onclick = () => openRefresher(s.needs); go.parentNode.insertBefore(b, go); go.textContent = t('no_continue'); } } }
    else setTray('info', r.title, r.body, t('continue'));
    go.disabled = false; go.focus();
    if (pos === order.length - 1 && cfg.onDone && !cfg._done) { cfg._done = true; const byIdea = {}; screens.forEach((x, i) => { if (x.graded) { const id = x._idea || cfg.idea; byIdea[id] = (byIdea[id] !== false) && !!firstTry[i]; } }); cfg.onDone({ byIdea, firstTry, missed }); }
  };
  cfg._t0 = Date.now(); logEvent({ kind: cfg.mode + '_start', lesson: cfg.id, n: screens.length, minutes: cfg.minutes || null });
  if (cfg.minutes) { const end = cfg._t0 + cfg.minutes * 60000; let warned = false; const tick = () => { const left = Math.max(0, end - Date.now()), el = $('#clock'); if (!el) { if (!app.isConnected || !tray.isConnected) clearInterval(cfg._clock); return; }
      const m = Math.floor(left / 60000), sec = Math.floor(left % 60000 / 1000); el.textContent = `⏱ ${m}:${String(sec).padStart(2, '0')}`; el.classList.toggle('low', left < 5 * 60000);
      if (left < 5 * 60000 && !warned) { warned = true; toast(t('five_left')); buzz([40, 60, 40]); }
      if (left <= 0) { clearInterval(cfg._clock); cfg.timeUp = true; toast(t('time_up')); screens.forEach((x, i) => { if (x.graded && !(i in firstTry)) { firstTry[i] = false; missed.add(i); } }); pos = order.length - 1; show(); } }; cfg._clock = setInterval(tick, 1000); setTimeout(tick, 0); }
  go.onclick = onGo; order = order.concat(SUM); show();
}

/* ---------- book reader: one scrolling page per section, questions inline ---------- */
async function viewLesson(path, mode, exIdx) {
  const ls = await loadLesson(path), idx = await loadIndex();
  await loadDict(ls.lang); setLessonLang(ls.lang); Translate.dir(ls.lang);
  const ch = idx.chapters.find(c => c.sections.some(x => x.lesson === path));
  const secs = ch ? ch.sections.filter(x => x.lesson) : [], si = secs.findIndex(x => x.lesson === path), nextSec = si >= 0 ? secs[si + 1] : null;
  const m = mode || 'learn', idea0 = ls.ideas[0];
  let blocks = [], title = ls.title;
  if (m === 'book') { const ex = ls.exercises[exIdx || 0]; blocks = ex.items.map(x => Object.assign({ _idea: idea0.id }, x)); title = ex.book_name; }
  else if (m === 'test') { blocks = ls.test.map(x => Object.assign({ _idea: idea0.id }, Gen.make(x))); title = `${t('unit_test')} · ${ls.title}`; }
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
  Feedback.here = () => ({ chapter: ch ? `${t('grade')} ${ch.grade} · ${L(idx.subjects[ch.subject])} · ${t('unit')} ${ch.unit}` : '', section: `${ls.book.section} ${ls.title}`, lesson: ls.id }); FAB.show(true);
  $('#rep').onclick = () => Feedback.open(Feedback.here());
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
      update() { if (!cur) return; if (cur.check && phase === 'retry') { phase = 'answer'; fb.hidden = true; const o = fb.nextElementSibling; if (o && o.dataset.offer) o.remove(); btn.textContent = cur.label; } if (cur.check) btn.disabled = phase !== 'answer' || !cur.ready(); else if (phase === 'answer' && cur.ready() && interactive) { phase = 'done'; wrap.classList.add('done'); finish(i, true); } } };
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
        if (r.ok === true) { Fx.verdict('ok'); say('ok', t('correct'), r.body); end(tries === 1); }
        else if (r.ok === null) { say('info', r.title, r.body); end(true); }
        else if (m === 'test') { Fx.verdict('answer'); say('no', t('not_yet'), s.why || ''); end(false); }
        else if (tries >= 2) { Fx.verdict('answer'); say('no', t('show_worked'), s.worked || s.why || ''); end(false); }
        else {
          Fx.verdict('retry'); say('no', t('not_yet'), r.body); phase = 'retry'; btn.textContent = t('try_again'); btn.disabled = false;
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
    ${m === 'learn' && ls.keywords && ls.keywords.length ? `<div class="defn"><b>${t('learned')}</b><ul class="kw">${ls.keywords.map(k => { const mk = kwMain(k, k.en, ls.main); return `<li><strong>${esc(mk[0])}</strong>${mk[1] ? ` <span class="kwam" lang="${ls.main === 'am' ? 'en' : 'am'}">${esc(mk[1])}</span>` : ''}<br><span class="small">${esc(k.def || '')}</span></li>`; }).join('')}</ul></div><div class="card sky"><div class="small">${t('comes_back')}</div></div>` : ''}
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
  buzz(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} },
  verdict(kind) { // kind: ok | retry | answer — a short pop-up so the student always knows what happened
    const old = document.querySelector('.verdict'); if (old) old.remove();
    const v = document.createElement('div'); v.className = 'verdict ' + kind; v.setAttribute('role', 'status');
    v.innerHTML = kind === 'ok' ? `<b>✓</b> ${esc(t('v_ok'))}` : kind === 'retry' ? `<b>↻</b> ${esc(t('v_retry'))}` : `<b>💡</b> ${esc(t('v_answer'))}`;
    document.body.appendChild(v); setTimeout(() => v.classList.add('out'), 1100); setTimeout(() => v.remove(), 1500);
  }
};
const burst = Fx.burst, buzz = Fx.buzz; // used by the step player

/* ---------- Focus: a simple study timer (Pomodoro-style) ---------- */
/* ---------- Install: one button that does the right thing on every phone ----------
   Android Chrome/Edge/Samsung: opens the browser's install window (beforeinstallprompt).
   iPhone/iPad: shows Share → Add to Home Screen. Inside Telegram/WhatsApp/Facebook: open in a real browser first. */
const Install = {
  ev: null,
  ua: navigator.userAgent || '',
  installed() { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (_) { return false; } },
  ios() { return /iPhone|iPad|iPod/i.test(Install.ua) || (/Macintosh/.test(Install.ua) && navigator.maxTouchPoints > 1); },
  android() { return /Android/i.test(Install.ua); },
  inapp() { return /Telegram|FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Line\/|MicroMessenger|; wv\)/i.test(Install.ua) || !!window.TelegramWebviewProxy; },
  weak() { return /Opera Mini|OPiOS|UCBrowser|UCWEB/i.test(Install.ua); },
  card(dismissable) { if (Install.installed()) return '';
    if (dismissable) { const until = store.get('installHide', 0); if (until > Date.now()) return ''; }
    return `<div class="card install" id="instcard"><div class="row"><div class="icon instic">📲</div><div class="grow"><div style="font-weight:800">${t('install')}</div><div class="small muted">${t('install_sub')}</div></div>${dismissable ? `<button class="iconbtn" id="insthide" aria-label="${t('close')}">${svgIcon(CLOSE)}</button>` : ''}</div><button class="btn" id="instbtn">${t('install_btn')}</button></div>`; },
  bind(root) { const b = root.querySelector('#instbtn'); if (b) b.onclick = () => Install.go(); const x = root.querySelector('#insthide'); if (x) x.onclick = () => { store.set('installHide', Date.now() + 7 * DAY); const c = root.querySelector('#instcard'); if (c) c.remove(); }; },
  async go() {
    logEvent({ install: 'tap', how: Install.ev ? 'prompt' : Install.inapp() ? 'inapp' : Install.ios() ? 'ios' : 'menu' });
    if (Install.ev) { const e = Install.ev; Install.ev = null; try { e.prompt(); const r = await e.userChoice; if (r && r.outcome === 'accepted') { toast(t('install_done')); const c = $('#instcard'); if (c) c.remove(); } } catch (_) { Install.help(); } return; }
    Install.help();
  },
  help() { const url = location.href.split('#')[0], step = (n, html) => `<li class="istep"><span class="inum">${n}</span><span>${html}</span></li>`;
    const share = `<svg class="ishare" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 12v8h14v-8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    let body;
    if (Install.inapp()) body = `<p>${t('inapp_why')}</p><ol class="isteps">${step(1, t('inapp_1'))}${step(2, t('inapp_2'))}${step(3, t('inapp_3'))}</ol>${Install.android() ? `<a class="btn" href="intent://${location.host}${location.pathname}#Intent;scheme=https;package=com.android.chrome;end">${t('open_chrome')}</a>` : ''}<button class="btn ghost" id="cpy">${t('copy_link')}</button>`;
    else if (Install.ios()) body = `<ol class="isteps">${step(1, t('ios_1').replace('{share}', share))}${step(2, t('ios_2'))}${step(3, t('ios_3'))}</ol><p class="small muted">${t('ios_note')}</p>`;
    else body = `${Install.weak() ? `<p>${t('weak_browser')}</p>` : ''}<ol class="isteps">${step(1, t('menu_1'))}${step(2, t('menu_2'))}${step(3, t('menu_3'))}</ol><p class="small muted">${t('menu_note')}</p>`;
    sheet(`<div class="stack instsheet"><h2 class="display">📲 ${t('install')}</h2>${body}<button class="btn ghost" id="iok">${t('continue')}</button></div>`);
    $('#iok').onclick = () => sheet('');
    const c = $('#cpy'); if (c) c.onclick = async () => { try { await navigator.clipboard.writeText(url); toast(t('link_copied')); } catch (_) { prompt(t('copy_link'), url); } };
  }
};
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); Install.ev = e; });
window.addEventListener('appinstalled', () => { Install.ev = null; logEvent({ install: 'done' }); const c = $('#instcard'); if (c) c.remove(); });

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
  from: 'en', to: 'am',
  dir(lessonLang) { Translate.from = lessonLang && lessonLang !== 'en' ? lessonLang : 'en'; Translate.to = Translate.from === 'en' ? 'am' : 'en'; const pill = $('#trpill'); if (pill) pill.textContent = '🌐 ' + t(Translate.from === 'en' ? 'tr_btn' : 'tr_btn_back'); },
  providers: [
    async (q, tl, sl = 'en') => { const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(q)}`); const j = await r.json(); return j[0].map(x => x[0]).join(''); },
    async (q, tl, sl = 'en') => { const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${sl}|${tl}`); const j = await r.json(); if (!j.responseData || !j.responseData.translatedText) throw 0; return j.responseData.translatedText; }
  ],
  async run(q, tl, sl = 'en') {
    const key = sl + '>' + tl + ':' + q, cache = store.get('tr', {}); if (cache[key]) return cache[key];
    for (const p of Translate.providers) { try { const out = await p(q, tl, sl); if (out) { const c = store.get('tr', {}); const ks = Object.keys(c); if (ks.length > 300) delete c[ks[0]]; c[key] = out; store.set('tr', c); logEvent({ translate: tl, chars: q.length }); return out; } } catch (_) {} }
    throw new Error('offline');
  },
  async show(q) {
    q = q.replace(/\s+/g, ' ').trim().slice(0, 600); if (!q) return;
    sheet(`<div class="trsheet"><div class="trq">${esc(q)}</div><div class="tra" lang="${Translate.to}"><span class="spin"></span></div><p class="small muted">${t('tr_machine')}</p><button class="btn" id="trok">${t('continue')}</button></div>`);
    $('#trok').onclick = () => sheet('');
    try { const out = await Translate.run(q, Translate.to, Translate.from); const a = $('.tra'); if (a) a.textContent = out; }
    catch (_) { const a = $('.tra'); if (a) { a.textContent = t('tr_fail'); a.classList.add('muted'); } }
  },
  bind(root) { // a small floating button appears when the student selects lesson text
    let pill = $('#trpill'); if (!pill) { pill = document.createElement('button'); pill.id = 'trpill'; pill.className = 'trpill'; pill.hidden = true; document.body.appendChild(pill); }
    pill.textContent = '🌐 ' + t(Translate.from === 'en' ? 'tr_btn' : 'tr_btn_back');
    pill.onpointerdown = e => e.preventDefault();
    pill.onclick = () => { const q = String(getSelection()); pill.hidden = true; Translate.show(q); };
    const upd = () => { const s = getSelection(); if (!root.isConnected || !s || s.isCollapsed || !String(s).trim()) { pill.hidden = true; return; } const n = s.anchorNode && (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement); if (!n || !n.closest('[data-text]') || !root.contains(n)) { pill.hidden = true; return; } const r = s.getRangeAt(0).getBoundingClientRect(); pill.hidden = false; const w = pill.offsetWidth || 150; pill.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px'; pill.style.top = Math.min(innerHeight - 64, r.bottom + 12) + 'px'; };
    document.removeEventListener('selectionchange', Translate._u || (() => {})); Translate._u = upd; document.addEventListener('selectionchange', upd);
  }
};

/* ---------- Text: every piece of lesson prose goes through here ---------- */
function Text(str, ctx, tag = 'p', cls = '') {
  let html = esc(str).replace(/(\S+) \? (\S+)/g, '<span class="nw">$1 <span class="cmpbox" aria-label="?"></span> $2</span>');
  if (ctx && ctx.kws) ctx.kws.forEach((k, j) => { const term = (ctx.main && k[ctx.main]) || k.en; if (ctx.used.has(j) || !term) return; const e = esc(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); const re = new RegExp(`(^|[^\\p{L}])(${e}${ctx.main === 'am' ? '\\p{L}{0,2}' : ''})(?![\\p{L}])`, 'iu'); const parts = html.split(/(<button[^>]*>[^<]*<\/button>)/); for (let q = 0; q < parts.length; q += 2) if (re.test(parts[q])) { parts[q] = parts[q].replace(re, `$1<button class="kwt" data-k="${j}">$2</button>`); ctx.used.add(j); break; } html = parts.join(''); });
  return `<${tag} class="${cls}" data-text>${html}</${tag}>`;
}
const pic = (id, label) => (window.PICS && window.PICS[id]) || `<svg viewBox="0 0 120 120" role="img" aria-label="${esc(label || id)}"><rect x="10" y="10" width="100" height="100" rx="20" style="fill:var(--surface-2)"/><text x="60" y="68" text-anchor="middle" font-size="14" style="fill:var(--muted)">${esc(label || id)}</text></svg>`;
/* ---------- drawn figures: any text slot (sort item, match side, option, tap chip) may hold "@rect:5x5" or "@obj:door" ---------- */
const FS = (f, w = 2) => `style="fill:${f};stroke:var(--fg)" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`, FN = `style="fill:none;stroke:var(--fg)" stroke-width="2" stroke-linecap="round"`;
const OBJ = {
  door: `<rect x="18" y="6" width="28" height="52" rx="2" ${FS('var(--sun)')}/><rect x="23" y="12" width="18" height="17" rx="1" style="fill:none;stroke:var(--fg)" stroke-opacity=".45"/><rect x="23" y="34" width="18" height="17" rx="1" style="fill:none;stroke:var(--fg)" stroke-opacity=".45"/><circle cx="41" cy="33" r="2.2" style="fill:var(--fg)"/>`,
  page: `<rect x="14" y="6" width="36" height="52" rx="2" ${FS('var(--surface-2)')}/><path d="M20 18h24M20 26h24M20 34h24M20 42h24" ${FN} stroke-opacity=".4"/><path d="M24 8v48" style="stroke:var(--coral)" stroke-width="1.5"/>`,
  field: `<rect x="3" y="14" width="58" height="36" rx="2" ${FS('var(--accent)')}/><path d="M32 14v36" style="stroke:#fff" stroke-width="2"/><circle cx="32" cy="32" r="7" style="fill:none;stroke:#fff" stroke-width="2"/><rect x="3" y="24" width="9" height="16" style="fill:none;stroke:#fff" stroke-width="2"/><rect x="52" y="24" width="9" height="16" style="fill:none;stroke:#fff" stroke-width="2"/>`,
  note: `<rect x="5" y="18" width="54" height="28" rx="3" ${FS('var(--sun)')}/><circle cx="32" cy="32" r="8" style="fill:none;stroke:var(--fg)" stroke-width="2"/><path d="M11 24h8M45 40h8" ${FN}/>`,
  eraser: `<rect x="12" y="24" width="40" height="18" rx="4" ${FS('var(--surface-2)')}/><path d="M34 24h14a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H34z" ${FS('var(--coral)')}/>`,
  house: `<rect x="12" y="30" width="40" height="26" ${FS('var(--surface-2)')}/><path d="M7 32L32 10l25 22z" ${FS('var(--coral)')}/><rect x="27" y="40" width="10" height="16" ${FS('var(--sun)')}/><rect x="15" y="36" width="8" height="8" style="fill:var(--sky);stroke:var(--fg)" stroke-width="1.5"/>`,
  park: `<path d="M3 54h58" ${FN}/><rect x="18" y="36" width="5" height="18" style="fill:var(--sun);stroke:var(--fg)" stroke-width="1.5"/><circle cx="20" cy="26" r="13" ${FS('var(--accent)')}/><rect x="42" y="40" width="4" height="14" style="fill:var(--sun);stroke:var(--fg)" stroke-width="1.5"/><circle cx="44" cy="32" r="10" ${FS('var(--accent)')}/>`,
  city: `<rect x="5" y="26" width="16" height="30" ${FS('var(--sky)')}/><rect x="24" y="10" width="16" height="46" ${FS('var(--surface-2)')}/><rect x="43" y="20" width="16" height="36" ${FS('var(--sun)')}/><path d="M9 32h3M14 32h3M9 40h3M14 40h3M28 18h3M33 18h3M28 28h3M33 28h3M28 38h3M33 38h3M47 28h3M52 28h3M47 38h3M52 38h3" ${FN} stroke-width="3"/>`,
  table: `<rect x="5" y="22" width="54" height="9" rx="2" ${FS('var(--sun)')}/><rect x="10" y="31" width="5" height="24" ${FS('var(--sun)')}/><rect x="49" y="31" width="5" height="24" ${FS('var(--sun)')}/>`,
  coin: `<circle cx="32" cy="32" r="17" ${FS('var(--sun)')}/><circle cx="32" cy="32" r="11" style="fill:none;stroke:var(--fg)" stroke-width="1.5" stroke-opacity=".6"/>`,
  bottle: `<rect x="27" y="4" width="10" height="7" rx="2" ${FS('var(--coral)')}/><path d="M27 11h10v7c8 5 10 11 10 20v16a4 4 0 0 1-4 4H21a4 4 0 0 1-4-4V38c0-9 2-15 10-20z" style="fill:var(--sky);stroke:var(--fg)" fill-opacity=".45" stroke-width="2" stroke-linejoin="round"/><rect x="17" y="30" width="30" height="14" style="fill:var(--surface-2);stroke:var(--fg)" stroke-width="1.5"/><path d="M19 52h26" style="stroke:#fff" stroke-width="2" stroke-opacity=".7"/>`,
  bucket: `<path d="M14 22h36l-6 34H20z" ${FS('var(--coral)')}/><ellipse cx="32" cy="22" rx="18" ry="4" ${FS('var(--surface-2)')}/><path d="M14 22C18 4 46 4 50 22" ${FN}/>`,
  jerrycan: `<rect x="12" y="16" width="38" height="42" rx="5" ${FS('var(--sun)')}/><rect x="14" y="8" width="11" height="8" rx="2" ${FS('var(--coral)')}/><path d="M34 16v-5a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v5" ${FN}/><rect x="19" y="28" width="24" height="14" rx="2" style="fill:var(--surface-2);stroke:var(--fg)" stroke-width="1.5"/>`,
  cup: `<ellipse cx="30" cy="54" rx="22" ry="4" ${FS('var(--surface-2)')}/><path d="M14 24h32v14a12 12 0 0 1-12 12h-8a12 12 0 0 1-12-12z" ${FS('var(--surface-2)')}/><path d="M46 28c10 0 10 14 0 14" ${FN}/><ellipse cx="30" cy="24" rx="16" ry="3.5" style="fill:var(--coral);stroke:var(--fg)" stroke-width="1.5"/>`,
  tank: `<path d="M12 14v34a20 6 0 0 0 40 0V14" style="fill:var(--sky);stroke:var(--fg)" fill-opacity=".5" stroke-width="2"/><ellipse cx="32" cy="14" rx="20" ry="6" ${FS('var(--surface-2)')}/><path d="M16 56v5M48 56v5M12 30a20 6 0 0 0 40 0" ${FN}/>`,
  lunchbox: `<rect x="8" y="24" width="48" height="30" rx="5" ${FS('var(--accent)')}/><path d="M8 34h48" ${FN}/><path d="M24 24v-5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v5" ${FN}/><rect x="28" y="31" width="8" height="6" rx="1" ${FS('var(--surface-2)', 1.5)}/>`,
  soapbox: `<path d="M12 22l9-9h36l-9 9z" ${FS('var(--surface-2)')}/><rect x="12" y="22" width="36" height="30" ${FS('var(--sun)')}/><path d="M48 22l9-9v30l-9 9z" ${FS('var(--coral)')}/><path d="M18 36h24" ${FN} stroke-opacity=".5"/>`,
  wardrobe: `<rect x="14" y="5" width="36" height="52" rx="2" ${FS('var(--sun)')}/><path d="M32 5v52" ${FN} stroke-width="1.5"/><circle cx="28" cy="32" r="1.8" style="fill:var(--fg)"/><circle cx="36" cy="32" r="1.8" style="fill:var(--fg)"/><path d="M17 57v4M47 57v4" ${FN}/>`,
  spoon: `<ellipse cx="32" cy="17" rx="10" ry="13" ${FS('var(--surface-2)')}/><rect x="29.5" y="29" width="5" height="30" rx="2.5" ${FS('var(--surface-2)')}/>`,
  sugar: `<path d="M32 12l20 10-20 10-20-10z" ${FS('var(--surface-2)')}/><path d="M12 22l20 10v22L12 44z" ${FS('var(--sky)')}/><path d="M52 22L32 32v22l20-10z" ${FS('var(--sun)')}/>`,
  room: `<path d="M6 20l20-8h34v32L40 56H6z" style="fill:var(--surface-2);stroke:var(--fg)" stroke-width="2" stroke-linejoin="round"/><path d="M6 20h34v36M40 20l20-8" ${FN}/><rect x="12" y="26" width="22" height="12" ${FS('var(--accent)', 1.5)}/>`
};
function miniFig(tok) {
  const m = String(tok).match(/^@(rect|obj):(.+)$/); if (!m) return null;
  if (m[1] === 'obj') return OBJ[m[2]] ? `<svg class="mf" viewBox="0 0 64 64" role="img" aria-label="${esc(m[2])}">${OBJ[m[2]]}</svg>` : null;
  const [w, h] = m[2].split('x').map(Number); if (!(w > 0 && h > 0)) return null;
  const k = Math.min(92 / w, 62 / h), pw = w * k, ph = h * k, x0 = 34 + (92 - pw) / 2, y0 = 18 + (62 - ph) / 2, sq = w === h, cx = x0 + pw / 2, cy = y0 + ph / 2;
  const tk = (x, y, vert, n) => Array.from({ length: n }, (_, i) => { const o = (i - (n - 1) / 2) * 5; return vert ? `<path d="M${x - 4} ${y + o}h8" style="stroke:var(--fg)" stroke-width="2"/>` : `<path d="M${x + o} ${y - 4}v8" style="stroke:var(--fg)" stroke-width="2"/>`; }).join('');
  const ra = (x, y, dx, dy) => `<path d="M${x + dx * 7} ${y}v${dy * 7}h${-dx * 7}" style="fill:none;stroke:var(--fg)" stroke-width="1.2" stroke-opacity=".6"/>`;
  const g = `<rect x="${x0}" y="${y0}" width="${pw}" height="${ph}" ${FS(sq ? 'var(--sky-soft, var(--sky))' : 'var(--sun-soft, var(--sun))')}/>` + ra(x0, y0, 1, 1) + ra(x0 + pw, y0, -1, 1) + ra(x0, y0 + ph, 1, -1) + ra(x0 + pw, y0 + ph, -1, -1)
    + tk(cx, y0, false, 1) + tk(cx, y0 + ph, false, 1) + tk(x0, cy, true, sq ? 1 : 2) + tk(x0 + pw, cy, true, sq ? 1 : 2)
    + `<text x="${cx}" y="${y0 - 6}" font-size="13" font-weight="800" text-anchor="middle" style="fill:var(--muted)">${w}</text><text x="${x0 - 8}" y="${cy + 5}" font-size="13" font-weight="800" text-anchor="end" style="fill:var(--muted)">${h}</text>`;
  return `<svg class="mf" viewBox="0 0 140 104" role="img" aria-label="${w} × ${h}">${g}</svg>`;
}
const fig = x => (typeof x === 'string' && x[0] === '@' && miniFig(x)) || esc(x);
// key word title + gloss: lessons with main "am" show the Amharic term first and the English term as the gloss (Grades 1-6)
const kwMain = (k, fallback, main) => !k ? [fallback, ''] : main === 'am' && k.am ? [k.am, k.en] : [k.en || fallback, k.am || ''];
const initials = n => n.replace(/^(Prof\.|Dr\.|Engineer)\s+/i, '').split(/\s+/).map(w => w[0]).slice(0, 2).join('');

/* ---------- Blocks: one builder per kind ---------- */
const Blocks = {
  read(s, ctx) { return h('rd', (s.title ? `<h3>${esc(s.title)}</h3>` : '') + (s.paras || []).map(p => Text(p, ctx)).join('') + (s.table ? `<div class="tbl"><table>${s.table.map((r, i) => `<tr>${r.map(x => i ? `<td data-text>${esc(x)}</td>` : `<th>${esc(x)}</th>`).join('')}</tr>`).join('')}</table></div>` : '') + (s.note ? Blocks.tip(s.note) : '')); },
  tip(note) { return `<div class="tip"><span>💡</span><span class="tx" data-text>${esc(note)}</span></div>`; },
  picture(s, ctx) { return h('picblk', `<div class="pic">${pic(s.pic, s.caption)}</div>${s.caption ? Text(s.caption, null, 'p', 'cap') : ''}${s.text ? Text(s.text, ctx) : ''}`); },
  gallery(s, ctx) {
    const el = h('gal', (s.title ? `<h3>${esc(s.title)}</h3>` : '') + (s.ask ? Text(s.ask, ctx, 'p', 'muted') : '') + `<div class="galgrid">${s.items.map((it, i) => `<button class="gi" data-i="${i}" aria-expanded="false"><span class="pic">${pic(it[0], it[1])}</span><span class="gn">${esc(it[1])}</span></button>`).join('')}</div><div class="ginfo" hidden data-text></div>`);
    const info = el.querySelector('.ginfo');
    const gseen = new Set(); el.querySelector('.galgrid').onclick = e => { const b = e.target.closest('.gi'); if (!b) return; const it = s.items[+b.dataset.i]; gseen.add(b.dataset.i); b.classList.add('seen'); if (gseen.size >= Math.min(3, s.items.length)) ctx.complete(s); const on = b.getAttribute('aria-expanded') !== 'true'; el.querySelectorAll('.gi').forEach(x => x.setAttribute('aria-expanded', x === b && on)); info.hidden = !on; info.innerHTML = on ? `<b>${esc(it[1])}</b> ${esc(it[2] || '')}` : ''; };
    return el;
  },
  people(s, ctx) {
    return h('ppl', (s.title ? `<h3>${esc(s.title)}</h3>` : '') + `<div class="pplgrid">${s.people.map(p => `<div class="person"><div class="face">${p.img ? `<img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${esc(initials(p.name))}'}))">` : `<span>${esc(initials(p.name))}</span>`}</div><div class="pinfo"><b>${esc(p.name)}</b>${p.years || p.from ? `<small>${esc([p.years, p.from].filter(Boolean).join(' · '))}</small>` : ''}${Text(p.did, ctx)}</div></div>`).join('')}</div>`);
  },
  name(s, ctx) { return h('keys', s.defs.map(d => { const k = ctx.kws.find(x => [x.en, x.am].some(v => v && v.toLowerCase() === d[0].toLowerCase())), mk = kwMain(k, d[0], ctx.main); return `<div class="kcard"><div class="kt">📘 ${esc(mk[0])}${mk[1] ? ` <span class="kam" lang="${ctx.main === 'am' ? 'en' : 'am'}">${esc(mk[1])}</span>` : ''}</div>${Text(d[1], null, 'div', 'kd')}</div>`; }).join('')); },
  guess(s, ctx) {
    const el = h('quiz think', `<div class="ql">🤔 ${t('step_hook')}</div>${Text(s.ask || s.text || '', null, 'p', 'qq')}${s.ask && s.text ? Text(s.text, null, 'p', 'small qctx') : ''}<div class="qo">${s.opts.map(o => `<button class="qb">${esc(o)}</button>`).join('')}</div><p class="qf" hidden data-text></p>`);
    el.querySelector('.qo').onclick = e => { const b = e.target.closest('.qb'); if (!b || el.dataset.done) return; el.dataset.done = 1; b.classList.add('pick', 'pop'); el.querySelectorAll('.qb').forEach(x => x.disabled = true); const f = el.querySelector('.qf'); f.hidden = !s.after; f.textContent = s.after || ''; ctx.complete(s); };
    if (ctx.isDone(s)) { el.dataset.done = 1; el.querySelectorAll('.qb').forEach(x => x.disabled = true); }
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
      if (ok) { b.classList.add('ok', 'pop'); say('ok', s.why); lock(); Fx.verdict('ok'); ctx.right(b, s, tries); }
      else { b.classList.add('no', 'shake'); b.disabled = true; setTimeout(() => b.classList.remove('shake'), 500); ctx.wrong(el);
        if (tries >= 2) { say('no', answerLine(ans, s)); lock(); Fx.verdict('answer'); ctx.done(el, s, 0); } else { say('no', `${s.clue || t('not_yet')} ${t('try_again')}.`); Fx.verdict('retry'); } } };
    return el;
  },
  answer(s, ctx) { // blank, pick, sort, order, match: shared renderers plus one Check button
    let phase = 'answer', tries = 0, cur = null; const btn = document.createElement('button'); btn.className = 'btn small'; btn.textContent = t('check'); const f = document.createElement('p'); f.className = 'qf'; f.hidden = true;
    const env = { phase: () => phase, state: {}, explain: null, enter: () => { if (!btn.disabled) btn.click(); }, update() { if (cur) btn.disabled = phase !== 'answer' || !cur.ready(); } };
    const RR = makeR(env).R; cur = (RR[s.kind] || RR.name)(Object.assign({}, s, { title: '', step: '', ref: '', level: 0 }));
    const el = h('quiz', `<div class="ql">✏️ ${t('quick_check')}</div>${s.title ? Text(s.title, null, 'p', 'qq') : ''}`); el.append(cur.el, f, btn); env.update();
    const say = (cls, txt) => { f.hidden = !txt; f.className = 'qf ' + cls; f.textContent = txt || ''; };
    ctx.question(el, s, { restore(v) { if (v === 's') return; btn.hidden = true; say('ok', '✓ ' + (s.why || '')); } });
    btn.onclick = () => { const r = cur.check(); tries++; ctx.log(s, !!r.ok, tries);
      if (r.ok) { phase = 'done'; btn.hidden = true; say('ok', r.body); Fx.verdict('ok'); ctx.right(btn, s, tries); }
      else { ctx.wrong(el); Fx.verdict(tries >= 2 ? 'answer' : 'retry'); if (tries >= 2) { const shown = s.kind === 'blank' ? s.a[0] : s.kind === 'pick' ? s.a.join(', ') : ''; phase = 'done'; btn.hidden = true; say('no', answerLine(shown, s)); ctx.done(el, s, 0); } else { say('no', `${r.body || t('not_yet')} ${t('try_again')}.`); cur.retry && cur.retry(); env.update(); } } };
    return el;
  },
  reveal(s, ctx) { // a book Activity: think, then tap to see the answer
    const el = h('quiz act', `<div class="ql">🧪 ${esc(s.title || t('activity'))}</div>${Text(s.ask, null, 'p', 'qq')}<button class="btn ghost small rv">${t('show_answer')}</button><p class="qf ok" hidden data-text>${esc(s.answer)}</p>`);
    const b = el.querySelector('.rv'), a = el.querySelector('.qf');
    const open = anim => { b.hidden = true; a.hidden = false; if (anim) { a.classList.add('pop'); ctx.complete(s); } };
    b.onclick = () => open(true); if (ctx.isDone(s)) open(false);
    return el;
  },
  tree(s, ctx) { // interactive tree diagram: tap a box to see what it covers
    const nodes = []; const walk = (n, d, parent) => { const i = nodes.length; nodes.push({ n, d, parent }); (n.children || []).forEach(c => walk(c, d + 1, i)); }; walk(s.root, 0, -1);
    const depth = Math.max(...nodes.map(x => x.d)); const rows = []; for (let d = 0; d <= depth; d++) rows.push(nodes.map((x, i) => [x, i]).filter(([x]) => x.d === d));
    const el = h('quiz fig tree', `<div class="ql">👆 ${t('tap_explore')}</div>${s.title ? Text(s.title, null, 'p', 'qq') : ''}<div class="treebox">${rows.map(r => `<div class="trow">${r.map(([x, i]) => `<button class="tnode" data-i="${i}">${x.n.pic ? `<span class="pic">${pic(x.n.pic, x.n.label)}</span>` : ''}<span>${esc(x.n.label)}</span></button>`).join('')}</div>`).join('')}</div><div class="ginfo" hidden data-text></div>`);
    const info = el.querySelector('.ginfo'), seen = new Set();
    el.querySelector('.treebox').onclick = e => { const b = e.target.closest('.tnode'); if (!b) return; const i = +b.dataset.i, path = new Set(); for (let k = i; k >= 0; k = nodes[k].parent) path.add(k);
      el.querySelectorAll('.tnode').forEach(x => { x.classList.toggle('on', +x.dataset.i === i); x.classList.toggle('path', path.has(+x.dataset.i) && +x.dataset.i !== i); });
      const n = nodes[i].n; info.hidden = false; info.innerHTML = `<b>${esc(n.label)}</b> ${esc(n.info || '')}${n.children ? `<br><small>${t('includes')}: ${n.children.map(c => esc(c.label)).join(', ')}</small>` : ''}`; info.classList.remove('pop'); void info.offsetWidth; info.classList.add('pop');
      seen.add(i); if (seen.size >= Math.min(3, nodes.length)) ctx.complete(s); };
    return el;
  },
  venn(s, ctx) { // interactive Venn diagram: tap a circle or an overlap
    const n = s.sets.length, C = n === 2 ? [[110, 100], [190, 100]] : [[115, 95], [185, 95], [150, 155]], cols = ['var(--sky)', 'var(--coral)', 'var(--accent)'];
    const regions = s.sets.map((x, i) => ({ label: x[0], info: x[1], sets: [i] })).concat((s.overlaps || []).map(o => ({ label: o[1], info: o[2], sets: o[0] })));
    const el = h('quiz fig venn', `<div class="ql">👆 ${t('tap_explore')}</div>${s.title ? Text(s.title, null, 'p', 'qq') : ''}<svg viewBox="0 0 300 ${n === 2 ? 200 : 250}" class="vsvg" role="img" aria-label="${esc(s.title || 'Venn diagram')}"></svg><div class="vchips">${regions.map((r, i) => `<button class="vchip ${r.sets.length > 1 ? 'ov' : ''}" data-i="${i}">${esc(r.label)}</button>`).join('')}</div><div class="ginfo" hidden data-text></div>`);
    const svg = el.querySelector('svg'), info = el.querySelector('.ginfo'), seen = new Set(); let sel = -1;
    const draw = () => { const on = sel >= 0 ? regions[sel].sets : []; svg.innerHTML = C.map((c, i) => `<circle data-set="${i}" cx="${c[0]}" cy="${c[1]}" r="72" style="fill:${cols[i]};stroke:${cols[i]};cursor:pointer" fill-opacity="${on.includes(i) ? (on.length > 1 ? .45 : .55) : .14}" stroke-width="${on.includes(i) ? 4 : 2}"/>`).join('') + C.map((c, i) => `<text x="${c[0] + (i === 0 ? -34 : i === 1 ? 34 : 0)}" y="${c[1] + (i === 2 ? 40 : -22)}" text-anchor="middle" font-size="14" font-weight="800" style="fill:var(--fg);pointer-events:none">${esc(s.sets[i][0])}</text>`).join(''); el.querySelectorAll('.vchip').forEach(b => b.classList.toggle('on', +b.dataset.i === sel)); };
    const pick = i => { sel = i; draw(); const r = regions[i]; info.hidden = false; info.innerHTML = `<b>${esc(r.label)}</b> ${esc(r.info || '')}`; info.classList.remove('pop'); void info.offsetWidth; info.classList.add('pop'); seen.add(i); if (seen.size >= Math.min(3, regions.length)) ctx.complete(s); };
    el.querySelector('.vchips').onclick = e => { const b = e.target.closest('.vchip'); if (b) pick(+b.dataset.i); };
    svg.onclick = e => { const c = e.target.closest('circle'); if (c) pick(+c.dataset.set); };
    draw(); return el;
  },
  tap(s, ctx) { // tap-to-explore buttons (optionally with pictures)
    if (s.graded) return Blocks.answer(s, ctx);
    const el = h('quiz fig taps', `<div class="ql">👆 ${t('tap_explore')}</div>${s.title ? Text(s.title, null, 'p', 'qq') : ''}${s.ask ? Text(s.ask, null, 'p', 'small qctx') : ''}<div class="tbtns ${s.items.some(x => x[2]) ? 'withpic' : ''}">${s.items.map((it, i) => `<button class="tb" data-i="${i}">${it[2] ? `<span class="pic">${pic(it[2], it[0])}</span>` : ''}<span>${esc(it[0])}</span></button>`).join('')}</div><div class="ginfo" hidden data-text></div>`);
    const info = el.querySelector('.ginfo'), seen = new Set(), need = Math.min(s.need || 3, s.items.length);
    el.querySelector('.tbtns').onclick = e => { const b = e.target.closest('.tb'); if (!b) return; const i = +b.dataset.i; el.querySelectorAll('.tb').forEach(x => x.classList.toggle('on', x === b)); b.classList.add('seen'); info.hidden = false; info.innerHTML = `<b>${esc(s.items[i][0])}</b> ${esc(s.items[i][1])}`; info.classList.remove('pop'); void info.offsetWidth; info.classList.add('pop'); seen.add(i); if (seen.size >= need) ctx.complete(s); };
    if (ctx.isDone(s)) el.querySelectorAll('.tb').forEach(x => x.classList.add('seen'));
    return el;
  },
  explore(s, ctx) { // ungraded sort / tap / steps / tiles
    let cur = null; const env = { phase: () => 'answer', state: {}, explain: null, enter() {}, update() { if (cur && cur.ready()) ctx.complete(s); } };
    const RR = makeR(env).R; cur = (RR[s.kind] || RR.name)(Object.assign({}, s, { title: '', step: '', ref: '', level: 0 }));
    const el = h(s.kind === 'steps' ? 'quiz worked' : 'quiz think', `<div class="ql">${s.kind === 'steps' ? '🧩 ' + t('worked_example') : '🔍 ' + t('step_explore')}</div>${s.title ? Text(s.title, null, 'p', 'qq') : ''}`); el.appendChild(cur.el); return el;
  }
};
// after a second wrong try: say the answer once. Skip "The answer is" when the explanation already states it.
function answerLine(shown, s) {
  shown = String(shown == null ? '' : shown).replace(/@rect:(\d+)x(\d+)/g, '$1 × $2').replace(/@obj:([a-z]+)/g, '$1');
  const ex = s.worked || s.why || '', parts = String(shown || '').split(/,\s*/).filter(Boolean);
  if (!shown || (parts.length && parts.every(x => ex.includes(x)))) return ex || `${t('answer_is')} ${shown}.`;
  return `${t('answer_is')} ${shown}. ${ex}`.trim();
}
/* Practise mix: the lesson's own questions (★ book level) plus extra questions from the same formulas.
   Extras are marked _adapt: the player picks their level (★★ or ★★★) from how the student is doing. Target overall mix ≈ 30% ★, 40% ★★, 30% ★★★. */
function mixPractise(base, again) {
  const own = base.map(x => again && Gen.has(x) ? Object.assign(Gen.make(x, null, null, x.level || 1), { _adapt: true }) : x);
  const tpl = []; base.forEach(x => { if (Gen.has(x) && !tpl.some(y => y.gen.t === x.gen.t && y.gen.op === x.gen.op && y._idea === x._idea)) tpl.push(x); });
  const n = Math.min(Math.max(2, Math.round(base.length * 1.2)), tpl.length * 3, 10), extra = [];
  for (let i = 0; i < n && tpl.length; i++) { const x = tpl[i % tpl.length]; extra.push(Object.assign({}, x, { _key: x._key + '~' + i, _adapt: true, level: 2 })); }
  const out = []; own.forEach((x, i) => { out.push(x); if (extra[i]) out.push(extra[i]); }); return out.concat(extra.slice(own.length));
}
function levelTag(s) { return s.level ? `<span class="lvl l${s.level}" title="${esc(t('level_' + s.level))}">${'★'.repeat(s.level)}</span>` : ''; }
function h(cls, html) { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; return d; }
function renderBlock(s, ctx) {
  const fn = Blocks[s.kind] || ((s.kind === 'mcq' || s.kind === 'tf') && s.graded ? Blocks.choice : s.graded ? Blocks.answer : Blocks.explore);
  const el = fn(s, ctx); el.dataset.kind = s.kind; if (s.id) el.dataset.id = s.id; if (s._gen) el.dataset.gen = '1';
  const ql = el.querySelector('.ql');
  if (ql && s.step === 'challenge') { ql.innerHTML = `🏆 ${esc(t('challenge'))}`; el.classList.add('chal'); }
  if (ql && s.level && s.graded) ql.insertAdjacentHTML('beforeend', levelTag(s));
  if (s.ref && ql) ql.insertAdjacentHTML('beforeend', `<span class="ref">📖 ${esc(s.ref)}</span>`);
  return el;
}

async function loadPictures() { if (window.PICS) return; await new Promise(r => { const sc = document.createElement('script'); sc.src = 'pictures.js'; sc.onload = sc.onerror = r; document.head.appendChild(sc); }); }

async function viewBook(id, goItem) {
  const idx = await loadIndex(); const c = idx.chapters.find(x => x.id === id); if (!c) { location.hash = 'home'; return; }
  const secs = c.sections.filter(x => x.lesson);
  const [lessons] = await Promise.all([Promise.all(secs.map(x => loadLesson(x.lesson))), loadPictures()]);
  const bookLang = (lessons.find(x => x.lang) || {}).lang || null; await loadDict(bookLang); setLessonLang(bookLang); Translate.dir(bookLang);
  setNav(false); hideTray(); markStudied(); logEvent({ kind: 'chapter_open', chapter: id });
  const all = store.get('bk', {}), B = all[id] = Object.assign({ got: {}, seen: {}, pts: 0, prac: {} }, all[id]); B.seen = B.seen || {};
  const save = () => { const a = store.get('bk', {}); a[id] = B; store.set('bk', a); };
  store.set('last', { route: 'book/' + id, title: `${t('unit')} ${c.unit} · ${L(c.title)}`, sub: `${L(idx.subjects[c.subject])} · ${t('grade')} ${c.grade}` });
  let streak = 0, away = false; const units = [], secUnits = secs.map(() => []);
  const chapterLabel = `${t('grade')} ${c.grade} · ${L(idx.subjects[c.subject])} · ${t('unit')} ${c.unit}`;
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
    const done = u => u.q ? typeof B.got[u.key] === 'number' : !!B.seen[u.key];
    const d = units.filter(done).length, pct = units.length ? Math.round(d / units.length * 100) : 0;
    $('#pbar').style.width = pct + '%'; $('#ppct').textContent = pct + '%';
    page.querySelectorAll('#secnav .chip').forEach((ch, i) => { const u = secUnits[i], p = u.length ? Math.round(u.filter(done).length / u.length * 100) : 0; ch.style.setProperty('--p', p + '%'); ch.classList.toggle('full', p === 100); });
  }

  secs.forEach((sec, si) => {
    const ls = lessons[si], kws = ls.keywords || [], hue = hueOf(sec.n);
    const box = document.createElement('section'); box.className = `sec h-${hue}`; box.id = 'sec' + si; box.dataset.i = si;
    box.innerHTML = `<h2 class="sechead"><span class="num">${esc(sec.n)}</span><span>${esc(ls.title)}</span></h2>`;
    const inline = [], practise = [];
    ls.ideas.forEach((idea, ii) => idea.screens.forEach((s, k) => { const sx = Object.assign({ _idea: idea.id, _key: `${sec.lesson}#${ii}.${k}` }, s); (s.graded && !['check', 'notice', 'challenge'].includes(s.step) ? practise : inline).push(sx); }));
    const seenIdea = new Set(); const rows = inline.filter(s => { if (!s.graded || s.step === 'challenge') return true; if (seenIdea.has(s._idea)) { practise.unshift(s); return false; } seenIdea.add(s._idea); return true; });
    // games stay in the reading: they are the hands-on part students enjoy
    for (let q = practise.length - 1; q >= 0; q--) { const g = practise[q]; if (['sort', 'match', 'order', 'pick'].includes(g.kind)) { practise.splice(q, 1); const at = rows.map(r => r._idea).lastIndexOf(g._idea); rows.splice(at + 1, 0, g); } }
    rows.filter(s => s.step === 'challenge').forEach(c => { rows.splice(rows.indexOf(c), 1); rows.splice(rows.map(r => r._idea).lastIndexOf(c._idea) + 1, 0, c); });
    const qKeys = rows.filter(s => s.graded).map(s => s._key);
    const doneCheck = () => { const ban = box.querySelector('.secdone'); if (!ban || !qKeys.every(k => k in B.got) || box.classList.contains('complete')) return; box.classList.add('complete'); ban.hidden = false;
      if (!B.got['done:' + sec.lesson]) { B.got['done:' + sec.lesson] = 1; setLessonProgress(sec.lesson, { done: true }); logEvent({ kind: 'section_done', lesson: sec.lesson, chapter: id, pts: B.pts }); const by = {}; qKeys.forEach(k => { const s = rows.find(r => r._key === k); by[s._idea] = (by[s._idea] !== false) && B.got[k] >= 10; }); Object.keys(by).forEach(i => bumpMastery(i, by[i])); B.pts += 20; save(); bumpPts(); Fx.at(ban, true); buzz([20, 40, 20]); } };
    const ctx = { kws, used: new Set(), hue, main: ls.main,
      complete(s) { if (B.seen[s._key]) return; B.seen[s._key] = 1; save(); progress(); }, isDone(s) { return !!B.seen[s._key]; }, log(s, ok, attempt) { logEvent({ lesson: ls.id, idea: s._idea, item: s._key, correct: ok, attempt, mode: 'book' }); },
      question(el, s, api) { // shared behaviour for every question: skip, restore, finishing
        const sk = document.createElement('button'); sk.className = 'skip'; sk.textContent = t('skip') + ' ›'; sk.hidden = s.kind === 'mcq' || s.kind === 'tf'; el.appendChild(sk);
        sk.onclick = () => { if (s._key in B.got) return; B.got[s._key] = 's'; save(); sk.hidden = true; el.classList.add('skipped'); el.querySelector('.qf') && (el.querySelector('.qf').hidden = true); const n = document.createElement('p'); n.className = 'skipnote'; n.textContent = '↷ ' + t('skipped_note'); el.appendChild(n); if (!practise.includes(s)) practise.unshift(s); updPrac(); streak = 0; progress(); doneCheck(); };
        if (s._key in B.got) { const v = B.got[s._key]; sk.hidden = true; if (v === 's') { el.classList.add('skipped'); const n = document.createElement('p'); n.className = 'skipnote'; n.textContent = '↷ ' + t('skipped_note'); el.appendChild(n); if (!practise.includes(s)) practise.unshift(s); } else { el.classList.add('done'); api.restore(v); } }
      },
      right(target, s, tries) { const pts = (s.level === 3 ? [15, 8] : [10, 5])[tries === 1 ? 0 : 1]; streak++; Fx.at(target); Fx.float(target, '+' + pts); buzz(25); B.pts += pts; bumpPts(); if (streak >= 3) Fx.float($('#pts'), `🔥 ${t('in_a_row', { n: streak })}`); ctx.done(target.closest('.quiz'), s, pts); },
      wrong(el) { streak = 0; buzz(60); const sk = el && el.querySelector('.skip'); if (sk && !el.classList.contains('done')) sk.hidden = false; },
      done(el, s, pts) { el.classList.add('done'); const sk = el.querySelector('.skip'); if (sk) sk.remove(); if (!(s._key in B.got) || B.got[s._key] === 's') { B.got[s._key] = pts; save(); } progress(); doneCheck(); }
    };
    rows.forEach(s => { const el = renderBlock(s, ctx); if (s.graded || ['guess', 'reveal', 'sort', 'tap', 'steps', 'tiles', 'order', 'match', 'tree', 'venn', 'gallery', 'numline', 'fracbar', 'grid', 'cubes', 'ladder', 'figure', 'nest', 'slider'].includes(s.kind)) { const u = { key: s._key, q: !!s.graded }; units.push(u); secUnits[si].push(u); } box.appendChild(el); });
    box.querySelectorAll('.kwt').forEach(b => b.onclick = () => { const k = kws[+b.dataset.k]; const mk = kwMain(k, k.en, ls.main); sheet(`<div class="kcard big"><div class="kt">📘 ${esc(mk[0])}</div>${mk[1] ? `<div class="kam" lang="${ls.main === 'am' ? 'en' : 'am'}">${esc(mk[1])}</div>` : ''}${k.om ? `<div class="kam" lang="om">${esc(k.om)}</div>` : ''}<div class="kd" data-text>${esc(k.def || '')}</div></div><button class="btn" id="kok">${t('continue')}</button>`); $('#kok').onclick = () => sheet(''); });
    // end of section: celebration, practise set, book exercises
    const end = document.createElement('div'); end.className = 'secend';
    end.innerHTML = `<div class="secdone" hidden>🎉 ${t('section_done', { s: esc(sec.n) })} <b>+20 ⭐</b></div><div class="prac"></div>${(ls.exercises || []).map((ex, k) => `<button class="pcard ${ex.chapter_test ? '' : 'soft'}" data-a="ex" data-k="${k}"><span class="pi">${ex.chapter_test ? '🏁' : ex.test ? '🎯' : '📝'}</span><span class="grow"><b>${esc(ex.book_name)}</b><small>${ex.chapter_test ? t('timed_test', { n: ex.count || 20, m: ex.minutes || 25 }) + (B.best && B.best[ls.id] ? ` · ${t('best')} ${B.best[ls.id]}/${ex.count || 20}` : '') : (ex.test ? t('fresh_test') : t('book_exercise')) + ' · ' + ex.items.length}</small></span><span>›</span></button>`).join('')}`;
    end.insertAdjacentHTML('beforeend', `<button class="btn link small fbsec">🚩 ${t('report_section')}</button>`);
    end.querySelector('.fbsec').onclick = () => Feedback.open({ lesson: ls.id, chapter: chapterLabel, section: `${sec.n} ${ls.title}`, link: Feedback.link(id, ls.ideas[0] && ls.ideas[0].screens[0] && ls.ideas[0].screens[0].id) });
    function updPrac() { const pr = B.prac[sec.lesson]; end.querySelector('.prac').innerHTML = practise.length ? `<button class="pcard" data-a="prac"><span class="pi">🎯</span><span class="grow"><b>${t('practise_n', { n: practise.length })}</b><small>${pr ? `${t('best')} ${pr}` : t('practise_sub')}</small></span><span>›</span></button>` : ''; }
    updPrac();
    const runHere = cfg => { const keep = { app: [...app.childNodes], top: [...topin.childNodes], y: window.scrollY }; away = true; cfg.where = { chapter: chapterLabel, section: `${sec.n} ${ls.title}`, chapterId: id };
      runPlayer(Object.assign({ backRoute: null, refreshers: ls.refreshers || {}, tool: ls.tool, cheer: true, resume: () => { app.replaceChildren(...keep.app); topin.replaceChildren(...keep.top); top.hidden = false; hideTray(); setNav(false); away = false; Feedback.here = bookHere; FAB.show(true); bumpPts(); Focus.tick(); requestAnimationFrame(() => window.scrollTo(0, keep.y)); } }, cfg)); };
    end.addEventListener('click', e => { const b = e.target.closest('.pcard'); if (!b) return;
      if (b.dataset.a === 'prac') { B.runs = B.runs || {}; const again = (B.runs[sec.lesson] = (B.runs[sec.lesson] || 0) + 1) > 1; save(); runHere({ id: ls.id, title: `${sec.n} · ${ls.title}`, mode: 'practice', vary: true, adapt: true, startLevel: (B.lvl && B.lvl[sec.lesson]) || 2, onLevel: L => { B.lvl = B.lvl || {}; B.lvl[sec.lesson] = L; save(); }, screens: mixPractise(practise, again), onDone: res => { const right = Object.values(res.firstTry).filter(Boolean).length; B.prac[sec.lesson] = `${right}/${practise.length}`; B.pts += right * 5; practise.forEach((s, i) => { if (B.got[s._key] === 's' && res.firstTry[i]) B.got[s._key] = 5; }); save(); Object.keys(res.byIdea).forEach(i => bumpMastery(i, res.byIdea[i])); updPrac(); } }); }
      else { const ex = ls.exercises[+b.dataset.k];
        if (ex.chapter_test) { const want = ex.count || 20, per = []; secs.forEach((sx, i) => (lessons[i].test || []).forEach(q => per.push(Object.assign({ _sec: sx.n, _secTitle: lessons[i].title, _lesson: lessons[i].id }, q)))); (ex.items || []).forEach(q => per.push(Object.assign({ _sec: sec.n, _secTitle: ls.title, _lesson: ls.id }, q)));
          const bySec = {}; per.forEach(q => { (bySec[q._sec] = bySec[q._sec] || []).push(q); }); const keys = Object.keys(bySec), pickN = []; let k = 0; while (pickN.length < Math.min(want, per.length)) { const pool = bySec[keys[k % keys.length]]; if (pool.length) pickN.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]); k++; }
          const items = pickN.map((q, i) => Gen.make(q, null, null, q.level || (i % 3) + 1)); runHere({ id: ls.id, title: ex.book_name, mode: 'test', minutes: ex.minutes || 25, screens: items, onDone: res => { const right = Object.values(res.firstTry).filter(Boolean).length; B.best = B.best || {}; if (!B.best[ls.id] || right > B.best[ls.id]) B.best[ls.id] = right; save(); const sm = b.querySelector("small"); if (sm && B.best[ls.id]) sm.textContent = t('timed_test', { n: want, m: ex.minutes || 25 }) + ` · ${t('best')} ${B.best[ls.id]}/${want}`; } }); }
        else runHere(ex.test ? { id: ls.id, title: ex.book_name, mode: 'test', vary: true, screens: ex.items.map(x => Gen.make(x)) } : { id: ls.id, title: ex.book_name, mode: 'book', screens: ex.items }); } });
    box.appendChild(end); page.appendChild(box); doneCheck();
  });
  const fin = document.createElement('div'); fin.className = 'bookend'; fin.innerHTML = `<div class="display">⭐ ${t('book_points')}</div><a class="btn ghost" href="#exams">${t('exams')} ›</a>`; page.appendChild(fin);
  // what the student is looking at: the section in view and the block nearest the middle of the screen
  function bookHere() { const on = page.querySelector('#secnav .chip.on'), i = on ? +on.dataset.go : 0, sec = secs[i], ls = lessons[i]; let best = null, bd = 1e9;
    page.querySelectorAll('[data-id]').forEach(el => { const r = el.getBoundingClientRect(); if (r.bottom < 70 || r.top > innerHeight) return; const d = Math.abs(r.top + r.height / 2 - innerHeight / 2) + (el.classList.contains('quiz') ? 0 : 250); if (d < bd) { bd = d; best = el; } });
    return { chapter: chapterLabel, section: sec ? `${sec.n} ${ls.title}` : '', lesson: ls ? ls.id : '', item: best ? best.dataset.id : '', link: Feedback.link(id, best ? best.dataset.id : ''), question: best ? best.innerText.replace(/\s+/g, ' ').trim().slice(0, 400) : '' }; }
  Feedback.here = bookHere; FAB.show(true);
  progress(); Translate.bind(page);
  page.querySelector('#secnav').addEventListener('click', e => { const a = e.target.closest('[data-go]'); if (!a) return; e.preventDefault(); $('#sec' + a.dataset.go).scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  try {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { page.querySelectorAll('#secnav .chip').forEach(ch => ch.classList.toggle('on', ch.dataset.go === en.target.dataset.i)); const on = page.querySelector('#secnav .chip.on'); if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' }); } }), { rootMargin: '-45% 0px -50% 0px' });
    page.querySelectorAll('.sec').forEach(s => io.observe(s));
  } catch (_) {}
  if (goItem) { const el = page.querySelector(`[data-id="${CSS.escape(goItem)}"]`);
    if (el) setTimeout(() => { el.scrollIntoView({ block: 'center' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 4000); }, 150);
    else { let found = null, li = -1; lessons.forEach((ls, i) => [...ls.ideas.flatMap(x => x.screens), ...(ls.exercises || []).flatMap(e => e.items), ...(ls.test || [])].forEach(sc => { if (sc.id === goItem) { found = sc; li = i; } }));
      if (found) { window.scrollTo(0, 0); setTimeout(() => runPlayer({ id: lessons[li].id, title: `${secs[li].n} · ${t('reported_q')}`, mode: 'book', screens: [Object.assign({}, found, { _from: goItem })], backRoute: 'book/' + id }), 200); }
      else toast(t('item_missing')); } }
  else if (B.y) requestAnimationFrame(() => window.scrollTo(0, B.y)); else window.scrollTo(0, 0);
  let tm; const onScroll = () => { if (away || !page.isConnected) return; clearTimeout(tm); tm = setTimeout(() => { if (page.isConnected && !away) { B.y = Math.round(window.scrollY); save(); } }, 400); };
  window.removeEventListener('scroll', viewBook._s || (() => {})); viewBook._s = onScroll; window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---------- router ---------- */
async function route() {
  sheet(''); closePanel(); FAB.show(false); Feedback.here = null;
  const h = location.hash.replace(/^#/, ''), [r, a, b, c4] = h.split('/');
  if (!S.lang && r !== 'welcome') { await viewWelcome(); return; }
  if (!T.app) await loadLang(S.lang);
  if (!/^(book|lesson)\//.test(h)) { setLessonLang(null); Translate.dir(null); }
  if (S.lang && !S.grades.length && !['setup', 'welcome', 'settings'].includes(r) && r) { location.hash = 'setup'; return; }
  switch (r) {
    case '': case 'welcome': return S.lang && S.grades.length && r === '' ? viewHome() : viewWelcome();
    case 'setup': return viewSetup();
    case 'home': return viewHome();
    case 'chapter': return viewChapter(a);
    case 'book': return viewBook(a, b === 'item' ? decodeURIComponent(c4 || '') : '');
    case 'lesson': return viewLesson(decodeURIComponent(a), 'learn');
    case 'exercise': return viewLesson(decodeURIComponent(a), 'book', +b || 0);
    case 'test': return viewLesson(decodeURIComponent(a), 'test');
    case 'review': return viewReview();
    case 'exams': return viewExams();
    case 'settings': return viewSettings();
    default: return viewHome();
  }
}
/* ---------- fractions: any "3/5" in text is shown stacked like the book; textContent stays "3/5" so answers still compare ---------- */
function fracify(root) {
  if (!root || !root.ownerDocument) return;
  const skip = n => { const p = n.nodeType === 3 ? n.parentElement : n; return !p || !!p.closest('svg,script,style,textarea,input,.frac,.mixed,.fwrap,.nofrac'); };
  const split = n => { const s = n.nodeValue, frag = document.createDocumentFragment(); let last = 0;
    // a mixed number "2 1/2" is drawn as one tight unit (2½); a plain "3/4" is drawn stacked. Hidden text keeps textContent = "2 1/2".
    s.replace(/(?<![\d.\/])([−-])?(?:(\d+) )?(\d+)\/(\d+)/g, (m, sg, w, a, b, i) => { frag.append(s.slice(last, i)); const fr = `<span class="frac"><span class="fn">${a}</span><span class="fs">/</span><span class="fd">${b}</span></span>`;
      const sp = document.createElement('span'); sp.className = w ? 'mixed' : 'fwrap'; sp.innerHTML = (sg ? `<span class="mw">${sg}</span>` : '') + (w ? `<span class="mw">${w}</span><span class="fs"> </span>` : '') + fr; frag.append(sp); last = i + m.length; return m; });
    frag.append(s.slice(last)); n.replaceWith(frag); };
  if (root.nodeType === 3) { if (!skip(root) && /\d\/\d/.test(root.nodeValue)) split(root); return; }
  if (root.nodeType !== 1 || skip(root)) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => skip(n) ? NodeFilter.FILTER_REJECT : /\d\/\d/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP });
  const list = []; while (w.nextNode()) list.push(w.currentNode); list.forEach(split);
}
try { new MutationObserver(ms => ms.forEach(m => { if (m.type === 'characterData') fracify(m.target); else m.addedNodes.forEach(fracify); })).observe(document.body, { childList: true, subtree: true, characterData: true }); } catch (_) {}

window.addEventListener('hashchange', route);
window.addEventListener('online', () => {}); window.addEventListener('offline', () => toast(t('offline')));
if ('serviceWorker' in navigator) { try { const had = !!navigator.serviceWorker.controller; navigator.serviceWorker.register('sw.js').then(r => r.update()).catch(() => {}); let once = false; navigator.serviceWorker.addEventListener('controllerchange', () => { if (had && !once) { once = true; location.reload(); } }); } catch (_) {} }
route();
Analytics.session(); setTimeout(() => { Feedback.flush(); Analytics.flush(true); }, 4000); setInterval(() => Analytics.flush(), 120000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') Analytics.flush(true); });
})();
