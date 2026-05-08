import { describe, it, expect } from 'vitest';
import { siteConfig } from '../../app/config';

describe('siteConfig', () => {
  it('contains the correct site information', () => {
    expect(siteConfig.name).toBe('Andika Dinata');
    expect(siteConfig.title).toContain('Software Engineer');
    expect(siteConfig.url).toBe('https://andikadinata.tech');
    expect(siteConfig.links.github).toBe('https://github.com/andika0x01');
  });
});
