import { visit } from 'unist-util-visit';

const SKIP_TAGS = new Set(['code', 'pre', 'kbd', 'samp', 'script', 'style', 'svg', 'rt']);
/** 二倍ダーシ：U+2014 EM DASH と U+2015 HORIZONTAL BAR */
const DASH_SPLIT = /([—―]{2,})/;
const DASH_ONLY = /^[—―]{2,}$/;

/**
 * ―― / —— を .emdash で包み、字間ギャップと途中改行を防ぐ
 * @returns {import('unified').Plugin<[], import('hast').Root>}
 */
export function rehypeEmdash() {
	return (tree) => {
		visit(tree, 'text', (node, index, parent) => {
			if (parent == null || index == null || parent.type !== 'element') return;
			if (parent.tagName === 'span' && classList(parent).includes('emdash')) return;
			if (SKIP_TAGS.has(parent.tagName)) return;

			const value = node.value;
			if (!value || !DASH_SPLIT.test(value)) return;

			/** @type {import('hast').ElementContent[]} */
			const next = [];
			for (const part of value.split(DASH_SPLIT)) {
				if (!part) continue;
				if (DASH_ONLY.test(part)) {
					next.push({
						type: 'element',
						tagName: 'span',
						properties: { className: ['emdash'] },
						children: [{ type: 'text', value: part.replaceAll('—', '―') }],
					});
				} else {
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
