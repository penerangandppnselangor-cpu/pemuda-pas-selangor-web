// Front matter ringkas: setiap nilai disimpan sebagai JSON supaya selamat dibaca semula.
export function parseDoc(text = '') {
  const src = String(text).replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: src.trim() };
  const data = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    const raw = kv[2].trim();
    let val = raw;
    if (raw === '') val = '';
    else {
      try { val = JSON.parse(raw); } catch { val = raw.replace(/^['"]|['"]$/g, ''); }
    }
    data[kv[1]] = val;
  }
  return { data, body: m[2].trim() };
}

export function stringifyDoc(data = {}, body = '') {
  const lines = ['---'];
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue;
    lines.push(`${k}: ${JSON.stringify(v)}`);
  }
  lines.push('---', '', String(body || '').trim(), '');
  return lines.join('\n');
}

export function slugify(s = '') {
  return String(s)
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' dan ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/[\s-]+/g, '-')
    .split('-').slice(0, 10).join('-')
    .slice(0, 80)
    .replace(/-+$/, '') || 'artikel';
}
