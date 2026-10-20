import config from '../../src-tauri/tauri.conf.json';

export const APP_VERSION = config.version;
export const DEFAULT_GITHUB_REPOSITORY = 'hizliislerajansi/Egitim';
export function githubRepository(value: string): string {
  const input = value.trim();
  const match = /^(?:https:\/\/github\.com\/)?([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38}))\/([a-zA-Z0-9._-]{1,100})(?:\.git)?\/?$/.exec(input);
  if (!match || ['.', '..'].includes(match[2])) throw new Error('GitHub depo adresini sahip/depo biçiminde girin.');
  return `${match[1]}/${match[2].replace(/\.git$/, '')}`;
}
export function newerVersion(candidate: string, current = APP_VERSION): boolean {
  const parse = (v: string) => /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(v)?.slice(1).map(Number);
  const a = parse(candidate), b = parse(current);
  if (!a || !b || [...a, ...b].some(n => !Number.isSafeInteger(n))) return false;
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}
export interface GithubUpdate { version: string; available: boolean; url: string; installers: number }
export async function checkGithubUpdate(repository: string, request: typeof fetch = fetch): Promise<GithubUpdate> {
  const repo = githubRepository(repository);
  try {
    const response = await request(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' }, credentials: 'omit', redirect: 'error',
      signal: AbortSignal.timeout(15000), cache: 'no-store',
    });
    if (response.status === 404) throw new Error('Depo herkese açık değil veya yayımlanmış sürüm bulunamadı.');
    if (response.status === 403 || response.status === 429) throw new Error('GitHub kontrol sınırına ulaşıldı. Bir süre sonra tekrar deneyin.');
    if (!response.ok) throw new Error(`GitHub sürüm kontrolü tamamlanamadı (${response.status}).`);
    const release = await response.json();
    if (!release || release.draft !== false || release.prerelease !== false || typeof release.tag_name !== 'string' || !/^v?\d+\.\d+\.\d+$/.test(release.tag_name)) throw new Error('Kararlı sürüm bilgisi geçerli değil.');
    // Construct the destination locally; never render remote HTML or execute an asset URL.
    const url = `https://github.com/${repo}/releases/tag/${encodeURIComponent(release.tag_name)}`;
    const installers = Array.isArray(release.assets) ? release.assets.filter((a: {name?: unknown; state?: unknown}) => typeof a.name === 'string' && /\.(exe|msi)$/i.test(a.name) && a.state === 'uploaded').length : 0;
    return {version: release.tag_name, available: newerVersion(release.tag_name), url, installers};
  } catch (error) {
    if (error instanceof TypeError || (error instanceof DOMException && ['TimeoutError','AbortError'].includes(error.name))) throw new Error('GitHub’a ulaşılamadı. İnternet bağlantısını kontrol edip tekrar deneyin. Dersler çevrimdışı kullanılabilir.');
    throw error;
  }
}
