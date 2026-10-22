#!/usr/bin/env node
// Penjana laman statik Pemuda PAS Selangor — tiada kebergantungan luar.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { renderMarkdown, plainText, esc } from '../src/md.js';
import { parseDoc, slugify } from '../src/frontmatter.js';
import { icons, khatam, brandMark, khatamTile } from '../src/icons.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const t0 = Date.now();

// ---------- muat kandungan ----------
const settings = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/settings.json'), 'utf8'));
const S = settings;
const SITE_URL = (S.site.url || process.env.URL || '').replace(/\/$/, '');

function readDir(dir) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter((f) => f.endsWith('.md')).map((f) => {
    const { data, body } = parseDoc(fs.readFileSync(path.join(full, f), 'utf8'));
    return { ...data, slug: f.replace(/\.md$/, ''), body };
  });
}

// Di Netlify: rekod repo & cabang supaya panel admin tahu ke mana hendak menyimpan
{
  const m = String(process.env.REPOSITORY_URL || '').match(/github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?\/?$/);
  const repo = m ? m[1] : S.deploy?.githubRepo || '';
  const branch = process.env.BRANCH || process.env.HEAD || S.deploy?.branch || 'main';
  if (repo) fs.writeFileSync(path.join(ROOT, 'netlify/lib/repo.generated.mjs'),
    `// Ditulis automatik oleh scripts/build.mjs\nexport default ${JSON.stringify({ repo, branch })};\n`);
}

const now = Date.now();
const allPosts = readDir('content/posts')
  .filter((p) => !p.draft && (!p.date || new Date(p.date).getTime() <= now + 60_000))
  .map((p) => ({
    ...p,
    title: p.title || p.slug,
    category: p.category || S.ai?.defaultCategory || 'Berita',
    tags: Array.isArray(p.tags) ? p.tags : [],
    gallery: Array.isArray(p.gallery) ? p.gallery : [],
    date: p.date || new Date(0).toISOString(),
    url: `/berita/${p.slug}/`,
  }))
  .sort((a, b) => new Date(b.date) - new Date(a.date) || (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

for (const p of allPosts) {
  p.html = renderMarkdown(p.body);
  const text = plainText(p.body);
  p.excerpt = p.excerpt || text.slice(0, 180).replace(/\s\S*$/, '') + (text.length > 180 ? '…' : '');
  p.minutes = Math.max(1, Math.round(text.split(/\s+/).length / 200));
  p.catSlug = slugify(p.category);
}

const pages = readDir('content/pages').filter((p) => !p.draft);
const RESERVED = new Set(['berita', 'kategori', 'carian', 'admin', 'api', 'assets', 'uploads']);

// ---------- tema ----------
const hex = (h) => { const m = String(h).replace('#', ''); const n = m.length === 3 ? m.split('').map((c) => c + c).join('') : m; return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) || 0); };
const toHex = (rgb) => '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));

const FONTS = {
  'sora-figtree': { display: "'Sora'", body: "'Figtree'", q: 'family=Figtree:wght@400;500;600;700&family=Sora:wght@600;700' },
  jakarta: { display: "'Plus Jakarta Sans'", body: "'Plus Jakarta Sans'", q: 'family=Plus+Jakarta+Sans:wght@400;500;600;700;800' },
  manrope: { display: "'Manrope'", body: "'Manrope'", q: 'family=Manrope:wght@400;500;600;700;800' },
  'outfit-source': { display: "'Outfit'", body: "'Source Sans 3'", q: 'family=Outfit:wght@600;700&family=Source+Sans+3:wght@400;600;700' },
  'merriweather-inter': { display: "'Merriweather'", body: "'Inter'", q: 'family=Inter:wght@400;500;600;700&family=Merriweather:wght@700;900' },
  system: { display: 'system-ui', body: 'system-ui', q: '' },
};
const T = S.theme || {};
const font = FONTS[T.font] || FONTS['sora-figtree'];
const FALLBACK = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
const headerGreen = T.headerStyle === 'green';
const themeCss = `:root{--primary:${T.primary};--primary-dark:${T.primaryDark};--primary-soft:${mix(T.primary, '#ffffff', 0.88)};--accent:${T.accent};--accent-dark:${mix(T.accent, '#000000', 0.12)};--accent-soft:${mix(T.accent, '#ffffff', 0.78)};--bg:${T.background};--surface:${T.surface};--text:${T.text};--muted:${T.muted};--line:${mix(T.text, T.background, 0.88)};--line-strong:${mix(T.text, T.background, 0.78)};--r:${Number(T.radius ?? 10)}px;--font-display:${font.display},${FALLBACK};--font-body:${font.body},${FALLBACK};--khatam:${khatamTile('#ffffff')};--header-bg:${headerGreen ? T.primary : 'rgba(255,255,255,.94)'};--header-line:${headerGreen ? 'rgba(255,255,255,.14)' : mix(T.text, '#ffffff', 0.9)};--header-text:${headerGreen ? '#ffffff' : T.text};--header-muted:${headerGreen ? 'rgba(255,255,255,.72)' : T.muted};--header-hover:${headerGreen ? 'rgba(255,255,255,.1)' : mix(T.primary, '#ffffff', 0.92)};--header-active:${headerGreen ? '#ffffff' : T.primary}}`;

