/* Wraps a classic chapter page: adds the Meseret bar, mirrors "Mark as read" into app progress, and a report button. */
(function () {
  const ID = location.pathname.split('/').pop().replace('.html', '');
  const LANG = (() => { try { return localStorage.getItem('meseret:lang') || 'en'; } catch (_) { return 'en'; } })();
  const T = {
    en: { back: 'Meseret', done: 'lessons read', report: 'Report', reported: 'Thanks. Sent to a teacher.' },
    am: { back: 'መሰረት', done: 'ትምህርቶች ተነበዋል', report: 'ችግር ጠቁም', reported: 'እናመሰግናለን። ለመምህር ተልኳል።' }
  }[LANG] || { back: 'Meseret', done: 'lessons read', report: 'Report', reported: 'Thanks. Sent to a teacher.' };

  const bar = document.createElement('div');
  bar.className = 'ms-bar';
  bar.innerHTML = `<a href="../index.html#chapter/${ID}" aria-label="${T.back}"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>${T.back}</a><span class="ms-title">${document.title.replace(/^Meseret\s*/, '')}</span><span class="ms-done" id="ms-done"></span><button type="button" id="ms-report">${T.report}</button>`;
  document.body.insertBefore(bar, document.body.firstChild);

  function readKeys() {
    const total = document.querySelectorAll('[data-done]').length;
    const done = document.querySelectorAll('[data-done][aria-pressed="true"]').length;
    document.getElementById('ms-done').textContent = `${done}/${total} ${T.done}`;
    try {
      const p = JSON.parse(localStorage.getItem('meseret:progress') || '{}');
      p[ID] = { done, total, at: Date.now() };
      localStorage.setItem('meseret:progress', JSON.stringify(p));
    } catch (_) {}
  }
  document.addEventListener('click', e => { if (e.target.closest('[data-done]')) setTimeout(readKeys, 0); });
  readKeys();

  document.getElementById('ms-report').addEventListener('click', () => {
    const sec = [...document.querySelectorAll('section.lesson')].find(s => s.getBoundingClientRect().bottom > 80);
    const rep = { chapter: ID, section: sec ? sec.id : '', url: location.href, at: new Date().toISOString(), lang: LANG };
    try { const q = JSON.parse(localStorage.getItem('meseret:reports') || '[]'); q.push(rep); localStorage.setItem('meseret:reports', JSON.stringify(q)); } catch (_) {}
    const b = document.getElementById('ms-report'); b.textContent = T.reported; b.disabled = true;
  });
})();
