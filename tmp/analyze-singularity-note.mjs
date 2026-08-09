import fs from 'node:fs';

const res = await fetch('https://note.com/api/v3/notes/n197dde2ff8eb', {
	headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
});
const json = await res.json();
const html = json.data.body;
fs.writeFileSync('tmp/singularity-note.html', html, 'utf8');

const ps = [...html.matchAll(/<p(\s[^>]*)?>([\s\S]*?)<\/p>/gi)];
console.log('p count', ps.length);
for (const [i, m] of ps.entries()) {
	const inner = m[2];
	const brs = (inner.match(/<br/gi) || []).length;
	const text = inner
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	if (!text && brs === 0) {
		console.log(i, 'EMPTY-P');
		continue;
	}
	if (!text) {
		console.log(i, 'BR-ONLY', `brs=${brs}`);
		continue;
	}
	const hasBrBr = /(?:<br\s*\/?>\s*){2,}/i.test(inner);
	const parts = inner
		.split(/(?:<br\s*\/?>\s*)+/i)
		.map((x) => x.replace(/<[^>]+>/g, '').trim())
		.filter(Boolean);
	console.log(i, `brs=${brs}`, hasBrBr ? 'BRBR' : '', `parts=${parts.length}`, text.slice(0, 42));
	if (hasBrBr || brs >= 2) {
		// show which breaks are double
		const runs = [...inner.matchAll(/(?:<br\s*\/?>\s*)+/gi)].map(
			(x) => (x[0].match(/<br/gi) || []).length,
		);
		console.log('   runs', runs.join(','));
	}
}
