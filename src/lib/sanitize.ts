/**
 * HTML Sanitizer & Input Hardener (Blocks Stored and Reflected XSS)
 */

const DANGEROUS_TAGS_REGEX = /<\/?(script|iframe|object|embed|style|link|form|input|button|meta|base|applet|svg)[\s\S]*?>/gi;
const DANGEROUS_ATTRIBUTES_REGEX = /\s*(on[a-z]+|javascript:|vbscript:|data:\s*text\/html)[\s\S]*?=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_PROTOCOL_REGEX = /(href|src)\s*=\s*["']?\s*(javascript:|vbscript:|data:text\/html)/gi;

/**
 * Sanitizes an HTML string by removing dangerous tags, script injections, and event handlers.
 * Allows safe semantic tags (h1-h6, p, ul, ol, li, a, b, strong, i, em, blockquote, hr, br, span, div, table, etc.).
 */
export function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') return '';

  let clean = dirtyHtml;

  // 1. Remove dangerous tags and their contents
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  clean = clean.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  clean = clean.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // 2. Remove remaining dangerous standalone tags
  clean = clean.replace(DANGEROUS_TAGS_REGEX, '');

  // 3. Remove inline event handlers (onload, onerror, onclick, onmouseover, etc.)
  clean = clean.replace(DANGEROUS_ATTRIBUTES_REGEX, '');

  // 4. Remove javascript: and data: text/html in href or src
  clean = clean.replace(JAVASCRIPT_PROTOCOL_REGEX, '$1="#"');

  // 5. Enforce rel="noopener noreferrer" on anchor tags
  clean = clean.replace(/<a\s+(?![^>]*\brel=)([^>]+)>/gi, '<a rel="noopener noreferrer" target="_blank" $1>');

  return clean;
}

/**
 * Escapes characters for plain text rendering to prevent HTML injection.
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Sanitizes CSV cell values to prevent CSV / Excel Formula Injection (CWE-1236).
 * Prepends a single quote if the string begins with =, +, -, @, or tab/return.
 */
export function sanitizeCsvField(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}
