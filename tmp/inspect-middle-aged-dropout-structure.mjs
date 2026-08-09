const NOTE_ID = 'n76e08e1fed8b';
const j = await fetch(`https://note.com/api/v3/notes/${NOTE_ID}`, {
	headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
}).then((r) => r.json());
const html = j.data.body;

const re = /<(figure|p|h[23]|hr)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
let m;
let i = 0;
while ((m = re.exec(html))) {
	const tag = m[1].toLowerCase();
	const inner = m[3];
	if (tag === 'figure') {
		const src = inner.match(/src="([^"]+)"/);
		const w = inner.match(/width="(\d+)"/);
		const h = inner.match(/height="(\d+)"/);
		console.log(i++, 'FIGURE', w?.[1], h?.[1], src?.[1]?.slice(-40));
		continue;
	}
	const text = inner.replace(/<[^>]+>/g, '').trim().slice(0, 70);
	if (!text || text.startsWith('特集：') || text === '中年ドロップアウトのすゝめ' || text === '久保一真') continue;
	console.log(i++, tag, text);
}
