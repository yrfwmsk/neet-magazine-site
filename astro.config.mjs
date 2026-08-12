// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';
import { rehypeHangingPunct } from './src/lib/rehype-hanging-punct.js';

const testPagePattern =
	/\/(home-.*-tests|magazines\/accent-tests|magazines\/article-layout-tests)(\/|$)/;

/** Asia/Tokyo の今日 YYYY-MM-DD（sitemap から未公開アーカイブを除く用） */
function tokyoTodayKey() {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Asia/Tokyo',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(new Date());
}

/** archiveAt が未来の号（例: vol5）を収集 */
function lockedVolumeSlugs() {
	const dir = path.resolve('./src/content/magazines');
	const today = tokyoTodayKey();
	/** @type {string[]} */
	const locked = [];
	for (const file of fs.readdirSync(dir)) {
		if (!file.endsWith('.md')) continue;
		const text = fs.readFileSync(path.join(dir, file), 'utf8');
		const volume = text.match(/^volume:\s*(.+)$/m)?.[1]?.trim();
		const archiveAt = text.match(/^archiveAt:\s*(\d{4}-\d{2}-\d{2})/m)?.[1];
		if (volume && archiveAt && today < archiveAt) locked.push(volume);
	}
	return locked;
}

const lockedVolumes = lockedVolumeSlugs();

/**
 * @param {string} pathname
 */
const excludeFromSitemap = (pathname) => {
	const normalized = pathname.replace(/\/$/, '') || '/';
	if (testPagePattern.test(normalized)) return true;
	if (normalized.endsWith('/viewer')) return true;
	// 未公開アーカイブの記事 URL は sitemap から除外（号トップは残す）
	return lockedVolumes.some(
		(volume) =>
			normalized.startsWith(`/magazines/${volume}/`) &&
			normalized !== `/magazines/${volume}`,
	);
};

// https://astro.build/config
export default defineConfig({
	site: 'https://neet-magazine.com',
	trailingSlash: 'never',
	markdown: {
		rehypePlugins: [rehypeHangingPunct],
	},
	integrations: [
		mdx({
			rehypePlugins: [rehypeHangingPunct],
		}),
		sitemap({
			filter: (page) => !excludeFromSitemap(new URL(page).pathname),
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