// ---------- aset ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
const copyDir = (from, to) => {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    e.isDirectory() ? copyDir(a, b) : fs.copyFileSync(a, b);
  }
};
copyDir(path.join(ROOT, 'public'), DIST);
copyDir(path.join(ROOT, 'admin'), path.join(DIST, 'admin'));
fs.mkdirSync(path.join(DIST, 'admin/lib'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'src/md.js'), path.join(DIST, 'admin/lib/md.js'));
fs.copyFileSync(path.join(ROOT, 'src/frontmatter.js'), path.join(DIST, 'admin/lib/frontmatter.js'));
fs.copyFileSync(path.join(ROOT, 'src/fbformat.js'), path.join(DIST, 'admin/lib/fbformat.js'));
fs.copyFileSync(path.join(ROOT, 'src/icons.js'), path.join(DIST, 'admin/lib/icons.js'));

const hashed = (name, content) => {
  const h = crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
  const [base, ext] = name.split('.');
  const out = `/assets/${base}.${h}.${ext}`;
  fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(DIST, out), content);
  return out;
};
const minCss = (c) => c.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '').replace(/\s*([{};:,>])\s*/g, '$1').replace(/;}/g, '}');
const CSS_URL = hashed('site.css', minCss(fs.readFileSync(path.join(ROOT, 'src/styles.css'), 'utf8')));
const JS_URL = hashed('site.js', fs.readFileSync(path.join(ROOT, 'src/site.js'), 'utf8'));

