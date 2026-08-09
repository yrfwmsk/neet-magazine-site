import fs from 'fs';

function parse(slide, rels) {
	const xml = fs.readFileSync(slide, 'utf8');
	const relXml = fs.readFileSync(rels, 'utf8');
	const ridToImg = {};
	for (const m of relXml.matchAll(/Id="(rId\d+)"[^>]*Target="\.\.\/media\/(image\d+\.png)"/g)) {
		ridToImg[m[1]] = m[2];
	}
	const pics = [...xml.matchAll(/<p:pic>[\s\S]*?<\/p:pic>/g)].map((m) => m[0]);
	const results = [];
	for (const pic of pics) {
		const name = pic.match(/<p:cNvPr[^>]*name="([^"]+)"/)?.[1];
		const rid = pic.match(/r:embed="(rId\d+)"/)?.[1];
		const off = pic.match(/<a:off[^>]*x="(\d+)"[^>]*y="(\d+)"/);
		const ext = pic.match(/<a:ext[^>]*cx="(\d+)"[^>]*cy="(\d+)"/);
		results.push({
			name,
			rid,
			img: ridToImg[rid],
			x: off ? +off[1] : null,
			y: off ? +off[2] : null,
			w: ext ? +ext[1] : null,
			h: ext ? +ext[2] : null,
		});
	}
	results.sort((a, b) => a.y - b.y || a.x - b.x);
	return results;
}

console.log('SLIDE1');
console.log(
	parse(
		'tmp/afterword-pptx/ppt/slides/slide1.xml',
		'tmp/afterword-pptx/ppt/slides/_rels/slide1.xml.rels',
	),
);
console.log('SLIDE2');
console.log(
	parse(
		'tmp/afterword-pptx/ppt/slides/slide2.xml',
		'tmp/afterword-pptx/ppt/slides/_rels/slide2.xml.rels',
	),
);
