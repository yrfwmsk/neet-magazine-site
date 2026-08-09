# 記事本文の区切りルール

記事 MDX（`src/content/articles/**/*.mdx`）の段落・余白の付け方。

note からの取り込みは `scripts/note-to-mdx-body.mjs` が同じルールで変換する。手動編集時もこの仕様に合わせる。

---

## 3段階のスペース

| 区分 | 用途 | MDX での書き方 | 表示 |
|------|------|----------------|------|
| **大スペース** | 章・場面転換 | 見出し（`##` / `###` / `<h2>`）または `◆` | 大きな余白 |
| **中スペース** | 意味のまとまりごと | `<p class="section-break"></p>` | やや広い余白 |
| **小スペース** | 改行ごとの段落 | 空行で区切った通常段落 | 標準の段落間隔 |

### 大スペース

**見出し**

```mdx
## ■ 見出しタイトル
```

数字のみの大見出し（中央揃え）:

```mdx
<h2 class="section-number">１</h2>
```

**◆ 区切り**

```mdx
<p class="section-mark">◆</p>
```

- 単独の `◆` 行は使わない
- `◆` の直前・直後に `section-break` は付けない（`section-mark` 自体の余白で足りる）

◆ のあとから次の見出しまでを補足・コメント扱いにする場合は `section-aside` で囲む（引用と同じ muted 色・左線）。

```mdx
<p class="section-mark">◆</p>

<div class="section-aside">

補足段落。

</div>

## ■ 次の見出し
```

### 中スペース

意味上ひとまとまりの段落群のあいだに入れる。

```mdx
前のまとまりの最後の段落。

<p class="section-break"></p>

次のまとまりの最初の段落。
```

note 取り込みでは、別 `<p>` ブロックの境界や、連続 `<br><br>` / 空 `<p>` がこれに相当する。

### 小スペース

改行するたびに独立した段落にする。段落のあいだは空行1行。

```mdx
一行目の段落。

二行目の段落。

三行目の段落。
```

- 最終形では `<br />` で段落をつながない
- 段落頭の一字下げ（行頭の全角スペース `　`）は使わない

---

## 編集時の判断

1. **場面が変わる・章が変わる** → 大スペース（見出し or `◆`）
2. **同じ場面のなかで話題・視点のまとまりが変わる** → 中スペース（`section-break`）
3. **同じまとまりのなかで改行したい** → 小スペース（空行区切りの段落）

---

## 参考例

- 小スペースのみ: `src/content/articles/vol4/mountain-neet.mdx`
- 小＋中＋大: `src/content/articles/vol4/moving-lyricism.mdx`
- 大見出し（`## ■`）: `src/content/articles/vol4/work-and-life.mdx`
- 小＋中＋大＋`section-aside`: `src/content/articles/vol4/unemployed-life-fragments.mdx`

---

## 関連

- 変換スクリプト: `scripts/note-to-mdx-body.mjs`（先頭コメントに同じ定義あり）
- スタイル: `src/styles/global.css`（`.prose p` / `.section-break` / `.section-mark` / `.section-aside` / `h2.section-number`）
