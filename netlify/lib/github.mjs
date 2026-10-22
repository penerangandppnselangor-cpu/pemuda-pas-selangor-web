// Simpan kandungan terus ke repo GitHub. Setiap commit mencetuskan build automatik di Netlify.
import generated from './repo.generated.mjs';
import { env, HttpError } from './util.mjs';

const API = 'https://api.github.com';

export function repoInfo() {
  const full = env('GITHUB_REPO') || generated.repo || '';
  const branch = env('GITHUB_BRANCH') || generated.branch || 'main';
  const token = env('GITHUB_TOKEN');
  return { full, branch, token, ready: Boolean(full && token) };
}

function ensure() {
  const r = repoInfo();
  if (!r.token) throw new HttpError(500, 'GITHUB_TOKEN belum ditetapkan dalam Netlify. Panel admin perlukannya untuk menyimpan perubahan.');
  if (!r.full) throw new HttpError(500, 'Repo GitHub tidak dikenal pasti. Tetapkan GITHUB_REPO (contoh: pemudapas/laman-web) dalam Netlify.');
  return r;
}

async function gh(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'pemuda-pas-selangor-admin',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    const msg = data?.message || String(text).slice(0, 200);
    if (res.status === 401) throw new HttpError(502, 'GITHUB_TOKEN tidak sah atau telah tamat tempoh. Jana token baharu dan kemas kini dalam Netlify.');
    if (res.status === 403 || res.status === 404) {
      const e = new HttpError(res.status === 404 ? 404 : 502, `GitHub menolak permintaan (${res.status}): ${msg}. Pastikan token mempunyai akses "Contents: Read and write" pada repo ini.`);
      e.ghStatus = res.status;
      throw e;
    }
    const e = new HttpError(502, `Ralat GitHub (${res.status}): ${msg}`);
    e.ghStatus = res.status;
    throw e;
  }
  return data;
}

const enc = (p) => p.split('/').map(encodeURIComponent).join('/');

export async function readFile(path) {
  const { full, branch, token } = ensure();
  try {
    const d = await gh(`/repos/${full}/contents/${enc(path)}?ref=${encodeURIComponent(branch)}`, { token });
    if (Array.isArray(d)) throw new HttpError(400, `${path} ialah folder`);
    if (d.content) return Buffer.from(d.content, 'base64').toString('utf8');
    const blob = await gh(`/repos/${full}/git/blobs/${d.sha}`, { token });
    return Buffer.from(blob.content, 'base64').toString('utf8');
  } catch (e) {
    if (e.ghStatus === 404 || e.status === 404) return null;
    throw e;
  }
}

// Baca semua fail teks dalam satu folder dengan satu panggilan GraphQL
export async function readDirTexts(dir) {
  const { full, branch, token } = ensure();
  const [owner, name] = full.split('/');
  const query = `query($owner:String!,$name:String!,$expr:String!){repository(owner:$owner,name:$name){object(expression:$expr){... on Tree{entries{name type object{... on Blob{text byteSize}}}}}}}`;
  const res = await fetch(`${API}/graphql`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'pemuda-pas-selangor-admin' },
    body: JSON.stringify({ query, variables: { owner, name, expr: `${branch}:${dir}` } }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.errors) {
    const msg = data?.errors?.[0]?.message || data?.message || res.status;
    if (res.status === 401) throw new HttpError(502, 'GITHUB_TOKEN tidak sah atau telah tamat tempoh.');
    throw new HttpError(502, `Ralat GitHub semasa membaca ${dir}: ${msg}`);
  }
  const entries = data?.data?.repository?.object?.entries || [];
  return entries.filter((e) => e.type === 'blob').map((e) => ({ name: e.name, text: e.object?.text ?? '' }));
}

/**
 * Commit beberapa fail serentak (satu commit = satu build Netlify).
 * files: [{ path, content }] (teks), [{ path, base64 }] (binari) atau [{ path, delete: true }]
 */
export async function commitFiles(files, message, attempt = 0) {
  const { full, branch, token } = ensure();
  const ref = await gh(`/repos/${full}/git/ref/heads/${encodeURIComponent(branch)}`, { token });
  const parentSha = ref.object.sha;
  const parent = await gh(`/repos/${full}/git/commits/${parentSha}`, { token });
  const tree = await Promise.all(files.map(async (f) => {
    if (f.delete) return { path: f.path, mode: '100644', type: 'blob', sha: null };
    const blob = await gh(`/repos/${full}/git/blobs`, {
      method: 'POST', token,
      body: f.base64 != null ? { content: f.base64, encoding: 'base64' } : { content: String(f.content), encoding: 'utf-8' },
    });
    return { path: f.path, mode: '100644', type: 'blob', sha: blob.sha };
  }));
  const newTree = await gh(`/repos/${full}/git/trees`, { method: 'POST', token, body: { base_tree: parent.tree.sha, tree } });
  const commit = await gh(`/repos/${full}/git/commits`, {
    method: 'POST', token,
    body: { message, tree: newTree.sha, parents: [parentSha] },
  });
  try {
    await gh(`/repos/${full}/git/refs/heads/${encodeURIComponent(branch)}`, { method: 'PATCH', token, body: { sha: commit.sha } });
  } catch (e) {
    if (attempt < 2 && (e.ghStatus === 422 || e.ghStatus === 409)) return commitFiles(files, message, attempt + 1);
    throw e;
  }
  return { sha: commit.sha, url: `https://github.com/${full}/commit/${commit.sha}` };
}

export async function lastCommit() {
  const { full, branch, token } = ensure();
  const c = await gh(`/repos/${full}/commits/${encodeURIComponent(branch)}`, { token });
  return { sha: c.sha, message: c.commit?.message, date: c.commit?.committer?.date, url: c.html_url };
}
