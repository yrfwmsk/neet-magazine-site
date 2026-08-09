import fs from 'fs';

const replacements = [
	{
		file: 'src/content/articles/vol3/light.mdx',
		from: `afterword: |
  30歳になったので一人称を僕から私に変更しました。
  Twitter/note：@yrfwmsk`,
		to: `afterword: |
  30歳になったので一人称を僕から私に変更しました。`,
	},
	{
		file: 'src/content/articles/vol3/business-neet.mdx',
		from: `afterword: |
  30歳になったので一人称を僕から私に変更しました。
  Twitter/note：@yrfwmsk`,
		to: `afterword: |
  30歳になったので一人称を僕から私に変更しました。`,
	},
	{
		file: 'src/content/articles/vol3/association.mdx',
		from: `afterword: |
  実家暮らしニート。野菜作りに挑戦中。
  座面が広めのソファにあぐらをかいて読書するのが好き。
  あぐらの上にクッションを置き、その上に本を置くとなお良い。
  Twitter/note：@dokushoneet`,
		to: `afterword: |
  実家暮らしニート。野菜作りに挑戦中。
  座面が広めのソファにあぐらをかいて読書するのが好き。
  あぐらの上にクッションを置き、その上に本を置くとなお良い。`,
	},
	{
		file: 'src/content/articles/vol3/escape.mdx',
		from: `afterword: |
  だめ連や寝そべり族の提唱する「最低限だけ働く」を実践しています。
  労働イヤッ！
  note：https://note.com/kosou`,
		to: `afterword: |
  だめ連や寝そべり族の提唱する「最低限だけ働く」を実践しています。
  労働イヤッ！`,
	},
	{
		file: 'src/content/articles/vol3/hakoniwa.mdx',
		from: `afterword: |
  将来住むことを検討している地域に行って、ふらふらするのが楽しい。
  スーパーで見たことのないパンが売っているとつい買ってしまう。
  ホームセンターで苗を買ってベランダ菜園をしようなど夢想する。
  note：https://note.com/gesyukunin`,
		to: `afterword: |
  将来住むことを検討している地域に行って、ふらふらするのが楽しい。
  スーパーで見たことのないパンが売っているとつい買ってしまう。
  ホームセンターで苗を買ってベランダ菜園をしようなど夢想する。`,
	},
	{
		file: 'src/content/articles/vol3/z-generation.mdx',
		from: `      焼肉屋さんで障害者雇用でゆるく働けてるので安心してください！
      note：https://note.com/shakaihukkisuru
  - author: コソウ
    authorId: kosou
    text: |
      だめ連や寝そべり族の提唱する「最低限だけ働く」を実践しています。
      労働イヤッ！
      note：https://note.com/kosou`,
		to: `      焼肉屋さんで障害者雇用でゆるく働けてるので安心してください！
  - author: コソウ
    authorId: kosou
    text: |
      だめ連や寝そべり族の提唱する「最低限だけ働く」を実践しています。
      労働イヤッ！`,
	},
	{
		file: 'src/content/articles/vol3/letters.mdx',
		from: `ひとつとして読んでいただけたら幸いです。気が向いたらnoteにも
      遊びに来てください。https://note.com/nassi_massi39`,
		to: `ひとつとして読んでいただけたら幸いです。気が向いたらnoteにも
      遊びに来てください。`,
	},
];

for (const { file, from, to } of replacements) {
	let raw = fs.readFileSync(file, 'utf8');
	if (!raw.includes(from)) {
		console.error('NOT FOUND:', file);
		continue;
	}
	fs.writeFileSync(file, raw.replace(from, to), 'utf8');
	console.log('OK', file);
}
