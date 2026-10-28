// API panel admin — semua laluan /api/*
import { json, HttpError, requireAuth, checkPassword, issueToken, sleep, env } from '../lib/util.mjs';
import { readFile, readDirTexts, commitFiles, repoInfo, lastCommit } from '../lib/github.mjs';
import { fetchLatestPosts } from '../lib/facebook.mjs';
import { articleFromFacebook, aiReady, aiSource } from '../lib/ai.mjs';
import { parseDoc, stringifyDoc, slugify } from '../../src/frontmatter.js';
import { POSTS, SETTINGS, RESERVED, getSettings, listDocs, cleanAssetPath, savePost } from '../lib/posts.mjs';
import { runAutoImport } from '../lib/autoimport.mjs';

export const config = { path: '/api/*' };

const PAGES = 'content/pages';
const PAGE_FIELDS = ['title', 'description', 'template', 'draft'];

// Petunjuk bentuk token tanpa mendedahkannya (jenis & panjang sahaja)
function tokenHint(t = '') {
  if (!t) return '';
  const type = t.startsWith('github_pat_') ? 'fine-grained (github_pat_…)' : t.startsWith('ghp_') ? 'classic (ghp_…)' : /^gh[osur]_/.test(t) ? 'token aplikasi/OAuth' : 'format tidak dikenali';
  return `${type}, ${t.length} aksara`;
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

  if (a === 'health') return { ok: true, admin: Boolean(env('ADMIN_PASSWORD')), ai: aiSource() || 'tiada', facebook: Boolean(env('FB_PAGE_TOKEN')) };

  requireAuth(req);

  if (a === 'status') {
    const r = repoInfo();
    let commit = null, githubError = null;
    if (r.ready) { try { commit = await lastCommit(); } catch (e) { githubError = e.message; } }
    return {
      github: { ready: r.ready && !githubError, repo: r.full, branch: r.branch, hasToken: Boolean(r.token), error: githubError, tokenHint: tokenHint(r.token) },
      facebook: { ready: Boolean(env('FB_PAGE_TOKEN')), pageId: env('FB_PAGE_ID') },
      ai: { ready: aiReady(), model: env('ANTHROPIC_MODEL'), source: aiSource() },
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
    if (b === 'auto-run' && method === 'POST') {
      return runAutoImport({ maxPosts: 3, force: true });
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
