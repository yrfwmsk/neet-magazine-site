/**
 * note 本文 HTML → サイト向け MDX ボディ
 *
 * スペースの考え方:
 * - ◆ / 見出し = 大きな区切り（section-mark / heading）
 * - note の別 <p>（意味の塊）境界 = section-break
 * - 同一 <p> 内の単一 <br> = 通常段落の小スペース
 * - 連続 <br><br> / 空 <p> = section-break
 * - 箇条書き（・ / ①②…）の連続 = 小スペースなしで密着
 * - ◆ 単独の前後に追加の section-break は付けない
 */
import fs from 'node:fs';

const AUTHOR_NAMES = new Set([
	'スペシャルゲスト',
	'ゆるふわ無職',
	'安眠計画',
	'白﨑',
	'ろっさん',
	'久保一真',
	'読書ニート',
	'逸民シライ',
	'コソウ',
	'下宿人',
	'レモン',
	'神長恒一',
	'だめライフ東京',
]);

export function convertInline(s) {
	return s
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, label) => {
			const text = label.replace(/<[^>]+>/g, '').trim();
			return `[${text}](${href})`;
		})
		.replace(/<\/?span[^>]*>/gi, '')
		.replace(/<\/?strong>/gi, '**')
		.replace(/<\/?b>/gi, '**')
		.replace(/<\/?em>/gi, '*')
		.replace(/<\/?i>/gi, '*')
		.replace(/｜([^《\n]+)《([^》]+)》/g, (_, base, anno) => {
			if (/^[・.…\.…]+$/.test(anno)) return `<em class="bouten">${base}</em>`;
			return `<ruby>${base}<rt>${anno}</rt></ruby>`;
		})
		.replaceAll('——', '――')
		.replaceAll('――', '<span class="emdash">――</span>');
}

export function cleanText(s) {
	return convertInline(s).replace(/^[　\s]+|[　\s]+$/g, '').trim();
}

function stripTags(s) {
	return s.replace(/<[^>]+>/g, '');
}

export function isChromeHeading(text, attrs = '', noteTitle = '') {
	const plain = stripTags(text).replace(/\s+/g, ' ').trim();
	if (!plain) return true;
	if (/^■/.test(plain)) return false;
	if (/^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫]/.test(plain)) return false;
	if (/^特集[：:]/.test(plain)) return true;
	if (AUTHOR_NAMES.has(plain)) return true;
	if (/text-align:\s*right/i.test(attrs) && [...plain].length <= 20) return true;
	if (noteTitle) {
		const bare = noteTitle.replace(/\/[^/]*$/, '').trim();
		if (plain === bare || plain === noteTitle.trim()) return true;
	}
	return false;
}

/** 冒頭の題名・著者・特集ラベルだけ落とす（本文見出しは残す） */
export function stripLeadingChrome(html, noteTitle = '') {
	let rest = html;
	const headingRe = /^(?:\s*)<(h[23])(\s[^>]*)?>([\s\S]*?)<\/\1>/i;
	while (true) {
		const m = rest.match(headingRe);
		if (!m) break;
		const text = m[3];
		const attrs = m[2] || '';
		if (!isChromeHeading(text, attrs, noteTitle)) break;
		rest = rest.slice(m[0].length);
	}
	return rest;
}

function isAuthorOnly(text, attrs = '') {
	const plain = stripTags(text).replace(/\*+/g, '').trim();
	if (!plain) return false;
	if (AUTHOR_NAMES.has(plain)) return true;
	if (/text-align:\s*right/i.test(attrs) && [...plain].length <= 20) return true;
	return false;
}

/** 箇条書き・番号リスト（密着対象） */
export function isListItemText(text) {
	const plain = stripTags(text).replace(/\*+/g, '').trim();
	return /^[・●○▪︎▫︎]|^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]/.test(plain);
}

function isDotBulletText(text) {
	const plain = stripTags(text).replace(/\*+/g, '').trim();
	return /^[・●○▪︎▫︎]/.test(plain);
}

function stripDotBullet(text) {
	return text.replace(/^[・●○▪︎▫︎]\s*/, '');
}

function lastContent(blocks) {
	for (let i = blocks.length - 1; i >= 0; i--) {
		const b = blocks[i];
		if (b.kind === 'gap') continue;
		return b;
	}
	return null;
}

function pushGapUnlessList(out, nextText) {
	const prev = lastContent(out);
	if (!prev) return;
	if (prev.kind === 'diamond' || prev.kind === 'heading') return;
	if (prev.kind === 'list' && isListItemText(nextText)) return;
	if (prev.kind === 'para' && isListItemText(prev.text) && isListItemText(nextText)) return;
	if (out[out.length - 1]?.kind === 'gap') return;
	out.push({ kind: 'gap', from: 'p-boundary' });
}

