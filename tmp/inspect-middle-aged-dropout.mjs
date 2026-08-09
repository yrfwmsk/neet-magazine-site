const NOTE_ID = 'n76e08e1fed8b';
const j = await fetch(`https://note.com/api/v3/notes/${NOTE_ID}`, {
	headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
}).then((r) => r.json());
const html = j.data.body;

const figures = [...html.matchAll(/<figure[\s\S]*?<\/figure>/gi)];
console.log('figures', figures.length);
figures.forEach((m, i) => {
	const src = m[0].match(/src="([^"]+)"/);
	const w = m[0].match(/width="(\d+)"/);
	const h = m[0].match(/height="(\d+)"/);
	console.log(i + 1, w?.[1], h?.[1], src?.[1]);
});

const re = /<(figure|p|h[23]|hr)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
let m;
let i = 0;
while ((m = re.exec(html))) {
	const tag = m[1].toLowerCase();
	if (tag === 'figure' || tag === 'hr') {
		console.log(i++, tag, tag === 'figure' ? 'img' : '');
		continue;
	}
	const inner = m[3].replace(/<[^>]+>/g, '').trim().slice(0, 80);
	if (inner.includes('注') || i < 5) console.log(i++, tag, inner);
}
