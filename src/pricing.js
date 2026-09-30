/**
 * Pricing utilities: cart subtotals, discounts, VAT and coupons.
 * All monetary values are in shekels (ILS) with two-decimal precision.
 */

export const DEFAULT_VAT_RATE = 0.18;

export function roundMoney(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * @param {{ sku: string, price: number, quantity: number }[]} items
 */
export function calculateSubtotal(items) {
  if (!Array.isArray(items)) {
    throw new TypeError('items must be an array');
  }

  const total = items.reduce((sum, item) => {
    if (!Number.isFinite(item.price) || item.price < 0) {
      throw new RangeError(`Invalid price for item ${item.sku}`);
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new RangeError(`Invalid quantity for item ${item.sku}`);
    }
    return sum + item.price * item.quantity;
  }, 0);

  return roundMoney(total);
}

export function applyPercentageDiscount(amount, percent) {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new RangeError('percent must be between 0 and 100');
  }
  return roundMoney(amount * (1 - percent / 100));
}

export function applyFixedDiscount(amount, discount) {
  if (!Number.isFinite(discount) || discount < 0) {
    throw new RangeError('discount must be a non-negative number');
  }
  return roundMoney(Math.max(0, amount - discount));
}

export function calculateTax(amount, rate = DEFAULT_VAT_RATE) {
  if (!Number.isFinite(rate) || rate < 0) {
    throw new RangeError('rate must be a non-negative number');
  }
  return roundMoney(amount * rate);
}

/**
 * Checks whether a coupon can be applied to a cart.
 *
 * @param {{
 *   code: string,
 *   type: 'percent' | 'fixed',
 *   value: number,
 *   expiresAt?: string | Date,
 *   minSubtotal?: number,
 *   maxUses?: number,
 *   usedCount?: number,
 * }} coupon
 * @param {{ subtotal: number, now?: Date }} context
 * @returns {{ valid: true } | { valid: false, reason: string }}
 */
export function validateCoupon(coupon, { subtotal, now = new Date() } = {}) {
  if (!coupon || typeof coupon.code !== 'string' || coupon.code.trim() === '') {
    return { valid: false, reason: 'MALFORMED' };
  }
  if (coupon.type !== 'percent' && coupon.type !== 'fixed') {
    return { valid: false, reason: 'UNKNOWN_TYPE' };
  }
  if (!Number.isFinite(coupon.value) || coupon.value <= 0) {
    return { valid: false, reason: 'INVALID_VALUE' };
  }
  if (coupon.type === 'percent' && coupon.value > 100) {
    return { valid: false, reason: 'INVALID_VALUE' };
  }
  if (coupon.expiresAt && now > new Date(coupon.expiresAt)) {
    return { valid: false, reason: 'EXPIRED' };
  }
  if (coupon.maxUses !== undefined && (coupon.usedCount ?? 0) >= coupon.maxUses) {
    return { valid: false, reason: 'EXHAUSTED' };
  }
  if (coupon.minSubtotal !== undefined && subtotal <= coupon.minSubtotal) {
    return { valid: false, reason: 'BELOW_MINIMUM' };
  }
  return { valid: true };
}

/**
 * Computes the full cart breakdown. Discounts are applied before VAT.
 */
export function calculateCartTotal(items, { coupon, taxRate = DEFAULT_VAT_RATE, now } = {}) {
  const subtotal = calculateSubtotal(items);

  let discounted = subtotal;
  let couponError = null;

  if (coupon) {
    const result = validateCoupon(coupon, { subtotal, now });
    if (result.valid) {
      discounted =
        coupon.type === 'percent'
          ? applyPercentageDiscount(subtotal, coupon.value)
          : applyFixedDiscount(subtotal, coupon.value);
    } else {
      couponError = result.reason;
    }
  }

  const tax = calculateTax(discounted, taxRate);

  return {
    subtotal,
    discount: roundMoney(subtotal - discounted),
    tax,
    total: roundMoney(discounted + tax),
    couponApplied: Boolean(coupon) && couponError === null,
    couponError,
  };
}
