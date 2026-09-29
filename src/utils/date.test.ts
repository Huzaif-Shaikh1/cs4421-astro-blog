import { describe, test, expect } from 'vitest';
import { formatDate } from './date';

describe('formatDate', () => {
	test('formats a date as "Mon D, YYYY"', () => {
		expect(formatDate(new Date(2026, 8, 29))).toBe('Sep 30, 2026');
	});

	test('does not add a leading zero to single-digit days', () => {
		expect(formatDate(new Date(2026, 2, 5))).toBe('Mar 5, 2026');
	});
});