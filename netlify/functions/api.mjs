// API panel admin — semua laluan /api/*
import { json, HttpError, requireAuth, checkPassword, issueToken, sleep, env } from '../lib/util.mjs';
import { readFile, readDirTexts, commitFiles, repoInfo, lastCommit } from '../lib/github.mjs';
import { fetchLatestPosts } from '../lib/facebook.mjs';
import { articleFromFacebook, aiReady } from '../lib/ai.mjs';
import { parseDoc, stringifyDoc, slugify } from '../../src/frontmatter.js';

export const config = { path: '/api/*' };

const POSTS = 'content/posts';
const PAGES = 'content/pages';
const SETTINGS = 'content/settings.json';
const RESERVED = new Set(['berita', 'kategori', 'carian', 'admin', 'api', 'assets', 'uploads']);
const POST_FIELDS = ['title', 'date', 'updated', 'category', 'excerpt', 'cover', 'coverAlt', 'gallery', 'tags', 'author', 'featured', 'draft', 'sample', 'source', 'fbId', 'fbUrl'];
const PAGE_FIELDS = ['title', 'description', 'template', 'draft'];

async function getSettings() {
  const t = await readFile(SETTINGS);
  if (!t) throw new HttpError(500, 'content/settings.json tidak dijumpai dalam repo.');
  return JSON.parse(t);
}

async function listDocs(dir) {
  const files = await readDirTexts(dir);
  return files.filter((f) => f.name.endsWith('.md')).map((f) => {
    const { data, body } = parseDoc(f.text);
    return { ...data, slug: f.name.replace(/\.md$/, ''), body };
  });
}

function cleanAssetPath(p) {
  const clean = String(p || '').replace(/^\/+/, '').replace(/\.\.+/g, '').replace(/[^a-zA-Z0-9/_.-]/g, '-');
  if (!/^uploads\/[\w/.-]+\.(jpe?g|png|webp|gif|svg|avif)$/i.test(clean)) throw new HttpError(400, `Laluan fail tidak sah: ${p}`);
  return clean;
}

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' };
async function downloadImage(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = (res.headers.get('content-type') || 'image/jpeg').split(';')[0];
  if (!type.startsWith('image/')) throw new Error('bukan imej');
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 8 * 1024 * 1024) throw new Error('imej terlalu besar');
  return { base64: buf.toString('base64'), ext: EXT[type] || 'jpg' };
}

