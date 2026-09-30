/**
 * Input validators for user-facing forms.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  '123456',
  '12345678',
  'qwerty',
  'letmein',
  'admin',
  'welcome',
]);

const STRENGTH_LABELS = ['very weak', 'weak', 'fair', 'good', 'strong'];

export function isValidEmail(email) {
  if (typeof email !== 'string') {
    return false;
  }

  const trimmed = email.trim();
  if (trimmed.length > 254 || !EMAIL_RE.test(trimmed)) {
    return false;
  }

  const local = trimmed.slice(0, trimmed.indexOf('@'));
  if (local.length > 64) {
    return false;
  }
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return false;
  }

  return true;
}

/**
 * Normalizes an Israeli phone number to E.164 (+972...).
 * Accepts mobile (05X), VoIP/virtual (07X) and landline (02/03/04/08/09) numbers,
 * with or without the international prefix, spaces or dashes.
 *
 * @returns {string | null} normalized number, or null if invalid
 */
export function normalizeIsraeliPhone(input) {
  if (typeof input !== 'string') {
    return null;
  }

  let digits = input.replace(/[\s\-().]/g, '');

  if (digits.startsWith('+972')) {
    digits = '0' + digits.slice(4);
  } else if (digits.startsWith('00972')) {
    digits = '0' + digits.slice(5);
  } else if (digits.startsWith('972') && digits.length >= 11) {
    digits = '0' + digits.slice(3);
  }

  // Some people write the trunk zero after the country code: +972-0-52-...
  if (digits.startsWith('00')) {
    digits = digits.slice(1);
  }

  if (!/^\d+$/.test(digits)) {
    return null;
  }

  const isMobile = /^05\d{8}$/.test(digits);
  const isVoip = /^07\d{8}$/.test(digits);
  const isLandline = /^0[23489]\d{7}$/.test(digits);

  if (!isMobile && !isVoip && !isLandline) {
    return null;
  }

  return '+972' + digits.slice(1);
}

export function isValidIsraeliPhone(input) {
  return normalizeIsraeliPhone(input) !== null;
}

/**
 * Scores a password from 0 (very weak) to 4 (strong).
 *
 * @returns {{ score: number, label: string, issues: string[] }}
 */
export function passwordStrength(password) {
  if (typeof password !== 'string' || password.length === 0) {
    return { score: 0, label: STRENGTH_LABELS[0], issues: ['EMPTY'] };
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { score: 0, label: STRENGTH_LABELS[0], issues: ['COMMON'] };
  }

  const issues = [];
  if (password.length < 8) issues.push('TOO_SHORT');
  if (!/[a-z]/.test(password)) issues.push('NO_LOWERCASE');
  if (!/[A-Z]/.test(password)) issues.push('NO_UPPERCASE');
  if (!/\d/.test(password)) issues.push('NO_DIGIT');
  if (!/[^A-Za-z0-9]/.test(password)) issues.push('NO_SYMBOL');

  let score = Math.max(0, 4 - issues.length);
  if (password.length >= 12 && score < 4 && !issues.includes('TOO_SHORT')) {
    score++;
  }
  if (issues.includes('TOO_SHORT')) {
    score = Math.min(score, 1);
  }

  return { score, label: STRENGTH_LABELS[score], issues };
}

/**
 * Validates an Israeli ID number (Teudat Zehut) using its check digit.
 * IDs shorter than 9 digits are left-padded with zeros.
 */
export function isValidIsraeliId(id) {
  const str = String(id ?? '').trim();
  if (!/^\d{5,9}$/.test(str)) {
    return false;
  }

  const padded = str.padEnd(9, '0');
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    let n = Number(padded[i]) * ((i % 2) + 1);
    if (n > 9) {
      n -= 9;
    }
    sum += n;
  }

  return sum % 10 === 0;
}
