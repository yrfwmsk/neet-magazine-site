import fs from 'node:fs';

const html = fs.readFileSync('tmp/island-drifter-note.html', 'utf8');
const re = /<(h[23]|p|figure)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
let m;
let i = 0;
while ((m = re.exec(html))) {
	const tag = m[1].toLowerCase();
	const inner = m[3];
	if (tag === 'figure') {
		const img = inner.match(/src="([^"]+)"/);
		const w = inner.match(/width="(\d+)"/);
		const h = inner.match(/height="(\d+)"/);
		if (img && !inner.includes('この記事は、')) {
			console.log(i++, 'FIGURE', img[1].slice(-40), w?.[1], h?.[1]);
		}
		continue;
	}
	const text = inner
		.replace(/<br\s*\/?>/gi, ' / ')
		.replace(/<[^>]+>/g, '')
		.replace(/^\s+/, '')
		.trim()
		.slice(0, 70);
	if (!text || text.startsWith('特集：') || text === 'ろっさん' || text === '離島に流れ着いた元ニートの漂泊記') continue;
	console.log(i++, tag.toUpperCase(), text);
}
