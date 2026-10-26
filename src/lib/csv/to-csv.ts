// src/lib/csv/to-csv.ts

const FORMULA_START = /^[=+\-@\t\r]/;

export type CsvColumn<T> = {
  label: string;
  value: (row: T) => unknown;
  trusted?: boolean;
};

/**
 * Generates an Excel-friendly UTF-8 CSV with optional anti-formula injection,
 * correct quotes escaping and UTF-8 Byte Order Mark (BOM).
 */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[], sep: ';' | ',' = ';'): string {
  const cell = (v: unknown, trusted = false): string => {
    if (v == null) return '';
    let s = String(v);
    // Anti-injection of formulas for external unverified data
    if (!trusted && FORMULA_START.test(s)) {
      s = `'${s}`;
    }
    return s.includes(sep) || /["\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const header = columns.map((c) => cell(c.label)).join(sep);
  const lines = rows.map((r) => columns.map((c) => cell(c.value(r), c.trusted)).join(sep));

  // UTF-8 BOM (\uFEFF) ensures French/African special accented characters display correctly in Excel
  return '\uFEFF' + [header, ...lines].join('\r\n');
}
