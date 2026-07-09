import { parseCSVFromString, validateCSVFile, rowsToCSV, sampleRows } from '@/lib/csv';
import type { CSVRow } from '@/types';

describe('CSV Parsing', () => {
  const validCSV = `name,email,phone,company
John Doe,john@example.com,+91-9876543210,GrowEasy
Jane Smith,jane@example.com,+1-555-123-4567,TechCorp`;

  const headerOnlyCSV = 'name,email,phone';

  describe('parseCSVFromString', () => {
    it('parses valid CSV correctly', () => {
      const result = parseCSVFromString(validCSV);
      expect(result.headers).toEqual(['name', 'email', 'phone', 'company']);
      expect(result.totalRows).toBe(2);
      expect(result.rows[0]).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+91-9876543210',
        company: 'GrowEasy',
      });
    });

    it('returns empty arrays for header-only CSV', () => {
      const result = parseCSVFromString(headerOnlyCSV);
      expect(result.headers).toEqual(['name', 'email', 'phone']);
      expect(result.totalRows).toBe(0);
    });

    it('trims whitespace from headers and values', () => {
      const csv = ' name , email \n John , john@test.com ';
      const result = parseCSVFromString(csv);
      expect(result.headers).toEqual(['name', 'email']);
      expect(result.rows[0].name).toBe('John');
    });

    it('handles quoted values with commas', () => {
      const csv = 'name,notes\n"John Doe","Likes apples, oranges"';
      const result = parseCSVFromString(csv);
      expect(result.rows[0].notes).toBe('Likes apples, oranges');
    });
  });

  describe('validateCSVFile', () => {
    it('accepts valid CSV file', () => {
      const file = new File([validCSV], 'test.csv', { type: 'text/csv' });
      const result = validateCSVFile(file);
      expect(result.valid).toBe(true);
    });

    it('rejects null file', () => {
      const result = validateCSVFile(null as any);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('No file provided');
    });

    it('rejects files larger than 10MB', () => {
      const largeContent = 'a'.repeat(11 * 1024 * 1024);
      const file = new File([largeContent], 'large.csv', { type: 'text/csv' });
      const result = validateCSVFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10MB');
    });

    it('accepts .txt files', () => {
      const file = new File([validCSV], 'test.txt', { type: 'text/plain' });
      const result = validateCSVFile(file);
      expect(result.valid).toBe(true);
    });

    it('rejects invalid file types', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const result = validateCSVFile(file);
      expect(result.valid).toBe(false);
    });
  });

  describe('rowsToCSV', () => {
    it('converts rows back to CSV', () => {
      const rows: CSVRow[] = [
        { name: 'John', email: 'john@test.com' },
        { name: 'Jane', email: 'jane@test.com' },
      ];
      const headers = ['name', 'email'];
      const csv = rowsToCSV(rows, headers);
      expect(csv).toContain('name,email');
      expect(csv).toContain('John,john@test.com');
    });
  });

  describe('sampleRows', () => {
    it('returns all rows if less than sample size', () => {
      const rows: CSVRow[] = [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
      ];
      const sampled = sampleRows(rows, 5);
      expect(sampled.length).toBe(2);
    });

    it('samples evenly distributed rows', () => {
      const rows: CSVRow[] = Array.from({ length: 100 }, (_, i) => ({ id: String(i), name: `Row ${i}` }));
      const sampled = sampleRows(rows, 10);
      expect(sampled.length).toBe(10);
      expect(sampled[0].id).toBe('0');
      expect(sampled[9].id).toBe('90');
    });
  });
});