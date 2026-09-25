/**
 * Client-safe text normalization and compression utility.
 * Strips redundant whitespace, zero-width characters, null bytes,
 * and page-break artifacts while preserving semantic structure.
 */

export function compressCvText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\0\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // remove unprintable control chars
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '') // strip zero-width spaces and soft hyphens
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim()) // trim each line & collapse inline spaces
    .filter((line, idx, arr) => {
      // Remove page numbering artifacts like "Page 1 of 2" or standalone digits
      if (/^page\s+\d+(\s+of\s+\d+)?$/i.test(line)) return false;
      // Allow single empty lines, collapse 2+ consecutive empty lines
      if (line === '' && arr[idx - 1] === '') return false;
      return true;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function countWords(text: string): number {
  if (!text) return 0;
  const matches = text.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}
