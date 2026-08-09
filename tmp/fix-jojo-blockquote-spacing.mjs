import fs from 'fs';

const path = 'src/content/articles/vol4/jojo-golden-wind.mdx';
const raw = fs.readFileSync(path, 'utf8');
const m = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
if (!m) throw new Error('frontmatter not found');

const fm = raw.slice(0, raw.length - m[1].length);
const isQuote = (block) =>
  block.trim().split(/\r?\n/).some((line) => line.trimStart().startsWith('>'));

const blocks = m[1].split(/\r?\n{2,}/);
let removed = 0;

const out = blocks.filter((block, i) => {
  if (block.trim() !== '<p class="section-break"></p>') return true;
  const prev = i > 0 ? blocks[i - 1] : '';
  const next = i < blocks.length - 1 ? blocks[i + 1] : '';
  if (isQuote(prev) || isQuote(next)) {
    removed++;
    return false;
  }
  return true;
});

fs.writeFileSync(path, fm + out.join('\n\n') + '\n', 'utf8');
console.log(`removed ${removed} section-breaks near blockquotes`);
