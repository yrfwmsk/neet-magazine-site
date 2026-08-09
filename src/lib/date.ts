/** 表示用日付を YYYY/MM/DD に統一する */
export function formatDate(date: Date): string {
	const y = date.getUTCFullYear();
	const m = String(date.getUTCMonth() + 1).padStart(2, '0');
	const d = String(date.getUTCDate()).padStart(2, '0');
	return `${y}/${m}/${d}`;
}

const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土'] as const;

/** 表示用年月（例: 2026年9月）— 取扱期間など */
export function formatYearMonthJa(date: Date): string {
	const y = date.getUTCFullYear();
	const m = date.getUTCMonth() + 1;
	return `${y}年${m}月`;
}

/** 表示用日付（例: 2026年9月13日（日））— コンテンツの日付のみフィールド想定 */
export function formatDateJa(date: Date): string {
	const y = date.getUTCFullYear();
	const m = date.getUTCMonth() + 1;
	const d = date.getUTCDate();
	const weekday = WEEKDAYS_JA[date.getUTCDay()];
	return `${y}年${m}月${d}日（${weekday}）`;
}

/** マーク表示用に年月日を分解する（コンテンツの日付のみフィールド想定） */
export function getDateParts(date: Date): { year: string; month: string; day: string } {
	return {
		year: String(date.getUTCFullYear()),
		month: String(date.getUTCMonth() + 1).padStart(2, '0'),
		day: String(date.getUTCDate()).padStart(2, '0'),
	};
}

/** イベント日付を YYYY-MM-DD に（比較用） */
export function getEventDateKey(date: Date): string {
	const { year, month, day } = getDateParts(date);
	return `${year}-${month}-${day}`;
}

/** Asia/Tokyo の今日を YYYY-MM-DD で返す */
export function getTokyoDateKey(date: Date = new Date()): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Asia/Tokyo',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(date);
}

/** 本日表記（例: 2026年8月8日土曜日）— Asia/Tokyo 基準 */
export function formatTodayLabel(date: Date = new Date()): string {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: 'Asia/Tokyo',
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		weekday: 'short',
	}).formatToParts(date);

	const year = parts.find((p) => p.type === 'year')?.value ?? '';
	const month = parts.find((p) => p.type === 'month')?.value ?? '';
	const day = parts.find((p) => p.type === 'day')?.value ?? '';
	const weekdayEn = parts.find((p) => p.type === 'weekday')?.value ?? '';
	const weekdayMap: Record<string, string> = {
		Sun: '日',
		Mon: '月',
		Tue: '火',
		Wed: '水',
		Thu: '木',
		Fri: '金',
		Sat: '土',
	};
	const weekday = weekdayMap[weekdayEn] ?? WEEKDAYS_JA[date.getDay()];

	return `${year}年${month}月${day}日${weekday}曜日`;
}

export function partitionByTodayDateKey<T extends { dateKey: string }>(
	items: T[],
	todayKey: string = getTokyoDateKey(),
): { upcoming: T[]; past: T[] } {
	const upcoming = items
		.filter((item) => item.dateKey >= todayKey)
		.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
	const past = items
		.filter((item) => item.dateKey < todayKey)
		.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
	return { upcoming, past };
}
