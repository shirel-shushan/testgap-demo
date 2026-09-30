/**
 * Text helpers used across the storefront and notification emails.
 */

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function slugify(text, { separator = '-', maxLength } = {}) {
  let slug = String(text ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, separator);

  const edges = new RegExp(`^${escapeRegExp(separator)}+|${escapeRegExp(separator)}+$`, 'g');
  slug = slug.replace(edges, '');

  if (maxLength !== undefined && slug.length > maxLength) {
    slug = slug.slice(0, maxLength).replace(edges, '');
  }

  return slug;
}

export function capitalizeWords(text) {
  return String(text ?? '').replace(/\b([a-z])/g, (_, ch) => ch.toUpperCase());
}

export function countWords(text) {
  const trimmed = String(text ?? '').trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}

/**
 * Shortens text to at most `maxLength` characters (suffix included).
 * When `preserveWords` is true, never cuts in the middle of a word unless the
 * first word alone is longer than the limit.
 */
export function truncate(text, maxLength, { suffix = '…', preserveWords = true } = {}) {
  const str = String(text ?? '');

  if (!Number.isInteger(maxLength) || maxLength < suffix.length) {
    throw new RangeError('maxLength must be an integer at least as long as the suffix');
  }
  if (str.length <= maxLength) {
    return str;
  }

  const limit = maxLength - suffix.length;
  let cut = str.slice(0, limit);

  if (preserveWords) {
    const nextChar = str[limit];
    const cutsMidWord = nextChar !== undefined && !/\s/.test(nextChar);
    if (cutsMidWord) {
      const lastSpace = cut.search(/\s\S*$/);
      if (lastSpace > 0) {
        cut = cut.slice(0, lastSpace);
      }
    }
  }

  return cut.trimEnd() + suffix;
}

/**
 * Renders `{{ path.to.value }}` placeholders. Supports a fallback with
 * `{{ name | Guest }}`.
 *
 * @param {string} template
 * @param {object} data
 * @param {{ strict?: boolean, escapeHtml?: boolean }} options
 *   strict: throw on missing values that have no fallback
 *   escapeHtml: HTML-escape substituted values (fallbacks are trusted)
 */
export function renderTemplate(template, data = {}, { strict = false, escapeHtml = false } = {}) {
  return template.replace(
    /\{\{\s*([\w.]+)\s*(?:\|\s*([^}]*?)\s*)?\}\}/g,
    (_, path, fallback) => {
      const value = path
        .split('.')
        .reduce((obj, key) => (obj == null ? undefined : obj[key]), data);

      if (value === undefined || value === null) {
        if (fallback !== undefined) {
          return fallback;
        }
        if (strict) {
          throw new Error(`Missing template variable: ${path}`);
        }
        return '';
      }

      const str = String(value);
      return escapeHtml ? str.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]) : str;
    },
  );
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
