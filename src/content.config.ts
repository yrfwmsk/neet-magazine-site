import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const magazines = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/magazines' }),
	schema: z.object({
		volume: z.string(),
		title: z.string(),
		publishedAt: z.coerce.date(),
		/** デジタルアーカイブ公開日（冊子発売日より後になる場合） */
		archiveAt: z.coerce.date().optional(),
		summary: z.string(),
		price: z.string().optional(),
		/** 紙冊子の総ページ数 */
		pageCount: z.coerce.number().int().positive().optional(),
		pdfPath: z.string().optional(),
		cover: z.string().optional(),
		coverArtist: z.string().optional(),
		/** 表紙イラスト担当の著者マスタ ID */
		coverArtistId: z.string().optional(),
		/** 表紙イラスト担当のあとがき（あるときだけクレジットがリンクになる） */
		coverAfterword: z.string().optional(),
		/** 号のイメージカラー（バックナンバー等のアクセント） */
		accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
		/** 特集タイトル（目次で「特集：…」見出しに使う） */
		featureTitle: z.string().optional(),
		/** 緊急特集タイトル（目次で「緊急特集：…」見出しに使う） */
		emergencyFeatureTitle: z.string().optional(),
		/** スペシャルゲスト名（トップ最新号など） */
		guests: z.array(z.string()).optional(),
	}),
});

const articles = defineCollection({
	loader: glob({ pattern: '**/*.mdx', base: './src/content/articles' }),
	schema: z.object({
		volume: z.string(),
		title: z.string(),
		author: z.string(),
		/** 著者マスタ ID（同一人物の別名義を束ねる） */
		authorId: z.string().optional(),
		/** 記事ごとのあとがき／プロフィール文（あるときのみ枠を表示） */
		afterword: z.string().optional(),
		/** 対談・共著など、複数名のあとがき（あるとき `afterword` より優先） */
		afterwords: z
			.array(
				z.object({
					author: z.string(),
					authorId: z.string().optional(),
					text: z.string(),
				}),
			)
			.optional(),
		publishedAt: z.coerce.date(),
		summary: z.string(),
		/** 目次上の区分ラベル（特集・スペシャルゲストなど） */
		section: z
			.enum([
				'スペシャルゲスト',
				'特集',
				'特集寄稿',
				'緊急特集',
				'自由寄稿',
				'乱入寄稿',
				'緊急対談',
				'往復書簡',
			])
			.optional(),
		/** 目次上で区分の後に表示する作品形式 */
		format: z.enum(['漫画']).optional(),
		order: z.number().default(0),
	}),
});

const authors = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/authors' }),
	schema: z.object({
		avatar: z.string(),
		links: z
			.object({
				x: z.string().url().optional(),
				note: z.string().url().optional(),
				instagram: z.string().url().optional(),
				youtube: z.string().url().optional(),
				website: z.string().url().optional(),
				amazon: z.string().url().optional(),
			})
			.default({}),
	}),
});

const events = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		place: z.string(),
		booth: z.string().optional(),
		status: z.enum(['upcoming', 'past']),
		/** その時点で刊行済みの最新号。1〜latestVolume の [n] を表示する */
		latestVolume: z.number().int().positive(),
		/** 販売した号。含まれない号は暗く表示する */
		soldVolumes: z.array(z.number().int().positive()).default([]),
		photo: z.string().optional(),
	}),
});

const qa = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/qa' }),
	schema: z.object({
		question: z.string(),
		order: z.number().default(0),
	}),
});

const bookstores = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/bookstores' }),
	schema: z.object({
		name: z.string(),
		status: z.enum(['active', 'archived']),
		/** 書店紹介（アクセス方法より先に表示） */
		introduction: z.string(),
		/** アクセス方法（住所の補足・最寄り駅など） */
		access: z.string(),
		prefecture: z.string().optional(),
		address: z.string().optional(),
		url: z.string().url().optional(),
		/** Google マップ（店舗ピン） */
		mapsUrl: z.string().url().optional(),
		/** 取扱開始（おおよその年月でよい） */
		startedAt: z.coerce.date().optional(),
		/** 取扱終了（archived のとき） */
		endedAt: z.coerce.date().optional(),
		order: z.number().default(0),
	}),
});

export const collections = { magazines, articles, authors, events, qa, bookstores };
