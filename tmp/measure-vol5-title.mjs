import WebSocket from 'ws';
import fs from 'fs';

const wsUrl = process.argv[2];
const outPath = process.argv[3] || 'c:/dev/neet-magazine-site/tmp/vol5-title-after.png';
const ws = new WebSocket(wsUrl);
let n = 0;
const send = (method, params = {}) =>
	new Promise((resolve, reject) => {
		const id = ++n;
		const onMessage = (raw) => {
			const msg = JSON.parse(raw.toString());
			if (msg.id !== id) return;
			ws.off('message', onMessage);
			if (msg.error) reject(msg.error);
			else resolve(msg.result);
		};
		ws.on('message', onMessage);
		ws.send(JSON.stringify({ id, method, params }));
	});

await new Promise((resolve, reject) => {
	ws.on('open', resolve);
	ws.on('error', reject);
});

await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', {
	width: 390,
	height: 900,
	deviceScaleFactor: 1,
	mobile: true,
});
await new Promise((r) => setTimeout(r, 1500));

await send('Runtime.evaluate', {
	expression: `(() => {
  const title = [...document.querySelectorAll('.archive-card__title')].find((el) =>
    el.textContent.includes('普通'),
  );
  const y = title.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo(0, y);
})()`,
});
await new Promise((r) => setTimeout(r, 400));

const info = await send('Runtime.evaluate', {
	returnByValue: true,
	expression: `(() => {
  const title = [...document.querySelectorAll('.archive-card__title')].find((el) =>
    el.textContent.includes('普通'),
  );
  const card = title.closest('.archive-card');
  const a = title.querySelector('a,span') || title;
  const range = document.createRange();
  range.selectNodeContents(a);
  const rects = [...range.getClientRects()];
  const lines = [];
  for (const x of rects) {
    const t = Math.round(x.top);
    let line = lines.find((l) => l.t === t);
    if (!line) {
      line = { t, l: Math.round(x.left), r: Math.round(x.right) };
      lines.push(line);
    } else {
      line.l = Math.min(line.l, Math.round(x.left));
      line.r = Math.max(line.r, Math.round(x.right));
    }
  }
  const cardLeft = Math.round(card.getBoundingClientRect().left);
  return {
    scrollY: Math.round(scrollY),
    titleTop: Math.round(title.getBoundingClientRect().top),
    cardLeft,
    lines: lines.map((l) => ({ ...l, w: l.r - l.l, delta: l.l - cardLeft })),
    text: title.textContent.trim(),
  };
})()`,
});

console.log(JSON.stringify(info.result.value, null, 2));
const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
ws.close();
