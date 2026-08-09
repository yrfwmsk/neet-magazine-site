export type ContactKind = 'member' | 'contribution' | 'survey' | 'other';

export type ContactSubmission =
	| {
			kind: 'member';
			name: string;
			email: string;
			noteId: string;
			discordId: string;
			neetHistory: string;
			qaConfirmed: boolean;
			magazineImpression: string;
			sampleArticle: string;
	  }
	| {
			kind: 'contribution';
			name: string;
			email: string;
			title: string;
			body: string;
			notes?: string;
	  }
	| {
			kind: 'survey';
			volumes: string[];
			impressionArticles: string[];
			impressionArticleLabels?: string[];
			impressionFeedback?: string;
			overallFeedback?: string;
			futureThemes?: string;
			collabGuests?: string;
	  }
	| {
			kind: 'other';
			name: string;
			email: string;
			message: string;
	  };

export const CONTACT_KIND_LABELS: Record<ContactKind, string> = {
	member: 'メンバー応募',
	contribution: '乱入寄稿応募',
	survey: '匿名読者アンケート',
	other: 'その他',
};

export const DEFAULT_CONTACT_TO_EMAIL = 'neet.na.magazine@gmail.com';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isNonEmpty = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

const readString = (formData: FormData, name: string) => {
	const value = formData.get(name);
	return typeof value === 'string' ? value.trim() : '';
};

const readCheckbox = (formData: FormData, name: string) => formData.get(name) === 'on';

const readStringArray = (formData: FormData, name: string) =>
	formData
		.getAll(name)
		.filter((value): value is string => typeof value === 'string')
		.map((value) => value.trim())
		.filter(Boolean);

export type SurveyArticleOption = {
	id: string;
	volume: string;
	volumeLabel: string;
	title: string;
};

export function parseContactForm(
	formData: FormData,
	options?: { surveyArticleCatalog?: SurveyArticleOption[] },
): ContactSubmission {
	const kind = readString(formData, 'kind') as ContactKind;

	switch (kind) {
		case 'member':
			return {
				kind,
				name: readString(formData, 'member-name'),
				email: readString(formData, 'member-email'),
				noteId: readString(formData, 'member-note-id'),
				discordId: readString(formData, 'member-discord-id'),
				neetHistory: readString(formData, 'member-neet-history'),
				qaConfirmed: readCheckbox(formData, 'member-qa-confirmed'),
				magazineImpression: readString(formData, 'member-magazine-impression'),
				sampleArticle: readString(formData, 'member-sample-article'),
			};
		case 'contribution':
			return {
				kind,
				name: readString(formData, 'contribution-name'),
				email: readString(formData, 'contribution-email'),
				title: readString(formData, 'contribution-title'),
				body: readString(formData, 'contribution-body'),
				notes: readString(formData, 'contribution-notes') || undefined,
			};
		case 'survey': {
			const impressionArticles = readStringArray(formData, 'survey-impression-articles');
			const catalog = options?.surveyArticleCatalog ?? [];
			const impressionArticleLabels = impressionArticles.map((articleId) => {
				const article = catalog.find((item) => item.id === articleId);
				return article ? `${article.volumeLabel} > ${article.title}` : articleId;
			});

			return {
				kind,
				volumes: readStringArray(formData, 'survey-volumes'),
				impressionArticles,
				impressionArticleLabels,
				impressionFeedback: readString(formData, 'survey-impression-feedback') || undefined,
				overallFeedback: readString(formData, 'survey-overall') || undefined,
				futureThemes: readString(formData, 'survey-themes') || undefined,
				collabGuests: readString(formData, 'survey-guests') || undefined,
			};
		}
		case 'other':
			return {
				kind,
				name: readString(formData, 'other-name'),
				email: readString(formData, 'other-email'),
				message: readString(formData, 'other-message'),
			};
		default:
			throw new Error('種別が選択されていません。');
	}
}

