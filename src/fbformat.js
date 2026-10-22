// Penukar asas hantaran Facebook -> draf artikel (tanpa AI). Digunakan sebagai sandaran
// oleh fungsi pelayan dan panel admin.
const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}\u{1F1E6}-\u{1F1FF}]/gu;
const HASHTAG = /(^|\s)#([\p{L}\p{N}_]+)/gu;

const RULES = [
  ['Kenyataan Media', /\bkenyataan\b|\bmedia statement\b|\bmendesak\b|\bmengecam\b|\bmenggesa\b/i],
  ['Kebajikan', /banjir|bantuan|asnaf|ziarah|sumbangan|kebajikan|mangsa|derma|infaq/i],
  ['Pendidikan', /usrah|kuliah|kursus|tazkirah|ceramah|daurah|tarbiah|bengkel|seminar|kelas/i],
  ['Sukan', /futsal|bola|sukan|larian|badminton|kejohanan|liga|riadah|hiking|mendaki/i],
  ['Aktiviti', /gotong|khidmat|sukarelawan|komuniti|bersih|lawatan/i],
  ['Program', /program|majlis|himpunan|konvensyen|mesyuarat|perhimpunan|muktamar|forum|pelancaran/i],
];

export function guessCategory(text, categories = [], fallback = 'Berita') {
  for (const [cat, re] of RULES) if (re.test(text) && (!categories.length || categories.includes(cat))) return cat;
  return fallback;
}

const BULLET = /^\s*(?:[•▪◾◽●○➡➤►✔✅☑🔸🔹🔶🔷👉📍📌⭐✨🟢-]\uFE0F?\s*)+/u;

export function cleanLine(s) {
  return String(s).replace(BULLET, '- ').replace(EMOJI, '').replace(HASHTAG, '$1').replace(/\s{2,}/g, ' ').trim();
}

export function extractHashtags(text) {
  const tags = [];
  for (const m of String(text).matchAll(HASHTAG)) tags.push(m[2].toLowerCase());
  return [...new Set(tags)].slice(0, 6);
}

const clip = (s, n) => (s.length <= n ? s : s.slice(0, n).replace(/\s+\S*$/, '') + '…');

export function basicArticle(fb, { categories = [], defaultCategory = 'Berita' } = {}) {
  const raw = String(fb.message || fb.story || '').replace(/\r\n?/g, '\n');
  const lines = raw.split('\n').map(cleanLine);
  let i = lines.findIndex((l) => l.replace(/[^\p{L}\p{N}]/gu, '').length > 3);
  let title = i >= 0 ? lines[i].replace(/^- /, '') : '';
  let rest = i >= 0 ? lines.slice(i + 1) : [];
  if (title.length > 110) {
    const m = title.match(/^(.{20,110}?[.!?])\s/);
    if (m) { rest = [title.slice(m[1].length).trim(), ...rest]; title = m[1]; } else { rest = [title, ...rest]; title = clip(title, 90); }
  }
  title = title.replace(/[.:\-–—]+$/, '').trim();
  if (title === title.toUpperCase() && /[A-Z]/.test(title)) title = title.toLowerCase().replace(/(^|\s)(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  if (!title) title = 'Laporan aktiviti Pemuda PAS Selangor';

  const paras = [];
  let buf = [];
  for (const l of rest) {
    if (!l) { if (buf.length) { paras.push(buf.join('\n')); buf = []; } continue; }
    if (/^- /.test(l)) { if (buf.length && !/^- /.test(buf[buf.length - 1])) { paras.push(buf.join('\n')); buf = []; } buf.push(l); continue; }
    if (buf.length && /^- /.test(buf[buf.length - 1])) { paras.push(buf.join('\n')); buf = []; }
    buf.push(l);
  }
  if (buf.length) paras.push(buf.join('\n'));
  let body = paras.join('\n\n').trim();
  if (!body) body = title;
  if (fb.link?.url) body += `\n\n[${fb.link.title || 'Baca lanjut'}](${fb.link.url})`;
  if (fb.video && /youtu/.test(fb.video)) body += `\n\n${fb.video}`;

  const plain = body.replace(/[#*_>\[\]()-]/g, ' ').replace(/\s+/g, ' ').trim();
  return {
    title: clip(title, 120),
    excerpt: clip(plain, 190),
    body,
    category: guessCategory(raw, categories, defaultCategory),
    tags: extractHashtags(raw),
    imageAlt: '',
  };
}
