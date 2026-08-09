const noteKey = process.argv[2] || 'n7a9b9418ad1a';
const res = await fetch(`https://note.com/api/v3/notes/${noteKey}`, {
	headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
});
const json = await res.json();
const body = json.data.body ?? '';
const figures = [...body.matchAll(/<figure\b[\s\S]*?<\/figure>/gi)];
console.log('figures:', figures.length);
for (const [i, f] of figures.entries()) {
	const img = f[0].match(/src="([^"]+)"/i);
	const cap = f[0].match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
	console.log(i, img?.[1] || 'no-img', cap ? cap[1].replace(/<[^>]+>/g, '').trim() : '');
}
