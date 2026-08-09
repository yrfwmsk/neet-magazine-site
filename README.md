# ニートマガジン公式サイト

Astroによるニートマガジンの公式サイト兼デジタルアーカイブです。

## 開発

```sh
npm install
npm run dev
npm run build
```

## コンテンツの追加

- 号: `src/content/magazines/` にMarkdownを追加
- 記事: `src/content/articles/<vol>/` にMDXを追加
- イベント: `src/content/events/` にMarkdownを追加

各ファイルのfrontmatterは `src/content.config.ts` のスキーマに従います。記事ファイル名がURLの末尾になります。

## 資産とPDF

- 表紙・イベント写真は `public/images/` に配置し、frontmatterのパスを指定します。
- PDFは `public/pdf/` に配置し、号の `pdfPath` に `/pdf/<ファイル名>.pdf` を設定します。
- PDFビューアにはPDF.jsを使用し、ダウンロードボタンは表示しません。

## 公開

Cloudflare Pagesではビルドコマンドに `npm run build`、出力ディレクトリに `dist` を設定します。静的サイトとして公開できます。

## お問い合わせ送信の有効化

フォームは `/api/contact` に POST し、Cloudflare Pages Functions から Resend 経由でメールを送信します。すべての種別の問い合わせは `neet.na.magazine@gmail.com` に届きます（`CONTACT_TO_EMAIL` で変更可能）。

### 1. Resend の準備

1. [Resend](https://resend.com/) でアカウントを作成する
2. 送信元ドメインを認証する（テスト時は Resend の案内に従い、登録メールアドレス宛のみ送信も可能）
3. API キーを発行する

### 2. Cloudflare Pages の環境変数

Cloudflare ダッシュボードの **Settings → Environment variables** に以下を設定します。

| 変数名 | 必須 | 説明 |
| --- | --- | --- |
| `RESEND_API_KEY` | はい | Resend の API キー |
| `CONTACT_FROM_EMAIL` | はい | 送信元（例: `ニートマガジン <noreply@your-domain.com>`） |
| `CONTACT_TO_EMAIL` | いいえ | 受信先（未設定時は `neet.na.magazine@gmail.com`） |

### 3. ローカルでの API テスト

```sh
npm run build
npx wrangler pages dev dist
```

ブラウザで表示された URL の `/contact` から送信を試せます。ローカルでは `.dev.vars` に同じ環境変数を置いてください。

```ini
RESEND_API_KEY=re_xxxxxxxx
CONTACT_FROM_EMAIL=ニートマガジン <onboarding@resend.dev>
CONTACT_TO_EMAIL=neet.na.magazine@gmail.com
```

`astro dev` だけでは `/api/contact` は動作しません。フロントの確認画面までは `astro dev` で、実送信は `wrangler pages dev` で確認してください。
# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
