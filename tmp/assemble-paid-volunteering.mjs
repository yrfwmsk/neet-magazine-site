import fs from 'node:fs';

const front = `---
volume: vol4
title: 有償ボランティアで生きていく
author: まちぇっと
publishedAt: 2025-11-23
summary: 特集「働きたくない、でも生活はある。」――有償ボランティアで生きていく。
section: 特集寄稿
order: 11
---
`;

let body = fs.readFileSync('tmp/paid-volunteering.md', 'utf8');

// 冒頭の叫び：dot-list ではなく quote-stack
body = body.replace(
	/^\*\*ああ・・・・・・\*\*\n\n\*\*それにしても\*\*\n\n\*\*働きたくないっ\*\*\n\n<ul class="dot-list">\n\t<li>\*\*・・・・・・‼\*\*<\/li>\n<\/ul>/,
	`<div class="quote-stack">
\t<p><strong>ああ・・・・・・</strong></p>
\t<p><strong>それにしても</strong></p>
\t<p><strong>働きたくないっ</strong></p>
\t<p><strong>・・・・・・‼</strong></p>
</div>`,
);

body = body.replace(/^### ■/gm, '## ■');

fs.writeFileSync('src/content/articles/vol4/paid-volunteering.mdx', `${front}\n${body.trim()}\n`, 'utf8');

const breaks = (body.match(/section-break/g) || []).length;
const headings = (body.match(/^## ■/gm) || []).length;
console.log('headings:', headings, 'section-breaks:', breaks, 'chars:', body.length);
