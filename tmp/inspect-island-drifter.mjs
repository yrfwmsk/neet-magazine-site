import fs from 'node:fs';

const j = await fetch('https://note.com/api/v3/notes/n62f892a2036a', {
	headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
}).then((r) => r.json());
const html = j.data.body ?? '';
fs.writeFileSync('tmp/island-drifter-note.html', html, 'utf8');

const imgs = [...html.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/gi)];
console.log('images', imgs.length);
imgs.forEach((m, i) => console.log(i + 1, m[1]));

const bold = [...html.matchAll(/<(strong|b)>([^<]+)<\/\1>/gi)];
console.log('bold count', bold.length);
bold.forEach((m) => console.log('BOLD:', m[2]));

const h3 = [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)];
console.log('h3 count', h3.length);
h3.forEach((m) => console.log('H3:', m[1].replace(/<[^>]+>/g, '').trim()));