export function validateContactSubmission(submission: ContactSubmission): string | null {
	switch (submission.kind) {
		case 'member':
			if (!isNonEmpty(submission.name)) return 'お名前・ハンドルネームを入力してください。';
			if (!EMAIL_PATTERN.test(submission.email)) return '連絡用メールアドレスを確認してください。';
			if (!isNonEmpty(submission.noteId)) return 'noteアカウントを入力してください。';
			if (!isNonEmpty(submission.discordId)) return 'Discordユーザー名を入力してください。';
			if (!isNonEmpty(submission.neetHistory)) return 'ニート経歴（自己紹介）を入力してください。';
			if (!submission.qaConfirmed) return '活動内容とQ&Aの確認にチェックを入れてください。';
			if (!isNonEmpty(submission.magazineImpression)) return '冊子版ニートマガジンを読んだ感想を入力してください。';
			if (!isNonEmpty(submission.sampleArticle)) return 'サンプル記事を入力してください。';
			return null;
		case 'contribution':
			if (!isNonEmpty(submission.name)) return '名前を入力してください。';
			if (!EMAIL_PATTERN.test(submission.email)) return 'メールアドレスを確認してください。';
			if (!isNonEmpty(submission.title)) return 'タイトルを入力してください。';
			if (!isNonEmpty(submission.body)) return '本文を入力してください。';
			return null;
		case 'survey':
			if (submission.volumes.length === 0) return 'お読みになった号を1つ以上選択してください。';
			if (submission.impressionArticles.length === 0) return '印象に残った作品を1つ以上選択してください。';
			return null;
		case 'other':
			if (!isNonEmpty(submission.name)) return 'お名前・ハンドルネームを入力してください。';
			if (!EMAIL_PATTERN.test(submission.email)) return 'メールアドレスを確認してください。';
			if (!isNonEmpty(submission.message)) return '内容を入力してください。';
			return null;
		default:
			return '種別が不正です。';
	}
}

const formatVolumeLabel = (volume: string) => {
	const number = volume.replace(/^vol/i, '');
	return `vol.${number}`;
};

const appendSection = (lines: string[], label: string, value?: string) => {
	if (!value?.trim()) return;
	lines.push(`${label}:`);
	lines.push(value.trim());
	lines.push('');
};

export function formatContactEmail(submission: ContactSubmission): { subject: string; body: string; replyTo?: string } {
	const kindLabel = CONTACT_KIND_LABELS[submission.kind];
	const lines = [`種別: ${kindLabel}`, ''];

	switch (submission.kind) {
		case 'member':
			appendSection(lines, 'お名前・ハンドルネーム', submission.name);
			appendSection(lines, '連絡用メールアドレス', submission.email);
			appendSection(lines, 'noteアカウント', submission.noteId);
			appendSection(lines, 'Discordユーザー名', submission.discordId);
			appendSection(lines, 'ニート経歴（自己紹介）', submission.neetHistory);
			lines.push('活動内容とQ&Aの確認: はい', '');
			appendSection(lines, '冊子版ニートマガジンを読んだ感想', submission.magazineImpression);
			appendSection(lines, 'サンプル記事', submission.sampleArticle);
			return {
				subject: `【ニートマガジン】${kindLabel}`,
				body: lines.join('\n'),
				replyTo: submission.email,
			};
		case 'contribution':
			appendSection(lines, '名前', submission.name);
			appendSection(lines, 'メールアドレス', submission.email);
			appendSection(lines, 'タイトル', submission.title);
			appendSection(lines, '本文', submission.body);
			appendSection(lines, 'その他、質問・要望・相談', submission.notes);
			return {
				subject: `【ニートマガジン】${kindLabel}`,
				body: lines.join('\n'),
				replyTo: submission.email,
			};
		case 'survey': {
			const volumes = submission.volumes.map(formatVolumeLabel).join('、');
			const articles = (submission.impressionArticleLabels ?? submission.impressionArticles).join('\n');
			appendSection(lines, 'お読みになった号', volumes);
			appendSection(lines, '印象に残った作品', articles);
			appendSection(lines, '作品に対する感想や意見', submission.impressionFeedback);
			appendSection(lines, 'ニートマガジン全体に対する感想／意見／批判', submission.overallFeedback);
			appendSection(lines, '今後取り上げてほしい内容や特集テーマ', submission.futureThemes);
			appendSection(lines, 'コラボしてほしいスペシャルゲスト', submission.collabGuests);
			return {
				subject: `【ニートマガジン】${kindLabel}`,
				body: lines.join('\n'),
			};
		}
		case 'other':
			appendSection(lines, 'お名前・ハンドルネーム', submission.name);
			appendSection(lines, 'メールアドレス', submission.email);
			appendSection(lines, '内容', submission.message);
			return {
				subject: `【ニートマガジン】${kindLabel}`,
				body: lines.join('\n'),
				replyTo: submission.email,
			};
	}
}

