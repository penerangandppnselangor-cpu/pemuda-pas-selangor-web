// Logik artikel dikongsi oleh API admin dan import automatik berjadual
import { HttpError } from './util.mjs';
import { readFile, readDirTexts, commitFiles } from './github.mjs';
import { parseDoc, stringifyDoc, slugify } from '../../src/frontmatter.js';

export const POSTS = 'content/posts';
export const SETTINGS = 'content/settings.json';
export const RESERVED = new Set(['berita', 'kategori', 'carian', 'admin', 'api', 'assets', 'uploads']);
const POST_FIELDS = ['title', 'date', 'updated', 'category', 'excerpt', 'cover', 'coverAlt', 'gallery', 'tags', 'author', 'featured', 'draft', 'sample', 'source', 'fbId', 'fbUrl'];

export async function getSettings() {
  const t = await readFile(SETTINGS);
  if (!t) throw new HttpError(500, 'content/settings.json tidak dijumpai dalam repo.');
  return JSON.parse(t);
}

export async function listDocs(dir) {
  const files = await readDirTexts(dir);
  return files.filter((f) => f.name.endsWith('.md')).map((f) => {
    const { data, body } = parseDoc(f.text);
    return { ...data, slug: f.name.replace(/\.md$/, ''), body };
  });
}

export function cleanAssetPath(p) {
  const clean = String(p || '').replace(/^\/+/, '').replace(/\.\.+/g, '').replace(/[^a-zA-Z0-9/_.-]/g, '-');
  if (!/^uploads\/[\w/.-]+\.(jpe?g|png|webp|gif|svg|avif)$/i.test(clean)) throw new HttpError(400, `Laluan fail tidak sah: ${p}`);
  return clean;
}

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' };
export async function downloadImage(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = (res.headers.get('content-type') || 'image/jpeg').split(';')[0];
  if (!type.startsWith('image/')) throw new Error('bukan imej');
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 8 * 1024 * 1024) throw new Error('imej terlalu besar');
  return { base64: buf.toString('base64'), ext: EXT[type] || 'jpg' };
}

export const monthDir = (iso) => {
  const d = new Date(new Date(iso || Date.now()).getTime() + 8 * 3600_000);
  return `uploads/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};
export async function preparePost(body, existingFiles) {
  const input = body.post || {};
  if (!String(input.title || '').trim()) throw new HttpError(400, 'Tajuk artikel diperlukan.');
  const existing = existingFiles || (await readDirTexts(POSTS).catch(() => []));
  const names = new Set(existing.map((f) => f.name.replace(/\.md$/, '')));
  const original = body.originalSlug ? slugify(body.originalSlug) : '';
  let slug = slugify(input.slug || input.title);
  if (RESERVED.has(slug)) slug += '-artikel';
  if (slug !== original && names.has(slug)) {
    let n = 2;
    while (names.has(`${slug}-${n}`)) n++;
    slug = `${slug}-${n}`;
  }
  if (input.fbId && !original) {
    const dup = existing.find((f) => parseDoc(f.text).data.fbId === input.fbId);
    if (dup && !body.allowDuplicate) throw new HttpError(409, 'Hantaran Facebook ini sudah diterbitkan sebelum ini.', { slug: dup.name.replace(/\.md$/, '') });
  }

  const files = [];
  const date = input.date || new Date().toISOString();
  const dir = monthDir(date);

  // imej dimuat naik dari peranti (sudah dimampatkan oleh pelayar)
  for (const a of body.assets || []) {
    const p = cleanAssetPath(a.path);
    files.push({ path: `public/${p}`, base64: String(a.base64).replace(/^data:[^,]+,/, '') });
  }

  // imej jauh (contohnya dari Facebook) dimuat turun dan disimpan dalam repo
  const remote = (body.remoteImages || []).slice(0, 12);
  const map = {};
  const warnings = [];
  await Promise.all(remote.map(async (url, i) => {
    try {
      const img = await downloadImage(url);
      const p = `${dir}/${slug.slice(0, 50)}-${i + 1}.${img.ext}`;
      files.push({ path: `public/${p}`, base64: img.base64 });
      map[url] = `/${p}`;
    } catch (e) {
      warnings.push(`Gambar ${i + 1} gagal dimuat turun (${e.message}); pautan asal digunakan.`);
      map[url] = url;
    }
  }));
  const swap = (u) => (u && map[u]) || u;

  const data = {};
  for (const k of POST_FIELDS) if (input[k] !== undefined && input[k] !== '' && input[k] !== false) data[k] = input[k];
  data.date = date;
  if (original) data.updated = new Date().toISOString();
  if (data.cover) data.cover = swap(data.cover);
  if (Array.isArray(data.gallery)) data.gallery = data.gallery.map(swap).filter(Boolean);
  if (Array.isArray(data.tags)) data.tags = data.tags.map((t) => String(t).trim()).filter(Boolean);
  let text = String(input.body || '');
  for (const [from, to] of Object.entries(map)) text = text.split(from).join(to);

  files.push({ path: `${POSTS}/${slug}.md`, content: stringifyDoc(data, text) });
  if (original && original !== slug) files.push({ path: `${POSTS}/${original}.md`, delete: true });

  const verb = original ? 'Kemas kini' : data.fbId ? 'Import Facebook' : 'Artikel baharu';
  return { slug, url: `/berita/${slug}/`, files, warnings, message: `${verb}: ${data.title}${data.draft ? ' (draf)' : ''}`, post: { ...data, slug, body: text } };
}

export async function savePost(body) {
  const r = await preparePost(body);
  const commit = await commitFiles(r.files, r.message);
  const { files, ...rest } = r;
  return { ...rest, commit };
}
