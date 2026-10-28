// Panel Admin Pemuda PAS Selangor — aplikasi satu halaman tanpa kebergantungan.
import { renderMarkdown, esc } from './lib/md.js';
import { slugify } from './lib/frontmatter.js';
import { basicArticle } from './lib/fbformat.js';
import { icons, brandMark } from './lib/icons.js';

// ---------- utiliti ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const app = $('#app');
const ls = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} },
};
const sv = (d, p, a = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${a}>${d}</svg>`;
const I = {
  ...icons,
  home: sv('<path d="M3.5 11L12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>'),
  file: sv('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'),
  pages: sv('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>'),
  gear: sv('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  help: sv('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5h.01"/>'),
  out: sv('<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4"/>'),
  ext: sv('<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  plus: sv('<path d="M12 5v14M5 12h14"/>'),
  trash: sv('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  edit: sv('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
  refresh: sv('<path d="M20 11a8 8 0 0 0-14.6-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5L20 16M20 20v-4h-4"/>'),
  spark: sv('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'),
  upload: sv('<path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>'),
  image: sv('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>'),
  check: sv('<path d="M5 12.5l4.5 4.5L19 7"/>'),
  x2: sv('<path d="M6 6l12 12M18 6L6 18"/>'),
  up: sv('<path d="M6 15l6-6 6 6"/>'),
  down: sv('<path d="M6 9l6 6 6-6"/>'),
  eye: sv('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
};
const fmtDate = (iso) => {
  if (!iso) return '-';
  const M = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
  const d = new Date(new Date(iso).getTime() + 8 * 3600_000);
  return `${d.getUTCDate()} ${M[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};
const toLocalInput = (iso) => {
  const d = new Date(new Date(iso || Date.now()).getTime() + 8 * 3600_000);
  return d.toISOString().slice(0, 16);
};
const fromLocalInput = (v) => (v ? new Date(`${v}:00+08:00`).toISOString() : new Date().toISOString());
const clone = (o) => JSON.parse(JSON.stringify(o));
const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const setPath = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); ks.reduce((a, k) => (a[k] ??= {}), o)[last] = v; };

function toast(msg, { error = false, html = false, ms = 5200 } = {}) {
  const el = document.createElement('div');
  el.className = `toast${error ? ' err' : ''}`;
  el[html ? 'innerHTML' : 'textContent'] = msg;
  $('#toasts').append(el);
  setTimeout(() => el.remove(), ms);
}
const savedToast = (res, what = 'Disimpan') =>
  toast(`${what}. Laman awam akan dikemas kini dalam kira-kira 1 minit.${res?.commit?.url ? ` <a href="${res.commit.url}" target="_blank" rel="noopener">Lihat perubahan</a>` : ''}`, { html: true, ms: 7000 });

function busy(btn, on, label) {
  if (!btn) return;
  if (on) { btn.dataset.html = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spin"></span> ${label || 'Sedang diproses…'}`; }
  else { btn.disabled = false; if (btn.dataset.html) btn.innerHTML = btn.dataset.html; }
}

// ---------- API ----------
const store = { token: ls.get('pps_token'), settings: null, posts: null, pages: null, status: null, fb: null };
async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`/api/${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(store.token ? { Authorization: `Bearer ${store.token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Tiada sambungan internet atau pelayan tidak dapat dihubungi.');
  }
  let data = null;
  try { data = await res.json(); } catch {
    if (res.status === 404) throw new Error('API admin tidak tersedia. Pastikan laman dideploy di Netlify (fungsi /api).');
    if ([502, 504].includes(res.status)) throw Object.assign(new Error('Pelayan mengambil masa terlalu lama. Cuba sekali lagi.'), { status: res.status });
    throw new Error(`Ralat pelayan (${res.status}).`);
  }
  if (res.status === 401 && path !== 'login') { logout(false); throw new Error(data?.error || 'Sila log masuk semula.'); }
  if (!res.ok) throw Object.assign(new Error(data?.error || `Ralat (${res.status})`), { status: res.status, data });
  return data;
}
const loadSettings = async (force) => (store.settings && !force ? store.settings : (store.settings = (await api('settings')).settings));
const loadPosts = async (force) => (store.posts && !force ? store.posts : (store.posts = (await api('posts')).posts));
const loadPages = async (force) => (store.pages && !force ? store.pages : (store.pages = (await api('pages')).pages));
function logout(msg = true) {
  store.token = null; ls.set('pps_token', null);
  if (msg) toast('Anda telah log keluar.');
  location.hash = '#/';
  render();
}

// ---------- imej ----------
const readDataUrl = (file) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(file); });
async function compressImage(file, { max = 1600, quality = 0.82, keepPng = false } = {}) {
  if (/svg|gif/.test(file.type)) return { dataUrl: await readDataUrl(file), ext: file.type.includes('svg') ? 'svg' : 'gif' };
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('Fail bukan imej yang sah')); i.src = url; });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
    const ctx = c.getContext('2d');
    const png = keepPng && file.type === 'image/png';
    if (!png) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return { dataUrl: c.toDataURL(png ? 'image/png' : 'image/jpeg', quality), ext: png ? 'png' : 'jpg' };
  } finally { URL.revokeObjectURL(url); }
}
const assetPath = (base, ext) => {
  const d = new Date(Date.now() + 8 * 3600_000);
  return `uploads/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${slugify(base).slice(0, 40)}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}.${ext}`;
};
const pickFiles = (multiple = true, accept = 'image/*') => new Promise((ok) => {
  const inp = Object.assign(document.createElement('input'), { type: 'file', accept, multiple });
  inp.onchange = () => ok([...inp.files]);
  inp.click();
});

// ---------- rangka ----------
const NAV = [
  ['', 'Papan pemuka', 'home'],
  ['facebook', 'Import Facebook', 'facebook'],
  ['artikel', 'Artikel', 'file'],
  ['halaman', 'Halaman', 'pages'],
  ['tetapan', 'Tetapan & tema', 'gear'],
  ['bantuan', 'Bantuan & sambungan', 'help'],
];
const TABBAR = [['', 'Utama', 'home'], ['facebook', 'Facebook', 'facebook'], ['artikel', 'Artikel', 'file'], ['halaman', 'Halaman', 'pages'], ['tetapan', 'Tetapan', 'gear']];

let dirty = false;
addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
const leaveOk = () => !dirty || confirm('Ada perubahan yang belum disimpan. Tinggalkan halaman ini?');
let lastHash = location.hash;
addEventListener('hashchange', () => {
  if (dirty && !confirm('Ada perubahan yang belum disimpan. Tinggalkan halaman ini?')) { history.replaceState(null, '', lastHash); return; }
  dirty = false; lastHash = location.hash; render();
});

function shell(section, inner) {
  const cur = (k) => (k === section ? ' aria-current="page"' : '');
  return `<div class="shell">
  <header class="topbar">
    <a class="brand" href="#/">${brandMark('#ffffff', '#E8B53A').replace('<circle cx="50" cy="50" r="23" fill="#fff"/>', '<circle cx="50" cy="50" r="23" fill="#083826"/>')}<span>Pemuda PAS Selangor<small>Panel admin</small></span></a>
    <div class="tb-actions">
      <a href="/" target="_blank" rel="noopener">${I.ext}<span class="hide-sm">Lihat laman</span></a>
      <button type="button" data-logout title="Log keluar">${I.out}</button>
    </div>
  </header>
  <nav class="side" aria-label="Menu admin">
    ${NAV.map(([k, l, ic], i) => `${i === 5 ? '<div class="sep"></div>' : ''}<a href="#/${k}"${cur(k)}>${I[ic]}${l}</a>`).join('')}
  </nav>
  <main class="content" id="view">${inner}</main>
  <nav class="tabbar" aria-label="Menu admin">${TABBAR.map(([k, l, ic]) => `<a href="#/${k}"${cur(k)}>${I[ic]}${l}</a>`).join('')}</nav>
</div>`;
}

function render() {
  if (!store.token) return renderLogin();
  const [section = '', a, b] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const views = { '': viewDashboard, facebook: viewFacebook, artikel: viewArticles, halaman: viewPages, tetapan: viewSettings, bantuan: viewHelp };
  const fn = views[section] || viewDashboard;
  app.innerHTML = shell(section in views ? section : '', '<p class="muted">Memuatkan…</p>');
  $('[data-logout]').onclick = () => leaveOk() && (dirty = false, logout());
  window.scrollTo(0, 0);
  Promise.resolve(fn($('#view'), a, b)).catch((e) => {
    $('#view').innerHTML = `<div class="note err">${esc(e.message)}</div><p style="margin-top:12px"><a href="#/bantuan">Buka panduan sambungan</a></p>`;
  });
}

// ---------- log masuk ----------
function renderLogin() {
  app.innerHTML = `<div class="login"><form>
    <div class="lg-brand">${brandMark()}<div><h1>Panel admin</h1><span class="muted small">Pemuda PAS Selangor</span></div></div>
    <div class="field"><label for="pw">Kata laluan admin</label><input id="pw" type="password" autocomplete="current-password" required></div>
    <p class="note err" id="lerr" hidden></p>
    <button class="btn primary big" style="width:100%">Log masuk</button>
    <p class="small muted" style="margin:14px 0 0">Kata laluan ditetapkan sebagai <code>ADMIN_PASSWORD</code> dalam tetapan Netlify.</p>
  </form></div>`;
  const form = $('.login form');
  $('#pw').focus();
  form.onsubmit = async (e) => {
    e.preventDefault();
    const btn = $('button', form);
    busy(btn, true, 'Menyemak…');
    try {
      const { token } = await api('login', { method: 'POST', body: { password: $('#pw').value } });
      store.token = token; ls.set('pps_token', token);
      render();
    } catch (err) {
      $('#lerr').hidden = false; $('#lerr').textContent = err.message;
      busy(btn, false);
    }
  };
}

