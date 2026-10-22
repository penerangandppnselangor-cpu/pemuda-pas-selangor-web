// Skrip kecil laman awam: menu mudah alih, salin pautan, carian.
(() => {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('menu');
  if (toggle && menu) {
    const openIcon = toggle.innerHTML;
    const closeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    const set = (open) => {
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
      toggle.innerHTML = open ? closeIcon : openIcon;
      document.body.style.overflow = open && innerWidth < 960 ? 'hidden' : '';
    };
    toggle.addEventListener('click', () => set(!menu.classList.contains('open')));
    document.addEventListener('keydown', (e) => e.key === 'Escape' && set(false));
    addEventListener('resize', () => innerWidth >= 960 && set(false));
  }

  document.querySelectorAll('[data-copy]').forEach((b) =>
    b.addEventListener('click', async () => {
      const url = b.dataset.copy.startsWith('http') ? b.dataset.copy : location.href;
      try {
        if (navigator.share && matchMedia('(pointer:coarse)').matches) { await navigator.share({ url, title: document.title }); return; }
        await navigator.clipboard.writeText(url);
        const s = b.querySelector('span');
        if (s) { s.textContent = 'Pautan disalin'; setTimeout(() => (s.textContent = 'Salin pautan'), 2000); }
      } catch {}
    }));

  const form = document.querySelector('[data-search]');
  if (form) {
    const input = form.querySelector('input');
    const results = document.querySelector('[data-results]');
    const count = document.querySelector('[data-count]');
    let index = null;
    const norm = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const run = async () => {
      const q = input.value.trim();
      history.replaceState(null, '', q ? `?q=${encodeURIComponent(q)}` : location.pathname);
      if (!q) { results.innerHTML = ''; count.textContent = ''; return; }
      index ||= await fetch('/search-index.json').then((r) => r.json()).catch(() => []);
      const terms = norm(q).split(/\s+/).filter(Boolean);
      const hits = index
        .map((p) => {
          const t = norm(p.t), body = norm(`${p.e} ${p.c} ${p.k}`);
          let score = 0;
          for (const term of terms) {
            if (t.includes(term)) score += 5;
            else if (body.includes(term)) score += 1;
            else return null;
          }
          return { p, score };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, 40);
      count.textContent = hits.length ? `${hits.length} laporan dijumpai untuk “${q}”` : `Tiada laporan untuk “${q}”. Cuba kata kunci lain yang lebih umum.`;
      results.innerHTML = hits.map(({ p }) => `<article class="row-card"><a class="ph" href="${p.u}" tabindex="-1" aria-hidden="true"><img src="${esc(p.i)}" alt="" loading="lazy"></a><div><span class="cat">${esc(p.c)}</span><h3><a href="${p.u}">${esc(p.t)}</a></h3><span class="meta">${esc(p.d)}</span></div></article>`).join('');
    };
    form.addEventListener('submit', (e) => { e.preventDefault(); run(); });
    let timer;
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 220); });
    const q0 = new URLSearchParams(location.search).get('q');
    if (q0) { input.value = q0; run(); } else input.focus();
  }
})();
