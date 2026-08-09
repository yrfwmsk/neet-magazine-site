# ニートマガジン公式サイト データモデル仕様

## 1. 基本方針

本サイトでは、コンテンツを固定HTMLとして管理せず、データとして管理する。

主要なデータ単位：

- Magazine（雑誌の号）
- Article（記事）
- Event（イベント）
- Author（著者）

これらをContent Collectionsで管理し、ページを自動生成する。

---

# 2. Magazine（雑誌）

## 役割

ニートマガジン各号の情報を管理する。

例：

- Vol.1
- Vol.2
- Vol.5

## 保持する情報

- volume
- title
- theme
- releaseDate
- coverImage
- pageCount
- description
- pdfPath
- articles

## 表示例

Vol.5

健康

2026年9月13日発行

212ページ

---

# 3. Article（記事）

## 役割

雑誌内の記事本文を管理する。

記事は必ずMagazineに所属する。

## 保持する情報

- title
- author
- magazineVolume
- category
- tags
- description
- publishedDate
- body
- footnotes

## 必須機能

記事ページでは以下を表示する。

- タイトル
- 著者名
- 掲載号
- 本文
- 目次
- 脚注
- 関連記事

---

# 4. Event（イベント）

## 役割

文学フリマなどの活動記録を管理する。

過去イベントも削除せず保存する。

## 保持する情報

- title
- date
- location
- description
- boothNumber
- images
- products
- report

## 表示例

文学フリマ東京43

開催日

会場

ブース番号

販売物

イベントレポート

---

# 5. Author（著者）

## 役割

寄稿者情報を管理する。

将来的な拡張用。

## 保持する情報

- name
- profile
- icon
- articles

---

# 6. データ関係

```
Magazine
|
└── Article

Author
|
└── Article

Event
|
└── Magazine
```

---

# 7. 将来拡張

将来的に追加可能：

- タグページ
- 著者一覧
- 人気記事
- 年表
- 特集ページ

既存データを変更せず追加できる設計にする。
