import { describe, it, expect } from 'vitest';
import { isValidEmail, passwordStrength } from '../src/validators.js';

describe('isValidEmail', () => {
  it.each(['dana@example.com', 'first.last+tag@sub.example.co.il', '  padded@example.org  '])(
    'accepts %s',
    (email) => {
      expect(isValidEmail(email)).toBe(true);
    },
  );

  it.each([
    'plainaddress',
    'missing-at.example.com',
    'no-tld@example',
    'short-tld@example.c',
    'two@@example.com',
    'space in@example.com',
    '.leading@example.com',
    'trailing.@example.com',
    'double..dot@example.com',
  ])('rejects %s', (email) => {
    expect(isValidEmail(email)).toBe(false);
  });

  it('rejects non-strings', () => {
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(42)).toBe(false);
  });

  it('rejects local parts longer than 64 characters', () => {
    expect(isValidEmail(`${'a'.repeat(65)}@example.com`)).toBe(false);
    expect(isValidEmail(`${'a'.repeat(64)}@example.com`)).toBe(true);
  });

  it('rejects addresses longer than 254 characters', () => {
    expect(isValidEmail(`a@${'b'.repeat(250)}.com`)).toBe(false);
  });
});

describe('passwordStrength', () => {
  it('flags empty input', () => {
    expect(passwordStrength('')).toEqual({ score: 0, label: 'very weak', issues: ['EMPTY'] });
    expect(passwordStrength(null).issues).toEqual(['EMPTY']);
  });

  it('flags common passwords regardless of case', () => {
    expect(passwordStrength('Password1')).toEqual({ score: 0, label: 'very weak', issues: ['COMMON'] });
  });

  it('rates a password with every character class as strong', () => {
    expect(passwordStrength('Tr0ub4dor&3')).toEqual({ score: 4, label: 'strong', issues: [] });
  });

  it('lists missing character classes', () => {
    const result = passwordStrength('lowercaseonly');
    expect(result.issues).toEqual(['NO_UPPERCASE', 'NO_DIGIT', 'NO_SYMBOL']);
  });

  it('caps short passwords at weak', () => {
    const result = passwordStrength('Ab1!');
    expect(result.issues).toContain('TOO_SHORT');
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('gives a length bonus to long passwords', () => {
    expect(passwordStrength('correcthorse1').score).toBe(3); // missing upper + symbol, +1 for length
    expect(passwordStrength('correcth1').score).toBe(2);
  });
});