export type ContactReviewItem = {
	label: string;
	value: string;
};

export function formatContactReview(submission: ContactSubmission): ContactReviewItem[] {
	switch (submission.kind) {
		case 'member':
			return [
				{ label: '種別', value: CONTACT_KIND_LABELS.member },
				{ label: 'お名前・ハンドルネーム', value: submission.name },
				{ label: '連絡用メールアドレス', value: submission.email },
				{ label: 'noteアカウント', value: submission.noteId },
				{ label: 'Discordユーザー名', value: submission.discordId },
				{ label: 'ニート経歴（自己紹介）', value: submission.neetHistory },
				{ label: '活動内容とQ&Aの確認', value: '確認済み' },
				{ label: '冊子版ニートマガジンを読んだ感想', value: submission.magazineImpression },
				{ label: 'サンプル記事', value: submission.sampleArticle },
			];
		case 'contribution':
			return [
				{ label: '種別', value: CONTACT_KIND_LABELS.contribution },
				{ label: '名前', value: submission.name },
				{ label: 'メールアドレス', value: submission.email },
				{ label: 'タイトル', value: submission.title },
				{ label: '本文', value: submission.body },
				{ label: 'その他、質問・要望・相談', value: submission.notes ?? '（未入力）' },
			];
		case 'survey':
			return [
				{ label: '種別', value: CONTACT_KIND_LABELS.survey },
				{
					label: 'お読みになった号',
					value: submission.volumes.map(formatVolumeLabel).join('、'),
				},
				{
					label: '印象に残った作品',
					value: (submission.impressionArticleLabels ?? submission.impressionArticles).join('\n'),
				},
				{ label: '作品に対する感想や意見', value: submission.impressionFeedback ?? '（未入力）' },
				{ label: 'ニートマガジン全体に対する感想／意見／批判', value: submission.overallFeedback ?? '（未入力）' },
				{ label: '今後取り上げてほしい内容や特集テーマ', value: submission.futureThemes ?? '（未入力）' },
				{ label: 'コラボしてほしいスペシャルゲスト', value: submission.collabGuests ?? '（未入力）' },
			];
		case 'other':
			return [
				{ label: '種別', value: CONTACT_KIND_LABELS.other },
				{ label: 'お名前・ハンドルネーム', value: submission.name },
				{ label: 'メールアドレス', value: submission.email },
				{ label: '内容', value: submission.message },
			];
	}
}

const contactApiUrl = import.meta.env.PUBLIC_CONTACT_API_URL ?? '/api/contact';

export async function submitContact(submission: ContactSubmission): Promise<{ accepted: true } | { accepted: false; message: string }> {
	const validationError = validateContactSubmission(submission);
	if (validationError) {
		return { accepted: false, message: validationError };
	}

	try {
		const response = await fetch(contactApiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify(submission),
		});

		const payload = (await response.json().catch(() => null)) as { message?: string } | null;

		if (!response.ok) {
			return {
				accepted: false,
				message: payload?.message ?? '送信に失敗しました。時間をおいて再度お試しください。',
			};
		}

		return { accepted: true };
	} catch {
		return {
			accepted: false,
			message: '送信に失敗しました。ネットワーク接続を確認して再度お試しください。',
		};
	}
}
