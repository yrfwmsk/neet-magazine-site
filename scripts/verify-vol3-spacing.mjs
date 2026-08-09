import fs from 'node:fs';
import { noteHtmlToBlocks } from './note-to-mdx-body.mjs';

const articles = [
	['singularity', 'n197dde2ff8eb'],
	['antiwork-dialogue', 'nf6aac6a1b8e1'],
	['association', 'n5f205b159545'],
	['bonbai', 'nfd82fb3ab8ef'],
	['escape', 'n106b81d1ee8f'],
	['z-generation', 'n2da5ff4fb58d'],
	['hakoniwa', 'n12b69f592149'],
	['new-world', 'n6adcced8effd'],
	['business-neet', 'n0d9ee807b9a5'],
	['kanazawa', 'nbf6ee49bb0b1'],
	['letters', 'n99d8d80696fe'],
];

const authors = new Set([
	'ゆるふわ無職',
	'安眠計画',
	'白﨑',
	'ろっさん',
	'久保一真',
	'逸民シライ',
	'コソウ',
	'下宿人',
	'レモン',
	'神長恒一',
	'だめライフ東京',
]);

for (const [slug, key] of articles) {
	const j = await (
		await fetch(`https://note.com/api/v3/notes/${key}`, {
			headers: { Accept: 'application/json' },
		})
	).json();
	const html = j.data.body || '';
	const brbr = (html.match(/(?:<br\s*\/?>\s*){2,}/gi) || []).length;
	const hrs = (html.match(/<hr\b/gi) || []).length;
	let empty = 0;
	for (const m of html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
		const t = m[1]
			.replace(/<br\s*\/?>/gi, '')
			.replace(/<[^>]+>/g, '')
			.replace(/&nbsp;/g, '')
			.replace(/[　\s]/g, '');
		if (!t) empty++;
	}
	const blocks = noteHtmlToBlocks(html, j.data.name || '');
	const gaps = blocks.filter((b) => b.kind === 'gap');
	const mdx = fs.readFileSync(`src/content/articles/vol3/${slug}.mdx`, 'utf8');
	const mdxGaps = (mdx.match(/section-break/g) || []).length;
	const mdxMarks = (mdx.match(/section-mark/g) || []).length;
	const mdxHeads = (mdx.match(/^#{2,3} /gm) || []).length;
	const diamonds = (html.match(/◆/g) || []).length;
	const bareTitle = (j.data.name || '').replace(/\/[^/]*$/, '').trim();
	const noteBodyHeads = [...html.matchAll(/<(h[23])[^>]*>([\s\S]*?)<\/\1>/gi)]
		.map((m) => m[2].replace(/<[^>]+>/g, '').trim())
		.filter((t) => !/^特集/.test(t) && !authors.has(t) && t !== bareTitle);

	const okGap = mdxGaps === gaps.length;
	const okMark = mdxMarks === blocks.filter((b) => b.kind === 'diamond').length;
	const okHead = mdxHeads === blocks.filter((b) => b.kind === 'heading').length;
	console.log(
		slug.padEnd(20),
		`note{brbr=${brbr},hr=${hrs},emptyP=${empty},◆=${diamonds},bodyH=${noteBodyHeads.length}}`,
		`mdx{gap=${mdxGaps},◆=${mdxMarks},h=${mdxHeads}}`,
		`expectH=${noteBodyHeads.length}`,
		okGap && okMark && okHead && mdxHeads === noteBodyHeads.length ? 'OK' : 'CHECK',
		gaps.map((g) => g.from).join(',') || '-',
	);
	if (mdxHeads !== noteBodyHeads.length) {
		console.log('  noteH:', noteBodyHeads);
		console.log(
			'  mdxH:',
			[...mdx.matchAll(/^#{2,3} (.+)/gm)].map((m) => m[1]),
		);
	}
}
