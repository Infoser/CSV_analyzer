import Papa from 'papaparse';
import type { CSVRow, CSVParseResult } from '@/types';

async function fileToString(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('utf-8');
}

export async function parseCSV(file: File): Promise<CSVParseResult> {
  const csvString = await fileToString(file);
  return parseCSVFromString(csvString);
}

export function parseCSVFromString(csvString: string): CSVParseResult {
  const results = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value?.trim(),
  });

  if (results.errors.length > 0) {
    const errors = results.errors.map(e => e.message).join('; ');
    throw new Error(`CSV parsing errors: ${errors}`);
  }

  const rows: CSVRow[] = results.data as CSVRow[];
  const headers: string[] = results.meta.fields || [];

  return {
    headers,
    rows,
    totalRows: rows.length,
    previewRows: rows.slice(0, 10),
  };
}

export function rowsToCSV(rows: CSVRow[], headers: string[]): string {
  return Papa.unparse({
    fields: headers,
    data: rows.map(row => headers.map(h => row[h] || '')),
  });
}

export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  const validTypes = [
    'text/csv',
    'application/csv',
    'text/plain',
    'application/vnd.ms-excel',
  ];

  const validExtensions = ['.csv', '.txt'];

  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

  if (!hasValidType && !hasValidExtension) {
    return { valid: false, error: 'Please upload a valid CSV file' };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  return { valid: true };
}

export function sampleRows(rows: CSVRow[], sampleSize: number = 5): CSVRow[] {
  if (rows.length <= sampleSize) return rows;
  
  const step = Math.floor(rows.length / sampleSize);
  const sampled: CSVRow[] = [];
  
  for (let i = 0; i < sampleSize; i++) {
    const index = Math.min(i * step, rows.length - 1);
    sampled.push(rows[index]);
  }
  
  return sampled;
}