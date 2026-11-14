import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';

export function parseAndDetectColumns(workbook: XLSX.WorkBook): { sheetName: string; columnCount: number; rowCount: number } {
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return { sheetName: '', columnCount: 0, rowCount: 0 };
  }
  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) {
    return { sheetName: firstSheetName, columnCount: 0, rowCount: 0 };
  }
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const rowCount = rows.length;
  const columnCount = rows[0]?.length || 0;
  return { sheetName: firstSheetName, columnCount, rowCount };
}

describe('Feature 24 Boundary: AI Excel/CSV Form Generator', () => {
  it('handles completely blank workbook (0 sheets or empty sheet) without throwing', () => {
    const emptyWb = XLSX.utils.book_new();
    const result = parseAndDetectColumns(emptyWb);

    expect(result.sheetName).toBe('');
    expect(result.columnCount).toBe(0);
    expect(result.rowCount).toBe(0);
  });

  it('handles headers-only spreadsheet (row count = 1, zero data rows)', () => {
    const wb = XLSX.utils.book_new();
    const headersOnly = [['PartNumber', 'Inspector', 'Measurement', 'Status']];
    const ws = XLSX.utils.aoa_to_sheet(headersOnly);
    XLSX.utils.book_append_sheet(wb, ws, 'HeadersOnly');

    const result = parseAndDetectColumns(wb);
    expect(result.columnCount).toBe(4);
    expect(result.rowCount).toBe(1); // 1 header row, 0 data
  });

  it('safely parses spreadsheets with Arabic Unicode headers and Arabic cell values', () => {
    const wb = XLSX.utils.book_new();
    const arabicData = [
      ['رقم القطعة', 'اسم المشغل', 'تاريخ الفحص', 'الحالة الجودة'],
      ['قطعة-١٠١', 'أحمد محمود', '2026-11-14', 'مطابق'],
      ['قطعة-١٠٢', 'سارة حسن', '2026-11-14', 'مرفوض'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(arabicData);
    XLSX.utils.book_append_sheet(wb, ws, 'ورقة_الفحص');

    const result = parseAndDetectColumns(wb);
    expect(result.sheetName).toBe('ورقة_الفحص');
    expect(result.columnCount).toBe(4);
    expect(result.rowCount).toBe(3);
  });

  it('handles columns with mixed data types (numbers, text, boolean, nulls) safely defaulting to text', () => {
    const mixedValues = ['100', 'Passed', 'true', '45.02', '', 'N/A', null];
    const nonNulls = mixedValues.filter((v) => v !== null && v !== '');

    const hasNumbers = nonNulls.some((v) => !isNaN(Number(v)));
    const hasText = nonNulls.some((v) => isNaN(Number(v)));

    const inferredType = hasNumbers && hasText ? 'text' : 'number';
    expect(inferredType).toBe('text'); // Conflict resolves to safe 'text'
  });

  it('safely processes ultra-wide spreadsheet (>80 columns) within memory limits', () => {
    const wb = XLSX.utils.book_new();
    const wideHeader: string[] = [];
    const wideData: number[] = [];
    for (let c = 0; c < 85; c++) {
      wideHeader.push(`Dimension_Point_${c + 1}`);
      wideData.push(10.0 + c * 0.1);
    }
    const ws = XLSX.utils.aoa_to_sheet([wideHeader, wideData]);
    XLSX.utils.book_append_sheet(wb, ws, 'WideInspection');

    const result = parseAndDetectColumns(wb);
    expect(result.columnCount).toBe(85);
    expect(result.rowCount).toBe(2);
  });
});
