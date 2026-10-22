// Tarik hantaran terkini daripada Halaman Facebook melalui Graph API rasmi.
import { env, HttpError } from './util.mjs';

const FIELDS = [
  'id', 'message', 'story', 'created_time', 'permalink_url', 'full_picture', 'status_type',
  'attachments{media_type,type,url,title,description,media,target,subattachments.limit(20){media_type,type,url,description,media}}',
].join(',');

const pick = (a) => a?.media?.image?.src || null;

export function normalizePost(p) {
  const images = [];
  let video = null;
  let link = null;
  for (const a of p.attachments?.data || []) {
    const subs = a.subattachments?.data || [];
    if (subs.length) {
      for (const s of subs) {
        if (s.media_type === 'video' || /video/.test(s.type || '')) video ||= s.url || null;
        const src = pick(s);
        if (src) images.push(src);
      }
    } else {
      if (a.media_type === 'video' || /video/.test(a.type || '')) video ||= a.url || a.target?.url || null;
      if (a.media_type === 'link' || a.type === 'share') link = { url: a.url || a.target?.url, title: a.title || '', description: a.description || '' };
      const src = pick(a);
      if (src) images.push(src);
    }
  }
  if (!images.length && p.full_picture) images.push(p.full_picture);
  const message = (p.message || '').trim();
  return {
    id: p.id,
    message,
    story: p.story || '',
    date: p.created_time,
    url: p.permalink_url || `https://www.facebook.com/${p.id}`,
    images: [...new Set(images)].slice(0, 12),
    video,
    link,
    type: p.status_type || '',
  };
}

export async function fetchLatestPosts({ limit = 10, pageId = '', version = 'v26.0' } = {}) {
  const token = env('FB_PAGE_TOKEN');
  if (!token) throw new HttpError(400, 'FB_PAGE_TOKEN belum ditetapkan. Ikut panduan "Sambung Facebook" dalam halaman Bantuan admin.', { code: 'NO_FB_TOKEN' });
  const id = env('FB_PAGE_ID') || pageId || 'me';
  const v = env('FB_GRAPH_VERSION') || version || 'v26.0';
  const url = `https://graph.facebook.com/${v}/${encodeURIComponent(id)}/posts?fields=${encodeURIComponent(FIELDS)}&limit=${Math.min(25, Math.max(1, limit))}&access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const err = data.error || {};
    if (err.code === 190) throw new HttpError(400, 'Token Facebook telah tamat tempoh atau dibatalkan. Jana Page Access Token baharu dan kemas kini FB_PAGE_TOKEN di Netlify.', { code: 'FB_TOKEN_EXPIRED' });
    if (err.code === 10 || err.code === 200) throw new HttpError(400, `Token tiada kebenaran membaca hantaran Halaman (${err.message}). Pastikan token ialah Page Access Token dengan kebenaran pages_read_engagement.`, { code: 'FB_PERMISSION' });
    if (err.code === 4 || err.code === 32 || err.code === 613) throw new HttpError(429, 'Had permintaan Facebook dicapai. Cuba lagi dalam beberapa minit.');
    throw new HttpError(502, `Facebook memulangkan ralat: ${err.message || res.status}`);
  }
  return (data.data || [])
    .map(normalizePost)
    .filter((p) => p.message || p.images.length);
}
