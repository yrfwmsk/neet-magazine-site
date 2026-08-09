import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	blocksToMdxBody,
	fixBoldSpaces,
	noteHtmlToBlocks,
} from '../scripts/note-to-mdx-body.mjs';

const articlesDir = fileURLToPath(new URL('../src/content/articles/vol4/', import.meta.url));

const imports = [
	{ file: 'unmanageable-life.mdx', noteId: 'n6123b347fc54' },
	{ file: 'living-is-hard.mdx', noteId: 'n2010edadeaba' },
	{ file: 'island-drifter.mdx', noteId: 'n62f892a2036a' },
	{ file: 'labor-society-lifehacks.mdx', noteId: 'n9ccb074e2f2d' },
	{ file: 'neet-company-retrospective.mdx', noteId: 'n2ef3a32393c7' },
	{ file: 'po.mdx', noteId: 'n399d118dad58' },
	{ file: 'shijimi-study.mdx', noteId: 'nae83b1a9fa79' },
	{ file: 'cannot-compromise.mdx', noteId: 'n5d73591c5793' },
	{ file: 'middle-aged-dropout.mdx', noteId: 'n76e08e1fed8b' },
	{ file: 'unemployed-life-dictionary.mdx', noteId: 'n23206c42bacc' },
	{ file: 'jojo-golden-wind.mdx', noteId: 'n89e4ba90d2b3' },
	{ file: 'blond-hair.mdx', noteId: 'n66e6bd58df5c' },
	{ file: 'okinawa.mdx', noteId: 'n6011c3864f31' },
];

function readFrontmatter(filePath) {
	const raw = fs.readFileSync(filePath, 'utf8');
	const end = raw.indexOf('---', 3);
	if (end < 0) throw new Error(`invalid frontmatter: ${filePath}`);
	return `${raw.slice(0, end + 3)}\n`;
}

/** 冒頭の太字連打 + 末尾1行を quote-stack に（有償ボランティア型） */
function fixOpeningQuoteStack(body) {
	const m = body.match(
		/^((?:\*\*[^*\n]+\*\*\n\n)+)<ul class="dot-list">\n\t<li>\*\*([^*]+)\*\*<\/li>\n<\/ul>/,
	);
	if (!m) return body;
	const lines = m[1]
		.trim()
		.split(/\n\n/)
		.map((line) => {
			const text = line.replace(/^\*\*|\*\*$/g, '');
			return `\t<p><strong>${text}</strong></p>`;
		});
	lines.push(`\t<p><strong>${m[2]}</strong></p>`);
	const stack = `<div class="quote-stack">\n${lines.join('\n')}\n</div>`;
	return body.replace(m[0], stack);
}

/** dot-list 1項目見出し（・付き）→ dot-section */
function fixDotSectionHeadings(body) {
	return body.replace(
		/<ul class="dot-list">\n\t<li>\*\*(・[^*]+)\*\*<\/li>\n<\/ul>\n\n([\s\S]*?)(?=\n\n<p class="section-break"><\/p>|\n\n<ul class="dot-list">|\n\n## ■|$)/g,
		(_all, title, rest) => {
			const paras = rest.trim();
			return `<div class="dot-section">\n\n<p class="dot-section__title"><strong>${title.slice(1)}</strong></p>\n\n${paras}\n\n</div>`;
		},
	);
}

function postProcess(body) {
	let out = body.replace(/^### ■/gm, '## ■');
	out = fixOpeningQuoteStack(out);
	out = fixDotSectionHeadings(out);
	return out.replace(/\n{3,}/g, '\n\n').trim();
}

for (const item of imports) {
	const filePath = path.join(articlesDir, item.file);
	const res = await fetch(`https://note.com/api/v3/notes/${item.noteId}`, {
		headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
	});
	if (!res.ok) throw new Error(`${item.file}: HTTP ${res.status}`);
	const json = await res.json();
	const blocks = noteHtmlToBlocks(json.data.body ?? '', json.data.name ?? '');
	const body = postProcess(fixBoldSpaces(blocksToMdxBody(blocks)));
	const breaks = (body.match(/section-break/g) || []).length;
	const headings = (body.match(/^## ■/gm) || []).length;
	fs.writeFileSync(filePath, `${readFrontmatter(filePath)}${body}\n`, 'utf8');
	console.log(
		`${item.file}: ${blocks.length} blocks, ${body.length} chars, ## ■ ${headings}, break ${breaks}`,
	);
}
