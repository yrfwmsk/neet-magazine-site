import WebSocket from 'ws';
import fs from 'fs';

const wsUrl = process.argv[2];
const width = Number(process.argv[3] || 375);
const outPath = process.argv[4] || 'c:/dev/neet-magazine-site/tmp/vol5-se.png';
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
	width,
	height: 667,
	deviceScaleFactor: 2,
	mobile: true,
});
await send('Page.reload', { ignoreCache: true });
await new Promise((r) => setTimeout(r, 2000));

await send('Runtime.evaluate', {
	expression: `(() => {
  const title = [...document.querySelectorAll('.archive-card__title')].find((el) =>
    el.textContent.includes('普通'),
  );
  const y = title.getBoundingClientRect().top + window.scrollY - 60;
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
  const body = card.querySelector('.archive-card__body');
  const eye = card.querySelector('.archive-card__eyebrows, .eyebrow');
  const meta = card.querySelector('.archive-card__meta');
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
  const cardRect = card.getBoundingClientRect();
  const bodyRect = body.getBoundingClientRect();
  const eyeRect = eye?.getBoundingClientRect();
  const metaRect = meta?.getBoundingClientRect();
  const tcs = getComputedStyle(title);
  const acs = getComputedStyle(a);
  // Compare border box of card vs text
  return {
    vw: innerWidth,
    dpr: devicePixelRatio,
    card: { l: Math.round(cardRect.left), r: Math.round(cardRect.right), w: Math.round(cardRect.width) },
    body: { l: Math.round(bodyRect.left) },
    eye: eyeRect ? { l: Math.round(eyeRect.left), text: eye.textContent.trim() } : null,
    meta: metaRect ? { l: Math.round(metaRect.left), text: meta.textContent.trim() } : null,
    titleBox: {
      l: Math.round(title.getBoundingClientRect().left),
      marginLeft: tcs.marginLeft,
      paddingLeft: tcs.paddingLeft,
      textIndent: tcs.textIndent,
      overflow: tcs.overflow,
      display: tcs.display,
    },
    anchor: {
      display: acs.display,
      textIndent: acs.textIndent,
      marginLeft: acs.marginLeft,
      paddingLeft: acs.paddingLeft,
      l: Math.round(a.getBoundingClientRect().left),
    },
    lines: lines.map((l) => ({
      ...l,
      w: l.r - l.l,
      vsCard: l.l - Math.round(cardRect.left),
      vsBody: l.l - Math.round(bodyRect.left),
      vsEye: eyeRect ? l.l - Math.round(eyeRect.left) : null,
    })),
    html: title.outerHTML.slice(0, 280),
  };
})()`,
});

console.log(JSON.stringify(info.result.value, null, 2));

const titleTop = info.result.value.lines?.[0]?.t ?? 100;
const shot = await send('Page.captureScreenshot', {
	format: 'png',
	clip: {
		x: 0,
		y: Math.max(0, titleTop - 50),
		width,
		height: 160,
		scale: 2,
	},
});
fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));

const full = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(outPath.replace(/\.png$/, '-full.png'), Buffer.from(full.data, 'base64'));
ws.close();
