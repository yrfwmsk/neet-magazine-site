import fs from 'node:fs';

const path = 'src/content/articles/vol4/unemployed-life-dictionary.mdx';
const raw = fs.readFileSync(path, 'utf8');
const m = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
if (!m) throw new Error('no frontmatter');

const intro = m[1].split(/\r?\n\*\*あるばいと【アルバイト】\*\*/)[0].trimEnd().replace(/\r?\n<p class="section-break"><\/p>\s*$/, '');
const dictRaw = '**あるばいと【アルバイト】**' + m[1].split(/\r?\n\*\*あるばいと【アルバイト】\*\*/)[1];

const entryRe = /\*\*([^【*]+)(【[^】]+】)\*\*([^*]*)/g;
const entries = [];
let match;
while ((match = entryRe.exec(dictRaw))) {
	entries.push({
		kana: match[1].trim(),
		kanji: match[2].trim(),
		def: match[3].trim(),
	});
}

if (entries.length < 40) throw new Error(`expected ~42 entries, got ${entries.length}`);

const dictHtml = entries
	.map(
		({ kana, kanji, def }) => `<div class="neet-dictionary__entry">
<p class="neet-dictionary__headword"><strong>${kana}</strong>${kanji}</p>
<p class="neet-dictionary__def">${def}</p>
</div>`,
	)
	.join('\n\n');

const body = `${intro}

<hr />

<div class="neet-dictionary">

${dictHtml}

</div>
`;

const frontmatter = raw.slice(0, raw.length - m[1].length);
fs.writeFileSync(path, frontmatter + body, 'utf8');
console.log(`formatted ${entries.length} dictionary entries`);
