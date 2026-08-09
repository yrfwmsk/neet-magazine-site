/**
 * 対談 MDX をオモコロ風 .dialogue-turn HTML に変換
 * Usage: node scripts/apply-dialogue-layout.mjs
 */
import fs from 'node:fs';

const SPEAKERS = {
	ゆるふわ: '/authors/yrfwmsk.png',
	久保一真: '/authors/kubo-kazuma.png',
	安眠計画: '/authors/unmi-n.png',
	コソウ: '/authors/kosou.png',
	社会復帰: '/authors/shakai-fukki.png',
};

const SPEAKER_RE = new RegExp(
	`^\\*\\*(${Object.keys(SPEAKERS).join('|')})\\*\\*[　\\s]*(.*)$`,
	's',
);

function isStructural(block) {
	const t = block.trim();
	if (!t) return true;
	if (/^#{1,3}\s/.test(t)) return true;
	if (/^>/.test(t)) return true;
	if (/^<p class="section-break/.test(t)) return true;
	if (/^<span class="emdash">/.test(t)) return true;
	// 話者以外の太字だけのラベル（例: **ニーマガＤｉｓｃｏｒｄにて**）
	if (/^\*\*[^*]+\*\*$/.test(t) && !SPEAKER_RE.test(t)) return true;
	return false;
}

function escapeHtml(s) {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** インラインHTMLを許しつつ、素のテキストはエスケープしない（MDX由来のHTMLを保持） */
function toParagraphHtml(block) {
	const t = block.trim();
	if (!t) return '';
	if (t.startsWith('<aside ') || t.startsWith('<p class=')) return t;
	// すでにブロックHTMLならそのまま
	if (/^<(aside|div|blockquote|h[1-6])\b/i.test(t)) return t;
	return `<p>${t}</p>`;
}

function renderTurn(speaker, parts) {
	const src = SPEAKERS[speaker];
	const body = parts.map(toParagraphHtml).filter(Boolean).join('\n');
	return [
		`<div class="dialogue-turn" data-speaker="${escapeHtml(speaker)}">`,
		`  <div class="dialogue-turn__meta">`,
		`    <img class="dialogue-turn__avatar" src="${src}" alt="" width="64" height="64" />`,
		`    <span class="dialogue-turn__name">${escapeHtml(speaker)}</span>`,
		`  </div>`,
		`  <div class="dialogue-turn__body">`,
		body
			.split('\n')
			.map((line) => `    ${line}`)
			.join('\n'),
		`  </div>`,
		`</div>`,
	].join('\n');
}

function convertBody(body) {
	const blocks = body.split(/\n\n+/);
	const out = [];
	let turn = null; // { speaker, parts: string[] }

	const flush = () => {
		if (!turn) return;
		out.push(renderTurn(turn.speaker, turn.parts));
		turn = null;
	};

	for (const raw of blocks) {
		const block = raw.trim();
		if (!block) continue;

		const m = block.match(SPEAKER_RE);
		if (m) {
			flush();
			const speaker = m[1];
			const rest = (m[2] || '').trim();
			turn = { speaker, parts: rest ? [rest] : [] };
			continue;
		}

		if (isStructural(block)) {
			flush();
			out.push(block);
			continue;
		}

		if (turn) {
			turn.parts.push(block);
		} else {
			out.push(block);
		}
	}
	flush();
	return `${out.join('\n\n')}\n`;
}

function convertFile(relPath) {
	const path = relPath;
	const text = fs.readFileSync(path, 'utf8');
	const fmMatch = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
	if (!fmMatch) throw new Error(`no frontmatter: ${path}`);
	const body = text.slice(fmMatch[0].length);
	const next = `${fmMatch[0]}\n${convertBody(body)}`;
	fs.writeFileSync(path, next, 'utf8');
	const turns = (next.match(/class="dialogue-turn"/g) || []).length;
	console.log(`OK ${path} turns=${turns}`);
}

convertFile('src/content/articles/vol3/antiwork-dialogue.mdx');
convertFile('src/content/articles/vol3/z-generation.mdx');
