/** 二倍ダーシを視覚的に繋げるための HTML 断片へ変換（信頼済みコンテンツ向け） */
export function emdashHtml(text: string): string {
	return text.replaceAll('——', '――').replaceAll('――', '<span class="emdash">――</span>');
}
