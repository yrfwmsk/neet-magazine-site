import { chromium } from 'file:///C:/Users/pures/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

const url = 'http://localhost:4321/magazines/vol1/beginning';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

const result = await page.evaluate(() => {
	const fontSize = parseFloat(getComputedStyle(document.querySelector('.prose')).fontSize);
	const FULLWIDTH = /[\u3040-\u3096\u30A0-\u30FF\u4E00-\u9FFF]/;
	const isTrackable = (ch) => FULLWIDTH.test(ch) && !/[、。「」『』（）]/.test(ch);
	const lines = [];
	for (const p of document.querySelectorAll('.prose > p')) {
		if ((p.textContent || '').replace(/\s/g, '').length < 24) continue;
		const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
		const chars = [];
		while (walker.nextNode()) {
			const n = walker.currentNode;
			for (let i = 0; i < n.length; i++) {
				if (/\s/.test(n.data[i])) continue;
				const range = document.createRange();
				range.setStart(n, i);
				range.setEnd(n, i + 1);
				const r = range.getBoundingClientRect();
				if (!r.width && !r.height) continue;
				chars.push({ ch: n.data[i], left: r.left, top: r.top, right: r.right });
			}
		}
		const lineTol = fontSize * 0.35;
		let cur = [];
		let lineTop = chars[0]?.top ?? 0;
		const push = () => {
			if (cur.length < 12) return;
			const advs = [];
			for (let i = 1; i < cur.length; i++) {
				const a = cur[i - 1];
				const b = cur[i];
				if (!isTrackable(a.ch) || !isTrackable(b.ch)) continue;
				const adv = (b.left - a.left) / fontSize;
				if (adv >= 0.5 && adv <= 2) advs.push(adv);
			}
			if (!advs.length) return;
			const avg = advs.reduce((x, y) => x + y, 0) / advs.length;
			const max = Math.max(...advs);
			lines.push({
				text: cur.map((c) => c.ch).join(''),
				n: cur.length,
				avg: Number(avg.toFixed(3)),
				max: Number(max.toFixed(3)),
				ls: getComputedStyle(p).letterSpacing,
			});
		};
		for (const c of chars) {
			if (cur.length && Math.abs(c.top - lineTop) > lineTol) {
				push();
				cur = [];
				lineTop = c.top;
			}
			cur.push(c);
		}
		// skip last line of paragraph
	}
	lines.sort((a, b) => b.avg - a.avg);
	const avgs = lines.map((l) => l.avg).sort((a, b) => a - b);
	return {
		lineCount: lines.length,
		median: avgs[Math.floor(avgs.length / 2)],
		p90: avgs[Math.floor(avgs.length * 0.9)],
		stretched: lines.filter((l) => l.avg > 1.06).length,
		top: lines.slice(0, 8),
	};
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
