/**
 * note → MDX（frontmatter維持）
 * Usage: node scripts/rebuild-vol3-body.mjs <slug> <noteKey>
 */
import fs from 'node:fs';
import path from 'node:path';
import { noteHtmlToBlocks, blocksToMdxBody, fixBoldSpaces } from './note-to-mdx-body.mjs';

const slug = process.argv[2];
const noteKey = process.argv[3];
if (!slug || !noteKey) {
	console.error('Usage: node scripts/rebuild-vol3-body.mjs <slug> <noteKey>');
	process.exit(1);
}

const mdxPath = path.join('src/content/articles/vol3', `${slug}.mdx`);
const existing = fs.readFileSync(mdxPath, 'utf8');
const fmMatch = existing.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
if (!fmMatch) throw new Error('frontmatter missing: ' + mdxPath);

const res = await fetch(`https://note.com/api/v3/notes/${noteKey}`, {
	headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
});
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const json = await res.json();
const blocks = noteHtmlToBlocks(json.data.body ?? '', json.data.name ?? '');
const body = fixBoldSpaces(blocksToMdxBody(blocks));

fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync(`tmp/${slug}-body.md`, body, 'utf8');
fs.writeFileSync(mdxPath, `${fmMatch[0]}\n${body}`, 'utf8');

const gaps = blocks.filter((b) => b.kind === 'gap').length;
const diamonds = blocks.filter((b) => b.kind === 'diamond').length;
const headings = blocks.filter((b) => b.kind === 'heading').length;
const paras = blocks.filter((b) => b.kind === 'para').length;
const quotes = blocks.filter((b) => b.kind === 'quote').length;
console.log(`OK ${slug} ← ${noteKey} (${json.data.name})`);
console.log(`  blocks: para=${paras} heading=${headings} ◆=${diamonds} gap=${gaps} quote=${quotes}`);
console.log(`  body chars: ${[...body].length}`);
