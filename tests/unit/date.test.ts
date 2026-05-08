import { describe, it, expect } from 'vitest';
import { formatDate } from '../../app/utils/date';

describe('formatDate utility', () => {
  it('formats an ISO date string to a default local string (Jakarta TZ)', () => {
    // 2026-05-08T00:00:00Z should be 2026-05-08 07:00:00 in Asia/Jakarta
    expect(formatDate('2026-05-08T00:00:00Z')).toBe('08 May 2026');
  });

  it('uses a custom format string', () => {
    expect(formatDate('2026-05-08T00:00:00Z', 'YYYY/MM/DD')).toBe('2026/05/08');
  });

  it('handles valid regular date strings', () => {
    expect(formatDate('2026-05-08')).toBe('08 May 2026');
  });
});
