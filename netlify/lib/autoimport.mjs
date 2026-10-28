// Import automatik: tarik hantaran Facebook baharu, olah dengan AI, simpan dalam satu commit.
import { readDirTexts, commitFiles } from './github.mjs';
import { fetchLatestPosts } from './facebook.mjs';
import { articleFromFacebook } from './ai.mjs';
import { POSTS, getSettings, preparePost } from './posts.mjs';
import { parseDoc } from '../../src/frontmatter.js';

/**
 * @param {{ maxPosts?: number, force?: boolean }} opts
 *   maxPosts: had hantaran diproses setiap larian (fungsi berjadual dihadkan 30 saat)
 *   force: jalankan walaupun mod automatik "off" (untuk butang "Jalankan sekarang")
 */
export async function runAutoImport({ maxPosts = 3, force = false } = {}) {
  const started = Date.now();
  const settings = await getSettings();
  const fb = settings.facebook || {};
  const mode = fb.autoImport || 'draft'; // 'draft' | 'publish' | 'off'
  if (mode === 'off' && !force) return { skipped: true, reason: 'Import automatik dimatikan dalam tetapan.' };

  const [posts, existingFiles] = await Promise.all([
    fetchLatestPosts({ limit: fb.limit || 10, pageId: fb.pageId, version: fb.graphVersion }),
    readDirTexts(POSTS).catch(() => []),
  ]);
  const imported = new Set(existingFiles.map((f) => parseDoc(f.text).data.fbId).filter(Boolean));
  const skipIds = new Set(fb.skipIds || []);
  const fresh = posts.filter((p) => !imported.has(p.id) && !skipIds.has(p.id)).slice(0, maxPosts);
  if (!fresh.length) return { created: [], pending: 0, mode, message: 'Tiada hantaran Facebook baharu.' };

  // Olah serentak supaya muat dalam had masa
  const articles = await Promise.all(fresh.map((p) => articleFromFacebook(p, settings).catch((e) => ({ error: e.message }))));

  const files = [];
  const created = [];
  const errors = [];
  const draft = mode !== 'publish';
  for (const [i, p] of fresh.entries()) {
    const a = articles[i];
    if (a.error) { errors.push(`${(p.message || '').slice(0, 40)}…: ${a.error}`); continue; }
    try {
      const r = await preparePost({
        post: {
          title: a.title, excerpt: a.excerpt, body: a.body, category: a.category, tags: a.tags,
          date: p.date, cover: p.images[0] || '', coverAlt: a.imageAlt || '', gallery: p.images,
          draft, fbId: p.id, fbUrl: p.url, source: 'facebook', author: '',
        },
        remoteImages: p.images,
      }, existingFiles);
      files.push(...r.files);
      existingFiles.push({ name: `${r.slug}.md`, text: `---\nfbId: ${JSON.stringify(p.id)}\n---\n` });
      created.push({ slug: r.slug, title: a.title, engine: a.engine, draft });
    } catch (e) {
      errors.push(`${a.title}: ${e.message}`);
    }
  }

  let commit = null;
  if (files.length) {
    commit = await commitFiles(files, `Import automatik Facebook: ${created.length} artikel${draft ? ' (draf)' : ''}`);
  }
  const pending = posts.filter((p) => !imported.has(p.id) && !skipIds.has(p.id)).length - created.length - errors.length;
  return { created, errors, pending: Math.max(0, pending), mode, commit, ms: Date.now() - started };
}
