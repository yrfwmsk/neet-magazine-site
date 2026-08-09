import fs from 'node:fs';

const key = process.argv[2];
if (!key) {
	console.error('Usage: node scripts/inspect-note.mjs <noteKey>');
	process.exit(1);
}

const res = await fetch(`https://note.com/api/v3/notes/${key}`, {
	headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
});
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const json = await res.json();
const html = json.data.body ?? '';
fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync(`tmp/${key}.html`, html, 'utf8');

console.log('title:', json.data.name);
console.log('len:', html.length);
console.log('p:', (html.match(/<p[\s>]/g) || []).length);
console.log('br runs >=2:', (html.match(/(?:<br\s*\/?>\s*){2,}/gi) || []).length);
console.log('h2/h3:', (html.match(/<h[23]/g) || []).length);
console.log('◆:', (html.match(/◆/g) || []).length);
console.log('--- headings ---');
for (const m of html.matchAll(/<(h[23])[^>]*>([\s\S]*?)<\/\1>/gi)) {
	const t = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
	console.log(m[1], t.slice(0, 80));
}
console.log('--- sample ---');
console.log(html.slice(0, 1000));