const monthDir = (iso) => {
  const d = new Date(new Date(iso || Date.now()).getTime() + 8 * 3600_000);
  return `uploads/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

async function savePost(body) {
  const input = body.post || {};
  if (!String(input.title || '').trim()) throw new HttpError(400, 'Tajuk artikel diperlukan.');
  const existing = await readDirTexts(POSTS).catch(() => []);
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
  const commit = await commitFiles(files, `${verb}: ${data.title}${data.draft ? ' (draf)' : ''}`);
  return { slug, url: `/berita/${slug}/`, commit, warnings, post: { ...data, slug, body: text } };
}

async function savePage(body) {
  const input = body.page || {};
  if (!String(input.title || '').trim()) throw new HttpError(400, 'Tajuk halaman diperlukan.');
  let slug = slugify(input.slug || input.title);
  if (RESERVED.has(slug)) throw new HttpError(400, `Pautan "/${slug}/" dikhaskan untuk sistem. Pilih nama lain.`);
  const original = body.originalSlug ? slugify(body.originalSlug) : '';
  const data = {};
  for (const k of PAGE_FIELDS) if (input[k] !== undefined && input[k] !== '' && input[k] !== false) data[k] = input[k];
  const files = [{ path: `${PAGES}/${slug}.md`, content: stringifyDoc(data, input.body || '') }];
  for (const a of body.assets || []) files.push({ path: `public/${cleanAssetPath(a.path)}`, base64: String(a.base64).replace(/^data:[^,]+,/, '') });
  if (original && original !== slug) files.push({ path: `${PAGES}/${original}.md`, delete: true });
  const commit = await commitFiles(files, `Halaman: ${data.title}`);
  return { slug, url: `/${slug}/`, commit };
}

async function route(req, parts) {
  const method = req.method;
  const [a, b, c] = parts;

  if (a === 'login' && method === 'POST') {
    const { password } = await req.json().catch(() => ({}));
    if (!checkPassword(password)) { await sleep(700); throw new HttpError(401, 'Kata laluan salah.'); }
    return { token: issueToken(12) };
  }

  if (a === 'health') return { ok: true, admin: Boolean(env('ADMIN_PASSWORD')) };

  requireAuth(req);

  if (a === 'status') {
    const r = repoInfo();
    let commit = null, githubError = null;
    if (r.ready) { try { commit = await lastCommit(); } catch (e) { githubError = e.message; } }
    return {
      github: { ready: r.ready && !githubError, repo: r.full, branch: r.branch, hasToken: Boolean(r.token), error: githubError },
      facebook: { ready: Boolean(env('FB_PAGE_TOKEN')), pageId: env('FB_PAGE_ID') },
      ai: { ready: aiReady(), model: env('ANTHROPIC_MODEL') },
      lastCommit: commit,
      siteUrl: env('URL'),
    };
  }

  if (a === 'settings') {
    if (method === 'GET') return { settings: await getSettings() };
    if (method === 'POST') {
      const body = await req.json();
      const s = body.settings;
      if (!s || typeof s !== 'object' || !s.site || !s.theme) throw new HttpError(400, 'Tetapan tidak lengkap.');
      const files = [{ path: SETTINGS, content: JSON.stringify(s, null, 2) + '\n' }];
      for (const x of body.assets || []) files.push({ path: `public/${cleanAssetPath(x.path)}`, base64: String(x.base64).replace(/^data:[^,]+,/, '') });
      return { commit: await commitFiles(files, `Tetapan: ${body.note || 'kemas kini laman'}`) };
    }
  }

  if (a === 'posts') {
    if (method === 'GET' && !b) {
      const posts = await listDocs(POSTS);
      posts.sort((x, y) => new Date(y.date || 0) - new Date(x.date || 0));
      return { posts: posts.map(({ body, ...m }) => ({ ...m, words: body.split(/\s+/).length })) };
    }
    if (method === 'GET' && b) {
      const text = await readFile(`${POSTS}/${slugify(b)}.md`);
      if (text == null) throw new HttpError(404, 'Artikel tidak dijumpai.');
      const { data, body } = parseDoc(text);
      return { post: { ...data, slug: slugify(b), body } };
    }
    if (method === 'POST' && b === 'delete') {
      const { slugs = [] } = await req.json();
      if (!slugs.length) throw new HttpError(400, 'Tiada artikel dipilih.');
      const files = slugs.map((s) => ({ path: `${POSTS}/${slugify(s)}.md`, delete: true }));
      return { commit: await commitFiles(files, `Padam ${slugs.length} artikel`) };
    }
    if (method === 'POST') return savePost(await req.json());
    if (method === 'DELETE' && b) return { commit: await commitFiles([{ path: `${POSTS}/${slugify(b)}.md`, delete: true }], `Padam artikel: ${b}`) };
  }

  if (a === 'pages') {
    if (method === 'GET' && !b) return { pages: (await listDocs(PAGES)).map(({ body, ...m }) => m) };
    if (method === 'GET' && b) {
      const text = await readFile(`${PAGES}/${slugify(b)}.md`);
      if (text == null) throw new HttpError(404, 'Halaman tidak dijumpai.');
      const { data, body } = parseDoc(text);
      return { page: { ...data, slug: slugify(b), body } };
    }
    if (method === 'POST') return savePage(await req.json());
    if (method === 'DELETE' && b) {
      if (['program', 'hubungi'].includes(b)) throw new HttpError(400, 'Halaman ini digunakan oleh menu utama dan tidak boleh dipadam. Anda boleh sunting kandungannya.');
      return { commit: await commitFiles([{ path: `${PAGES}/${slugify(b)}.md`, delete: true }], `Padam halaman: ${b}`) };
    }
  }

  if (a === 'facebook') {
    if (b === 'fetch' && method === 'POST') {
      const settings = await getSettings();
      const fb = settings.facebook || {};
      const [posts, existing] = await Promise.all([
        fetchLatestPosts({ limit: fb.limit || 10, pageId: fb.pageId, version: fb.graphVersion }),
        listDocs(POSTS).catch(() => []),
      ]);
      const byFb = new Map(existing.filter((p) => p.fbId).map((p) => [p.fbId, p.slug]));
      return { posts: posts.map((p) => ({ ...p, importedSlug: byFb.get(p.id) || null })) };
    }
    if (b === 'process' && method === 'POST') {
      const { post } = await req.json();
      if (!post) throw new HttpError(400, 'Tiada hantaran untuk diolah.');
      const settings = await getSettings();
      return { article: await articleFromFacebook(post, settings) };
    }
  }

  throw new HttpError(404, `Laluan API tidak dikenali: ${method} /api/${parts.join('/')}`);
  // eslint-disable-next-line no-unreachable
  void c;
}

export default async (req) => {
  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  try {
    return json(await route(req, parts));
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    if (status >= 500) console.error(e);
    return json({ error: e.message || 'Ralat pelayan', ...(e.extra || {}) }, status);
  }
};
