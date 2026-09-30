import { describe, it, expect } from 'vitest';
import {
  roundMoney,
  calculateSubtotal,
  applyPercentageDiscount,
  applyFixedDiscount,
  calculateTax,
  DEFAULT_VAT_RATE,
} from '../src/pricing.js';

describe('roundMoney', () => {
  it('rounds to two decimals', () => {
    expect(roundMoney(10.555)).toBe(10.56);
    expect(roundMoney(10.554)).toBe(10.55);
  });

  it('handles floating point artifacts', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(1.005)).toBe(1.01);
  });
});

describe('calculateSubtotal', () => {
  it('sums price * quantity for every item', () => {
    const items = [
      { sku: 'A', price: 19.9, quantity: 2 },
      { sku: 'B', price: 5, quantity: 1 },
    ];
    expect(calculateSubtotal(items)).toBe(44.8);
  });

  it('returns 0 for an empty cart', () => {
    expect(calculateSubtotal([])).toBe(0);
  });

  it('allows free items', () => {
    expect(calculateSubtotal([{ sku: 'GIFT', price: 0, quantity: 1 }])).toBe(0);
  });

  it('throws when items is not an array', () => {
    expect(() => calculateSubtotal(null)).toThrow(TypeError);
  });

  it('rejects negative or non-numeric prices', () => {
    expect(() => calculateSubtotal([{ sku: 'X', price: -1, quantity: 1 }])).toThrow(/price for item X/);
    expect(() => calculateSubtotal([{ sku: 'Y', price: NaN, quantity: 1 }])).toThrow(RangeError);
  });

  it('rejects zero, negative or fractional quantities', () => {
    expect(() => calculateSubtotal([{ sku: 'X', price: 1, quantity: 0 }])).toThrow(/quantity/);
    expect(() => calculateSubtotal([{ sku: 'X', price: 1, quantity: 1.5 }])).toThrow(/quantity/);
  });
});

describe('applyPercentageDiscount', () => {
  it('applies the percentage', () => {
    expect(applyPercentageDiscount(200, 15)).toBe(170);
    expect(applyPercentageDiscount(99.99, 10)).toBe(89.99);
  });

  it('supports 0% and 100%', () => {
    expect(applyPercentageDiscount(50, 0)).toBe(50);
    expect(applyPercentageDiscount(50, 100)).toBe(0);
  });

  it('rejects out-of-range percentages', () => {
    expect(() => applyPercentageDiscount(50, -5)).toThrow(RangeError);
    expect(() => applyPercentageDiscount(50, 101)).toThrow(RangeError);
  });
});

describe('applyFixedDiscount', () => {
  it('subtracts the discount', () => {
    expect(applyFixedDiscount(100, 25.5)).toBe(74.5);
  });

  it('never goes below zero', () => {
    expect(applyFixedDiscount(20, 50)).toBe(0);
  });

  it('rejects negative discounts', () => {
    expect(() => applyFixedDiscount(20, -1)).toThrow(RangeError);
  });
});

describe('calculateTax', () => {
  it('uses the default VAT rate', () => {
    expect(DEFAULT_VAT_RATE).toBe(0.18);
    expect(calculateTax(100)).toBe(18);
  });

  it('accepts a custom rate', () => {
    expect(calculateTax(200, 0.05)).toBe(10);
    expect(calculateTax(200, 0)).toBe(0);
  });

  it('rounds the result', () => {
    expect(calculateTax(9.99)).toBe(1.8);
  });

  it('rejects negative rates', () => {
    expect(() => calculateTax(100, -0.1)).toThrow(RangeError);
  });
});
