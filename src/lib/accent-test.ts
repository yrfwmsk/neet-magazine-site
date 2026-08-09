import { getCollection } from 'astro:content';

export const VOLUME_ACCENTS: Record<string, string> = {
	vol1: '#9C89B3',
	vol2: '#DA7B45',
	vol3: '#398879',
	vol4: '#CBD64F',
	vol5: '#751F32',
};

type MagazineItem = {
	volume: string;
	title: string;
	summary: string;
	publishedAt: Date;
	accentColor: string;
	href: string;
};

export async function getAccentTestMagazines(): Promise<MagazineItem[]> {
	const magazines = await getCollection('magazines');
	return magazines
		.map((magazine) => ({
			volume: magazine.data.volume,
			title: magazine.data.title,
			summary: magazine.data.summary,
			publishedAt: magazine.data.publishedAt,
			accentColor: VOLUME_ACCENTS[magazine.data.volume] ?? magazine.data.accentColor ?? '#888888',
			href: `/magazines/${magazine.data.volume}`,
		}))
		.sort((a, b) => b.publishedAt.valueOf() - a.publishedAt.valueOf());
}

export function volumeLabel(volume: string): string {
	return volume.replace(/^vol/i, '');
}
