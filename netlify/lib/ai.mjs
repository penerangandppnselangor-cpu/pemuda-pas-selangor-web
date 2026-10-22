// Olah hantaran Facebook menjadi artikel berita menggunakan Claude (Anthropic API).
import { env, HttpError } from './util.mjs';
import { basicArticle } from '../../src/fbformat.js';

function extractJson(text) {
  const s = text.indexOf('{');
  const e = text.lastIndexOf('}');
  if (s < 0 || e <= s) throw new Error('Tiada JSON');
  return JSON.parse(text.slice(s, e + 1));
}

export function aiReady() {
  return Boolean(env('ANTHROPIC_API_KEY'));
}

export async function articleFromFacebook(fb, settings) {
  const categories = settings.categories || [];
  const defaultCategory = settings.ai?.defaultCategory || 'Berita';
  const basic = basicArticle(fb, { categories, defaultCategory });
  const key = env('ANTHROPIC_API_KEY');
  if (!key) return { ...basic, engine: 'asas', note: 'ANTHROPIC_API_KEY belum ditetapkan — draf disediakan tanpa AI.' };
  if (!fb.message || fb.message.replace(/\s/g, '').length < 15) return { ...basic, engine: 'asas', note: 'Hantaran terlalu pendek untuk diolah AI.' };

  const site = settings.site || {};
  const ai = settings.ai || {};
  const system = [
    `Anda editor berita untuk laman web rasmi ${site.fullName || site.name}.`,
    'Tugas anda: mengolah satu hantaran Facebook organisasi menjadi artikel laporan berita yang kemas untuk laman web.',
    ai.tone ? `Gaya penulisan: ${ai.tone}` : '',
    ai.instructions ? `Arahan tambahan: ${ai.instructions}` : '',
    'Peraturan wajib: gunakan HANYA fakta dalam hantaran asal. Jangan reka nama, angka, tarikh, tempat atau petikan. Jika maklumat tidak lengkap, tulis secara umum tanpa meneka.',
    'Buang emoji dan hashtag daripada isi. Kekalkan ejaan nama orang dan tempat. Tulis dalam Bahasa Melayu standard.',
    'Balas dengan satu objek JSON sahaja, tanpa teks lain dan tanpa blok kod.',
  ].filter(Boolean).join('\n');

  const user = `Hantaran Facebook
Tarikh: ${fb.date || '-'}
Pautan: ${fb.url || '-'}
Bilangan gambar: ${fb.images?.length || 0}${fb.link?.url ? `\nPautan dikongsi: ${fb.link.title || ''} ${fb.link.url}` : ''}

<<<
${fb.message}
>>>

Kategori yang dibenarkan: ${JSON.stringify(categories)}

Pulangkan JSON dengan medan:
{"title": "tajuk berita 6–14 perkataan, huruf besar hanya pada awal ayat dan nama khas",
 "excerpt": "ringkasan 1–2 ayat, maksimum 200 aksara",
 "body": "isi artikel dalam Markdown: 3–8 perenggan pendek; boleh guna subtajuk ## jika panjang; senarai '-' untuk butiran; jangan ulang tajuk",
 "category": "satu daripada kategori yang dibenarkan",
 "tags": ["2 hingga 5 tag pendek huruf kecil"],
 "imageAlt": "penerangan ringkas gambar utama berdasarkan konteks hantaran"}`;

  const content = [{ type: 'text', text: user }];
  if (ai.useVision && fb.images?.[0]) content.unshift({ type: 'image', source: { type: 'url', url: fb.images[0] } });

  const model = env('ANTHROPIC_MODEL') || ai.model || 'claude-haiku-5-5';
  const timeout = Number(env('AI_TIMEOUT_MS', '9500'));
  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: 1800, system, messages: [{ role: 'user', content }] }),
      signal: AbortSignal.timeout(timeout),
    });
  } catch (e) {
    return { ...basic, engine: 'asas', note: e.name === 'TimeoutError' ? 'AI mengambil masa terlalu lama — draf asas disediakan. Anda boleh cuba “Olah semula dengan AI”.' : `AI tidak dapat dihubungi (${e.message}). Draf asas disediakan.` };
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || res.status;
    if (res.status === 401) throw new HttpError(400, 'ANTHROPIC_API_KEY tidak sah. Semak semula kunci di Netlify.');
    return { ...basic, engine: 'asas', note: `AI memulangkan ralat (${msg}). Draf asas disediakan.` };
  }
  const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  try {
    const j = extractJson(text);
    return {
      title: String(j.title || basic.title).trim(),
      excerpt: String(j.excerpt || basic.excerpt).trim(),
      body: String(j.body || basic.body).trim(),
      category: categories.includes(j.category) ? j.category : basic.category,
      tags: Array.isArray(j.tags) ? j.tags.map((t) => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 6) : basic.tags,
      imageAlt: String(j.imageAlt || ''),
      engine: 'ai',
      model,
    };
  } catch {
    return { ...basic, engine: 'asas', note: 'Jawapan AI tidak dapat dibaca. Draf asas disediakan.' };
  }
}
