/** MDX/HTML 本文から検索用のプレーンテキストを作る */
export function plainSearchText(body = ''): string {
	return body
		.replace(/<[^>]+>/g, ' ')
		.replace(/[#>*_`~\[\]\(\)!|]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}
