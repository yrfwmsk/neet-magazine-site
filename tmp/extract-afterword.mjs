import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';

const pdfPath = process.argv[2];
const data = new Uint8Array(fs.readFileSync(pdfPath));
const doc = await getDocument({ data, useSystemFonts: true }).promise;
console.log('pages:', doc.numPages);

for (let i = 1; i <= doc.numPages; i++) {
	const page = await doc.getPage(i);
	const content = await page.getTextContent();
	const items = content.items.filter((it) => 'str' in it && it.str);
	const sorted = [...items].sort((a, b) => {
		const ay = a.transform[5],
			by = b.transform[5];
		if (Math.abs(ay - by) > 2) return by - ay;
		return a.transform[4] - b.transform[4];
	});
	const lines = [];
	let currentY = null;
	let line = '';
	let lastX = 0;
	for (const it of sorted) {
		const y = it.transform[5];
		const x = it.transform[4];
		if (currentY === null || Math.abs(y - currentY) > 4) {
			if (line) lines.push(line);
			line = it.str;
			currentY = y;
			lastX = x + (it.width || 0);
		} else {
			const gap = x - lastX;
			if (gap > 1.5) line += ' ';
			line += it.str;
			lastX = x + (it.width || 0);
		}
	}
	if (line) lines.push(line);
	console.log(`\n===== PAGE ${i} =====`);
	console.log(lines.join('\n'));
}
