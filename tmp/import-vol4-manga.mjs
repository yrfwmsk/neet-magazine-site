import fs from 'node:fs';
import path from 'node:path';

const manga = [
	{ slug: 'po', noteId: 'n399d118dad58', title: 'ポ' },
	{ slug: 'blond-hair', noteId: 'n66e6bd58df5c', title: '金髪' },
];
const outDir = 'public/articles/vol4';
fs.mkdirSync(outDir, { recursive: true });

for (const item of manga) {
	const j = await fetch(`https://note.com/api/v3/notes/${item.noteId}`, {
		headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
	}).then((r) => r.json());
	const html = j.data.body ?? '';
	const imgs = [...html.matchAll(/<img[^>]+src="([^"]+)"[^>]*width="(\d+)"[^>]*height="(\d+)"/gi)];
	const lines = ['<div class="manga-pages">', ''];
	let n = 0;
	for (const m of imgs) {
		n += 1;
		const fname = `${item.slug}-${String(n).padStart(2, '0')}.png`;
		const buf = Buffer.from(await fetch(m[1]).then((r) => r.arrayBuffer()));
		fs.writeFileSync(path.join(outDir, fname), buf);
		lines.push(
			`<img src="/articles/vol4/${fname}" alt="${item.title} ${n}ページ目" width="${m[2]}" height="${m[3]}" />`,
			'',
		);
	}
	lines.push('</div>');
	const mdxPath = `src/content/articles/vol4/${item.slug}.mdx`;
	const raw = fs.readFileSync(mdxPath, 'utf8');
	const fmEnd = raw.indexOf('---', 3);
	const fm = `${raw.slice(0, fmEnd + 3)}\n`;
	fs.writeFileSync(mdxPath, `${fm}\n${lines.join('\n')}\n`, 'utf8');
	console.log(`wrote ${mdxPath} (${n} images)`);
}