// ---------- pembantu ----------
const MONTHS = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
const myt = (iso) => new Date(new Date(iso).getTime() + 8 * 3600_000);
const fmtDate = (iso) => { const d = myt(iso); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
const abs = (u) => (!u ? '' : /^https?:/.test(u) ? u : SITE_URL + u);
const waLink = (msg = S.contact.whatsappMessage || '') => `https://wa.me/${String(S.contact.whatsapp).replace(/\D/g, '')}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`;
const resolveHref = (h) => (h === 'whatsapp' ? waLink() : h);
const isExt = (h) => /^https?:/.test(h);
const PLACEHOLDER = '/assets/placeholder.svg';
const cover = (p) => p.cover || p.gallery?.[0] || PLACEHOLDER;
const logoHtml = (cls = '') => (S.site.logo ? `<img src="${esc(S.site.logo)}" alt="" width="46" height="46" class="${cls}">` : brandMark(T.primary, T.accent));
const sampleBadge = (p) => (p.sample && S.listing?.showSampleBadge !== false ? ' <span class="badge-sample">Contoh</span>' : '');
const img = (src, alt, attrs = '') => `<img src="${esc(src)}" alt="${esc(alt)}" ${attrs || 'loading="lazy" decoding="async"'}>`;

fs.writeFileSync(path.join(DIST, 'assets/placeholder.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><rect width="800" height="500" fill="${T.primary}"/><rect width="800" height="500" fill="url(#p)" opacity=".18"/><defs><pattern id="p" width="84" height="84" patternUnits="userSpaceOnUse"><g fill="none" stroke="#fff" stroke-width="1.4"><rect x="22" y="22" width="40" height="40"/><rect x="22" y="22" width="40" height="40" transform="rotate(45 42 42)"/></g></pattern></defs><g transform="translate(340 190) scale(1.2)" opacity=".9">${brandMark(T.primaryDark, T.accent).replace(/<\/?svg[^>]*>/g, '')}</g></svg>`);
if (!S.site.logo) fs.writeFileSync(path.join(DIST, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" ${brandMark(T.primary, T.accent).slice(5)}`);

const socials = Object.entries(S.social || {}).filter(([, v]) => v);
const socialLinks = (cls) => socials.map(([k, v]) => `<a href="${esc(v)}" target="_blank" rel="noopener" aria-label="${k}"${cls ? ` class="${cls}"` : ''}>${icons[k] || icons.link}</a>`).join('');

// ---------- rangka halaman ----------
function layout({ title, description, url, image, body, type = 'website', jsonLd, current = '', noindex = false }) {
  const fullTitle = title ? `${title} | ${S.site.name}` : `${S.site.name} | ${S.site.tagline}`;
  const desc = description || S.site.description;
  const ogImg = abs(image || S.site.ogImage);
  const navItems = (S.nav || []).map((n) => {
    const href = resolveHref(n.href);
    const active = current && (n.href === current || (n.href !== '/' && current.startsWith(n.href)));
    return `<li><a href="${esc(href)}"${active ? ' aria-current="page"' : ''}${isExt(href) ? ' target="_blank" rel="noopener"' : ''}>${esc(n.label)}</a></li>`;
  }).join('');
  const fontLinks = font.q ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?${font.q}&display=swap">` : '';
  const wa = waLink();
  return `<!doctype html>
<html lang="ms">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
${SITE_URL ? `<link rel="canonical" href="${abs(url)}">` : ''}
<meta name="theme-color" content="${T.primary}">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${esc(S.site.name)}">
<meta property="og:title" content="${esc(title || S.site.name)}">
<meta property="og:description" content="${esc(desc)}">
${SITE_URL ? `<meta property="og:url" content="${abs(url)}">` : ''}
${ogImg ? `<meta property="og:image" content="${esc(ogImg)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${esc(S.site.logo || S.site.favicon || '/favicon.svg')}">
<link rel="alternate" type="application/rss+xml" title="${esc(S.site.name)}" href="/rss.xml">
${fontLinks}
<link rel="stylesheet" href="${CSS_URL}">
<style>${themeCss}</style>
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : ''}
<script src="${JS_URL}" defer></script>
</head>
<body>
<a class="skip" href="#kandungan">Langkau ke kandungan</a>
<div class="topbar"><div class="wrap"><span class="tb-left">${esc(S.site.fullName || S.site.name)}</span><span class="tb-social">${socialLinks()}</span></div></div>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/" aria-label="${esc(S.site.name)} — laman utama">${logoHtml()}<span class="brand-text"><span class="brand-name">${esc(S.site.name)}</span><span class="brand-sub">${esc(S.site.tagline)}</span></span></a>
    <nav class="main-nav" id="menu" aria-label="Menu utama">
      <ul>${navItems}</ul>
      <div class="nav-cta"><a class="btn btn-wa" href="${wa}" target="_blank" rel="noopener">${icons.whatsapp} WhatsApp kami</a></div>
    </nav>
    <div class="header-actions">
      <a class="icon-btn" href="/carian/" aria-label="Cari">${icons.search}</a>
      <a class="btn btn-green header-wa" href="${wa}" target="_blank" rel="noopener">${icons.whatsapp} Hubungi kami</a>
      <button class="nav-toggle" aria-expanded="false" aria-controls="menu" aria-label="Buka menu">${icons.menu}</button>
    </div>
  </div>
</header>
<main id="kandungan">
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <div class="foot-brand">${logoHtml()}<b>${esc(S.site.fullName || S.site.name)}</b></div>
        <p>${esc(S.footer?.about || '')}</p>
        ${socials.length ? `<div class="foot-social">${socialLinks()}</div>` : ''}
      </div>
      <div>
        <h3>Pautan</h3>
        <ul>${(S.nav || []).map((n) => `<li><a href="${esc(resolveHref(n.href))}">${esc(n.label)}</a></li>`).join('')}<li><a href="/rss.xml">Suapan RSS</a></li></ul>
      </div>
      <div>
        <h3>Hubungi</h3>
        <ul>
          <li><a href="${wa}" target="_blank" rel="noopener">WhatsApp ${esc(S.contact.whatsappDisplay || '')}</a></li>
          ${S.contact.phone ? `<li><a href="tel:${esc(S.contact.phone.replace(/\s/g, ''))}">${esc(S.contact.phone)}</a></li>` : ''}
          ${S.contact.email ? `<li><a href="mailto:${esc(S.contact.email)}">${esc(S.contact.email)}</a></li>` : ''}
          ${S.contact.address ? `<li>${esc(S.contact.address)}</li>` : ''}
        </ul>
      </div>
    </div>
    <div class="foot-bottom"><span>© ${new Date().getFullYear()} ${esc(S.footer?.copyright || S.site.name)}</span><span>Hak cipta terpelihara</span></div>
  </div>
</footer>
${S.contact.whatsappButton !== false ? `<a class="wa-float" href="${wa}" target="_blank" rel="noopener" aria-label="WhatsApp Pemuda PAS Selangor">${icons.whatsapp}<span>WhatsApp</span></a>` : ''}
</body>
</html>`;
}

const out = (route, html) => {
  const file = route.endsWith('.html') || route.endsWith('.xml') || route.endsWith('.json') || route.endsWith('.txt')
    ? path.join(DIST, route)
    : path.join(DIST, route, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
};

// ---------- komponen ----------
const postCard = (p, eager = false) => `<article class="post-card">
  <a class="ph" href="${p.url}" tabindex="-1" aria-hidden="true">${img(cover(p), '', eager ? 'fetchpriority="high" decoding="async"' : '')}</a>
  <div class="pc-top"><a class="cat" href="/kategori/${p.catSlug}/">${esc(p.category)}</a><span class="meta">${fmtDate(p.date)}</span>${sampleBadge(p)}</div>
  <h3><a href="${p.url}">${esc(p.title)}</a></h3>
  <p>${esc(p.excerpt)}</p>
</article>`;

const rowCard = (p) => `<article class="row-card">
  <a class="ph" href="${p.url}" tabindex="-1" aria-hidden="true">${img(cover(p), '')}</a>
  <div><div class="pc-top"><a class="cat" href="/kategori/${p.catSlug}/">${esc(p.category)}</a>${sampleBadge(p)}</div>
  <h3><a href="${p.url}">${esc(p.title)}</a></h3><span class="meta">${fmtDate(p.date)}</span></div>
</article>`;

const pager = (base, page, total) => {
  if (total <= 1) return '';
  const link = (n) => (n === 1 ? base : `${base}halaman/${n}/`);
  let h = '<nav class="pager" aria-label="Halaman">';
  if (page > 1) h += `<a href="${link(page - 1)}" rel="prev">Sebelum</a>`;
  for (let n = 1; n <= total; n++) {
    if (total > 7 && Math.abs(n - page) > 2 && n !== 1 && n !== total) { if (Math.abs(n - page) === 3) h += '<span>…</span>'; continue; }
    h += n === page ? `<span aria-current="page">${n}</span>` : `<a href="${link(n)}">${n}</a>`;
  }
  if (page < total) h += `<a href="${link(page + 1)}" rel="next">Seterusnya</a>`;
  return h + '</nav>';
};

const categories = [...new Set([...(S.categories || []), ...allPosts.map((p) => p.category)])];
const catChips = (activeSlug) => `<nav class="chips" aria-label="Kategori"><a class="chip" href="/berita/"${!activeSlug ? ' aria-current="page"' : ''}>Semua</a>${categories
  .filter((c) => allPosts.some((p) => p.category === c))
  .map((c) => `<a class="chip" href="/kategori/${slugify(c)}/"${activeSlug === slugify(c) ? ' aria-current="page"' : ''}>${esc(c)}</a>`).join('')}</nav>`;

const orgLd = { '@context': 'https://schema.org', '@type': 'Organization', name: S.site.fullName || S.site.name, url: SITE_URL || undefined, logo: abs(S.site.logo) || undefined, sameAs: socials.map(([, v]) => v) };

// ---------- laman utama ----------
const H = S.home || {};
const featured = allPosts.find((p) => p.featured) || allPosts[0];
const sections = {
  hero() {
    const h = H.hero || {};
    const lead = h.showFeatured !== false && featured;
    const secHref = resolveHref(h.secondaryHref || '');
    return `<section class="hero">
  ${T.heroPattern !== false ? '<div class="hero-pattern" aria-hidden="true"></div>' : ''}${khatam('hero-star')}
  <div class="wrap">
    <div>
      <h1>${esc(h.title || S.site.tagline)}</h1>
      <p class="hero-sub">${esc(h.subtitle || S.site.description)}</p>
      <div class="hero-actions">
        ${h.primaryLabel ? `<a class="btn btn-primary" href="${esc(resolveHref(h.primaryHref || '/berita/'))}">${esc(h.primaryLabel)}</a>` : ''}
        ${h.secondaryLabel ? `<a class="btn btn-ghost" href="${esc(secHref)}"${isExt(secHref) ? ' target="_blank" rel="noopener"' : ''}>${h.secondaryHref === 'whatsapp' ? icons.whatsapp : ''}${esc(h.secondaryLabel)}</a>` : ''}
      </div>
    </div>
    ${lead ? `<div><span class="lead-label">Sorotan</span><a class="lead-card" href="${featured.url}">
      <div class="ph">${img(cover(featured), '', 'fetchpriority="high" decoding="async" width="800" height="500"')}</div>
      <div class="lc-body"><div class="lc-kicker"><span class="cat">${esc(featured.category)}</span><span>${fmtDate(featured.date)}</span>${sampleBadge(featured)}</div>
      <h2>${esc(featured.title)}</h2><p>${esc(featured.excerpt)}</p></div></a></div>` : ''}
  </div>
</section>`;
  },
  latest() {
    const skip = H.hero?.showFeatured !== false && sectionsOn.has('hero') ? featured : null;
    const list = allPosts.filter((p) => p !== skip).slice(0, H.latestCount || 7);
    if (!list.length) return '';
    const [main, ...rest] = list;
    return `<section class="section"><div class="wrap">
  <div class="section-head"><h2>${esc(H.latestTitle || 'Berita terkini')}</h2><a class="see-all" href="/berita/">Semua berita ${icons.arrow}</a></div>
  <div class="latest"><div class="latest-main">${postCard(main)}</div><div class="latest-list">${rest.slice(0, 5).map(rowCard).join('')}</div></div>
</div></section>`;
  },
  programmes() {
    if (!S.programmes?.length) return '';
    return `<section class="section alt-bg"><div class="wrap">
  <div class="section-head"><div><h2>${esc(H.programmesTitle || 'Program teras')}</h2>${H.programmesIntro ? `<p>${esc(H.programmesIntro)}</p>` : ''}</div><a class="see-all" href="/program/">Lihat program ${icons.arrow}</a></div>
  <div class="prog-grid">${S.programmes.map(programmeCard).join('')}</div>
</div></section>`;
  },
  stats() {
    const st = (H.stats || []).filter((x) => x.value);
    if (!st.length) return '';
    return `<section class="section"><div class="wrap"><div class="section-head"><h2>${esc(H.statsTitle || '')}</h2></div><div class="stats">${st.map((x) => `<div class="stat"><b>${esc(x.value)}</b><span>${esc(x.label)}</span></div>`).join('')}</div></div></section>`;
  },
  activities() {
    const cat = H.activitiesCategory || 'Aktiviti';
    let list = allPosts.filter((p) => p.category === cat && (p.cover || p.gallery.length));
    if (list.length < 3) list = allPosts.filter((p) => p.cover || p.gallery.length);
    list = list.slice(0, 8);
    if (list.length < 2) return '';
    return `<section class="section"><div class="wrap">
  <div class="section-head"><h2>${esc(H.activitiesTitle || 'Aktiviti')}</h2><a class="see-all" href="/kategori/${slugify(cat)}/">Lihat semua ${icons.arrow}</a></div>
  <div class="strip">${list.map((p) => `<a class="tile" href="${p.url}">${img(cover(p), '')}<div><h3>${esc(p.title)}</h3><span class="meta">${fmtDate(p.date)}</span></div></a>`).join('')}</div>
</div></section>`;
  },
  cta() {
    return `<section class="section"><div class="wrap"><div class="cta">
  <div><h2>${esc(H.ctaTitle || '')}</h2><p>${esc(H.ctaText || '')}</p></div>
  <div class="cta-actions"><a class="btn btn-wa" href="${waLink()}" target="_blank" rel="noopener">${icons.whatsapp} WhatsApp ${esc(S.contact.whatsappDisplay || '')}</a><a class="btn btn-ghost" href="/hubungi/">Cara lain hubungi kami</a></div>
</div></div></section>`;
  },
};
const programmeCard = (pr) => `<a class="prog" href="/kategori/${slugify(pr.category || pr.title)}/"><span class="prog-icon">${icons[pr.icon] || icons.star}</span><span><h3>${esc(pr.title)}</h3><p>${esc(pr.description)}</p></span></a>`;
const sectionsOn = new Set((H.sections || []).filter((x) => x.enabled).map((x) => x.id));
const homeBody = (H.sections || []).filter((x) => x.enabled && sections[x.id]).map((x) => sections[x.id]()).join('\n')
  || `<section class="section"><div class="wrap"><h1>${esc(S.site.name)}</h1></div></section>`;
out('/', layout({ body: homeBody, url: '/', current: '/', jsonLd: { ...orgLd, '@type': 'Organization' } }));

// ---------- senarai berita & kategori ----------
const PER = S.listing?.postsPerPage || 12;
function listing(base, list, { title, intro, crumbs, activeSlug }) {
  const total = Math.max(1, Math.ceil(list.length / PER));
  for (let n = 1; n <= total; n++) {
    const items = list.slice((n - 1) * PER, n * PER);
    const body = `<section class="page-head"><div class="wrap">
  <div class="crumbs"><a href="/">Utama</a>${crumbs || ''}</div>
  <h1>${esc(title)}</h1>${intro ? `<p>${esc(intro)}</p>` : ''}${catChips(activeSlug)}
</div></section>
<section class="section"><div class="wrap">
  ${items.length ? `<div class="post-grid">${items.map((p, i) => postCard(p, n === 1 && i === 0)).join('')}</div>` : `<p class="empty">Belum ada artikel dalam bahagian ini. Laporan baharu akan dipaparkan di sini sebaik sahaja diterbitkan.</p>`}
  ${pager(base, n, total)}
</div></section>`;
    out(n === 1 ? base : `${base}halaman/${n}/`, layout({ title: n > 1 ? `${title} — halaman ${n}` : title, description: intro, url: n === 1 ? base : `${base}halaman/${n}/`, body, current: '/berita/' }));
  }
}
listing('/berita/', allPosts, { title: 'Berita & laporan', intro: 'Laporan program, aktiviti dan kenyataan terkini Pemuda PAS Selangor.' });
for (const c of categories) {
  const slug = slugify(c);
  listing(`/kategori/${slug}/`, allPosts.filter((p) => p.category === c), {
    title: c, intro: `Semua laporan dalam kategori ${c}.`, crumbs: ` / <a href="/berita/">Berita</a>`, activeSlug: slug,
  });
}

// ---------- artikel ----------
for (const p of allPosts) {
  const related = allPosts.filter((x) => x !== p && x.category === p.category).slice(0, 3);
  const more = related.length < 3 ? allPosts.filter((x) => x !== p && !related.includes(x)).slice(0, 3 - related.length) : [];
  const shareUrl = abs(p.url) || p.url;
  const gallery = p.gallery.filter((g) => g !== p.cover);
  const body = `<article>
<header class="article-head"><div class="wrap narrow">
  <div class="crumbs"><a href="/">Utama</a> / <a href="/berita/">Berita</a> / <a href="/kategori/${p.catSlug}/">${esc(p.category)}</a></div>
  <h1>${esc(p.title)}</h1>
  ${p.excerpt ? `<p class="lede">${esc(p.excerpt)}</p>` : ''}
  <div class="article-meta"><span>${icons.calendar}${fmtDate(p.date)}</span><span>${icons.clock}${p.minutes} minit bacaan</span>${p.author ? `<span>Oleh ${esc(p.author)}</span>` : ''}${sampleBadge(p)}</div>
</div></header>
${p.cover ? `<figure class="article-cover">${img(p.cover, p.coverAlt || p.title, 'fetchpriority="high" decoding="async"')}</figure>` : ''}
<div class="wrap narrow">
  ${p.sample ? `<p class="sample-note">Ini artikel contoh. Ia boleh dipadam di panel admin selepas laporan sebenar diterbitkan.</p>` : ''}
  <div class="prose">${p.html}</div>
  ${gallery.length ? `<h2 class="sr-only">Galeri</h2><div class="gallery">${gallery.map((g) => `<a href="${esc(g)}" target="_blank" rel="noopener">${img(g, p.title)}</a>`).join('')}</div>` : ''}
  ${p.tags.length ? `<div class="tags">${p.tags.map((t) => `<a href="/carian/?q=${encodeURIComponent(t)}">#${esc(t)}</a>`).join('')}</div>` : ''}
  ${p.fbUrl ? `<p class="source-note">Laporan ini diolah daripada <a href="${esc(p.fbUrl)}" target="_blank" rel="noopener">hantaran asal di Facebook</a>.</p>` : ''}
  <div class="share"><span>Kongsi</span>
    <a href="https://wa.me/?text=${encodeURIComponent(p.title + ' ' + shareUrl)}" target="_blank" rel="noopener">${icons.whatsapp} WhatsApp</a>
    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener">${icons.facebook} Facebook</a>
    <a href="https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(p.title)}" target="_blank" rel="noopener">${icons.telegram} Telegram</a>
    <button type="button" data-copy="${esc(shareUrl)}">${icons.copy} <span>Salin pautan</span></button>
  </div>
</div>
</article>
${[...related, ...more].length ? `<section class="section"><div class="wrap"><div class="section-head"><h2>Bacaan berkaitan</h2><a class="see-all" href="/kategori/${p.catSlug}/">Lagi ${esc(p.category)} ${icons.arrow}</a></div><div class="post-grid">${[...related, ...more].map((x) => postCard(x)).join('')}</div></div></section>` : ''}`;
  out(p.url, layout({
    title: p.title, description: p.excerpt, url: p.url, image: p.cover || undefined, type: 'article', body, current: '/berita/',
    jsonLd: { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: p.title, description: p.excerpt, datePublished: p.date, dateModified: p.updated || p.date, image: p.cover ? [abs(p.cover)] : undefined, mainEntityOfPage: abs(p.url) || undefined, author: { '@type': 'Organization', name: p.author || S.site.fullName }, publisher: orgLd },
  }));
}

// ---------- halaman statik ----------
const contactBlock = () => `<div class="contact-grid">
  <div class="contact-card wa-big">
    <h3>${icons.whatsapp} WhatsApp sekretariat</h3>
    <p>Cara paling pantas untuk bertanya, menyertai program atau menghantar maklumat aktiviti.</p>
    <p style="margin-top:14px"><a class="btn btn-primary" href="${waLink()}" target="_blank" rel="noopener">${icons.whatsapp} ${esc(S.contact.whatsappDisplay || 'WhatsApp')}</a></p>
  </div>
  <div class="contact-card">
    ${S.contact.address ? `<h3>${icons.pin} Alamat</h3><p>${esc(S.contact.address)}</p>${S.contact.mapUrl ? `<p><a href="${esc(S.contact.mapUrl)}" target="_blank" rel="noopener">Buka dalam peta</a></p>` : ''}` : ''}
    ${S.contact.officeHours ? `<p style="margin-top:10px">${esc(S.contact.officeHours)}</p>` : ''}
    ${S.contact.phone ? `<h3 style="margin-top:18px">${icons.phone} Telefon</h3><p><a href="tel:${esc(S.contact.phone.replace(/\s/g, ''))}">${esc(S.contact.phone)}</a></p>` : ''}
    ${S.contact.email ? `<h3 style="margin-top:18px">${icons.mail} E-mel</h3><p><a href="mailto:${esc(S.contact.email)}">${esc(S.contact.email)}</a></p>` : ''}
    ${socials.length ? `<h3 style="margin-top:18px">${icons.users} Media sosial</h3><div class="foot-social" style="margin-top:6px">${socials.map(([k, v]) => `<a href="${esc(v)}" target="_blank" rel="noopener" aria-label="${k}" style="background:var(--primary-soft);color:var(--primary)">${icons[k] || icons.link}</a>`).join('')}</div>` : ''}
  </div>
</div>`;

const programmesBlock = () => {
  const progPosts = allPosts.filter((p) => p.category === 'Program').slice(0, 6);
  return `<div class="prog-grid">${(S.programmes || []).map(programmeCard).join('')}</div>
  ${progPosts.length ? `<div class="section-head" style="margin-top:56px"><h2>Laporan program terkini</h2><a class="see-all" href="/kategori/program/">Semua ${icons.arrow}</a></div><div class="post-grid">${progPosts.map((p) => postCard(p)).join('')}</div>` : ''}`;
};

const ensurePages = [
  { slug: 'program', title: 'Program', template: 'programmes', body: '' },
  { slug: 'hubungi', title: 'Hubungi kami', template: 'contact', body: '' },
];
for (const def of ensurePages) if (!pages.some((p) => p.slug === def.slug)) pages.push(def);

for (const pg of pages) {
  if (RESERVED.has(pg.slug)) continue;
  const route = `/${pg.slug}/`;
  const extra = pg.template === 'contact' ? contactBlock() : pg.template === 'programmes' ? programmesBlock() : '';
  const body = `<section class="page-head"><div class="wrap">
  <div class="crumbs"><a href="/">Utama</a></div>
  <h1>${esc(pg.title)}</h1>${pg.description ? `<p>${esc(pg.description)}</p>` : ''}
</div></section>
<section class="section"><div class="wrap">
  ${pg.body ? `<div class="prose mt-0" style="padding-top:0">${renderMarkdown(pg.body)}</div>` : ''}
  ${extra}
</div></section>`;
  out(route, layout({ title: pg.title, description: pg.description, url: route, body, current: route }));
}

// ---------- carian ----------
out('/carian/', layout({
  title: 'Carian', url: '/carian/', current: '/carian/', noindex: true,
  body: `<section class="page-head"><div class="wrap narrow"><div class="crumbs"><a href="/">Utama</a></div><h1>Cari laporan</h1>
<form class="search-box" role="search" action="/carian/" data-search><label class="sr-only" for="q">Kata kunci</label><input id="q" name="q" type="search" placeholder="Contoh: banjir, usrah, Shah Alam" autocomplete="off"><button class="btn btn-green" type="submit">Cari</button></form></div></section>
<section class="section" style="padding-top:28px"><div class="wrap narrow"><p class="search-count" aria-live="polite" data-count></p><div class="search-results" data-results></div></div></section>`,
}));
out('/search-index.json', JSON.stringify(allPosts.map((p) => ({ t: p.title, u: p.url, e: p.excerpt, c: p.category, d: fmtDate(p.date), i: cover(p), k: [p.tags.join(' '), plainText(p.body).slice(0, 1500)].join(' ') }))));

// ---------- 404 ----------
out('/404.html', layout({
  title: 'Halaman tidak dijumpai', url: '/404.html', noindex: true,
  body: `<section class="not-found"><div class="wrap narrow"><div class="big">404</div><h1>Halaman ini tidak dijumpai</h1><p>Pautan mungkin telah berubah. Cuba cari laporan yang anda perlukan atau kembali ke laman utama.</p><p><a class="btn btn-green" href="/">Ke laman utama</a> <a class="btn btn-outline" href="/carian/">Cari laporan</a></p></div></section>`,
}));

// ---------- RSS, sitemap, robots ----------
const xmlEsc = (s) => esc(s).replace(/'/g, '&apos;');
out('/rss.xml', `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xmlEsc(S.site.name)}</title><link>${SITE_URL || '/'}</link><description>${xmlEsc(S.site.description)}</description><language>ms</language>${allPosts.slice(0, 30).map((p) => `<item><title>${xmlEsc(p.title)}</title><link>${abs(p.url)}</link><guid>${abs(p.url)}</guid><pubDate>${new Date(p.date).toUTCString()}</pubDate><description>${xmlEsc(p.excerpt)}</description></item>`).join('')}</channel></rss>`);
const urls = ['/', '/berita/', ...pages.filter((p) => !RESERVED.has(p.slug)).map((p) => `/${p.slug}/`), ...categories.map((c) => `/kategori/${slugify(c)}/`), ...allPosts.map((p) => p.url)];
out('/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${xmlEsc(abs(u) || u)}</loc></url>`).join('')}</urlset>`);
out('/robots.txt', `User-agent: *\nDisallow: /admin/\nDisallow: /api/\n${SITE_URL ? `Sitemap: ${SITE_URL}/sitemap.xml\n` : ''}`);

console.log(`✓ ${allPosts.length} artikel, ${pages.length} halaman, ${categories.length} kategori dijana dalam ${Date.now() - t0}ms → dist/`);
