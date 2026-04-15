/**
 * Slug generation utilities for canonical IDs.
 *
 * Canonical IDs must match `/^[a-z-]+:[A-Za-z0-9._-]+$/` (from canonical-id.ts).
 * 2DA Label columns may contain accented Spanish characters (e.g., Engañar)
 * that need to be transliterated to ASCII before slug generation.
 *
 * @module
 */

/**
 * Map of accented/special characters to their ASCII transliterations.
 * Covers Spanish characters that appear in NWN 2DA Label columns.
 */
const TRANSLITERATION_MAP: Record<string, string> = {
  // Latin-1 accented characters (codepoints 0xC0-0xFF)
  '\u00E1': 'a', // a
  '\u00E9': 'e', // e
  '\u00ED': 'i', // i
  '\u00F3': 'o', // o
  '\u00FA': 'u', // u
  '\u00C1': 'A', // A
  '\u00C9': 'E', // E
  '\u00CD': 'I', // I
  '\u00D3': 'O', // O
  '\u00DA': 'U', // U
  '\u00F1': 'n', // n tilde
  '\u00D1': 'N', // N tilde
  '\u00FC': 'u', // u dieresis
  '\u00DC': 'U', // U dieresis
  '\u00E0': 'a', // a grave
  '\u00E8': 'e', // e grave
  '\u00EC': 'i', // i grave
  '\u00F2': 'o', // o grave
  '\u00F9': 'u', // u grave
  '\u00E4': 'a', // a dieresis
  '\u00EB': 'e', // e dieresis
  '\u00EF': 'i', // i dieresis
  '\u00F6': 'o', // o dieresis
  '\u00E2': 'a', // a circumflex
  '\u00EA': 'e', // e circumflex
  '\u00EE': 'i', // i circumflex
  '\u00F4': 'o', // o circumflex
  '\u00FB': 'u', // u circumflex
};

/**
 * Transliterate a string to ASCII, replacing accented characters.
 * Non-transliterable non-ASCII characters are removed.
 */
function transliterate(input: string): string {
  let result = '';
  for (const char of input) {
    const mapped = TRANSLITERATION_MAP[char];
    if (mapped !== undefined) {
      result += mapped;
    } else if (char.charCodeAt(0) < 128) {
      // ASCII character, keep as-is
      result += char;
    }
    // Non-ASCII characters without a mapping are dropped
  }
  return result;
}

/**
 * Generate a canonical slug from a 2DA Label column value.
 *
 * - Transliterates accented characters to ASCII
 * - Lowercases
 * - Replaces underscores with hyphens
 * - Removes any remaining non-allowed characters
 *
 * @param label - The raw 2DA Label column value.
 * @returns A slug safe for use in canonical IDs.
 */
export function slugify(label: string): string {
  return transliterate(label)
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[^a-z0-9._-]/g, '');
}

/**
 * Generate a canonical ID with a kind prefix from a 2DA Label.
 *
 * @param kind - Entity kind prefix (e.g., 'class', 'skill', 'race').
 * @param label - The raw 2DA Label column value.
 * @returns A canonical ID like 'class:fighter' or 'skill:engnar'.
 */
export function canonicalId(kind: string, label: string): string {
  return `${kind}:${slugify(label)}`;
}
