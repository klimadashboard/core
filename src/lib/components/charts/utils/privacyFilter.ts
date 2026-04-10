// $lib/components/charts/utils/privacyFilter.ts

/**
 * Privacy threshold for data suppression.
 * Values of 6 or less are set to 0 for data privacy reasons.
 */
export const PRIVACY_THRESHOLD = 6;

/**
 * Result of applying a privacy filter to data
 */
export interface PrivacyFilterResult<T> {
	/** The filtered data */
	data: T;
	/** Whether any values were suppressed due to privacy */
	hasPrivacySuppression: boolean;
}

/**
 * Apply privacy filter to a record of category values.
 * Values <= PRIVACY_THRESHOLD are set to 0.
 *
 * @param categories Record mapping category names to values
 * @returns Filtered categories and whether suppression occurred
 */
export function filterCategoryValues(
	categories: Record<string, number>
): PrivacyFilterResult<Record<string, number>> {
	let hasPrivacySuppression = false;
	const filtered: Record<string, number> = {};

	for (const [key, value] of Object.entries(categories)) {
		if (value > 0 && value <= PRIVACY_THRESHOLD) {
			filtered[key] = 0;
			hasPrivacySuppression = true;
		} else {
			filtered[key] = value;
		}
	}

	return { data: filtered, hasPrivacySuppression };
}

/**
 * Check if a single value should be suppressed for privacy
 *
 * @param value The value to check
 * @returns true if the value should be suppressed (set to 0)
 */
export function shouldSuppressValue(value: number): boolean {
	return value > 0 && value <= PRIVACY_THRESHOLD;
}

/**
 * Apply privacy filter to a single value
 *
 * @param value The value to filter
 * @returns 0 if suppressed, otherwise the original value
 */
export function filterValue(value: number): number {
	return shouldSuppressValue(value) ? 0 : value;
}
