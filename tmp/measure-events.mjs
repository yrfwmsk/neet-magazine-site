import WebSocket from 'ws';
import fs from 'fs';

const wsUrl = process.argv[2];
if (!wsUrl) {
	console.error('usage: node measure-events.mjs <wsUrl>');
	process.exit(1);
}

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
await new Promise((r) => setTimeout(r, 800));

const evaluated = await send('Runtime.evaluate', {
	returnByValue: true,
	expression: `(() => {
  const as = [...document.querySelectorAll('.archive-card__title a')];
  const pick = (s) => as.find((a) => a.textContent.includes(s));
  const info = (a) => {
    if (!a) return null;
    const r = document.createRange();
    r.selectNodeContents(a);
    const rects = [...r.getClientRects()].map((x) => ({
      t: Math.round(x.top),
      l: Math.round(x.left),
      w: Math.round(x.width),
      b: Math.round(x.bottom),
    }));
    const cs = getComputedStyle(a);
    const parent = a.parentElement;
    const pcs = getComputedStyle(parent);
    return {
      text: a.textContent,
      lines: [...new Set(rects.map((x) => x.t))].length,
      rects,
      clientW: a.clientWidth,
      scrollW: a.scrollWidth,
      clipped: a.scrollWidth > a.clientWidth + 1,
      wordBreak: cs.wordBreak,
      overflowWrap: cs.overflowWrap,
      textWrap: cs.textWrap,
      parentOverflow: pcs.overflow,
      parentWidth: parent.clientWidth,
      parentFlex: pcs.flex,
    };
  };
  const vol4 = pick('vol.4');
  const top = vol4 ? Math.max(0, vol4.getBoundingClientRect().top - 20) : 400;
  return {
    vol4: info(vol4),
    suzu: info(pick('すずひら')),
    vw: innerWidth,
    cropTop: Math.round(top),
  };
})()`,
});

const data = evaluated.result.value;
console.log(JSON.stringify(data, null, 2));

const shot = await send('Page.captureScreenshot', {
	format: 'png',
	clip: { x: 0, y: data.cropTop, width: 390, height: 200, scale: 1 },
});
fs.writeFileSync(
	'c:/dev/neet-magazine-site/tmp/events-vol4-live-crop.png',
	Buffer.from(shot.data, 'base64'),
);

ws.close();
