/**
 * 2DA V2.0 text parser.
 *
 * Parses the NWN two-dimensional array text format used by all game data
 * tables (classes, feats, skills, spells, etc.).
 *
 * Format:
 *   Line 1: "2DA V2.0" header
 *   Line 2: empty (blank line)
 *   Line 3: column headers (whitespace-separated)
 *   Line 4+: data rows (index + values, whitespace-separated)
 *
 * Special handling:
 *   - "****" values are converted to null (absent data marker)
 *   - Quoted values ("War Wizard") preserve internal spaces
 *   - Row indices may be non-contiguous (gaps from DELETED rows)
 *   - Rows with fewer values than columns default trailing columns to null
 *   - Columns are resolved by name from the header, never by position
 *
 * @module
 */

/**
 * Parsed 2DA table. Provides column-addressed access to row data.
 */
export interface TwoDaTable {
  /** Column header names in declaration order. */
  readonly columns: string[];

  /** Map from row index to column->value record. Indices may be non-contiguous. */
  readonly rows: Map<number, Record<string, string | null>>;

  /**
   * Get the value at the given row index and column name.
   *
   * @param row - The row index (from the 2DA file, may be non-contiguous).
   * @param column - The column header name (case-sensitive).
   * @returns The cell value, or null if the row/column doesn't exist or the
   *          value is "****".
   */
  getCell(row: number, column: string): string | null;

  /** Number of data rows present in the table (may differ from max index). */
  readonly rowCount: number;
}

/**
 * Split a 2DA data line into tokens, respecting quoted values.
 *
 * Tokens are whitespace-separated. A token starting with `"` consumes
 * everything up to and including the closing `"`, stripping the quotes
 * from the returned value.
 */
function splitTwoDaLine(line: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  const len = line.length;

  while (i < len) {
    // Skip whitespace
    while (i < len && (line[i] === ' ' || line[i] === '\t')) {
      i++;
    }
    if (i >= len) break;

    if (line[i] === '"') {
      // Quoted token: consume until closing quote
      i++; // skip opening quote
      const start = i;
      while (i < len && line[i] !== '"') {
        i++;
      }
      tokens.push(line.substring(start, i));
      if (i < len) i++; // skip closing quote
    } else {
      // Unquoted token: consume until whitespace
      const start = i;
      while (i < len && line[i] !== ' ' && line[i] !== '\t') {
        i++;
      }
      tokens.push(line.substring(start, i));
    }
  }

  return tokens;
}

/**
 * Parse a 2DA V2.0 text string into a column-addressed table.
 *
 * @param content - The raw 2DA file content as a string.
 * @returns A TwoDaTable for querying cell values by row index and column name.
 */
export function parseTwoDa(content: string): TwoDaTable {
  const lines = content.split('\n').map((l) => l.trimEnd());

  // Find the column header line. The format is:
  //   Line 0: "2DA V2.0"
  //   Line 1: blank
  //   Line 2: column headers
  // But we search for the first non-empty line after the header to be robust.
  let headerLineIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim().length > 0) {
      headerLineIndex = i;
      break;
    }
  }

  if (headerLineIndex === -1) {
    return { columns: [], rows: new Map(), getCell: () => null, rowCount: 0 };
  }

  const columns = splitTwoDaLine(lines[headerLineIndex]);
  const rows = new Map<number, Record<string, string | null>>();

  for (let i = headerLineIndex + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.length === 0) continue;

    const parts = splitTwoDaLine(lines[i]);
    if (parts.length < 1) continue;

    const rowIndex = parseInt(parts[0], 10);
    if (Number.isNaN(rowIndex)) continue;

    const record: Record<string, string | null> = {};

    for (let c = 0; c < columns.length; c++) {
      const value = parts[c + 1]; // +1 to skip row index
      if (value === undefined || value === '****') {
        record[columns[c]] = null;
      } else {
        record[columns[c]] = value;
      }
    }

    rows.set(rowIndex, record);
  }

  return {
    columns,
    rows,
    getCell(row: number, column: string): string | null {
      return rows.get(row)?.[column] ?? null;
    },
    rowCount: rows.size,
  };
}
