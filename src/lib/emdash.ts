/** 表示テキストの視覚調整用 HTML 断片へ変換（信頼済みコンテンツ向け） */
export function emdashHtml(text: string): string {
	return text
		.replaceAll('——', '――')
		.replaceAll('――', '<span class="emdash">――</span>')
		// Yu Gothic / Noto Serif JP などで「もう」の字間が空きすぎるのを詰める
		.replaceAll('もう', 'も<span class="opt-kern">う</span>');
}
