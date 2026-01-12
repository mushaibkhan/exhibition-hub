import * as XLSX from 'xlsx';
import { format } from 'date-fns';

/**
 * Export data to Excel file
 * @param data Array of objects to export
 * @param filename Name of the file (without extension)
 * @param sheetName Optional sheet name (defaults to 'Sheet1')
 */
export function exportToExcel(
  data: any[],
  filename: string,
  sheetName: string = 'Sheet1'
): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-size columns
  const maxWidth = 50;
  const colWidths = Object.keys(data[0]).map((key) => {
    const maxLength = Math.max(
      key.length,
      ...data.map((row) => {
        const value = row[key];
        if (value === null || value === undefined) return 0;
        return String(value).length;
      })
    );
    return { wch: Math.min(maxLength + 2, maxWidth) };
  });
  ws['!cols'] = colWidths;

  // Style header row (bold) - Note: Cell styling requires xlsx-style or similar library
  // For now, we'll skip styling as it requires additional dependencies
  // The header row will still be present and columns will be auto-sized

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate filename with date
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const fullFilename = `${filename}_${dateStr}.xlsx`;

  // Write file
  XLSX.writeFile(wb, fullFilename);
}

/**
 * Format date for Excel export
 * @param dateString ISO date string
 * @returns Formatted date string
 */
export function formatDateForExport(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), 'dd MMM yyyy');
  } catch {
    return dateString;
  }
}

/**
 * Format currency for Excel export
 * @param amount Number amount
 * @returns Formatted currency string with ₹ symbol
 */
export function formatCurrencyForExport(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '';
  return `₹${amount.toLocaleString('en-IN')}`;
}
