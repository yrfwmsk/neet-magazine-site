export type {
	ContactKind,
	ContactReviewItem,
	ContactSubmission,
	SurveyArticleOption,
} from './contact-shared';
export {
	CONTACT_KIND_LABELS,
	DEFAULT_CONTACT_TO_EMAIL,
	formatContactEmail,
	formatContactReview,
	parseContactForm,
	validateContactSubmission,
} from './contact-shared';

import { validateContactSubmission, type ContactSubmission } from './contact-shared';

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
