export const LAYOUT_TESTS = [
	{
		id: 'current',
		label: '現行',
		href: '/magazines/article-layout-tests/current',
		title: '現行レイアウト',
		blurb: '右サイド記事一覧あり・shell 1040px。ヘッダー幅（920px）からはみ出す現状。',
	},
	{
		id: 'a',
		label: 'A',
		href: '/magazines/article-layout-tests/a',
		title: 'A · 一覧削除',
		blurb: '右サイドをやめ、本文をヘッダーと同じ shell（920px）に揃える。',
	},
	{
		id: 'b',
		label: 'B',
		href: '/magazines/article-layout-tests/b',
		title: 'B · 折りたたみ一覧',
		blurb: '記事一覧を details で折りたたみ。デフォルト閉じ、本文はシングルカラム。',
	},
	{
		id: 'c',
		label: 'C',
		href: '/magazines/article-layout-tests/c',
		title: 'C · 極小 TOC（暫定採用）',
		blurb: 'ヘッダー幅内で、右に番号だけの細い TOC。hover でタイトル表示。本番の記事ページに暫定反映済み。',
	},
	{
		id: 'd',
		label: 'D',
		href: '/magazines/article-layout-tests/d',
		title: 'D · 前後ナビ',
		blurb: '右サイドなし。文末に前の記事 / 次の記事だけ置く。',
	},
	{
		id: 'e',
		label: 'E',
		href: '/magazines/article-layout-tests/e',
		title: 'E · 号メニュー',
		blurb: '右サイドなし。「この号」ボタンで一覧を開く（全幅シングルカラム）。',
	},
] as const;

export type LayoutTestId = (typeof LAYOUT_TESTS)[number]['id'];

export const SAMPLE_ARTICLES = [
	{ order: 1, slug: 'except-mine', title: 'オレの文章以外面白くない', author: '無職詩人' },
	{ order: 2, slug: 'status', title: 'ニートの社会的地位向上に向けた提言', author: 'ホモ・ネーモ' },
	{ order: 3, slug: 'ten-years', title: '35歳過ぎたニートがこの10年で感じたこと', author: 'なかさま' },
	{ order: 4, slug: 'farm', title: '適当に畑ニート', author: '吉永' },
	{ order: 5, slug: 'memoir', title: '学生から無職へ、十何年の随想録', author: 'ろっさん' },
	{ order: 6, slug: 'elements', title: 'ニート的な自分を構成する要素', author: 'ひろーり' },
	{ order: 7, slug: 'psychoanalysis', title: '生き延びるための精神分析学', author: '白﨑' },
	{ order: 8, slug: 'contingency', title: 'ニートと偶然性', author: 'ゆるふわ無職' },
	{ order: 9, slug: 'amida', title: 'なぜ「それ」を阿弥陀如来と呼ぶのか', author: '安眠計画' },
	{ order: 10, slug: 'uncle', title: '拝啓、叔父さん', author: '下宿人' },
] as const;

/** タイトルのはみ出し確認用に、やや長いタイトルをカレントにする */
export const SAMPLE_CURRENT = SAMPLE_ARTICLES[2];

export const SAMPLE_PREV = SAMPLE_ARTICLES[1];
export const SAMPLE_NEXT = SAMPLE_ARTICLES[3];