// ---------- papan pemuka ----------
async function viewDashboard(v) {
  v.innerHTML = `<div class="page-title"><div><h1>Assalamualaikum</h1><p>Urus laman web Pemuda PAS Selangor dari sini.</p></div></div>
  <div class="hero-cta"><div><h2>Ada hantaran baharu di Facebook?</h2><p>Tarik 10 hantaran terkini dan biar AI menyediakan artikel berita yang kemas.</p></div>
  <a class="btn accent big" href="#/facebook/tarik">${I.facebook} Tarik 10 posting terkini</a></div>
  <div class="grid c4" id="stats">${'<div class="card stat"><b>…</b><span>&nbsp;</span></div>'.repeat(4)}</div>
  <div class="grid c2" style="margin-top:14px">
    <div class="card" id="conn"><h2>Sambungan</h2><p class="muted">Menyemak…</p></div>
    <div class="card"><h2>Tindakan pantas</h2>
      <div class="actions">
        <a class="btn" href="#/artikel/baru">${I.plus} Tulis artikel</a>
        <a class="btn" href="#/tetapan/laman-utama">${I.home} Susun laman utama</a>
        <a class="btn" href="#/tetapan/tema">${I.gear} Tukar tema</a>
        <a class="btn" href="#/halaman">${I.pages} Sunting halaman</a>
      </div>
      <div id="samples"></div>
      <div id="last" class="small muted" style="margin-top:14px"></div>
    </div>
  </div>`;
  const [status, posts] = await Promise.allSettled([api('status'), loadPosts(true)]);
  if (status.status === 'fulfilled') {
    const s = (store.status = status.value);
    const row = (ok, title, okMsg, noMsg) => `<div class="status" style="margin-bottom:12px"><span class="dot ${ok ? 'ok' : 'no'}"></span><div><b>${title}</b><div class="small muted">${ok ? okMsg : noMsg}</div></div></div>`;
    $('#conn').innerHTML = `<h2>Sambungan</h2>
      ${row(s.github.ready, 'Penyimpanan (GitHub)', `Disambung ke ${esc(s.github.repo)} (${esc(s.github.branch)})`, esc(s.github.error || 'Belum disambung — perubahan tidak boleh disimpan.') + (s.github.tokenHint ? `<br>Token dikesan: ${esc(s.github.tokenHint)}. Token fine-grained biasanya 93 aksara; classic 40 aksara.` : ''))}
      ${row(s.facebook.ready, 'Facebook', 'Token Halaman tersedia', 'Belum disambung — butang tarik posting belum berfungsi.')}
      ${row(s.ai.ready, 'AI penulis artikel', `Aktif melalui ${esc(s.ai.source || 'Anthropic')}`, 'Belum aktif — draf akan disediakan tanpa AI.')}
      ${!(s.github.ready && s.facebook.ready && s.ai.ready) ? '<a class="btn sm" href="#/bantuan">Lengkapkan sambungan</a>' : ''}`;
    if (s.lastCommit) $('#last').innerHTML = `Kemas kini terakhir: ${esc((s.lastCommit.message || '').split('\n')[0])} · ${fmtDate(s.lastCommit.date)} · <a href="${s.lastCommit.url}" target="_blank" rel="noopener">GitHub</a>`;
  } else $('#conn').innerHTML = `<h2>Sambungan</h2><div class="note err">${esc(status.reason.message)}</div>`;

  if (posts.status === 'fulfilled') {
    const p = posts.value;
    const pub = p.filter((x) => !x.draft).length, dr = p.filter((x) => x.draft).length, fb = p.filter((x) => x.fbId).length, sm = p.filter((x) => x.sample);
    $('#stats').innerHTML = [[pub, 'Artikel diterbitkan'], [dr, 'Draf'], [fb, 'Dari Facebook'], [p.length, 'Jumlah artikel']]
      .map(([n, l]) => `<div class="card stat"><b>${n}</b><span>${l}</span></div>`).join('');
    if (sm.length) {
      $('#samples').innerHTML = `<div class="note" style="margin-top:14px">${sm.length} artikel contoh masih dipaparkan di laman. <button class="btn sm" id="delSamples" style="margin-left:6px">${I.trash} Padam artikel contoh</button></div>`;
      $('#delSamples').onclick = async (e) => {
        if (!confirm(`Padam ${sm.length} artikel contoh?`)) return;
        busy(e.currentTarget, true, 'Memadam…');
        try { const r = await api('posts/delete', { method: 'POST', body: { slugs: sm.map((x) => x.slug) } }); savedToast(r, 'Artikel contoh dipadam'); store.posts = null; render(); }
        catch (err) { toast(err.message, { error: true }); busy(e.currentTarget, false); }
      };
    }
  } else $('#stats').innerHTML = `<div class="note err" style="grid-column:1/-1">${esc(posts.reason.message)}</div>`;
}

