import fs from 'node:fs';
import path from 'node:path';
import { cleanText, stripLeadingChrome, isChromeHeading } from '../scripts/note-to-mdx-body.mjs';

const NOTE_ID = 'n62f892a2036a';
const SLUG = 'island-drifter';
const mdxPath = 'src/content/articles/vol4/island-drifter.mdx';
const outDir = 'public/articles/vol4';

function readFrontmatter(filePath) {
	const raw = fs.readFileSync(filePath, 'utf8');
	const end = raw.indexOf('---', 3);
	return `${raw.slice(0, end + 3)}\n`;
}

function headingHtml(inner) {
	const html = inner
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/<br\s*\/?>/gi, '<br />')
		.replace(/^[　\s]+/gm, '')
		.replace(/<(?!\/?br\s*\/?>)[^>]+>/gi, '')
		.trim();
	return `<h2>${html}</h2>`;
}

function endsSentence(text) {
	return /[。！？」』…]$/.test(text.trim());
}

function shouldMergeParas(prev, next) {
	if (!prev || !next) return false;
	if (endsSentence(prev)) return false;
	if (/^[-─「『（【<]/.test(next.trim())) return false;
	if (/^### |^## |^<h2/.test(next.trim())) return false;
	return true;
}

function parseNoteHtml(html, noteTitle) {
	let body = stripLeadingChrome(html, noteTitle);
	body = body.replace(/<figure\b[\s\S]*?<\/figure>/gi, (fig) => {
		if (fig.includes('この記事は、') || fig.includes('この作品は、')) return '';
		return fig;
	});

	const blocks = [];
	const re = /<(h[23]|p|figure)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
	let m;

	while ((m = re.exec(body))) {
		const tag = m[1].toLowerCase();
		const attrs = m[2] || '';
		const inner = m[3];

		if (tag === 'h2' || tag === 'h3') {
			if (isChromeHeading(inner, attrs, noteTitle)) continue;
			blocks.push({ kind: 'scene-heading', html: headingHtml(inner) });
			continue;
		}

		if (tag === 'figure') {
			const img = inner.match(/<img[^>]+src="([^"]+)"[^>]*width="(\d+)"[^>]*height="(\d+)"/i);
			if (img) blocks.push({ kind: 'image', src: img[1], width: img[2], height: img[3] });
			continue;
		}

		const textOnly = inner
			.replace(/<br\s*\/?>/gi, '')
			.replace(/<[^>]+>/g, '')
			.replace(/&nbsp;/g, ' ')
			.replace(/[　\s]+/g, '');
		if (!textOnly) {
			blocks.push({ kind: 'gap' });
			continue;
		}

		const parts = inner.split(/(?:<br\s*\/?>\s*)+/i);
		const brRuns = [...inner.matchAll(/(?:<br\s*\/?>\s*)+/gi)].map(
			(x) => (x[0].match(/<br/gi) || []).length,
		);

		if (blocks.length && blocks[blocks.length - 1].kind !== 'gap') {
			const last = blocks[blocks.length - 1];
			if (last.kind !== 'scene-heading' && last.kind !== 'image') {
				blocks.push({ kind: 'gap' });
			}
		}

		for (let i = 0; i < parts.length; i++) {
			const t = cleanText(parts[i]);
			if (!t) continue;
			blocks.push({ kind: 'para', text: t });
			if (brRuns[i] >= 2) blocks.push({ kind: 'gap' });
		}
	}

	// merge orphan paragraph fragments
	const merged = [];
	for (const item of blocks) {
		if (item.kind !== 'para') {
			merged.push(item);
			continue;
		}
		const prev = merged[merged.length - 1];
		if (prev?.kind === 'para' && shouldMergeParas(prev.text, item.text)) {
			prev.text += item.text;
			continue;
		}
		merged.push({ ...item });
	}

	// drop gap before scene-heading / image / at start
	const out = [];
	for (let i = 0; i < merged.length; i++) {
		const item = merged[i];
		if (item.kind === 'gap') {
			const prev = out[out.length - 1];
			const next = merged[i + 1];
			if (!prev || prev.kind === 'gap') continue;
			if (next?.kind === 'scene-heading' || next?.kind === 'image') continue;
			out.push(item);
			continue;
		}
		if (item.kind === 'scene-heading' || item.kind === 'image') {
			if (out[out.length - 1]?.kind === 'gap') out.pop();
			out.push(item);
			continue;
		}
		out.push(item);
	}
	while (out.length && out[out.length - 1].kind === 'gap') out.pop();
	return out;
}

function blocksToMdx(blocks, imageFiles) {
	const lines = [];
	let imgIdx = 0;
	for (const item of blocks) {
		if (item.kind === 'para') {
			lines.push(item.text, '');
		} else if (item.kind === 'scene-heading') {
			lines.push(item.html, '');
		} else if (item.kind === 'image') {
			imgIdx += 1;
			const file = imageFiles[imgIdx - 1];
			lines.push(
				`<img src="/articles/vol4/${file}" alt="離島に流れ着いた元ニートの漂泊記 写真${imgIdx}" width="${item.width}" height="${item.height}" />`,
				'',
			);
		} else if (item.kind === 'gap') {
			lines.push('<p class="section-break"></p>', '');
		}
	}
	return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

const json = await fetch(`https://note.com/api/v3/notes/${NOTE_ID}`, {
	headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
}).then((r) => r.json());

const blocks = parseNoteHtml(json.data.body ?? '', json.data.name ?? '');
const images = blocks.filter((b) => b.kind === 'image');

fs.mkdirSync(outDir, { recursive: true });
const imageFiles = [];
for (let i = 0; i < images.length; i++) {
	const ext = images[i].src.includes('.jpg') ? 'jpg' : 'png';
	const file = `${SLUG}-${String(i + 1).padStart(2, '0')}.${ext}`;
	const buf = Buffer.from(await fetch(images[i].src).then((r) => r.arrayBuffer()));
	fs.writeFileSync(path.join(outDir, file), buf);
	imageFiles.push(file);
	console.log('saved', file);
}

const body = blocksToMdx(blocks, imageFiles);
fs.writeFileSync(mdxPath, `${readFrontmatter(mdxPath)}${body}\n`, 'utf8');
console.log('wrote', mdxPath, 'blocks', blocks.length, 'images', images.length, 'chars', body.length);
