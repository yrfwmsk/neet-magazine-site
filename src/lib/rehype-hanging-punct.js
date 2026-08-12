import { visit } from 'unist-util-visit';

const SKIP_TAGS = new Set(['code', 'pre', 'kbd', 'samp', 'script', 'style', 'svg', 'rt']);
/** 。、の直後だと詰めぶら下げすると重なる閉じ約物 */
const CLOSING_AFTER_STOP = /^[」』）\)】〉》〕］］"'”’]/;

/**
 * 、。を .punct-hang で包み、行末ぶら下げ（半角幅）を安定させる rehype プラグイン
 * @returns {import('unified').Plugin<[], import('hast').Root>}
 */
export function rehypeHangingPunct() {
	return (tree) => {
		visit(tree, 'text', (node, index, parent) => {
			if (parent == null || index == null || parent.type !== 'element') return;
			if (parent.tagName === 'span' && classList(parent).includes('punct-hang')) return;
			if (SKIP_TAGS.has(parent.tagName)) return;

			const value = node.value;
			if (!value || !/[、。]/.test(value)) return;

			/** @type {import('hast').ElementContent[]} */
			const next = [];
			const parts = value.split(/([、。])/);
			for (let i = 0; i < parts.length; i++) {
				const part = parts[i];
				if (part === '、' || part === '。') {
					const following = parts[i + 1] ?? followingText(parent, index);
					// 。」 のように続く閉じ約物があるときは詰めない（重なり防止）
					if (CLOSING_AFTER_STOP.test(following)) {
						next.push({ type: 'text', value: part });
					} else {
						next.push({
							type: 'element',
							tagName: 'span',
							properties: { className: ['punct-hang'] },
							children: [{ type: 'text', value: part }],
						});
					}
				} else if (part) {
					next.push({ type: 'text', value: part });
				}
			}

			parent.children.splice(index, 1, ...next);
			return index + next.length;
		});
	};
}

/** @param {{ properties?: { className?: string | string[] } }} node */
function classList(node) {
	const raw = node.properties?.className;
	if (!raw) return [];
	return Array.isArray(raw) ? raw : String(raw).split(/\s+/);
}

/**
 * 同一テキストノード内に続きが無いとき、次の兄弟テキスト先頭を見る
 * @param {import('hast').Element} parent
 * @param {number} index
 */
function followingText(parent, index) {
	for (let i = index + 1; i < parent.children.length; i++) {
		const sib = parent.children[i];
		if (sib.type === 'text') return sib.value ?? '';
		if (sib.type === 'element') {
			const first = sib.children?.[0];
			if (first?.type === 'text') return first.value ?? '';
			return '';
		}
	}
	return '';
}
