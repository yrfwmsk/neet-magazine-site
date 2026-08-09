import {
	formatContactReview,
	parseContactForm,
	submitContact,
	type SurveyArticleOption,
} from '../lib/contact';

type ContactPageConfig = {
	contributionOpen: boolean;
	surveyArticleCatalog: SurveyArticleOption[];
};

export function initContactPage({ contributionOpen, surveyArticleCatalog }: ContactPageConfig) {
	const form = document.querySelector('#contact-form');
	const kind = document.querySelector('#kind') as HTMLSelectElement | null;
	const fields = document.querySelector('#contact-fields');
	const submitBtn = document.querySelector('#submit-btn') as HTMLButtonElement | null;
	const status = document.querySelector('#form-status');
	const closedNotice = document.querySelector('#contribution-closed-notice');
	const contributionFields = document.querySelector('#contribution-fields');
	const fieldGroups = document.querySelectorAll('[data-kinds]');
	const impressionArticleSelect = document.querySelector('#survey-impression-article') as HTMLSelectElement | null;
	const impressionSelected = document.querySelector('#survey-impression-selected');
	const impressionSelectedList = document.querySelector('#survey-impression-selected-list');
	const impressionHiddenInputs = document.querySelector('#survey-impression-hidden-inputs');
	const reviewPanel = document.querySelector('#contact-review');
	const reviewList = document.querySelector('#contact-review-list');
	const reviewEditBtn = document.querySelector('#review-edit-btn');
	const reviewSendBtn = document.querySelector('#review-send-btn') as HTMLButtonElement | null;
	const reviewStatus = document.querySelector('#review-status');
	const successPanel = document.querySelector('#contact-success');
	const selectedImpressionArticles = new Set<string>();
	let pendingSubmission: ReturnType<typeof parseContactForm> | null = null;

	const isContributionClosed = () => kind?.value === 'contribution' && !contributionOpen;

	const getArticleLabel = (article: SurveyArticleOption) => `${article.volumeLabel} > ${article.title}`;

	const getCheckedReadVolumes = () =>
		Array.from(form?.querySelectorAll('input[name="survey-volumes"]:checked') ?? []).map(
			(checkbox) => (checkbox as HTMLInputElement).value,
		);

	const pruneImpressionSelections = () => {
		const checkedVolumes = new Set(getCheckedReadVolumes());
		for (const articleId of [...selectedImpressionArticles]) {
			const article = surveyArticleCatalog.find((item) => item.id === articleId);
			if (!article || !checkedVolumes.has(article.volume)) {
				selectedImpressionArticles.delete(articleId);
			}
		}
	};

	const syncImpressionHiddenInputs = () => {
		if (!impressionHiddenInputs) return;
		impressionHiddenInputs.replaceChildren(
			...Array.from(selectedImpressionArticles).map((articleId) => {
				const input = document.createElement('input');
				input.type = 'hidden';
				input.name = 'survey-impression-articles';
				input.value = articleId;
				return input;
			}),
		);
	};

	const renderImpressionDropdown = () => {
		if (!impressionArticleSelect) return;

		const checkedVolumes = getCheckedReadVolumes();
		impressionArticleSelect.replaceChildren();

		const placeholder = document.createElement('option');
		placeholder.value = '';
		if (checkedVolumes.length === 0) {
			placeholder.textContent = '先に上の「お読みになった号」にチェックを入れてください';
			impressionArticleSelect.disabled = true;
			impressionArticleSelect.appendChild(placeholder);
			return;
		}

		placeholder.textContent = 'ここから作品を選んでください';
		impressionArticleSelect.appendChild(placeholder);
		impressionArticleSelect.disabled = false;

		for (const volume of checkedVolumes) {
			const articles = surveyArticleCatalog.filter(
				(article) => article.volume === volume && !selectedImpressionArticles.has(article.id),
			);
			if (articles.length === 0) continue;

			const group = document.createElement('optgroup');
			group.label = articles[0].volumeLabel;
			for (const article of articles) {
				const option = document.createElement('option');
				option.value = article.id;
				option.textContent = article.title;
				group.appendChild(option);
			}
			impressionArticleSelect.appendChild(group);
		}
	};

	const renderSelectedImpressionArticles = () => {
		if (!impressionSelected || !impressionSelectedList) return;

		const selected = surveyArticleCatalog.filter((article) => selectedImpressionArticles.has(article.id));
		impressionSelected.hidden = selected.length === 0;
		impressionSelectedList.replaceChildren(
			...selected.map((article) => {
				const item = document.createElement('li');
				item.className = 'flex items-start justify-between gap-3 border border-[var(--line)] p-3';
				item.innerHTML = `<span>${getArticleLabel(article)}</span>`;
				const removeBtn = document.createElement('button');
				removeBtn.type = 'button';
				removeBtn.className = 'shrink-0 text-sm text-[var(--muted)] underline';
				removeBtn.textContent = '削除';
				removeBtn.addEventListener('click', () => {
					selectedImpressionArticles.delete(article.id);
					renderImpressionDropdown();
					renderSelectedImpressionArticles();
					syncImpressionHiddenInputs();
					updateSubmitState();
				});
				item.appendChild(removeBtn);
				return item;
			}),
		);
	};

	const syncImpressionPicker = () => {
		pruneImpressionSelections();
		renderImpressionDropdown();
		renderSelectedImpressionArticles();
		syncImpressionHiddenInputs();
	};

	const resetImpressionPicker = () => {
		selectedImpressionArticles.clear();
		if (impressionArticleSelect) impressionArticleSelect.value = '';
		syncImpressionPicker();
	};

	const hasImpressionArticles = () => {
		if (kind?.value !== 'survey') return true;
		return selectedImpressionArticles.size > 0;
	};

	const syncContributionClosed = () => {
		const contributionClosed = isContributionClosed();

		if (closedNotice) closedNotice.hidden = !contributionClosed;
		if (!contributionFields) return;

		contributionFields.classList.toggle('opacity-40', contributionClosed);
		contributionFields.classList.toggle('pointer-events-none', contributionClosed);
		contributionFields.querySelectorAll('input, textarea, select').forEach((el) => {
			(el as HTMLInputElement).disabled = contributionClosed;
		});
	};

	const syncRequired = () => {
		const selected = kind?.value ?? '';
		const contributionClosed = isContributionClosed();

		fieldGroups.forEach((group) => {
			const kinds = group.getAttribute('data-kinds')?.split(' ') ?? [];
			const visible = Boolean(selected) && kinds.includes(selected);
			(group as HTMLElement).hidden = !visible;

			group.querySelectorAll('[data-required]').forEach((input) => {
				if (visible && !(selected === 'contribution' && contributionClosed)) {
					input.setAttribute('required', '');
				} else {
					input.removeAttribute('required');
				}
			});
		});

		syncContributionClosed();
	};

	const hasRequiredGroupValue = () => {
		const visibleGroups = Array.from(fieldGroups).filter(
			(group) => !(group as HTMLElement).hidden && group.hasAttribute('data-required-group'),
		);
		return visibleGroups.every((group) => {
			const checkboxes = group.querySelectorAll('input[type="checkbox"]');
			return Array.from(checkboxes).some((checkbox) => (checkbox as HTMLInputElement).checked);
		});
	};

	const isFormValid = () => {
		if (!kind?.value || !fields || (fields as HTMLElement).hidden) return false;
		if (isContributionClosed()) return false;
		if (!hasRequiredGroupValue()) return false;
		if (!hasImpressionArticles()) return false;
		const inputs = fields.querySelectorAll('[required]');
		return Array.from(inputs).every((input) => {
			const el = input as HTMLInputElement | HTMLTextAreaElement;
			return el.validity.valid && el.value.trim() !== '';
		});
	};

	const updateSubmitState = () => {
		syncRequired();
		if (submitBtn) submitBtn.disabled = !isFormValid();
	};

	kind?.addEventListener('change', () => {
		if (fields) (fields as HTMLElement).hidden = !kind.value;
		if (status) status.textContent = '';
		if (kind.value === 'survey') syncImpressionPicker();
		if (kind.value !== 'survey') resetImpressionPicker();
		updateSubmitState();
	});

	impressionArticleSelect?.addEventListener('change', () => {
		const articleId = impressionArticleSelect.value;
		if (!articleId) return;
		selectedImpressionArticles.add(articleId);
		impressionArticleSelect.value = '';
		syncImpressionPicker();
		updateSubmitState();
	});

	form?.addEventListener('input', updateSubmitState);
	form?.addEventListener('change', (event) => {
		if (event.target instanceof HTMLInputElement && event.target.name === 'survey-volumes') {
			syncImpressionPicker();
		}
		updateSubmitState();
	});

	const hideReview = () => {
		if (reviewPanel) (reviewPanel as HTMLElement).hidden = true;
		if (reviewStatus) reviewStatus.textContent = '';
		pendingSubmission = null;
	};

	const showReview = (submission: ReturnType<typeof parseContactForm>) => {
		if (!reviewPanel || !reviewList) return;

		pendingSubmission = submission;
		reviewList.replaceChildren(
			...formatContactReview(submission).map((item) => {
				const wrapper = document.createElement('div');
				const term = document.createElement('dt');
				term.className = 'font-bold';
				term.textContent = item.label;
				const description = document.createElement('dd');
				description.className = 'mt-1 whitespace-pre-wrap text-[var(--muted)]';
				description.textContent = item.value;
				wrapper.append(term, description);
				return wrapper;
			}),
		);

		if (form) (form as HTMLElement).hidden = true;
		if (successPanel) (successPanel as HTMLElement).hidden = true;
		(reviewPanel as HTMLElement).hidden = false;
		if (status) status.textContent = '';
		reviewPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	const showSuccess = () => {
		if (form) (form as HTMLElement).hidden = true;
		if (reviewPanel) (reviewPanel as HTMLElement).hidden = true;
		if (successPanel) (successPanel as HTMLElement).hidden = false;
		successPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	const returnToForm = () => {
		hideReview();
		if (form) (form as HTMLElement).hidden = false;
		if (successPanel) (successPanel as HTMLElement).hidden = true;
		if (status) status.textContent = '';
	};

	form?.addEventListener('submit', (event) => {
		event.preventDefault();
		updateSubmitState();
		if (!isFormValid()) {
			if (status) status.textContent = '必須項目を確認してください。';
			(form as HTMLFormElement).reportValidity();
			return;
		}

		try {
			const submission = parseContactForm(new FormData(form as HTMLFormElement), { surveyArticleCatalog });
			showReview(submission);
		} catch (error) {
			if (status) {
				status.textContent = error instanceof Error ? error.message : '送信内容の確認に失敗しました。';
			}
		}
	});

	reviewEditBtn?.addEventListener('click', returnToForm);

	reviewSendBtn?.addEventListener('click', async () => {
		if (!pendingSubmission || !reviewSendBtn) return;

		reviewSendBtn.setAttribute('disabled', 'true');
		if (reviewStatus) reviewStatus.textContent = '送信中です…';

		const result = await submitContact(pendingSubmission);

		reviewSendBtn.removeAttribute('disabled');

		if (!result.accepted) {
			if (reviewStatus) reviewStatus.textContent = result.message;
			return;
		}

		showSuccess();
	});
}
