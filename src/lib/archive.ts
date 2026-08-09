import { getEventDateKey, getTokyoDateKey } from './date';

/** archiveAt を YYYY-MM-DD に（比較用） */
export function getArchiveDateKey(date: Date): string {
	return getEventDateKey(date);
}

/** archiveAt 当日（Asia/Tokyo）から Web アーカイブを公開する */
export function isArchiveAvailable(archiveAt?: Date, todayKey: string = getTokyoDateKey()): boolean {
	if (!archiveAt) return true;
	return todayKey >= getArchiveDateKey(archiveAt);
}

/** 号ごとの archiveAt から、記事が検索・閲覧可能か判定する */
export function isVolumeArchiveAvailable(
	volume: string,
	archiveAtByVolume: ReadonlyMap<string, Date | undefined>,
	todayKey: string = getTokyoDateKey(),
): boolean {
	return isArchiveAvailable(archiveAtByVolume.get(volume), todayKey);
}
