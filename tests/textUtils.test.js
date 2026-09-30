import { describe, it, expect } from 'vitest';
import { slugify, capitalizeWords, countWords } from '../src/textUtils.js';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('strips accents', () => {
    expect(slugify('Crème Brûlée')).toBe('creme-brulee');
  });

  it('replaces ampersands with "and"', () => {
    expect(slugify('Salt & Pepper')).toBe('salt-and-pepper');
  });

  it('collapses runs of punctuation and trims separators', () => {
    expect(slugify('  --Hello,   World!!--  ')).toBe('hello-world');
  });

  it('supports a custom separator', () => {
    expect(slugify('Hello World', { separator: '_' })).toBe('hello_world');
  });

  it('respects maxLength without leaving a trailing separator', () => {
    expect(slugify('The quick brown fox', { maxLength: 10 })).toBe('the-quick');
  });

  it('handles null and undefined', () => {
    expect(slugify(undefined)).toBe('');
    expect(slugify(null)).toBe('');
  });
});

describe('capitalizeWords', () => {
  it('capitalizes the first letter of each word', () => {
    expect(capitalizeWords('hello big world')).toBe('Hello Big World');
  });

  it('only touches the first character of each word', () => {
    expect(capitalizeWords('iPhone and USB')).toBe('IPhone And USB');
  });
});

describe('countWords', () => {
  it('counts whitespace-separated words', () => {
    expect(countWords('one two  three\nfour')).toBe(4);
  });

  it('returns 0 for blank input', () => {
    expect(countWords('   ')).toBe(0);
    expect(countWords(undefined)).toBe(0);
  });
});