export function noteHtmlToBlocks(html, noteTitle = '') {
	let body = stripLeadingChrome(html, noteTitle);
	body = body.replace(/<figure\b[\s\S]*?<\/figure>/gi, (fig) => {
		if (fig.includes('この記事は、')) return '';
		return fig;
	});

	const out = [];
	const re = /<(h[23]|p|blockquote|figure)(\s[^>]*)?>([\s\S]*?)<\/\1>|<hr\b[^>]*>/gi;
	let m;
	let sawBody = false;

	while ((m = re.exec(body))) {
		if (/^<hr\b/i.test(m[0])) {
			out.push({ kind: 'gap', from: 'hr' });
			continue;
		}
		const tag = m[1].toLowerCase();
		const attrs = m[2] || '';
		let inner = m[3];

		if (tag === 'h2' || tag === 'h3') {
			let title = inner
				.replace(/&nbsp;/g, ' ')
				.replace(/&amp;/g, '&')
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>')
				.replace(/&quot;/g, '"')
				.replace(/&#39;/g, "'")
				.replace(/<[^>]+>/g, '')
				.replace(/\n+/g, ' ')
				.replace(/^[　\s]+|[　\s]+$/g, '')
				.trim();
			title = title.replace(/^■\s*/, '■ ').trim();
			title = title.replaceAll('——', '――').replaceAll('――', '<span class="emdash">――</span>');
			if (isChromeHeading(title.replace(/<[^>]+>/g, ''), attrs, noteTitle)) continue;
			if (!title) continue;
			sawBody = true;
			out.push({ kind: 'heading', level: tag === 'h2' ? 2 : 3, text: title });
			continue;
		}

		if (tag === 'figure') {
			const bq = inner.match(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/i);
			if (!bq) continue;
			const raw = bq[1]
				.replace(/<\/?p[^>]*>/gi, '\n')
				.replace(/(?:<br\s*\/?>\s*){2,}/gi, '\n\n')
				.replace(/<br\s*\/?>/gi, '\n');
			const normalized = [];
			for (const l of raw.split(/\n/)) {
				const t = cleanText(l);
				if (t) normalized.push(t);
				else if (normalized.length && normalized[normalized.length - 1] !== '') normalized.push('');
			}
			while (normalized.length && normalized[normalized.length - 1] === '') normalized.pop();
			if (normalized.some(Boolean)) {
				const cap = inner.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
				const capText = cap ? cleanText(cap[1]) : '';
				if (capText) {
					while (normalized.length && normalized[normalized.length - 1] === '') normalized.pop();
					normalized.push('', capText);
				}
				pushGapUnlessList(out, normalized.find(Boolean));
				out.push({ kind: 'quote', text: normalized.join('\n') });
				sawBody = true;
			}
			continue;
		}

		if (tag === 'blockquote') {
			const raw = inner
				.replace(/<\/?p[^>]*>/gi, '\n')
				.replace(/(?:<br\s*\/?>\s*){2,}/gi, '\n\n')
				.replace(/<br\s*\/?>/gi, '\n');
			const normalized = [];
			for (const l of raw.split(/\n/)) {
				const t = cleanText(l);
				if (t) normalized.push(t);
				else if (normalized.length && normalized[normalized.length - 1] !== '') normalized.push('');
			}
			while (normalized.length && normalized[normalized.length - 1] === '') normalized.pop();
			if (normalized.some(Boolean)) {
				pushGapUnlessList(out, normalized.find(Boolean));
				out.push({ kind: 'quote', text: normalized.join('\n') });
				sawBody = true;
			}
			continue;
		}

		// p: 空（br のみ含む）→ section-break
		const textOnly = inner
			.replace(/<br\s*\/?>/gi, '')
			.replace(/<[^>]+>/g, '')
			.replace(/&nbsp;/g, ' ')
			.replace(/[　\s]+/g, '');
		if (!textOnly) {
			out.push({ kind: 'gap', from: 'empty-p' });
			continue;
		}

		if (isAuthorOnly(cleanText(inner), attrs) && !sawBody) continue;

		// 対談などで <br> なしに連続する <strong>話者</strong> を段落分割
		inner = inner.replace(/([^>\s])(\s*)<strong\b/gi, '$1$2<br><strong');

		const parts = inner.split(/(?:<br\s*\/?>\s*)+/i);
		const brRuns = [...inner.matchAll(/(?:<br\s*\/?>\s*)+/gi)].map(
			(x) => (x[0].match(/<br/gi) || []).length,
		);

		const cleanedParts = [];
		for (let i = 0; i < parts.length; i++) {
			const t = cleanText(parts[i]);
			if (!t) continue;
			cleanedParts.push({ text: t, brAfter: i < brRuns.length ? brRuns[i] : 0 });
		}
		if (!cleanedParts.length) {
			out.push({ kind: 'gap', from: 'empty-p' });
			continue;
		}

		// 別 <p> 境界 = 意味の塊の空き（箇条書き連続は除く）
		pushGapUnlessList(out, cleanedParts[0].text);

		for (let i = 0; i < cleanedParts.length; i++) {
			const t = cleanedParts[i].text;
			const plain = stripTags(t).replace(/\*+/g, '').trim();
			if (plain === '◆') out.push({ kind: 'diamond' });
			else {
				out.push({ kind: 'para', text: t });
				sawBody = true;
			}
			if (cleanedParts[i].brAfter >= 2) out.push({ kind: 'gap', from: 'br', n: cleanedParts[i].brAfter });
		}
	}

	while (out.length && out[out.length - 1].kind === 'gap') out.pop();
	while (out.length && out[0].kind === 'gap') out.shift();

	const merged = [];
	for (const item of out) {
		if (item.kind === 'gap') {
			const prev = merged[merged.length - 1];
			if (prev?.kind === 'diamond') continue;
			if (prev?.kind === 'gap') continue;
			if (prev?.kind === 'heading') continue;
			merged.push(item);
			continue;
		}
		if (item.kind === 'diamond' && merged[merged.length - 1]?.kind === 'gap') merged.pop();
		if (item.kind === 'heading' && merged[merged.length - 1]?.kind === 'gap') merged.pop();
		// 箇条書きは list ブロックにまとめ、折り返し時は・の下でインデント
		if (item.kind === 'para' && isListItemText(item.text)) {
			const prev = merged[merged.length - 1];
			const variant = isDotBulletText(item.text) ? 'dot' : 'num';
			if (prev?.kind === 'list' && prev.variant === variant) {
				prev.items.push(item.text);
				continue;
			}
			merged.push({ kind: 'list', variant, items: [item.text] });
			continue;
		}
		merged.push(item);
	}
	return merged;
}

export function blocksToMdxBody(blocks) {
	const lines = [];
	for (const item of blocks) {
		if (item.kind === 'para') {
			lines.push(item.text, '');
		} else if (item.kind === 'list') {
			if (item.variant === 'dot') {
				const lis = item.items
					.map((t) => `\t<li>${stripDotBullet(t)}</li>`)
					.join('\n');
				lines.push(`<ul class="dot-list">\n${lis}\n</ul>`, '');
			} else {
				const lis = item.items.map((t) => `\t<li>${t}</li>`).join('\n');
				lines.push(`<ul class="num-list">\n${lis}\n</ul>`, '');
			}
		} else if (item.kind === 'quote') {
			const q = item.text
				.split('\n')
				.map((l) => (l === '' ? '>' : `> ${l}`))
				.join('\n');
			lines.push(q, '');
		} else if (item.kind === 'heading') {
			const marks = '#'.repeat(item.level);
			lines.push(`${marks} ${item.text}`, '');
		} else if (item.kind === 'diamond') {
			lines.push('<p class="section-mark">◆</p>', '');
		} else if (item.kind === 'gap') {
			lines.push('<p class="section-break"></p>', '');
		}
	}
	return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

export function fixBoldSpaces(md) {
	// 話者名などの **name　** / **name ** のみ。改行をまたぐ誤マッチを防ぐ
	return md.replace(/\*\*([^\n*]+?)[ \t\u3000]+\*\*/g, '**$1**');
}

const isCli = process.argv[1] && /note-to-mdx-body.mjs$/.test(process.argv[1].replace(/\\/g, '/'));
if (isCli) {
	const noteKey = process.argv[2];
	const outPath = process.argv[3];
	if (!noteKey || !outPath) {
		console.error('Usage: node scripts/note-to-mdx-body.mjs <noteKey> <out.md>');
		process.exit(1);
	}
	const res = await fetch(`https://note.com/api/v3/notes/${noteKey}`, {
		headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const json = await res.json();
	const blocks = noteHtmlToBlocks(json.data.body ?? '', json.data.name ?? '');
	const md = fixBoldSpaces(blocksToMdxBody(blocks));
	fs.mkdirSync('tmp', { recursive: true });
	fs.writeFileSync(outPath, md, 'utf8');
	for (const [i, b] of blocks.entries()) {
		if (b.kind === 'para') console.log(i, 'PARA', [...b.text].length, b.text.slice(0, 36));
		else if (b.kind === 'list') console.log(i, 'LIST', b.variant, b.items.length, b.items[0].slice(0, 36));
		else if (b.kind === 'heading') console.log(i, `H${b.level}`, b.text);
		else if (b.kind === 'diamond') console.log(i, '◆');
		else if (b.kind === 'gap') console.log(i, 'GAP', b.from, b.n || '');
		else if (b.kind === 'quote') console.log(i, 'QUOTE', b.text.slice(0, 36));
		else console.log(i, b.kind);
	}
	console.log('title:', json.data.name);
	console.log('wrote', outPath, 'chars', [...md].length, 'blocks', blocks.length);
}
