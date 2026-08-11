/** 本番サイトの正規オリジン */
export const SITE_URL = 'https://neet-magazine.com';

/** デフォルトの OGP 画像パス */
export const DEFAULT_OG_IMAGE = '/images/covers/vol5-complete.png';

/** 相対パスまたは絶対 URL を絶対 URL に正規化する */
export function absoluteUrl(pathOrUrl: string, site: string = SITE_URL): string {
	if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
	const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
	return new URL(path, site).href;
}

/** pathname から canonical URL を作る（末尾スラッシュなし） */
export function canonicalUrl(pathname: string, site: string = SITE_URL): string {
	const normalized = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
	return new URL(normalized, site).href;
}

/** meta description 用に要約を整える */
export function truncateDescription(text: string, max = 120): string {
	const plain = text.replace(/\s+/g, ' ').trim();
	if (plain.length <= max) return plain;
	return `${plain.slice(0, max - 1)}…`;
}
