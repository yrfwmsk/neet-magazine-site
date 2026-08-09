import { readdir, readFile, writeFile } from 'node:fs/promises';

const issueDate = '2025-11-23';
const issuePath = new URL('../src/content/magazines/vol4.md', import.meta.url);
const articlesDir = new URL('../src/content/articles/vol4/', import.meta.url);

const imports = [
	{
		file: 'mountain-neet.mdx',
		noteId: 'nac3bdf9506c6',
		startsWith: '１',
	},
	{
		file: 'work-and-life.mdx',
		noteId: 'ne0c62ad74b49',
		startsWith: '■ 今の自分の仕事と生活',
		title: '僕にとっての「働きたくない、でも生活はある。」',
	},
	{
		file: 'moving-lyricism.mdx',
		noteId: 'n2fd040f81d84',
		startsWith: '「この辺は坂が多いんです。',
	},
	{
		file: 'cyclops-butt.mdx',
		noteId: 'nde1b642d96ef',
		startsWith: '家の周辺に「尻毛橋」という橋があり',
	},
	{
		file: 'unemployed-life-fragments.mdx',
		noteId: 'na3c2ad3bf66b',
		startsWith: '「働きたくない人」の生活って、',
	},
];

function decodeHtml(value) {
	return value
		.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
		.replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&apos;/g, "'");
}

function inlineMarkdown(html) {
	const markdown = html
		.replace(/<br\s*\/?>/gi, '\u0000')
		.replace(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
		.replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, '**$2**')
		.replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, '*$2*')
		.replace(/<rt\b[^>]*>[\s\S]*?<\/rt>/gi, '')
		.replace(/<rp\b[^>]*>[\s\S]*?<\/rp>/gi, '')
		.replace(/<[^>]+>/g, '');
	return decodeHtml(markdown).replaceAll('\u0000', '<br />\n').trim();
}

function extractBlocks(html) {
	const blocks = [];
	const pattern = /<(p|h2|h3|blockquote)\b[^>]*\bname="[0-9a-f-]{36}"[^>]*>([\s\S]*?)<\/\1>/gi;
	for (const match of html.matchAll(pattern)) {
		const text = inlineMarkdown(match[2]);
		if (text.replaceAll('<br />', '').trim()) {
			blocks.push({ tag: match[1].toLowerCase(), text });
		}
	}
	return blocks;
}

function toMarkdown(block) {
	if (block.tag === 'h2') return `## ${block.text}`;
	if (block.tag === 'h3') return `### ${block.text}`;
	if (block.tag === 'blockquote') {
		return block.text
			.split('\n')
			.map((line) => `> ${line}`)
			.join('\n');
	}
	return block.text;
}

function replaceFrontmatterValue(source, key, value) {
	const pattern = new RegExp(`^${key}:.*$`, 'm');
	if (!pattern.test(source)) throw new Error(`${key} is missing from frontmatter`);
	return source.replace(pattern, `${key}: ${value}`);
}

async function importArticle(config) {
	const response = await fetch(`https://note.com/neetmagazine/n/${config.noteId}`);
	if (!response.ok) throw new Error(`${config.noteId}: HTTP ${response.status}`);

	const html = await response.text();
	const blocks = extractBlocks(html);
	const start = blocks.findIndex(({ text }) => text.replaceAll('*', '').trimStart().startsWith(config.startsWith));
	if (start < 0) throw new Error(`${config.noteId}: article start was not found`);

	const end = blocks.findIndex(
		({ text }, index) => index > start && text.startsWith('この記事は、2025年11月23日刊行の'),
	);
	if (end < 0) throw new Error(`${config.noteId}: article end was not found`);

	const body = blocks.slice(start, end).map(toMarkdown).join('\n\n');
	if (body.length < 500) throw new Error(`${config.noteId}: extracted body is unexpectedly short`);

	const path = new URL(config.file, articlesDir);
	const current = await readFile(path, 'utf8');
	const frontmatterEnd = current.indexOf('---', 3);
	if (frontmatterEnd < 0) throw new Error(`${config.file}: invalid frontmatter`);

	let frontmatter = current.slice(0, frontmatterEnd + 3);
	frontmatter = replaceFrontmatterValue(frontmatter, 'publishedAt', issueDate);
	if (config.title) frontmatter = replaceFrontmatterValue(frontmatter, 'title', config.title);

	await writeFile(path, `${frontmatter}\n\n${body}\n`, 'utf8');
	console.log(`${config.file}: ${blocks.slice(start, end).length} blocks, ${body.length} characters`);
}

const issue = await readFile(issuePath, 'utf8');
await writeFile(issuePath, replaceFrontmatterValue(issue, 'publishedAt', issueDate), 'utf8');

for (const file of await readdir(articlesDir)) {
	if (!file.endsWith('.mdx')) continue;
	const path = new URL(file, articlesDir);
	const article = await readFile(path, 'utf8');
	await writeFile(path, replaceFrontmatterValue(article, 'publishedAt', issueDate), 'utf8');
}

for (const config of imports) {
	await importArticle(config);
}
