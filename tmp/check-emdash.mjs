import { chromium } from 'file:///C:/Users/pures/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 800 } });
await page.goto('http://localhost:4321/magazines/vol1/beginning', { waitUntil: 'networkidle' });

const stats = await page.evaluate(() => {
	const dashes = [...document.querySelectorAll('#article-body .emdash')];
	const fontSize = parseFloat(getComputedStyle(document.querySelector('.prose')).fontSize);
	return dashes.map((dash) => {
		const parent = dash.parentNode;
		const idx = [...parent.childNodes].indexOf(dash);
		const before = parent.childNodes[idx - 1];
		const after = parent.childNodes[idx + 1];
		const lastBefore = before?.nodeType === 3 ? before : before?.lastChild;
		const firstAfter = after?.nodeType === 3 ? after : after?.firstChild;

		function charRect(node, i) {
			const r = document.createRange();
			r.setStart(node, i);
			r.setEnd(node, i + 1);
			return r.getBoundingClientRect();
		}
		const prevCh = lastBefore?.nodeType === 3 ? lastBefore.data.at(-1) : '';
		const nextCh = firstAfter?.nodeType === 3 ? firstAfter.data[0] : firstAfter?.parentElement?.textContent?.[0];
		const prevRect = lastBefore?.nodeType === 3 ? charRect(lastBefore, lastBefore.length - 1) : null;
		const nextRect =
			firstAfter?.nodeType === 3
				? charRect(firstAfter, 0)
				: after?.nodeType === 1
					? after.getBoundingClientRect()
					: null;
		const dashRect = dash.getBoundingClientRect();
		const inner = dash.firstChild;
		const firstInk = inner ? charRect(inner, 0) : dashRect;
		const lastInk = inner && inner.length > 1 ? charRect(inner, inner.length - 1) : dashRect;
		return {
			text: dash.textContent,
			prevCh,
			nextCh,
			gapLeftEm: prevRect ? (firstInk.left - prevRect.right) / fontSize : null,
			gapRightEm: nextRect ? (nextRect.left - lastInk.right) / fontSize : null,
			boxLeftEm: prevRect ? (dashRect.left - prevRect.right) / fontSize : null,
			boxRightEm: nextRect ? (nextRect.left - dashRect.right) / fontSize : null,
			inkInBoxLeft: (firstInk.left - dashRect.left) / fontSize,
			inkInBoxRight: (dashRect.right - lastInk.right) / fontSize,
		};
	});
});
console.log(JSON.stringify(stats, null, 2));
await browser.close();
