import fs from 'node:fs';

const frontmatterPath = 'src/content/articles/vol4/stop-adjusting.mdx';
const frontmatter = fs.readFileSync(frontmatterPath, 'utf8').split('---').slice(0, 2).join('---') + '---\n\n';

let body = fs.readFileSync('tmp/stop-adjusting.md', 'utf8');
body = body.replace(/^### (■ .+)$/gm, '## $1');
// ◆ / 見出しの直前後には section-break を付けない
body = body.replace(/\n<p class="section-break"><\/p>\n\n<p class="section-mark">◆<\/p>/g, '\n\n<p class="section-mark">◆</p>');
body = body.replace(/\n<p class="section-mark">◆<\/p>\n\n<p class="section-break"><\/p>/g, '\n\n<p class="section-mark">◆</p>');
body = body.replace(/\n<p class="section-break"><\/p>\n\n(## ■)/g, '\n\n$1');
body = body.replace(/\n{3,}/g, '\n\n').trim() + '\n';

fs.writeFileSync(frontmatterPath, frontmatter + body, 'utf8');
const count = (body.match(/section-break/g) || []).length;
console.log('section-breaks', count);