// ---------- penyunting artikel (dikongsi) ----------
function postEditor(host, { post, isNew, fb, onSaved, inDialog = false }) {
  const S = store.settings;
  const st = {
    title: post.title || '', slug: post.slug || '', slugTouched: !isNew, date: post.date || new Date().toISOString(),
    category: post.category || S.ai?.defaultCategory || 'Berita', tags: (post.tags || []).join(', '), excerpt: post.excerpt || '',
    cover: post.cover || '', coverAlt: post.coverAlt || '', gallery: [...(post.gallery || [])], author: post.author || '',
    featured: Boolean(post.featured), draft: Boolean(post.draft), body: post.body || '',
    fbId: post.fbId || fb?.id || '', fbUrl: post.fbUrl || fb?.url || '', source: post.source || (fb ? 'facebook' : ''),
    sample: post.sample, engine: post.engine, note: post.note,
  };
  const remote = new Set(fb?.images || []);
  if (fb) { st.gallery = [...(fb.images || [])]; st.cover = st.cover || fb.images?.[0] || ''; }
  const pending = new Map(); // laluan -> dataUrl
  let tab = 'tulis';
  const resolveImg = (src) => (pending.get(src.replace(/^\//, '')) || src);
  const cats = [...new Set([...(S.categories || []), st.category])];

  host.innerHTML = `
  ${st.note ? `<div class="note" style="margin-bottom:12px">${esc(st.note)}</div>` : ''}
  ${st.engine === 'ai' ? `<div class="note info" style="margin-bottom:12px">${I.spark} Draf disediakan oleh AI. Semak fakta, nama dan tarikh sebelum menerbitkan.</div>` : ''}
  <div class="editor">
    <div>
      <div class="field"><label for="e-title" class="sr-only">Tajuk</label><input id="e-title" class="title-input" type="text" placeholder="Tajuk artikel" value="${esc(st.title)}"></div>
      <div class="field"><label for="e-excerpt">Ringkasan</label><textarea id="e-excerpt" rows="2" placeholder="1–2 ayat yang muncul di bawah tajuk dan dalam senarai berita">${esc(st.excerpt)}</textarea></div>
      <div class="md-wrap">
        <div class="md-tools">
          <button type="button" data-md="b" title="Tebal">B</button><button type="button" data-md="i" title="Condong"><i>I</i></button>
          <button type="button" data-md="h2" title="Subtajuk">H2</button><button type="button" data-md="h3" title="Subtajuk kecil">H3</button>
          <button type="button" data-md="ul" title="Senarai">•</button><button type="button" data-md="q" title="Petikan">❝</button>
          <button type="button" data-md="a" title="Pautan">${I.link}</button><button type="button" data-md="img" title="Masukkan gambar">${I.image}</button>
          <span class="sp"></span>
          <span class="md-tabs"><button type="button" data-tab="tulis" aria-pressed="true">Tulis</button><button type="button" data-tab="pratonton" aria-pressed="false">Pratonton</button></span>
        </div>
        <textarea id="e-body" class="md" placeholder="Tulis isi artikel di sini…">${esc(st.body)}</textarea>
        <div class="preview prose" id="e-prev" hidden></div>
      </div>
      <p class="small muted">Format: **tebal**, *condong*, ## subtajuk, - senarai, > petikan. Pautan YouTube pada baris sendiri akan dipaparkan sebagai video.</p>
    </div>
    <aside>
      <div class="card">
        <label class="switch" style="margin-bottom:12px"><input type="checkbox" id="e-draft" ${st.draft ? '' : 'checked'}><span id="e-draft-l">${st.draft ? 'Draf (tidak dipaparkan)' : 'Diterbitkan'}</span></label>
        <div class="field"><label for="e-date">Tarikh & masa</label><input id="e-date" type="datetime-local" value="${toLocalInput(st.date)}"></div>
        <div class="field"><label for="e-cat">Kategori</label><select id="e-cat">${cats.map((c) => `<option${c === st.category ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
        <div class="field"><label for="e-tags">Tag</label><input id="e-tags" type="text" value="${esc(st.tags)}" placeholder="banjir, klang"><span class="hint">Pisahkan dengan koma</span></div>
        <label class="check"><input type="checkbox" id="e-feat" ${st.featured ? 'checked' : ''}> Jadikan sorotan di laman utama</label>
      </div>
      <div class="card">
        <div class="lbl" style="margin-bottom:8px">Gambar utama</div>
        <div class="cover-box" id="e-cover"></div>
        <div class="row" style="margin-top:8px"><button type="button" class="btn sm" id="e-cover-up">${I.upload} Muat naik</button><button type="button" class="btn sm ghost" id="e-cover-rm">Buang</button></div>
        <div class="field" style="margin-top:10px"><label for="e-alt">Teks alternatif gambar</label><input id="e-alt" type="text" value="${esc(st.coverAlt)}" placeholder="Penerangan ringkas gambar"></div>
        <div class="lbl" style="margin:6px 0 8px">Galeri <span class="muted small">(tanda untuk paparkan)</span></div>
        <div class="img-pick" id="e-gal"></div>
        <button type="button" class="btn sm" id="e-gal-up" style="margin-top:8px">${I.plus} Tambah gambar</button>
      </div>
      <div class="card">
        <div class="field"><label for="e-slug">Pautan artikel</label><input id="e-slug" type="text" value="${esc(st.slug)}"><span class="hint" id="e-slug-h"></span></div>
        <div class="field"><label for="e-author">Penulis (pilihan)</label><input id="e-author" type="text" value="${esc(st.author)}" placeholder="Unit Media Pemuda PAS Selangor"></div>
        ${st.fbUrl ? `<p class="small"><a href="${esc(st.fbUrl)}" target="_blank" rel="noopener">Lihat hantaran asal di Facebook</a></p>` : ''}
      </div>
    </aside>
  </div>
  <div class="${inDialog ? 'dlg-foot' : 'savebar'}" id="e-foot">
    ${fb ? `<button type="button" class="btn" id="e-redo">${I.spark} Olah semula dengan AI</button>` : ''}
    ${!isNew && !inDialog ? `<a class="btn ghost" href="/berita/${esc(post.slug)}/" target="_blank" rel="noopener">${I.eye} Lihat</a>` : ''}
    <button type="button" class="btn" id="e-save-draft">Simpan sebagai draf</button>
    <button type="button" class="btn primary" id="e-save">${I.check} Terbitkan</button>
  </div>`;

  const body = $('#e-body', host), prev = $('#e-prev', host);
  const mark = () => { dirty = true; };
  const slugHint = () => { $('#e-slug-h', host).textContent = `/berita/${slugify($('#e-slug', host).value || $('#e-title', host).value)}/`; };
  $('#e-title', host).oninput = (e) => { mark(); if (!st.slugTouched) $('#e-slug', host).value = slugify(e.target.value); slugHint(); };
  $('#e-slug', host).oninput = () => { st.slugTouched = true; mark(); slugHint(); };
  slugHint();
  $$('input,textarea,select', host).forEach((el) => el.addEventListener('input', mark));
  $('#e-draft', host).onchange = (e) => { $('#e-draft-l', host).textContent = e.target.checked ? 'Diterbitkan' : 'Draf (tidak dipaparkan)'; };

  const drawCover = () => {
    const box = $('#e-cover', host);
    box.style.backgroundImage = st.cover ? `url("${resolveImg(st.cover)}")` : '';
    box.textContent = st.cover ? '' : 'Tiada gambar utama';
  };
  const drawGallery = () => {
    const all = [...new Set([...(fb?.images || []), ...st.gallery, ...(st.cover ? [st.cover] : [])])];
    $('#e-gal', host).innerHTML = all.length ? all.map((src, i) => `<label class="${src === st.cover ? 'cover' : ''}"><img src="${esc(resolveImg(src))}" alt="" loading="lazy"><input type="checkbox" data-g="${i}" ${st.gallery.includes(src) || src === st.cover ? 'checked' : ''}>${src === st.cover ? '<span class="cv">Gambar utama</span>' : `<button type="button" class="mk" data-c="${i}">Jadikan utama</button>`}</label>`).join('') : '<p class="small muted">Tiada gambar.</p>';
    $$('[data-g]', host).forEach((cb) => (cb.onchange = () => {
      const src = all[+cb.dataset.g];
      st.gallery = cb.checked ? [...new Set([...st.gallery, src])] : st.gallery.filter((x) => x !== src);
      if (!cb.checked && src === st.cover) st.cover = st.gallery[0] || '';
      mark(); drawCover(); drawGallery();
    }));
    $$('[data-c]', host).forEach((b) => (b.onclick = (e) => { e.preventDefault(); st.cover = all[+b.dataset.c]; if (!st.gallery.includes(st.cover)) st.gallery.unshift(st.cover); mark(); drawCover(); drawGallery(); }));
  };
  drawCover(); drawGallery();

  const upload = async (multiple) => {
    const files = await pickFiles(multiple);
    const out = [];
    for (const f of files) {
      try {
        const { dataUrl, ext } = await compressImage(f);
        const p = assetPath($('#e-title', host).value || 'gambar', ext);
        pending.set(p, dataUrl);
        out.push('/' + p);
      } catch (e) { toast(`${f.name}: ${e.message}`, { error: true }); }
    }
    mark();
    return out;
  };
  $('#e-cover-up', host).onclick = async () => { const [p] = await upload(false); if (p) { st.cover = p; st.gallery = [p, ...st.gallery]; drawCover(); drawGallery(); } };
  $('#e-cover-rm', host).onclick = () => { st.cover = ''; mark(); drawCover(); drawGallery(); };
  $('#e-gal-up', host).onclick = async () => { const ps = await upload(true); st.gallery.push(...ps); if (!st.cover && ps[0]) st.cover = ps[0]; drawCover(); drawGallery(); };

  // bar alat markdown
  const wrapSel = (before, after = before, ph = 'teks') => {
    const { selectionStart: s, selectionEnd: e, value } = body;
    const sel = value.slice(s, e) || ph;
    body.setRangeText(before + sel + after, s, e, 'end');
    body.focus(); mark();
  };
  const linePrefix = (pre) => {
    const { selectionStart: s, value } = body;
    const ls0 = value.lastIndexOf('\n', s - 1) + 1;
    body.setRangeText(pre, ls0, ls0, 'end'); body.focus(); mark();
  };
  $$('[data-md]', host).forEach((b) => (b.onclick = async () => {
    const k = b.dataset.md;
    if (k === 'b') wrapSel('**'); else if (k === 'i') wrapSel('*');
    else if (k === 'h2') linePrefix('## '); else if (k === 'h3') linePrefix('### ');
    else if (k === 'ul') linePrefix('- '); else if (k === 'q') linePrefix('> ');
    else if (k === 'a') { const u = prompt('Alamat pautan (https://…)'); if (u) wrapSel('[', `](${u})`, 'teks pautan'); }
    else if (k === 'img') { const ps = await upload(true); if (ps.length) { body.setRangeText('\n\n' + ps.map((p) => `![](${p})`).join('\n\n') + '\n\n', body.selectionStart, body.selectionEnd, 'end'); mark(); } }
  }));
  $$('[data-tab]', host).forEach((b) => (b.onclick = () => {
    tab = b.dataset.tab;
    $$('[data-tab]', host).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    const pv = tab === 'pratonton';
    body.hidden = pv; prev.hidden = !pv;
    if (pv) prev.innerHTML = renderMarkdown(body.value).replace(/src="\/(uploads\/[^"]+)"/g, (m, p) => (pending.has(p) ? `src="${pending.get(p)}"` : m));
  }));

  const collect = (draft) => ({
    title: $('#e-title', host).value.trim(),
    slug: $('#e-slug', host).value.trim() || $('#e-title', host).value,
    date: fromLocalInput($('#e-date', host).value),
    category: $('#e-cat', host).value,
    tags: $('#e-tags', host).value.split(',').map((t) => t.trim()).filter(Boolean),
    excerpt: $('#e-excerpt', host).value.trim(),
    cover: st.cover, coverAlt: $('#e-alt', host).value.trim(),
    gallery: st.gallery.filter((g) => g),
    author: $('#e-author', host).value.trim(),
    featured: $('#e-feat', host).checked, draft,
    body: body.value, fbId: st.fbId, fbUrl: st.fbUrl, source: st.source,
  });

  const save = async (btn, draft) => {
    const p = collect(draft);
    if (!p.title) { toast('Tajuk artikel diperlukan.', { error: true }); $('#e-title', host).focus(); return; }
    const used = new Set([p.cover, ...p.gallery, ...[...p.body.matchAll(/\]\((\/uploads\/[^)\s]+)\)/g)].map((m) => m[1])]);
    const assets = [...pending.entries()].filter(([path]) => used.has('/' + path)).map(([path, dataUrl]) => ({ path, base64: dataUrl }));
    const remoteImages = [...used].filter((u) => u && remote.has(u));
    busy(btn, true, remoteImages.length ? 'Memuat turun gambar & menyimpan…' : 'Menyimpan…');
    try {
      const res = await api('posts', { method: 'POST', body: { post: p, originalSlug: isNew ? '' : post.slug, assets, remoteImages } });
      dirty = false;
      store.posts = null;
      savedToast(res, draft ? 'Draf disimpan' : 'Artikel diterbitkan');
      res.warnings?.forEach((w) => toast(w, { error: true }));
      onSaved?.(res);
    } catch (e) {
      if (e.status === 409 && e.data?.slug) toast(`${e.message} <a href="#/artikel/${e.data.slug}">Buka artikel</a>`, { error: true, html: true });
      else toast(e.message, { error: true });
    } finally { busy(btn, false); }
  };
  $('#e-save', host).onclick = (e) => { $('#e-draft', host).checked = true; save(e.currentTarget, false); };
  $('#e-save-draft', host).onclick = (e) => save(e.currentTarget, true);
  if (fb) $('#e-redo', host).onclick = async (e) => {
    busy(e.currentTarget, true, 'AI sedang menulis…');
    try {
      const { article } = await api('facebook/process', { method: 'POST', body: { post: fb } });
      $('#e-title', host).value = article.title; $('#e-excerpt', host).value = article.excerpt; body.value = article.body;
      if (!st.slugTouched) $('#e-slug', host).value = slugify(article.title);
      if (cats.includes(article.category)) $('#e-cat', host).value = article.category;
      $('#e-tags', host).value = (article.tags || []).join(', ');
      if (article.imageAlt) $('#e-alt', host).value = article.imageAlt;
      slugHint(); mark();
      toast(article.engine === 'ai' ? 'Draf baharu disediakan oleh AI.' : article.note || 'Draf asas disediakan.');
    } catch (err) { toast(err.message, { error: true }); }
    finally { busy(e.currentTarget, false); }
  };
}

function openDialog(title, build) {
  const d = document.createElement('dialog');
  d.innerHTML = `<div class="dlg-head"><h2>${esc(title)}</h2><button type="button" class="btn ghost sm" data-close aria-label="Tutup">${I.x2}</button></div><div class="dlg-body"></div>`;
  document.body.append(d);
  const close = () => { if (!leaveOk()) return; dirty = false; d.close(); d.remove(); };
  $('[data-close]', d).onclick = close;
  d.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  d.showModal();
  build($('.dlg-body', d), () => { dirty = false; d.close(); d.remove(); });
  // pindahkan kaki ke luar badan supaya kekal di bawah
  const foot = $('.dlg-foot', d); if (foot) d.append(foot);
  return d;
}

// ---------- artikel ----------
async function viewArticles(v, a) {
  await loadSettings();
  if (a === 'baru') {
    v.innerHTML = `<div class="page-title"><div><h1>Artikel baharu</h1></div></div><div id="ed"></div>`;
    postEditor($('#ed', v), { post: {}, isNew: true, onSaved: (r) => (location.hash = `#/artikel/${r.slug}`) });
    return;
  }
  if (a) {
    const { post } = await api(`posts/${encodeURIComponent(a)}`);
    v.innerHTML = `<div class="page-title"><div><h1>Sunting artikel</h1><p>${post.fbId ? '<span class="pill fb">Dari Facebook</span> ' : ''}${post.sample ? '<span class="pill sample">Contoh</span>' : ''}</p></div></div><div id="ed"></div>`;
    postEditor($('#ed', v), { post, isNew: false, onSaved: (r) => { if (r.slug !== a) { lastHash = `#/artikel/${r.slug}`; location.hash = lastHash; } } });
    return;
  }
  v.innerHTML = `<div class="page-title"><div><h1>Artikel</h1><p>Semua berita dan laporan di laman.</p></div><div class="actions"><a class="btn" href="#/facebook/tarik">${I.facebook} Import Facebook</a><a class="btn primary" href="#/artikel/baru">${I.plus} Artikel baharu</a></div></div>
  <div class="toolbar-filters"><input type="search" id="q" placeholder="Cari tajuk…"><select id="fc"><option value="">Semua kategori</option>${(store.settings.categories || []).map((c) => `<option>${esc(c)}</option>`).join('')}</select><select id="fs"><option value="">Semua status</option><option value="pub">Diterbitkan</option><option value="draft">Draf</option><option value="fb">Dari Facebook</option><option value="sample">Contoh</option></select></div>
  <div id="bulk"></div><div class="list" id="list"><div class="empty">Memuatkan artikel…</div></div>`;
  const posts = await loadPosts(true);
  const sel = new Set();
  const draw = () => {
    const q = $('#q', v).value.toLowerCase(), fc = $('#fc', v).value, fs = $('#fs', v).value;
    const list = posts.filter((p) => (!q || (p.title || '').toLowerCase().includes(q)) && (!fc || p.category === fc) &&
      (!fs || (fs === 'pub' && !p.draft) || (fs === 'draft' && p.draft) || (fs === 'fb' && p.fbId) || (fs === 'sample' && p.sample)));
    $('#list', v).innerHTML = list.length ? list.map((p) => `<div class="item">
      <input type="checkbox" data-s="${esc(p.slug)}" ${sel.has(p.slug) ? 'checked' : ''} aria-label="Pilih">
      <img class="th" src="${esc(p.cover || '/assets/placeholder.svg')}" alt="" loading="lazy">
      <div><h3><a href="#/artikel/${encodeURIComponent(p.slug)}">${esc(p.title || p.slug)}</a></h3>
        <div class="meta"><span>${fmtDate(p.date)}</span><span>${esc(p.category || '')}</span>${p.draft ? '<span class="pill draft">Draf</span>' : '<span class="pill">Diterbitkan</span>'}${p.fbId ? '<span class="pill fb">Facebook</span>' : ''}${p.sample ? '<span class="pill sample">Contoh</span>' : ''}${p.featured ? '<span class="pill">Sorotan</span>' : ''}</div></div>
      <div class="acts"><a class="btn sm" href="#/artikel/${encodeURIComponent(p.slug)}">${I.edit} Sunting</a>${p.draft ? '' : `<a class="btn sm ghost" href="/berita/${esc(p.slug)}/" target="_blank" rel="noopener">${I.eye}</a>`}</div>
    </div>`).join('') : `<div class="empty">${posts.length ? 'Tiada artikel sepadan dengan carian.' : 'Belum ada artikel. Tarik hantaran dari Facebook atau tulis artikel baharu.'}</div>`;
    $$('[data-s]', v).forEach((cb) => (cb.onchange = () => { cb.checked ? sel.add(cb.dataset.s) : sel.delete(cb.dataset.s); drawBulk(); }));
  };
  const drawBulk = () => {
    $('#bulk', v).innerHTML = sel.size ? `<div class="bulkbar"><span>${sel.size} dipilih</span><span class="actions"><button class="btn sm" id="unsel">Batal pilih</button><button class="btn sm danger" id="del" style="background:#fff">${I.trash} Padam</button></span></div>` : '';
    if (!sel.size) return;
    $('#unsel', v).onclick = () => { sel.clear(); drawBulk(); draw(); };
    $('#del', v).onclick = async (e) => {
      if (!confirm(`Padam ${sel.size} artikel? Tindakan ini boleh dipulihkan melalui sejarah GitHub sahaja.`)) return;
      busy(e.currentTarget, true, 'Memadam…');
      try { const r = await api('posts/delete', { method: 'POST', body: { slugs: [...sel] } }); savedToast(r, 'Artikel dipadam'); store.posts = null; render(); }
      catch (err) { toast(err.message, { error: true }); busy(e.currentTarget, false); }
    };
  };
  ['q', 'fc', 'fs'].forEach((id) => ($(`#${id}`, v).oninput = draw));
  draw();
}

// ---------- Facebook ----------
async function viewFacebook(v, a) {
  await loadSettings();
  v.innerHTML = `<div class="page-title"><div><h1>Import dari Facebook</h1><p>Tarik hantaran terkini Halaman Facebook rasmi, kemudian terbitkan sebagai artikel berita.</p></div>
    <div class="actions"><button class="btn" id="manual">${I.edit} Tampal hantaran secara manual</button></div></div>
  <div class="hero-cta"><div><h2>Tarik ${store.settings.facebook?.limit || 10} posting terkini</h2><p>Teks, tajuk, gambar dan pautan akan diambil. AI menyusunnya menjadi laporan berita untuk anda semak.</p></div>
  <button class="btn accent big" id="pull">${I.refresh} Tarik sekarang</button></div>
  <div id="fbmsg"></div><div id="fbbar"></div><div class="fb-grid" id="fbgrid"></div>`;
  const sel = new Set();
  let posts = store.fb || [];

  const draw = () => {
    if (!posts.length) { $('#fbgrid', v).innerHTML = ''; $('#fbbar', v).innerHTML = ''; return; }
    const fresh = posts.filter((p) => !p.importedSlug);
    $('#fbbar', v).innerHTML = `<div class="card" style="margin-bottom:14px"><div class="row" style="justify-content:space-between">
      <span><b>${posts.length}</b> hantaran · <b>${fresh.length}</b> belum diterbitkan</span>
      <span class="actions"><button class="btn sm" id="selfresh">Pilih semua yang baharu</button>
      <label class="check small" style="padding:0 6px"><input type="checkbox" id="asdraft"> Simpan sebagai draf dahulu</label>
      <button class="btn primary sm" id="batch" ${sel.size ? '' : 'disabled'}>${I.spark} Olah & terbitkan (${sel.size})</button></span></div>
      <div id="batchlog"></div></div>`;
    $('#fbgrid', v).innerHTML = posts.map((p, i) => {
      const imgs = p.images.slice(0, 3);
      return `<article class="fb${sel.has(i) ? ' sel' : ''}">
        ${imgs.length ? `<div class="fb-imgs${imgs.length === 1 ? ' one' : ''}">${imgs.map((src, j) => j === 2 && p.images.length > 3 ? `<div class="more"><img src="${esc(src)}" alt="" loading="lazy" referrerpolicy="no-referrer"><span>+${p.images.length - 3}</span></div>` : `<img src="${esc(src)}" alt="" loading="lazy" referrerpolicy="no-referrer">`).join('')}</div>` : ''}
        <div class="fb-body">
          <div class="row small muted" style="justify-content:space-between"><span>${fmtDate(p.date)} · ${p.images.length} gambar${p.video ? ' · video' : ''}</span>${p.importedSlug ? `<span class="pill">Sudah diterbitkan</span>` : '<span class="pill fb">Baharu</span>'}</div>
          <div class="fb-text">${esc(p.message || p.story || '(Tiada teks)')}</div>
        </div>
        <div class="fb-foot">
          <label class="check small" style="padding:0"><input type="checkbox" data-i="${i}" ${sel.has(i) ? 'checked' : ''} ${p.importedSlug ? 'disabled' : ''}> Pilih</label>
          <span class="actions"><a class="btn sm ghost" href="${esc(p.url)}" target="_blank" rel="noopener">Asal</a>
          ${p.importedSlug ? `<a class="btn sm" href="#/artikel/${encodeURIComponent(p.importedSlug)}">${I.edit} Sunting artikel</a>` : `<button class="btn sm primary" data-proc="${i}">${I.spark} Olah & semak</button>`}</span>
        </div></article>`;
    }).join('');
    $$('[data-i]', v).forEach((cb) => (cb.onchange = () => { cb.checked ? sel.add(+cb.dataset.i) : sel.delete(+cb.dataset.i); draw(); }));
    $$('[data-proc]', v).forEach((b) => (b.onclick = () => processOne(+b.dataset.proc, b)));
    $('#selfresh', v).onclick = () => { posts.forEach((p, i) => !p.importedSlug && sel.add(i)); draw(); };
    $('#batch', v).onclick = (e) => runBatch(e.currentTarget);
  };

  const pull = async (btn) => {
    busy(btn, true, 'Menarik dari Facebook…');
    $('#fbmsg', v).innerHTML = '';
    try {
      posts = store.fb = (await api('facebook/fetch', { method: 'POST' })).posts;
      sel.clear();
      if (!posts.length) $('#fbmsg', v).innerHTML = '<div class="note">Tiada hantaran ditemui pada Halaman ini.</div>';
      draw();
    } catch (e) {
      const setup = ['NO_FB_TOKEN', 'FB_TOKEN_EXPIRED', 'FB_PERMISSION'].includes(e.data?.code);
      $('#fbmsg', v).innerHTML = `<div class="note err" style="margin-bottom:14px">${esc(e.message)}${setup ? ' <a href="#/bantuan">Buka panduan sambungan Facebook</a>.' : ''}<br><span class="small">Sementara itu, anda boleh guna “Tampal hantaran secara manual”.</span></div>`;
    } finally { busy(btn, false); }
  };

  const processOne = async (i, btn) => {
    const p = posts[i];
    busy(btn, true, 'AI sedang menulis…');
    let article;
    try { article = (await api('facebook/process', { method: 'POST', body: { post: p } })).article; }
    catch (e) { toast(`${e.message} Draf asas digunakan.`, { error: true }); article = { ...basicArticle(p, { categories: store.settings.categories, defaultCategory: store.settings.ai?.defaultCategory }), engine: 'asas' }; }
    finally { busy(btn, false); }
    openDialog('Semak artikel sebelum terbit', (host, done) => postEditor(host, {
      post: { ...article, date: p.date, coverAlt: article.imageAlt },
      isNew: true, fb: p, inDialog: true,
      onSaved: (r) => { p.importedSlug = r.slug; sel.delete(i); done(); draw(); },
    }));
  };

  const runBatch = async (btn) => {
    const draft = $('#asdraft', v).checked;
    const ids = [...sel];
    busy(btn, true, 'Memproses…');
    const log = $('#batchlog', v);
    log.innerHTML = `<div class="progress"><i style="width:0"></i></div><ul class="small" style="margin:6px 0 0;padding-left:18px"></ul>`;
    const ul = $('ul', log), bar = $('.progress i', log);
    let ok = 0;
    for (const [n, i] of ids.entries()) {
      const p = posts[i];
      const li = document.createElement('li');
      li.textContent = `${(p.message || '').slice(0, 60) || 'Hantaran'}… sedang diolah`;
      ul.append(li);
      try {
        let article;
        try { article = (await api('facebook/process', { method: 'POST', body: { post: p } })).article; }
        catch { article = basicArticle(p, { categories: store.settings.categories, defaultCategory: store.settings.ai?.defaultCategory }); }
        const res = await api('posts', { method: 'POST', body: {
          post: { title: article.title, excerpt: article.excerpt, body: article.body, category: article.category, tags: article.tags, date: p.date, cover: p.images[0] || '', coverAlt: article.imageAlt || '', gallery: p.images, draft, fbId: p.id, fbUrl: p.url, source: 'facebook' },
          remoteImages: p.images,
        } });
        p.importedSlug = res.slug; sel.delete(i); ok++;
        li.innerHTML = `✓ <a href="#/artikel/${encodeURIComponent(res.slug)}">${esc(article.title)}</a>${article.engine === 'ai' ? '' : ' <span class="muted">(tanpa AI)</span>'}`;
      } catch (e) { li.innerHTML = `✗ ${esc((p.message || '').slice(0, 50))}… — <span style="color:var(--red)">${esc(e.message)}</span>`; }
      bar.style.width = `${((n + 1) / ids.length) * 100}%`;
    }
    store.posts = null;
    busy(btn, false);
    toast(`${ok} daripada ${ids.length} hantaran ${draft ? 'disimpan sebagai draf' : 'diterbitkan'}. Laman dikemas kini dalam kira-kira 1 minit.`, { ms: 8000 });
    const keep = log.innerHTML;
    draw(); $('#batchlog', v).innerHTML = keep;
  };

  $('#pull', v).onclick = (e) => pull(e.currentTarget);
  $('#manual', v).onclick = () => openDialog('Tampal hantaran Facebook', (host, done) => {
    host.innerHTML = `<p class="muted">Salin teks hantaran dari Facebook dan tampal di bawah. Tambah gambar dari peranti anda jika perlu.</p>
      <div class="field"><label for="m-text">Teks hantaran</label><textarea id="m-text" rows="10"></textarea></div>
      <div class="field"><label for="m-url">Pautan hantaran (pilihan)</label><input id="m-url" type="url" placeholder="https://www.facebook.com/…"></div>
      <div class="dlg-foot"><button class="btn primary" id="m-go">${I.spark} Olah dengan AI</button></div>`;
    $('#m-go', host).onclick = async (e) => {
      const text = $('#m-text', host).value.trim();
      if (!text) return toast('Tampal teks hantaran dahulu.', { error: true });
      const fb = { id: '', message: text, url: $('#m-url', host).value.trim(), date: new Date().toISOString(), images: [] };
      busy(e.currentTarget, true, 'AI sedang menulis…');
      let article;
      try { article = (await api('facebook/process', { method: 'POST', body: { post: fb } })).article; }
      catch (err) { toast(err.message, { error: true }); article = basicArticle(fb, { categories: store.settings.categories }); }
      host.innerHTML = '';
      postEditor(host, { post: { ...article, fbUrl: fb.url, source: 'facebook' }, isNew: true, inDialog: true, onSaved: done });
      const foot = $('.dlg-foot', host); if (foot) host.closest('dialog').append(foot);
    };
  });

  draw();
  if (a === 'tarik' && !posts.length) { history.replaceState(null, '', '#/facebook'); lastHash = '#/facebook'; pull($('#pull', v)); }
}

// ---------- halaman ----------
const TEMPLATES = { default: 'Halaman biasa', contact: 'Hubungi (dengan kad WhatsApp & alamat)', programmes: 'Program (dengan senarai program teras)' };
async function viewPages(v, a) {
  await loadSettings();
  if (a) {
    const isNew = a === 'baru';
    const page = isNew ? { title: '', body: '', template: 'default' } : (await api(`pages/${encodeURIComponent(a)}`)).page;
    const inNav = (store.settings.nav || []).some((n) => n.href === `/${page.slug}/`);
    v.innerHTML = `<div class="page-title"><div><h1>${isNew ? 'Halaman baharu' : 'Sunting halaman'}</h1>${!isNew ? `<p><a href="/${esc(page.slug)}/" target="_blank" rel="noopener">/${esc(page.slug)}/</a></p>` : ''}</div></div>
    <div class="editor"><div>
      <div class="field"><input id="p-title" class="title-input" type="text" placeholder="Tajuk halaman" value="${esc(page.title)}"></div>
      <div class="field"><label for="p-desc">Penerangan ringkas</label><textarea id="p-desc" rows="2">${esc(page.description || '')}</textarea></div>
      <div class="field"><label for="p-body">Kandungan</label><textarea id="p-body" class="md" style="border-radius:9px">${esc(page.body || '')}</textarea><span class="hint">Format Markdown sama seperti artikel.</span></div>
    </div><aside><div class="card">
      <div class="field"><label for="p-tpl">Susun atur</label><select id="p-tpl">${Object.entries(TEMPLATES).map(([k, l]) => `<option value="${k}"${k === (page.template || 'default') ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label for="p-slug">Pautan</label><input id="p-slug" type="text" value="${esc(page.slug || '')}" placeholder="auto dari tajuk"></div>
      <label class="check"><input type="checkbox" id="p-nav" ${inNav ? 'checked' : ''}> Papar dalam menu utama</label>
    </div></aside></div>
    <div class="savebar">${!isNew && !['program', 'hubungi'].includes(page.slug) ? `<button class="btn danger" id="p-del">${I.trash} Padam</button>` : ''}<button class="btn primary" id="p-save">${I.check} Simpan halaman</button></div>`;
    $$('input,textarea,select', v).forEach((el) => el.addEventListener('input', () => (dirty = true)));
    $('#p-title', v).oninput = (e) => { dirty = true; if (isNew) $('#p-slug', v).value = slugify(e.target.value); };
    $('#p-save', v).onclick = async (e) => {
      const data = { title: $('#p-title', v).value.trim(), description: $('#p-desc', v).value.trim(), template: $('#p-tpl', v).value, body: $('#p-body', v).value, slug: $('#p-slug', v).value.trim() };
      busy(e.currentTarget, true, 'Menyimpan…');
      try {
        const r = await api('pages', { method: 'POST', body: { page: data, originalSlug: isNew ? '' : page.slug } });
        const want = $('#p-nav', v).checked;
        const nav = clone(store.settings.nav || []);
        const href = `/${r.slug}/`, oldHref = page.slug ? `/${page.slug}/` : null;
        const idx = nav.findIndex((n) => n.href === href || n.href === oldHref);
        let changed = false;
        if (want && idx < 0) { nav.push({ label: data.title, href }); changed = true; }
        if (want && idx >= 0 && nav[idx].href !== href) { nav[idx].href = href; changed = true; }
        if (!want && idx >= 0) { nav.splice(idx, 1); changed = true; }
        if (changed) { const s = clone(store.settings); s.nav = nav; await api('settings', { method: 'POST', body: { settings: s, note: 'menu utama' } }); store.settings = s; }
        dirty = false; store.pages = null; savedToast(r, 'Halaman disimpan');
        if (isNew || r.slug !== page.slug) { lastHash = `#/halaman/${r.slug}`; location.hash = lastHash; }
      } catch (err) { toast(err.message, { error: true }); }
      finally { busy(e.currentTarget, false); }
    };
    const del = $('#p-del', v);
    if (del) del.onclick = async (e) => {
      if (!confirm('Padam halaman ini?')) return;
      busy(e.currentTarget, true, 'Memadam…');
      try {
        const r = await api(`pages/${encodeURIComponent(page.slug)}`, { method: 'DELETE' });
        const s = clone(store.settings); const before = s.nav.length; s.nav = s.nav.filter((n) => n.href !== `/${page.slug}/`);
        if (s.nav.length !== before) { await api('settings', { method: 'POST', body: { settings: s, note: 'menu utama' } }); store.settings = s; }
        dirty = false; store.pages = null; savedToast(r, 'Halaman dipadam'); location.hash = '#/halaman';
      } catch (err) { toast(err.message, { error: true }); busy(e.currentTarget, false); }
    };
    return;
  }
  const pages = await loadPages(true);
  v.innerHTML = `<div class="page-title"><div><h1>Halaman</h1><p>Halaman tetap seperti Tentang Kami, Program dan Hubungi.</p></div><div class="actions"><a class="btn primary" href="#/halaman/baru">${I.plus} Halaman baharu</a></div></div>
  <div class="list">${pages.map((p) => `<div class="item" style="grid-template-columns:1fr auto"><div><h3><a href="#/halaman/${encodeURIComponent(p.slug)}">${esc(p.title || p.slug)}</a></h3><div class="meta"><span>/${esc(p.slug)}/</span><span>${esc(TEMPLATES[p.template || 'default'] || '')}</span></div></div><div class="acts" style="grid-column:auto;margin:0"><a class="btn sm" href="#/halaman/${encodeURIComponent(p.slug)}">${I.edit} Sunting</a></div></div>`).join('') || '<div class="empty">Tiada halaman.</div>'}</div>
  <p class="small muted" style="margin-top:14px">Laman utama, susunan seksyen dan menu diurus di <a href="#/tetapan/laman-utama">Tetapan → Laman utama</a> dan <a href="#/tetapan/menu">Menu</a>.</p>`;
}

// ---------- tetapan ----------
const PRESETS = [
  { id: 'hijau-daun', name: 'Hijau Daun', primary: '#0E5A3F', primaryDark: '#083826', accent: '#E8B53A', background: '#F6F8F6', surface: '#FFFFFF', text: '#14211B', muted: '#5A6A62' },
  { id: 'korporat', name: 'Korporat Gelap', primary: '#0B3D2E', primaryDark: '#05221A', accent: '#C9A227', background: '#F4F6F5', surface: '#FFFFFF', text: '#111A16', muted: '#55625C' },
  { id: 'segar', name: 'Hijau Segar', primary: '#12804F', primaryDark: '#0B5434', accent: '#F2C230', background: '#F7FAF8', surface: '#FFFFFF', text: '#14211B', muted: '#5A6A62' },
  { id: 'klasik', name: 'Hijau Putih Klasik', primary: '#00843D', primaryDark: '#00552A', accent: '#FFD100', background: '#FFFFFF', surface: '#F7F9F8', text: '#16201B', muted: '#5B6862' },
  { id: 'zamrud', name: 'Zamrud & Emas', primary: '#046C4E', primaryDark: '#023D2C', accent: '#D4AF37', background: '#F5F7F6', surface: '#FFFFFF', text: '#13201A', muted: '#56645E' },
];
const FONTS = { 'sora-figtree': 'Sora + Figtree (moden)', jakarta: 'Plus Jakarta Sans', manrope: 'Manrope', 'outfit-source': 'Outfit + Source Sans', 'merriweather-inter': 'Merriweather + Inter (berita klasik)', system: 'Fon sistem (paling laju)' };
const FONT_CSS = { 'sora-figtree': 'Sora, Figtree', jakarta: '"Plus Jakarta Sans"', manrope: 'Manrope', 'outfit-source': 'Outfit', 'merriweather-inter': 'Merriweather, serif', system: 'system-ui' };
const SECTION_NAMES = { hero: 'Hero (tajuk besar & sorotan)', latest: 'Berita terkini', programmes: 'Program teras', stats: 'Angka / statistik', activities: 'Aktiviti di lapangan (galeri)', cta: 'Seruan hubungi WhatsApp' };
const ICON_CHOICES = ['book', 'heart', 'hands', 'ball', 'mic', 'screen', 'users', 'flag', 'star', 'calendar', 'pin'];
const STABS = [['identiti', 'Identiti'], ['hubungan', 'Hubungan'], ['laman-utama', 'Laman utama'], ['menu', 'Menu'], ['tema', 'Tema'], ['kategori', 'Kategori'], ['ai', 'AI & Facebook']];

async function viewSettings(v, tabArg) {
  const base = await loadSettings(true);
  const S = clone(base);
  const tab = STABS.some(([k]) => k === tabArg) ? tabArg : 'identiti';
  const assets = new Map();
  const f = (path, label, { type = 'text', hint = '', ph = '', rows } = {}) => {
    const val = getPath(S, path) ?? '';
    const input = rows ? `<textarea data-k="${path}" rows="${rows}" placeholder="${esc(ph)}">${esc(val)}</textarea>` : `<input data-k="${path}" type="${type}" value="${esc(val)}" placeholder="${esc(ph)}">`;
    return `<div class="field"><label>${label}</label>${input}${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
  };
  const sw = (path, label) => `<label class="switch" style="margin:6px 0 14px"><input type="checkbox" data-k="${path}" ${getPath(S, path) ? 'checked' : ''}><span>${label}</span></label>`;

  v.innerHTML = `<div class="page-title"><div><h1>Tetapan & tema</h1><p>Perubahan dipaparkan di laman awam kira-kira 1 minit selepas disimpan.</p></div></div>
  <nav class="tabs">${STABS.map(([k, l]) => `<a href="#/tetapan/${k}"${k === tab ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
  <div id="tab"></div>
  <div class="savebar"><button class="btn" id="reset">Batal perubahan</button><button class="btn primary" id="save">${I.check} Simpan tetapan</button></div>`;
  const T = $('#tab', v);

  const tabs = {
    identiti() {
      T.innerHTML = `<div class="grid c2"><div class="card">
        ${f('site.name', 'Nama pendek laman')}${f('site.fullName', 'Nama penuh organisasi')}${f('site.tagline', 'Slogan / tagline')}
        ${f('site.description', 'Penerangan laman (untuk Google & media sosial)', { rows: 3 })}
        ${f('site.url', 'Alamat laman', { type: 'url', ph: 'https://pemudapasselangor.org', hint: 'Kosongkan untuk guna alamat Netlify secara automatik.' })}
      </div><div class="card">
        <div class="lbl">Logo</div><p class="small muted">Gunakan logo rasmi (PNG lutsinar atau SVG, berbentuk segi empat). Tanpa logo, lambang bintang khatam digunakan.</p>
        <div class="row"><div id="logoPrev" style="width:72px;height:72px;border:1px solid var(--ln);border-radius:12px;display:grid;place-items:center;overflow:hidden;background:#fff"></div>
        <button class="btn sm" id="logoUp">${I.upload} Muat naik logo</button><button class="btn sm ghost" id="logoRm">Guna lambang lalai</button></div>
        <hr style="border:0;border-top:1px solid var(--ln);margin:18px 0">
        ${f('footer.about', 'Teks ringkas di kaki laman', { rows: 3 })}${f('footer.copyright', 'Nama hak cipta')}
        ${sw('listing.showSampleBadge', 'Papar lencana “Contoh” pada artikel contoh')}
        ${f('listing.postsPerPage', 'Bilangan artikel setiap halaman senarai', { type: 'number' })}
      </div></div>`;
      const drawLogo = () => { const src = S.site.logo; $('#logoPrev', v).innerHTML = src ? `<img src="${esc(assets.get(src.slice(1)) || src)}" alt="" style="max-width:100%;max-height:100%">` : brandMark(S.theme.primary, S.theme.accent); };
      drawLogo();
      $('#logoUp', v).onclick = async () => {
        const [file] = await pickFiles(false, 'image/png,image/svg+xml,image/jpeg,image/webp');
        if (!file) return;
        const { dataUrl, ext } = await compressImage(file, { max: 512, keepPng: true, quality: 0.9 });
        const p = assetPath('logo', ext).replace(/^uploads\/\d+\/\d+\//, 'uploads/brand/');
        assets.set(p, dataUrl); S.site.logo = '/' + p; dirty = true; drawLogo();
      };
      $('#logoRm', v).onclick = () => { S.site.logo = ''; dirty = true; drawLogo(); };
    },
    hubungan() {
      T.innerHTML = `<div class="grid c2"><div class="card"><h2>WhatsApp</h2>
        ${f('contact.whatsapp', 'Nombor WhatsApp (format antarabangsa, tanpa +)', { ph: '60182596954', hint: 'Contoh: 60182596954' })}
        ${f('contact.whatsappDisplay', 'Nombor seperti dipaparkan', { ph: '+60 18-259 6954' })}
        ${f('contact.whatsappMessage', 'Mesej awal apabila pembaca tekan butang', { rows: 2 })}
        ${sw('contact.whatsappButton', 'Papar butang WhatsApp terapung di semua halaman')}
        <a class="btn sm" id="waTest" target="_blank" rel="noopener">${I.whatsapp} Uji pautan WhatsApp</a>
      </div><div class="card"><h2>Maklumat lain</h2>
        ${f('contact.phone', 'Telefon pejabat', { type: 'tel' })}${f('contact.email', 'E-mel', { type: 'email' })}
        ${f('contact.address', 'Alamat', { rows: 2 })}${f('contact.mapUrl', 'Pautan Google Maps', { type: 'url' })}${f('contact.officeHours', 'Waktu pejabat')}
      </div><div class="card"><h2>Media sosial</h2><p class="small muted">Kosongkan yang tidak digunakan.</p>
        ${['facebook', 'instagram', 'tiktok', 'youtube', 'x', 'telegram'].map((k) => f(`social.${k}`, k[0].toUpperCase() + k.slice(1), { type: 'url', ph: 'https://' })).join('')}
      </div></div>`;
      const upd = () => setTimeout(() => $('#waTest', v).href = `https://wa.me/${String(S.contact.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(S.contact.whatsappMessage || '')}`);
      upd(); T.addEventListener('input', upd);
    },
    'laman-utama'() {
      const H = S.home;
      T.innerHTML = `<div class="grid c2">
      <div class="card"><h2>Susunan seksyen</h2><p class="small muted">Hidupkan, matikan dan susun seksyen laman utama.</p><div class="sortable" id="secs"></div></div>
      <div class="card"><h2>Hero</h2>
        ${f('home.hero.title', 'Tajuk besar')}${f('home.hero.subtitle', 'Teks bawah tajuk', { rows: 3 })}
        <div class="row"><div class="grow">${f('home.hero.primaryLabel', 'Butang utama')}</div><div class="grow">${f('home.hero.primaryHref', 'Pautan butang utama')}</div></div>
        <div class="row"><div class="grow">${f('home.hero.secondaryLabel', 'Butang kedua')}</div><div class="grow">${f('home.hero.secondaryHref', 'Pautan butang kedua', { hint: 'Tulis <code>whatsapp</code> untuk terus ke WhatsApp' })}</div></div>
        ${sw('home.hero.showFeatured', 'Papar artikel sorotan di sebelah tajuk')}
        ${sw('theme.heroPattern', 'Papar corak bintang khatam pada latar')}
      </div>
      <div class="card"><h2>Tajuk seksyen</h2>
        ${f('home.latestTitle', 'Berita terkini')}${f('home.latestCount', 'Bilangan berita terkini', { type: 'number' })}
        ${f('home.programmesTitle', 'Program teras')}${f('home.programmesIntro', 'Pengenalan program', { rows: 2 })}
        ${f('home.activitiesTitle', 'Aktiviti')}
        <div class="field"><label>Kategori untuk galeri aktiviti</label><select data-k="home.activitiesCategory">${S.categories.map((c) => `<option${c === H.activitiesCategory ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
        ${f('home.ctaTitle', 'Tajuk seruan WhatsApp')}${f('home.ctaText', 'Teks seruan', { rows: 2 })}
      </div>
      <div class="card"><h2>Angka / statistik</h2>${f('home.statsTitle', 'Tajuk')}<p class="small muted">Seksyen hanya dipaparkan jika ada nilai diisi dan seksyen dihidupkan.</p><div class="sortable" id="stats"></div><button class="btn sm" id="addStat" style="margin-top:8px">${I.plus} Tambah angka</button></div>
      <div class="card" style="grid-column:1/-1"><h2>Program teras</h2><p class="small muted">Setiap kad memaut ke kategori artikel yang dipilih.</p><div class="sortable" id="progs"></div><button class="btn sm" id="addProg" style="margin-top:8px">${I.plus} Tambah program</button></div>
      </div>`;
      const listUI = (el, arr, rowHtml, { removable = true } = {}) => {
        const draw = () => {
          $(el, v).innerHTML = arr.map((it, i) => `<div class="sort-row"><div class="mv"><button data-up="${i}" aria-label="Naik">${I.up}</button><button data-dn="${i}" aria-label="Turun">${I.down}</button></div>${rowHtml(it, i)}<div class="ctl">${removable ? `<button class="btn sm ghost" data-rm="${i}" aria-label="Buang">${I.trash}</button>` : ''}</div></div>`).join('');
          $$(`${el} [data-up]`, v).forEach((b) => (b.onclick = () => { const i = +b.dataset.up; if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; dirty = true; draw(); } }));
          $$(`${el} [data-dn]`, v).forEach((b) => (b.onclick = () => { const i = +b.dataset.dn; if (i < arr.length - 1) { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; dirty = true; draw(); } }));
          $$(`${el} [data-rm]`, v).forEach((b) => (b.onclick = () => { arr.splice(+b.dataset.rm, 1); dirty = true; draw(); }));
          $$(`${el} [data-f]`, v).forEach((inp) => (inp.oninput = inp.onchange = () => { const [i, k] = inp.dataset.f.split(':'); arr[+i][k] = inp.type === 'checkbox' ? inp.checked : inp.value; dirty = true; }));
        };
        draw();
        return draw;
      };
      listUI('#secs', H.sections, (s, i) => `<label class="switch"><input type="checkbox" data-f="${i}:enabled" ${s.enabled ? 'checked' : ''}><span>${SECTION_NAMES[s.id] || s.id}</span></label>`, { removable: false });
      const statsDraw = listUI('#stats', H.stats, (s, i) => `<div class="fields two"><input type="text" data-f="${i}:value" value="${esc(s.value)}" placeholder="Nilai, cth: 22"><input type="text" data-f="${i}:label" value="${esc(s.label)}" placeholder="Label"></div>`);
      $('#addStat', v).onclick = () => { H.stats.push({ value: '', label: '' }); dirty = true; statsDraw(); };
      const progDraw = listUI('#progs', S.programmes, (p, i) => `<div class="fields two"><input type="text" data-f="${i}:title" value="${esc(p.title)}" placeholder="Nama program"><select data-f="${i}:category">${S.categories.map((c) => `<option${c === p.category ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select><input type="text" data-f="${i}:description" value="${esc(p.description)}" placeholder="Penerangan ringkas" style="grid-column:1/-1"><select data-f="${i}:icon">${ICON_CHOICES.map((ic) => `<option${ic === p.icon ? ' selected' : ''}>${ic}</option>`).join('')}</select></div>`);
      $('#addProg', v).onclick = () => { S.programmes.push({ title: 'Program baharu', description: '', icon: 'star', category: S.categories[0] }); dirty = true; progDraw(); };
    },
    menu() {
      T.innerHTML = `<div class="card"><h2>Menu utama</h2><p class="small muted">Pautan dalaman bermula dengan / (cth: /berita/). Untuk WhatsApp tulis <code>whatsapp</code>.</p><div class="sortable" id="nav"></div>
      <div class="row" style="margin-top:10px"><button class="btn sm" id="addNav">${I.plus} Tambah pautan</button><select id="quick" style="max-width:280px"><option value="">Tambah pantas…</option><option value="/berita/|Berita">Berita</option><option value="/program/|Program">Program</option><option value="/carian/|Carian">Carian</option><option value="whatsapp|WhatsApp">WhatsApp</option>${S.categories.map((c) => `<option value="/kategori/${slugify(c)}/|${esc(c)}">Kategori: ${esc(c)}</option>`).join('')}</select></div></div>`;
      const nav = S.nav;
      const draw = () => {
        $('#nav', v).innerHTML = nav.map((n, i) => `<div class="sort-row"><div class="mv"><button data-up="${i}" aria-label="Naik">${I.up}</button><button data-dn="${i}" aria-label="Turun">${I.down}</button></div><div class="fields two"><input type="text" data-f="${i}:label" value="${esc(n.label)}" placeholder="Label"><input type="text" data-f="${i}:href" value="${esc(n.href)}" placeholder="/pautan/"></div><div class="ctl"><button class="btn sm ghost" data-rm="${i}" aria-label="Buang">${I.trash}</button></div></div>`).join('');
        $$('#nav [data-up]', v).forEach((b) => (b.onclick = () => { const i = +b.dataset.up; if (i > 0) { [nav[i - 1], nav[i]] = [nav[i], nav[i - 1]]; dirty = true; draw(); } }));
        $$('#nav [data-dn]', v).forEach((b) => (b.onclick = () => { const i = +b.dataset.dn; if (i < nav.length - 1) { [nav[i + 1], nav[i]] = [nav[i], nav[i + 1]]; dirty = true; draw(); } }));
        $$('#nav [data-rm]', v).forEach((b) => (b.onclick = () => { nav.splice(+b.dataset.rm, 1); dirty = true; draw(); }));
        $$('#nav [data-f]', v).forEach((inp) => (inp.oninput = () => { const [i, k] = inp.dataset.f.split(':'); nav[+i][k] = inp.value; dirty = true; }));
      };
      draw();
      $('#addNav', v).onclick = () => { nav.push({ label: 'Pautan baharu', href: '/' }); dirty = true; draw(); };
      $('#quick', v).onchange = (e) => { if (!e.target.value) return; const [href, label] = e.target.value.split('|'); nav.push({ label, href }); e.target.value = ''; dirty = true; draw(); };
    },
    tema() {
      const t = S.theme;
      T.innerHTML = `<div class="grid c2"><div>
        <div class="card"><h2>Pilihan warna siap</h2><div class="presets" id="presets"></div></div>
        <div class="card"><h2>Warna</h2><div class="grid c2">
          ${[['primary', 'Warna utama'], ['primaryDark', 'Warna utama gelap'], ['accent', 'Warna aksen (butang)'], ['background', 'Latar halaman'], ['surface', 'Latar kad'], ['text', 'Teks'], ['muted', 'Teks kelabu']].map(([k, l]) => `<div class="field"><label>${l}</label><div class="row"><input type="color" data-c="${k}" value="${esc(t[k])}"><input type="text" data-k="theme.${k}" value="${esc(t[k])}" style="flex:1"></div></div>`).join('')}
        </div></div>
        <div class="card"><h2>Tipografi & bentuk</h2>
          <div class="field"><label>Fon</label><select data-k="theme.font">${Object.entries(FONTS).map(([k, l]) => `<option value="${k}"${k === t.font ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
          <div class="field"><label>Kelengkungan sudut: <b id="rv">${t.radius}px</b></label><input type="range" min="0" max="20" data-k="theme.radius" value="${t.radius}" style="accent-color:var(--g)"></div>
          <div class="field"><label>Gaya pengepala</label><select data-k="theme.headerStyle"><option value="light"${t.headerStyle !== 'green' ? ' selected' : ''}>Putih (korporat)</option><option value="green"${t.headerStyle === 'green' ? ' selected' : ''}>Hijau penuh</option></select></div>
        </div></div>
        <div><div class="card" style="position:sticky;top:76px"><h2>Pratonton</h2><div class="mini" id="mini"><div class="mh"><span>${esc(S.site.name)}</span><span style="font-weight:400;font-size:.8rem">Berita · Program</span></div><div class="mhero"><b>${esc(S.home.hero.title)}</b><span class="mbtn">${esc(S.home.hero.primaryLabel || 'Baca')}</span></div><div class="mcards"><div></div><div></div><div></div><div></div></div></div></div></div>
      </div>`;
      const mini = () => {
        const m = $('#mini', v);
        m.style.setProperty('--mp', t.primary); m.style.setProperty('--ma', t.accent); m.style.setProperty('--mbg', t.background);
        m.style.setProperty('--mhead', t.headerStyle === 'green' ? t.primary : '#fff'); m.style.setProperty('--mhtx', t.headerStyle === 'green' ? '#fff' : t.text);
        m.style.setProperty('--mr', `${t.radius}px`); m.style.setProperty('--mfont', `${FONT_CSS[t.font] || 'system-ui'}, system-ui, sans-serif`);
        $('#rv', v).textContent = `${t.radius}px`;
      };
      const drawPresets = () => {
        $('#presets', v).innerHTML = PRESETS.map((p) => `<button type="button" class="preset" data-p="${p.id}" aria-pressed="${t.preset === p.id}"><span class="sw"><i style="background:${p.primary}"></i><i style="background:${p.primaryDark}"></i><i style="background:${p.accent}"></i><i style="background:${p.background}"></i></span><b class="small">${p.name}</b></button>`).join('');
        $$('[data-p]', v).forEach((b) => (b.onclick = () => {
          const p = PRESETS.find((x) => x.id === b.dataset.p);
          Object.assign(t, { ...p, preset: p.id }); delete t.name; delete t.id; dirty = true;
          for (const k of ['primary', 'primaryDark', 'accent', 'background', 'surface', 'text', 'muted']) { $(`[data-c="${k}"]`, v).value = t[k]; $(`[data-k="theme.${k}"]`, v).value = t[k]; }
          drawPresets(); mini();
        }));
      };
      $$('[data-c]', v).forEach((c) => (c.oninput = () => { t[c.dataset.c] = c.value; $(`[data-k="theme.${c.dataset.c}"]`, v).value = c.value; t.preset = 'custom'; dirty = true; drawPresets(); mini(); }));
      T.addEventListener('input', (e) => { if (e.target.dataset.k?.startsWith('theme.')) { setTimeout(mini); if (/^#[0-9a-f]{6}$/i.test(e.target.value)) { const c = $(`[data-c="${e.target.dataset.k.slice(6)}"]`, v); if (c) c.value = e.target.value; } } });
      drawPresets(); mini();
    },
    kategori() {
      T.innerHTML = `<div class="card"><h2>Kategori artikel</h2><p class="small muted">Kategori digunakan untuk menapis berita, kad program teras dan pilihan AI semasa mengolah hantaran Facebook.</p><div class="sortable" id="cats"></div><button class="btn sm" id="addCat" style="margin-top:8px">${I.plus} Tambah kategori</button></div>`;
      const cats = S.categories;
      const draw = () => {
        $('#cats', v).innerHTML = cats.map((c, i) => `<div class="sort-row"><div class="mv"><button data-up="${i}">${I.up}</button><button data-dn="${i}">${I.down}</button></div><input type="text" data-i="${i}" value="${esc(c)}"><div class="ctl"><button class="btn sm ghost" data-rm="${i}">${I.trash}</button></div></div>`).join('');
        $$('#cats [data-up]', v).forEach((b) => (b.onclick = () => { const i = +b.dataset.up; if (i > 0) { [cats[i - 1], cats[i]] = [cats[i], cats[i - 1]]; dirty = true; draw(); } }));
        $$('#cats [data-dn]', v).forEach((b) => (b.onclick = () => { const i = +b.dataset.dn; if (i < cats.length - 1) { [cats[i + 1], cats[i]] = [cats[i], cats[i + 1]]; dirty = true; draw(); } }));
        $$('#cats [data-rm]', v).forEach((b) => (b.onclick = () => { cats.splice(+b.dataset.rm, 1); dirty = true; draw(); }));
        $$('#cats [data-i]', v).forEach((inp) => (inp.oninput = () => { cats[+inp.dataset.i] = inp.value; dirty = true; }));
      };
      draw();
      $('#addCat', v).onclick = () => { cats.push('Kategori baharu'); dirty = true; draw(); };
    },
    ai() {
      T.innerHTML = `<div class="grid c2"><div class="card"><h2>Penulis AI</h2>
        <div class="field"><label>Model</label><select data-k="ai.model"><option value="claude-haiku-5-5"${S.ai.model === 'claude-haiku-5-5' ? ' selected' : ''}>Claude Haiku 5.5 (pantas, disyorkan)</option><option value="claude-sonnet-5-5"${S.ai.model === 'claude-sonnet-5-5' ? ' selected' : ''}>Claude Sonnet 5.5 (lebih teliti, lebih perlahan)</option></select></div>
        ${f('ai.tone', 'Gaya penulisan', { rows: 3 })}${f('ai.instructions', 'Arahan tambahan kepada AI', { rows: 4, hint: 'Contoh: sebut nama kawasan pada perenggan pertama.' })}
        <div class="field"><label>Kategori lalai</label><select data-k="ai.defaultCategory">${S.categories.map((c) => `<option${c === S.ai.defaultCategory ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
        ${sw('ai.useVision', 'Benarkan AI melihat gambar utama (lebih tepat, sedikit lebih perlahan)')}
      </div><div class="card"><h2>Facebook</h2>
        ${f('facebook.pageUrl', 'Pautan Halaman Facebook', { type: 'url', ph: 'https://www.facebook.com/…' })}
        ${f('facebook.pageId', 'ID Halaman (pilihan)', { hint: 'Kosongkan jika guna Page Access Token — halaman dikesan automatik.' })}
        ${f('facebook.limit', 'Bilangan hantaran ditarik', { type: 'number' })}
        ${f('facebook.graphVersion', 'Versi Graph API', { ph: 'v26.0' })}
        <p class="small muted">Token rahsia (FB_PAGE_TOKEN, ANTHROPIC_API_KEY) disimpan sebagai pemboleh ubah persekitaran Netlify, bukan di sini. Lihat <a href="#/bantuan">Bantuan</a>.</p>
      </div></div>`;
    },
  };
  tabs[tab]();

  // pengikat medan umum
  T.addEventListener('input', (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    let val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    if (e.target.type === 'number' || e.target.type === 'range') val = Number(val);
    setPath(S, k, val);
    dirty = true;
  });
  T.addEventListener('change', (e) => { if (e.target.dataset.k && (e.target.type === 'checkbox' || e.target.tagName === 'SELECT')) { setPath(S, e.target.dataset.k, e.target.type === 'checkbox' ? e.target.checked : e.target.value); dirty = true; } });

  $('#reset', v).onclick = () => { if (!dirty || confirm('Buang semua perubahan yang belum disimpan?')) { dirty = false; render(); } };
  $('#save', v).onclick = async (e) => {
    if (!S.contact.whatsapp?.replace(/\D/g, '')) return toast('Nombor WhatsApp diperlukan.', { error: true });
    busy(e.currentTarget, true, 'Menyimpan…');
    try {
      const used = JSON.stringify(S);
      const list = [...assets.entries()].filter(([p]) => used.includes(p)).map(([path, base64]) => ({ path, base64 }));
      const r = await api('settings', { method: 'POST', body: { settings: S, assets: list, note: STABS.find(([k]) => k === tab)[1].toLowerCase() } });
      store.settings = S; dirty = false; savedToast(r, 'Tetapan disimpan');
    } catch (err) { toast(err.message, { error: true }); }
    finally { busy(e.currentTarget, false); }
  };
}

// ---------- bantuan ----------
async function viewHelp(v) {
  v.innerHTML = `<div class="page-title"><div><h1>Bantuan & sambungan</h1><p>Panel admin memerlukan beberapa kunci yang disimpan dengan selamat dalam Netlify.</p></div></div><div id="hs" class="card"><p class="muted">Menyemak status…</p></div>
  <div class="card"><h2>Cara menambah kunci di Netlify</h2><ol class="steps">
    <li>Buka <b>Netlify → laman ini → Site configuration → Environment variables</b>.</li>
    <li>Tekan <b>Add a variable</b>, masukkan nama dan nilai seperti dalam senarai di bawah.</li>
    <li>Selepas semua ditambah, buka <b>Deploys → Trigger deploy → Deploy site</b> supaya kunci baharu digunakan.</li>
  </ol></div>
  <div class="card"><h2>1. <code>ADMIN_PASSWORD</code> — kata laluan panel ini</h2><p>Pilih kata laluan yang panjang (12+ aksara). Tukar bila-bila masa; semua sesi lama akan tamat.</p></div>
  <div class="card"><h2>2. <code>GITHUB_TOKEN</code> — untuk menyimpan perubahan</h2><ol class="steps">
    <li>Log masuk GitHub akaun Pemuda PAS, buka <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Fine-grained personal access token</a>.</li>
    <li>Nama: <i>laman-web-admin</i>. Tempoh: pilih tempoh paling panjang dibenarkan.</li>
    <li><b>Repository access</b>: <i>Only select repositories</i> → pilih repo laman ini.</li>
    <li><b>Permissions → Repository → Contents</b>: <i>Read and write</i>. Tekan <b>Generate token</b> dan salin.</li>
  </ol></div>
  <div class="card"><h2>3. <code>ANTHROPIC_API_KEY</code> — AI penulis artikel</h2><p>Daftar di <a href="https://console.anthropic.com/" target="_blank" rel="noopener">console.anthropic.com</a>, tambah kredit, kemudian <b>API Keys → Create Key</b>. Tanpa kunci ini, draf masih disediakan secara asas (tanpa AI).</p></div>
  <div class="card"><h2>4. <code>FB_PAGE_TOKEN</code> — tarik hantaran Facebook</h2>
  <p class="small muted">Perlu dibuat oleh admin Halaman Facebook Pemuda PAS Selangor.</p><ol class="steps">
    <li>Buka <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener">developers.facebook.com/apps</a> → <b>Create app</b> → jenis <i>Business</i> (atau “Other”).</li>
    <li>Buka <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener">Graph API Explorer</a>, pilih app tadi, tambah kebenaran <code>pages_show_list</code> dan <code>pages_read_engagement</code>, kemudian <b>Generate Access Token</b>.</li>
    <li>Buka <a href="https://developers.facebook.com/tools/debug/accesstoken/" target="_blank" rel="noopener">Access Token Debugger</a>, tampal token, tekan <b>Extend Access Token</b> untuk token jangka panjang.</li>
    <li>Kembali ke Graph API Explorer, guna token jangka panjang dan jalankan <code>me/accounts</code>. Salin <code>access_token</code> bagi Halaman Pemuda PAS Selangor — token Halaman ini tidak tamat tempoh.</li>
    <li>Simpan sebagai <code>FB_PAGE_TOKEN</code>. (Pilihan: simpan juga <code>id</code> Halaman sebagai <code>FB_PAGE_ID</code>.)</li>
  </ol></div>
  <div class="card"><h2>Pilihan lanjutan</h2><p class="small"><code>GITHUB_REPO</code> (owner/repo) dan <code>GITHUB_BRANCH</code> dikesan automatik semasa build. <code>ANTHROPIC_MODEL</code> mengatasi pilihan model. <code>AI_TIMEOUT_MS</code> (lalai 9500) mengawal had masa AI.</p></div>`;
  try {
    const s = await api('status');
    const r = (ok, n, msg) => `<div class="status" style="margin-bottom:10px"><span class="dot ${ok ? 'ok' : 'no'}"></span><div><b>${n}</b><div class="small muted">${msg}</div></div></div>`;
    $('#hs', v).innerHTML = `<h2>Status semasa</h2>${r(true, 'ADMIN_PASSWORD', 'Ditetapkan (anda sudah log masuk)')}${r(s.github.ready, 'GITHUB_TOKEN', s.github.ready ? `Disambung ke ${esc(s.github.repo)}` : esc(s.github.error || (s.github.hasToken ? 'Repo tidak dikenal pasti' : 'Belum ditetapkan')))}${r(s.ai.ready, 'ANTHROPIC_API_KEY', s.ai.ready ? 'Ditetapkan' : 'Belum ditetapkan')}${r(s.facebook.ready, 'FB_PAGE_TOKEN', s.facebook.ready ? 'Ditetapkan' : 'Belum ditetapkan')}`;
  } catch (e) { $('#hs', v).innerHTML = `<div class="note err">${esc(e.message)}</div>`; }
}

render();
