import fs from 'node:fs';
import path from 'node:path';

const NOTE_ID = 'n76e08e1fed8b';
const SLUG = 'middle-aged-dropout';
const MDX_PATH = 'src/content/articles/vol4/middle-aged-dropout.mdx';
const OUT_DIR = 'public/articles/vol4';

const FULLWIDTH = '１２３４５６';

const footnotes = {
	1: 'もちろん私はドロップアウトの難易度を格付けし、マウントを取りたいわけではない。あくまで一つの研究として意見を提示し、そのうえで本稿のメインテーマに接続するための布石である。どうか気を悪くしないでいただきたい。',
	2: 'その根拠を書き連ねるには紙幅が足りない。詳しくは拙著『14歳からのアンチワーク哲学　なぜ僕らは働きたくないのか？』（まとも書房）等を参照のこと。',
	3: '利潤の獲得が主たる支配のシステムとして機能していた社会を資本主義と呼び、賃料や手数料といったレントの獲得が主たる支配のシステムとして機能している社会を封建制と呼ぶのだとすれば、現代はどちらかといえば封建制社会である。詳しくはヤニス・バルファキス（訳：関美和）『テクノ封建制』（集英社、二〇二五年）を参照のこと。',
	4: '現代がどれほどブルシット・ジョブで埋め尽くされているかについては、デヴィッド・グレーバー（訳：酒井隆史他）『ブルシット・ジョブ　クソどうでもいい仕事の理論』（岩波書店、二〇二〇年）を参照のこと。',
	5: '私はここではエッセンシャルワークを「意味のある仕事」という意味で使用している。米を作って誰かが食べてくれるならその人に喜びが与えられるという意味でエッセンシャルだし、漫画を描いて誰かが読んでくれるなら同様にエッセンシャルである。もちろん一般的なエッセンシャルワークの用法は「生命維持に欠かせない」的なニュアンスで語られる傾向にあるが、それを言い出せば米すらも食わなくても死なないし、トマトやレタス、パクチーも同様である。カロリーメイトと数種のビタミン剤を摂っていれば、人間は生命維持ができるだろう。だが、私たちは豊かさを享受し、生活に喜びを見出すために、トマトやレタス、パクチーを欲するのである。そのニーズに応えるものは全てエッセンシャルであると考えれば、漫画を描くことも、ショートコントを演じることも、本稿のように刺激的な文章を書くことも、エッセンシャルワークなのである。もちろん、誰も読まないパワーポイント資料や誰も食べない恵方巻を作ることはエッセンシャルワークとは言えない。',
	6: '経営学や経済心理、脳科学などの領域の参考書を列挙しようかと思ったが、むしろ自由や自発性の重要度、あるいは強制の害を強調していない書籍を探す方が難しいくらいなので、割愛する。',
};

function footnoteButton(n) {
	const label = `[*${FULLWIDTH[n - 1]}]`;
	return `<button data-footnote="note-${n}" aria-expanded="false">${label}</button>`;
}

function footnoteAside(n) {
	return `<aside id="note-${n}" data-footnote-popup role="note">${footnotes[n]}</aside>`;
}

function replaceFootnotes(text) {
	return text.replace(/【注([１２３４５６])】/g, (_, digit) => {
		const n = FULLWIDTH.indexOf(digit) + 1;
		return footnoteButton(n);
	});
}

async function downloadImages() {
	const j = await fetch(`https://note.com/api/v3/notes/${NOTE_ID}`, {
		headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
	}).then((r) => r.json());
	const html = j.data.body ?? '';
	const figures = [...html.matchAll(/<figure\b[\s\S]*?<\/figure>/gi)].filter(
		(f) => !f[0].includes('この記事は、'),
	);

	fs.mkdirSync(OUT_DIR, { recursive: true });
	const blocks = [];

	for (let i = 0; i < figures.length; i++) {
		const fig = figures[i][0];
		const src = fig.match(/src="([^"]+)"/)?.[1];
		const w = fig.match(/width="(\d+)"/)?.[1];
		const h = fig.match(/height="(\d+)"/)?.[1];
		const caption = fig.match(/<figcaption>([\s\S]*?)<\/figcaption>/)?.[1]?.trim() ?? '';
		if (!src || !w || !h) continue;

		const n = String(blocks.length + 1).padStart(2, '0');
		const ext = src.includes('.png') ? 'png' : 'jpg';
		const fname = `${SLUG}-${n}.${ext}`;
		const buf = Buffer.from(await fetch(src).then((r) => r.arrayBuffer()));
		fs.writeFileSync(path.join(OUT_DIR, fname), buf);

		blocks.push(`<figure>
<img src="/articles/vol4/${fname}" alt="中年ドロップアウトのすゝめ 写真${blocks.length + 1}" width="${w}" height="${h}" />
<figcaption>${caption}</figcaption>
</figure>`);
	}

	return blocks.join('\n\n');
}

function rebuildBody(rawBody) {
	const endMarker = '\n<p class="section-break"></p>\n\n【注１】';
	const cut = rawBody.indexOf(endMarker);
	if (cut === -1) throw new Error('footnote section not found');
	let body = rawBody.slice(0, cut).trimEnd();

	const blocks = body.split(/\n{2,}/);
	const out = [];

	for (const block of blocks) {
		const trimmed = block.trim();
		if (!trimmed) continue;

		if (trimmed.includes('data-footnote') || trimmed.startsWith('<')) {
			out.push(trimmed);
			continue;
		}

		if (!trimmed.includes('【注')) {
			out.push(trimmed);
			continue;
		}

		const used = [...trimmed.matchAll(/【注([１２３４５６])】/g)].map((m) => FULLWIDTH.indexOf(m[1]) + 1);
		const html = `<p>${replaceFootnotes(trimmed)}</p>`;
		out.push(html);
		for (const n of used) out.push(footnoteAside(n));
	}

	return out.join('\n\n');
}

const raw = fs.readFileSync(MDX_PATH, 'utf8');
const m = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
if (!m) throw new Error('no frontmatter');
const frontmatter = raw.slice(0, raw.length - m[1].length);

const images = await downloadImages();
let body = rebuildBody(m[1]);

const imageAnchor = '出版したのである。冷静に振り返ってみれば、かなりヤバい奴である。';
const imagePos = body.indexOf(imageAnchor);
if (imagePos === -1) throw new Error('image anchor not found');
const insertAt = imagePos + imageAnchor.length;
		const insert = `\n\n${images}\n\n`;
		const closeTag = '</p>';
		const closePos = body.indexOf(closeTag, imagePos);
		if (closePos === -1) {
			body = `${body.slice(0, insertAt)}${insert}${body.slice(insertAt)}`;
		} else {
			body = `${body.slice(0, closePos + closeTag.length)}${insert}${body.slice(closePos + closeTag.length)}`;
		}

fs.writeFileSync(MDX_PATH, `${frontmatter}${body}\n`, 'utf8');
console.log('rebuilt', MDX_PATH);
