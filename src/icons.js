// Ikon SVG sebaris (tiada permintaan rangkaian tambahan)
const s = (d, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`;
const f = (d) => `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${d}</svg>`;

export const icons = {
  menu: s('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  close: s('<path d="M6 6l12 12M18 6L6 18"/>'),
  search: s('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  arrow: s('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  calendar: s('<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/>'),
  clock: s('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  link: s('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  mail: s('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>'),
  phone: s('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
  pin: s('<path d="M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  book: s('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/><path d="M9 7.5h7"/>'),
  heart: s('<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z"/>'),
  hands: s('<path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11"/><path d="M10 10V5a1.5 1.5 0 0 1 3 0v5"/><path d="M13 10V6a1.5 1.5 0 0 1 3 0v6"/><path d="M16 12v-2.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-2.7L3.6 14.6a1.5 1.5 0 0 1 2.4-1.8L7 14"/>'),
  ball: s('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5l4 3-1.5 4.7h-5L8 10.5z"/><path d="M12 3.5v4M16 10.5l4-1.5M14.5 15.2l2.5 3.6M9.5 15.2L7 18.8M8 10.5L4 9"/>'),
  mic: s('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>'),
  screen: s('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/><path d="M10 8.5l4 1.8-4 1.8z"/>'),
  users: s('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6"/>'),
  flag: s('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'),
  star: s('<path d="M12 2.8l2.1 5.1 5.1 2.1-5.1 2.1L12 17.2l-2.1-5.1L4.8 10l5.1-2.1z"/>'),
  copy: s('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'),
  whatsapp: f('<path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.24 8.24 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.24-8.24 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z"/>'),
  facebook: f('<path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.87.25-1.46 1.5-1.46h1.6V4.46A21 21 0 0 0 14.3 4.3c-2.3 0-3.8 1.4-3.8 3.95v2.25H8v3h2.5V21z"/>'),
  instagram: s('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6" fill="currentColor"/>'),
  tiktok: f('<path d="M16.6 3c.3 2.3 1.6 3.7 3.9 3.9v2.7c-1.4.1-2.6-.3-3.9-1.1v5.1c0 6.5-7.1 8.5-9.9 3.8-1.8-3-.7-8.3 5.1-8.5v2.9c-.4.1-.9.2-1.3.3-1.3.4-2 1.3-1.8 2.7.4 2.7 5.3 3.5 4.9-1.8V3z"/>'),
  youtube: f('<path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z"/>'),
  x: f('<path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L1.9 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.5z"/>'),
  telegram: f('<path d="M21.4 4.3L2.9 11.4c-1.3.5-1.3 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.1.9.8.9.5 0 .7-.2 1-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.8-1.4-1.4zM8.6 14l9.2-5.8c.5-.3.8-.1.5.2l-7.6 6.9-.3 3.2z"/>'),
};

// Bintang lapan (khatam) — motif jenama
export const khatam = (cls = '', title = '') =>
  `<svg class="${cls}" viewBox="0 0 100 100" ${title ? `role="img" aria-label="${title}"` : 'aria-hidden="true"'}><g fill="currentColor"><rect x="20" y="20" width="60" height="60" rx="3"/><rect x="20" y="20" width="60" height="60" rx="3" transform="rotate(45 50 50)"/></g></svg>`;

export function brandMark(primary = '#0E5A3F', accent = '#E8B53A') {
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="${primary}"><rect x="14" y="14" width="72" height="72" rx="6"/><rect x="14" y="14" width="72" height="72" rx="6" transform="rotate(45 50 50)"/></g><circle cx="50" cy="50" r="23" fill="#fff"/><path d="M50 33l4.3 10.4L65 47.7l-10.7 4.3L50 62.4 45.7 52 35 47.7l10.7-4.3z" fill="${accent}"/></svg>`;
}

export const khatamTile = (color = '#ffffff') => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 84 84'><g fill='none' stroke='${color}' stroke-width='1.4'><rect x='22' y='22' width='40' height='40'/><rect x='22' y='22' width='40' height='40' transform='rotate(45 42 42)'/><path d='M0 42h8M76 42h8M42 0v8M42 76v8'/></g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};
