import { describe, it, expect } from 'vitest';
import { cn } from '../../app/utils/cn';

describe('cn utility', () => {
  it('merges tailwind classes using twMerge and clsx', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    expect(cn('flex', true && 'items-center')).toBe('flex items-center');
    expect(cn('px-2 py-1', { 'text-white': true, 'text-black': false })).toBe('px-2 py-1 text-white');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn(null, undefined, false)).toBe('');
  });
});
