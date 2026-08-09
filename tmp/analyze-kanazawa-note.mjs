import fs from 'node:fs';

const res = await fetch('https://note.com/api/v3/notes/nbf6ee49bb0b1', {
	headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
});
const json = await res.json();
const html = json.data.body;
fs.writeFileSync('tmp/kanazawa-note.html', html, 'utf8');

const ps = [...html.matchAll(/<p(\s[^>]*)?>([\s\S]*?)<\/p>/gi)];
console.log('p count', ps.length);
for (const [i, m] of ps.entries()) {
	const inner = m[2];
	const text = inner
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	if (!text) {
		console.log(i, 'EMPTY');
		continue;
	}
	const runs = [...inner.matchAll(/(?:<br\s*\/?>\s*)+/gi)].map(
		(x) => (x[0].match(/<br/gi) || []).length,
	);
	const parts = inner
		.split(/(?:<br\s*\/?>\s*)+/i)
		.map((x) => x.replace(/<[^>]+>/g, '').replace(/[　\s]+/g, ' ').trim())
		.filter(Boolean);
	console.log(
		i,
		`parts=${parts.length}`,
		`runs=[${runs.join(',')}]`,
		parts[0]?.slice(0, 28),
	);
}
