import fs from 'node:fs';

const path = 'src/content/articles/vol3/business-neet.mdx';
let md = fs.readFileSync(path, 'utf8');

// ①〜⑫ を大見出し（h2）に
md = md.replace(/^### ([①②③④⑤⑥⑦⑧⑨⑩⑪⑫] )/gm, '## $1');

// Practice ブロック引用 → 架空ツイートカード
md = md.replace(
	/> ■ Ｐｒａｃｔｉｃｅ！\n> ([^\n]+)のツイート\n> 「([\s\S]*?)」\n/g,
	(_, user, body) => {
		const cleanBody = body.replace(/\n> /g, '').trim();
		return [
			'<aside class="practice-tweet">',
			'\t<p class="practice-tweet__label">■ Practice!</p>',
			'\t<div class="practice-tweet__card">',
			`\t\t<p class="practice-tweet__user">${user}</p>`,
			`\t\t<p class="practice-tweet__body">${cleanBody}</p>`,
			'\t</div>',
			'</aside>',
			'',
			'',
		].join('\n');
	},
);

fs.writeFileSync(path, md, 'utf8');

const practices = (md.match(/practice-tweet/g) || []).length;
const h2 = (md.match(/^## [①②③④⑤⑥⑦⑧⑨⑩⑪⑫]/gm) || []).length;
const leftover = (md.match(/Ｐｒａｃｔｉｃｅ/g) || []).length;
const h3left = (md.match(/^### [①②③④⑤⑥⑦⑧⑨⑩⑪⑫]/gm) || []).length;
console.log({ practices, h2, leftover, h3left });
