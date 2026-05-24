/**
 * QMS Enterprise 4.0 - Data Export Utilities
 * Handles Excel, CSV, and JSON export for quality records
 */

import * as XLSX from 'xlsx';

export type ExportFormat = 'excel' | 'csv' | 'json';

/**
 * Generic export function for any array of objects
 * @param data Array of objects to export
 * @param fileName Base name of the file (without extension)
 * @param sheetName Name of the sheet (for Excel)
 * @param format Export format (excel, csv, json)
 */
export function exportData<T extends Record<string, any>>(
  data: T[],
  fileName: string,
  sheetName: string = 'Records',
  format: ExportFormat = 'excel'
) {
  if (!data || data.length === 0) {
    throw new Error('No data available to export');
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const fullFileName = `${fileName}_${timestamp}`;

  switch (format) {
    case 'excel': {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${fullFileName}.xlsx`);
      break;
    }
    case 'csv': {
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `${fullFileName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      break;
    }
    case 'json': {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `${fullFileName}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      break;
    }
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Clean data for export by removing internal fields and formatting dates
 */
export function prepareDataForExport<T extends Record<string, any>>(
  data: T[],
  columnMapping?: Record<string, string>
): any[] {
  return data.map(item => {
    const cleanedItem: Record<string, any> = {};
    
    // If we have a specific column mapping, use it
    if (columnMapping) {
      Object.entries(columnMapping).forEach(([key, label]) => {
        let value = item[key];
        
        // Format dates if they look like ISO strings
        if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
          value = new Date(value).toLocaleDateString();
        }
        
        cleanedItem[label] = value ?? '---';
      });
    } else {
      // Default behavior: include all non-private fields
      Object.entries(item).forEach(([key, value]) => {
        if (key.startsWith('_') || key === 'id' || key === 'metadata') return;
        
        let formattedValue = value;
        if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
          formattedValue = new Date(value).toLocaleDateString();
        }
        
        // Capitalize key for label
        const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        cleanedItem[label] = formattedValue ?? '---';
      });
    }
    
    return cleanedItem;
  });
}
