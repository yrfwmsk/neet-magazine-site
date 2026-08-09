import fs from 'fs';
import path from 'path';

const afterwords = {
	'kaminaga-koichi': {
		author: '神長恒一',
		text: `30年寝太郎のだめアナキストです～。
『だめ連の資本主義よりたのしく生きる』（現代書館）読んでね。
YouTubeで「だめ連ラジオ・熱くレボリューション！」、
ツイッター（@nogawaanarchy）もやってます。交流ヨロシク～！`,
	},
	'dame-life': {
		author: 'だめライフ東京',
		text: `ただいま無職につき、文章の執筆依頼募集中！
これまで書いた文章はnote（note.com/dame_life_chuo）に掲載しています。
ご連絡はTwitter（@dame_life_chuo）のDMまで！
また、毎週火曜日にはbar「あかね」（@waseda_akane）でスタッフやってます。
政治・思想・性愛・サブカル等に興味のある方、交流しましょう！(^_-)-☆`,
	},
	yrfwmsk: {
		author: 'ゆるふわ無職',
		text: `30歳になったので一人称を僕から私に変更しました。
Twitter/note：@yrfwmsk`,
	},
	'unmi-n': {
		author: '安眠計画',
		text: '大乗仏教の大丈夫の部分',
	},
	asajifu: {
		author: '白﨑',
		text: `レヴィナスという文字列を見ると麻婆茄子が食べたくなります。
この世の食べ物で唐揚げだけは、人が作ってくれたほうがうまい。`,
	},
	zttk1996: {
		author: 'ろっさん',
		text: `私事ですが、しばらくニートを卒業することになりました。
今回の記事を特集枠へ薦めてくれたゆるふわ君、
素敵なタイトルを付けてくれた安眠さん。
おふたりと、俺に善い交流を与えてくれた全ての方々に感謝を。`,
	},
	'kubo-kazuma': {
		author: '久保一真',
		text: `労働を撲滅するために生まれた哲学者。まとも書房代表。
著書に『14歳からのアンチワーク哲学』、訳書に『労働廃絶論』。
2025年5月に新著『まともな奴は労働しない』発売予定。`,
	},
	dokushoneet: {
		author: '読書ニート',
		text: `実家暮らしニート。野菜作りに挑戦中。
座面が広めのソファにあぐらをかいて読書するのが好き。
あぐらの上にクッションを置き、その上に本を置くとなお良い。
Twitter/note：@dokushoneet`,
	},
	kosou: {
		author: 'コソウ',
		text: `だめ連や寝そべり族の提唱する「最低限だけ働く」を実践しています。
労働イヤッ！
note：https://note.com/kosou`,
	},
	'shakai-fukki': {
		author: '社会復帰した',
		text: `数日でとんでもない経験をしました。ただただ社会復帰したかっただけ
なのに…。精神障害者の肩身が狭いことを再認識させられました。今は
焼肉屋さんで障害者雇用でゆるく働けてるので安心してください！
note：https://note.com/shakaihukkisuru`,
	},
	gesyukunin: {
		author: '下宿人',
		text: `将来住むことを検討している地域に行って、ふらふらするのが楽しい。
スーパーで見たことのないパンが売っているとつい買ってしまう。
ホームセンターで苗を買ってベランダ菜園をしようなど夢想する。
note：https://note.com/gesyukunin`,
	},
	starshoot: {
		author: 'レモン',
		text: `日本古来の和歌集には誰が読んだかわからない和歌が収められています。
ニートマガジンは、そんな和歌集に似ていると思っています。
労働から降りて時間的余裕を持ったニートの記録が後世に伝われば、
嬉しい限りです。`,
	},
	ryuboku: {
		author: '流木',
		text: `この本を手に取った方の期待に沿えるようなものを提供できた自信は
全くありませんが、あくまで「あまり働かない」生き方のサンプルの
ひとつとして読んでいただけたら幸いです。気が向いたらnoteにも
遊びに来てください。https://note.com/nassi_massi39`,
	},
};

/** @type {Record<string, { authorId?: string, authorIds?: string[] }>} */
const articles = {
	'dameren.mdx': { authorId: 'kaminaga-koichi' },
	'dame-life.mdx': { authorId: 'dame-life' },
	'light.mdx': { authorId: 'yrfwmsk' },
	'sanpo.mdx': { authorId: 'unmi-n' },
	'soup.mdx': { authorId: 'asajifu' },
	'singularity.mdx': { authorId: 'zttk1996' },
	'antiwork-dialogue.mdx': { authorIds: ['kubo-kazuma', 'unmi-n'] },
	'association.mdx': { authorId: 'dokushoneet' },
	'bonbai.mdx': { authorId: 'unmi-n' },
	'escape.mdx': { authorId: 'kosou' },
	'z-generation.mdx': { authorIds: ['shakai-fukki', 'kosou'] },
	'hakoniwa.mdx': { authorId: 'gesyukunin' },
	'new-world.mdx': { authorId: 'kubo-kazuma' },
	'business-neet.mdx': { authorId: 'yrfwmsk' },
	'kanazawa.mdx': { authorId: 'starshoot' },
	'letters.mdx': { authorIds: ['asajifu', 'ryuboku'] },
};

function yamlBlock(text, indent = 2) {
	const pad = ' '.repeat(indent);
	return text
		.split('\n')
		.map((line) => `${pad}${line}`)
		.join('\n');
}

function buildAfterwordFields(cfg) {
	if (cfg.authorIds) {
		const lines = ['afterwords:'];
		for (const id of cfg.authorIds) {
			const aw = afterwords[id];
			lines.push(`  - author: ${aw.author}`);
			lines.push(`    authorId: ${id}`);
			lines.push(`    text: |`);
			lines.push(yamlBlock(aw.text, 6));
		}
		return lines.join('\n');
	}
	const aw = afterwords[cfg.authorId];
	return [`authorId: ${cfg.authorId}`, `afterword: |`, yamlBlock(aw.text, 2)].join('\n');
}

const dir = 'src/content/articles/vol3';
for (const [file, cfg] of Object.entries(articles)) {
	const full = path.join(dir, file);
	let raw = fs.readFileSync(full, 'utf8');
	if (!raw.startsWith('---\n')) throw new Error(`no frontmatter: ${file}`);
	const end = raw.indexOf('\n---\n', 4);
	if (end < 0) throw new Error(`no closing frontmatter: ${file}`);
	let fm = raw.slice(4, end);
	const body = raw.slice(end + 5);

	// remove existing authorId / afterword / afterwords
	fm = fm
		.replace(/^authorId:.*\n/m, '')
		.replace(/^afterword: \|[\s\S]*?(?=^[a-zA-Z])/m, '')
		.replace(/^afterword:.*\n/m, '')
		.replace(/^afterwords:[\s\S]*?(?=^[a-zA-Z])/m, '');

	// insert after author line
	if (!/^author:/m.test(fm)) throw new Error(`no author: ${file}`);
	fm = fm.replace(/^(author:.*)$/m, `$1\n${buildAfterwordFields(cfg)}`);

	fs.writeFileSync(full, `---\n${fm}\n---\n${body}`, 'utf8');
	console.log('updated', file);
}
