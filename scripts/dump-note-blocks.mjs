/**
 * note HTML のブロック構造を詳細ダンプ（スペース判定用）
 * Usage: node scripts/dump-note-blocks.mjs <noteKey>
 */
import fs from 'node:fs';

const key = process.argv[2];
const res = await fetch(`https://note.com/api/v3/notes/${key}`, {
	headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
});
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const json = await res.json();
let html = json.data.body ?? '';

// strip leading chrome headings
html = html.replace(/^(?:\s*<(?:h2|h3)[^>]*>[\s\S]*?<\/(?:h2|h3)>)+/i, '');
html = html.replace(/<figure\b[\s\S]*?<\/figure>/gi, (fig) =>
	fig.includes('この記事は、') ? '' : '[FIGURE]',
);

const re = /<(h[23]|p|blockquote|figure|hr)(\s[^>]*)?>([\s\S]*?)<\/\1>|<hr[^>]*>/gi;
let i = 0;
let m;
const rows = [];
while ((m = re.exec(html))) {
	const tag = (m[1] || 'hr').toLowerCase();
	const attrs = m[2] || '';
	const inner = m[3] || '';
	const brCount = (inner.match(/<br\s*\/?>/gi) || []).length;
	const brRuns = [...inner.matchAll(/(?:<br\s*\/?>\s*)+/gi)].map(
		(x) => (x[0].match(/<br/gi) || []).length,
	);
	const maxBrRun = brRuns.length ? Math.max(...brRuns) : 0;
	const text = inner
		.replace(/<br\s*\/?>/gi, '↵')
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/[　]/g, '＿')
		.replace(/\s+/g, ' ')
		.trim();
	const align = /text-align:\s*([^;"']+)/i.exec(attrs)?.[1] || '';
	const empty = !text || text === '↵' || /^↵+$/.test(text);
	rows.push({
		i: i++,
		tag,
		align,
		empty,
		br: brCount,
		maxBrRun,
		len: [...text.replace(/↵/g, '')].length,
		preview: text.slice(0, 60),
	});
}

console.log('title:', json.data.name);
console.log('blocks:', rows.length);
console.log('empty p:', rows.filter((r) => r.tag === 'p' && r.empty).length);
console.log('p with maxBrRun>=2:', rows.filter((r) => r.maxBrRun >= 2).length);
console.log('content p:', rows.filter((r) => r.tag === 'p' && !r.empty).length);
console.log('---');
for (const r of rows) {
	const flags = [
		r.empty ? 'EMPTY' : '',
		r.maxBrRun >= 2 ? `BRRUN${r.maxBrRun}` : '',
		r.align ? `align=${r.align}` : '',
	]
		.filter(Boolean)
		.join(' ');
	console.log(
		String(r.i).padStart(3),
		r.tag.padEnd(10),
		`br=${String(r.br).padStart(2)}`,
		`len=${String(r.len).padStart(4)}`,
		flags.padEnd(22),
		r.preview,
	);
}

fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync(`tmp/${key}-blocks.json`, JSON.stringify(rows, null, 2), 'utf8');
