// Fungsi berjadual: setiap jam (minit ke-17, UTC) semak hantaran Facebook baharu
// dan jadikannya artikel (draf atau terus terbit, ikut tetapan admin).
// Had fungsi berjadual ialah 30 saat, jadi maksimum 3 hantaran setiap larian;
// selebihnya diproses pada larian seterusnya.
import { runAutoImport } from '../lib/autoimport.mjs';

export default async () => {
  try {
    const r = await runAutoImport({ maxPosts: 3 });
    console.log('[fb-auto-import]', JSON.stringify({ ...r, commit: r.commit?.sha }));
  } catch (e) {
    console.error('[fb-auto-import] gagal:', e.message);
  }
};

export const config = {
  schedule: '17 * * * *', // setiap jam pada minit ke-17 (UTC); di Malaysia juga minit ke-17
};
