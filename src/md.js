// Penukar Markdown ringkas tanpa kebergantungan (digunakan oleh laman & panel admin)
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const safeHref = (h) => (/^\s*(javascript|data|vbscript):/i.test(h) ? '#' : h);

function inline(src) {
  const codes = [];
  let s = String(src).replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = esc(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) =>
    `<img src="${safeHref(src)}" alt="${alt}" loading="lazy" decoding="async">`);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, h) => {
    const ext = /^https?:/i.test(h);
    return `<a href="${safeHref(h)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`;
  });
  s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+[^\s<).,!?;:'"])/g, (_, pre, url) =>
    `${pre}<a href="${url}" target="_blank" rel="noopener">${url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 48)}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+)__/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<em>$2</em>');
  s = s.replace(/(^|[^_\w])_([^_\s][^_]*?)_(?!\w)/g, '$1<em>$2</em>');
  s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[+i])}</code>`);
  return s;
}

const RAW_HTML = /^<(iframe|div|figure|video|audio|table|details|section|blockquote|p|aside)[\s>]/i;
const YT = /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})\S*$/i;

export function slugifyHeading(t) {
  return String(t).toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60);
}

export function renderMarkdown(md = '') {
  const lines = String(md).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;
  const isBlank = (l) => !l || !l.trim();
  while (i < lines.length) {
    let line = lines[i];
    if (isBlank(line)) { i++; continue; }
    // blok kod
    if (/^```/.test(line)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`);
      continue;
    }
    // tajuk
    const h = line.match(/^(#{1,6})\s+(.*?)\s*#*$/);
    if (h) {
      const lvl = Math.max(2, h[1].length); // h1 dikhaskan untuk tajuk artikel
      out.push(`<h${lvl} id="${slugifyHeading(h[2])}">${inline(h[2])}</h${lvl}>`);
      i++;
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { out.push('<hr>'); i++; continue; }
    // HTML mentah (kandungan admin dipercayai)
    if (RAW_HTML.test(line.trim())) {
      const buf = [];
      while (i < lines.length && !isBlank(lines[i])) buf.push(lines[i++]);
      out.push(buf.join('\n').replace(/<script[\s\S]*?<\/script>/gi, ''));
      continue;
    }
    // video YouTube
    const yt = line.trim().match(YT);
    if (yt) {
      const id = yt[1];
      out.push(`<a class="yt" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener" aria-label="Tonton video di YouTube"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" decoding="async"><span class="yt-play" aria-hidden="true"></span></a>`);
      i++;
      continue;
    }
    // imej bersendirian -> figure
    const img = line.trim().match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (img) {
      const cap = img[1] ? `<figcaption>${inline(img[1])}</figcaption>` : '';
      out.push(`<figure><img src="${safeHref(img[2])}" alt="${esc(img[1])}" loading="lazy" decoding="async">${cap}</figure>`);
      i++;
      continue;
    }
    // petikan
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${renderMarkdown(buf.join('\n'))}</blockquote>`);
      continue;
    }
    // senarai
    if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) {
        let item = lines[i].replace(/^\s*([-*+]|\d+[.)])\s+/, '');
        i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) item += ' ' + lines[i++].trim();
        items.push(`<li>${inline(item)}</li>`);
      }
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${items.join('')}</${tag}>`);
      continue;
    }
    // perenggan
    const buf = [];
    while (
      i < lines.length && !isBlank(lines[i]) && !/^(#{1,6}\s|```|>\s?)/.test(lines[i]) &&
      !/^\s*([-*+]|\d+[.)])\s+/.test(lines[i]) && !RAW_HTML.test(lines[i].trim())
    ) buf.push(lines[i++]);
    if (!buf.length) { out.push(`<p>${inline(lines[i++])}</p>`); continue; }
    out.push(`<p>${buf.map(inline).join('<br>')}</p>`);
  }
  return out.join('\n');
}

export function plainText(md = '') {
  return String(md)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export { esc };
