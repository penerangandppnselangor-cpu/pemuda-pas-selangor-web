# Laman Web Pemuda PAS Selangor

Laman rasmi Dewan Pemuda PAS Negeri Selangor: berita, program dan aktiviti, dengan panel admin di `/admin` dan butang **Tarik 10 posting terkini** yang mengolah hantaran Facebook menjadi artikel berita menggunakan AI.

- **Laju & mudah alih dahulu** — laman statik tulen (tiada rangka kerja), CSS ~15 KB, JS ~2 KB, build < 1 saat.
- **Korporat & mesra pembaca** — susun atur berita, kategori, carian, kongsi WhatsApp/Facebook/Telegram, galeri gambar.
- **WhatsApp** — butang terapung dan seruan ke `+60 18-259 6954` (boleh diubah di admin).
- **Panel admin** — tulis/sunting artikel, halaman, susunan laman utama, menu, tema warna & fon, kategori.
- **Import Facebook + AI** — tarik hantaran, AI (Claude) tulis tajuk, ringkasan, isi, kategori & tag; gambar dimuat turun dan disimpan dalam repo.

## Cara ia berfungsi

```
Admin (/admin) ──► Netlify Function /api ──► commit ke GitHub ──► Netlify build automatik (~1 minit) ──► laman dikemas kini
                         │
                         ├─► Facebook Graph API (tarik hantaran Halaman)
                         └─► Anthropic API (olah menjadi artikel)
```

Semua kandungan disimpan dalam repo: `content/posts/*.md`, `content/pages/*.md`, `content/settings.json`, gambar dalam `public/uploads/`. Setiap perubahan mempunyai sejarah dalam GitHub dan boleh dipulihkan.

## Pemasangan di Netlify

1. Sambungkan repo GitHub ini di Netlify (**Add new site → Import an existing project**). Tetapan build dibaca automatik daripada `netlify.toml`.
2. Tambah pemboleh ubah di **Site configuration → Environment variables**:

| Nama | Wajib | Kegunaan |
|---|---|---|
| `ADMIN_PASSWORD` | Ya | Kata laluan log masuk `/admin` |
| `GITHUB_TOKEN` | Ya | Fine-grained token, repo ini sahaja, **Contents: Read and write** — untuk menyimpan perubahan |
| `ANTHROPIC_API_KEY` | Disyorkan | AI penulis artikel (tanpanya, draf asas tetap disediakan) |
| `FB_PAGE_TOKEN` | Untuk import FB | Page Access Token Halaman Facebook (kebenaran `pages_read_engagement`) |
| `FB_PAGE_ID` | Pilihan | ID Halaman; tidak perlu jika guna Page Access Token |

3. **Deploys → Trigger deploy** selepas menambah pemboleh ubah.
4. Buka `https://<laman-anda>/admin`, log masuk, dan ikut halaman **Bantuan & sambungan** untuk langkah terperinci (termasuk cara mendapatkan token Facebook yang tidak tamat tempoh).

`GITHUB_REPO` dan `GITHUB_BRANCH` dikesan automatik semasa build daripada repo yang disambungkan.

## Pembangunan tempatan

```bash
npm run dev      # bina ke dist/ dan pratonton di http://localhost:4321
npm run build    # bina sahaja
```

Tiada `npm install` diperlukan — projek ini tiada kebergantungan.

## Struktur

```
content/            kandungan (artikel, halaman, tetapan)
public/             fail statik & gambar (uploads/)
src/                penjana: gaya, ikon, markdown, skrip awam
scripts/build.mjs   penjana laman statik
admin/              panel admin (/admin)
netlify/functions/  API admin (/api/*)
netlify/lib/        GitHub, Facebook, AI, sesi
```
