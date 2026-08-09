import {
	DEFAULT_CONTACT_TO_EMAIL,
	formatContactEmail,
	validateContactSubmission,
	type ContactSubmission,
} from '../../src/lib/contact-shared';

type ContactEnv = {
	RESEND_API_KEY?: string;
	CONTACT_TO_EMAIL?: string;
	CONTACT_FROM_EMAIL?: string;
};

const json = (body: Record<string, unknown>, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
		},
	});

const isContactSubmission = (value: unknown): value is ContactSubmission => {
	if (!value || typeof value !== 'object' || !('kind' in value)) return false;
	const kind = (value as { kind?: unknown }).kind;
	return kind === 'member' || kind === 'contribution' || kind === 'survey' || kind === 'other';
};

async function sendWithResend(
	env: ContactEnv,
	email: ReturnType<typeof formatContactEmail>,
	toEmail: string,
) {
	if (!env.RESEND_API_KEY) {
		throw new Error('RESEND_API_KEY is not configured');
	}

	if (!env.CONTACT_FROM_EMAIL) {
		throw new Error('CONTACT_FROM_EMAIL is not configured');
	}

	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.RESEND_API_KEY}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			from: env.CONTACT_FROM_EMAIL,
			to: [toEmail],
			subject: email.subject,
			text: email.body,
			...(email.replyTo ? { reply_to: email.replyTo } : {}),
		}),
	});

	if (!response.ok) {
		const errorBody = await response.text();
		console.error('Resend API error:', response.status, errorBody);
		throw new Error('Failed to send email');
	}
}

type PagesContext = {
	request: Request;
	env: ContactEnv;
};

export const onRequestPost = async (context: PagesContext) => {
	let submission: unknown;

	try {
		submission = await context.request.json();
	} catch {
		return json({ message: '送信内容を読み取れませんでした。' }, 400);
	}

	if (!isContactSubmission(submission)) {
		return json({ message: '送信内容が不正です。' }, 400);
	}

	const validationError = validateContactSubmission(submission);
	if (validationError) {
		return json({ message: validationError }, 400);
	}

	const toEmail = context.env.CONTACT_TO_EMAIL?.trim() || DEFAULT_CONTACT_TO_EMAIL;
	const email = formatContactEmail(submission);

	try {
		await sendWithResend(context.env, email, toEmail);
	} catch (error) {
		console.error(error);
		return json({ message: 'メールの送信に失敗しました。' }, 500);
	}

	return json({ accepted: true });
};
