import { fallbackExtraction, buildUserPrompt, parsePhoneNumber, combineNames } from '@/lib/ai';
import type { CSVFieldMapping, AIExtractionResult } from '@/types';

describe('AI Extraction - Fallback Logic', () => {
  const headers = ['Full Name', 'Email Address', 'Phone Number', 'Company Name', 'City', 'State', 'Country', 'Lead Owner', 'Status', 'Notes', 'Source', 'Possession Time', 'Description'];
  
  const rows = [
    { 'Full Name': 'John Doe', 'Email Address': 'john@example.com', 'Phone Number': '+91-9876543210', 'Company Name': 'GrowEasy', 'City': 'Mumbai', 'State': 'Maharashtra', 'Country': 'India', 'Lead Owner': 'test@gmail.com', 'Status': 'GOOD_LEAD_FOLLOW_UP', 'Notes': 'Interested in demo', 'Source': 'leads_on_demand', 'Possession Time': '2026-06-15', 'Description': '2BHK flat' },
    { 'Full Name': 'Jane Smith', 'Email Address': 'jane@example.com', 'Phone Number': '+1-555-123-4567', 'Company Name': 'TechCorp', 'City': 'San Francisco', 'State': 'California', 'Country': 'USA', 'Lead Owner': 'test@gmail.com', 'Status': 'DID_NOT_CONNECT', 'Notes': 'Busy', 'Source': 'meridian_tower', 'Possession Time': '2026-07-01', 'Description': 'Commercial space' },
    { 'Full Name': '', 'Email Address': '', 'Phone Number': '', 'Company Name': '', 'City': '', 'State': '', 'Country': '', 'Lead Owner': '', 'Status': '', 'Notes': '', 'Source': '', 'Possession Time': '', 'Description': '' },
  ];

  const sampleRows = rows.slice(0, 2);

  describe('fallbackExtraction', () => {
    let result: AIExtractionResult;

    beforeEach(() => {
      result = fallbackExtraction(headers, rows, sampleRows);
    });

    it('maps columns to CRM fields correctly', () => {
      expect(result.mappings.length).toBe(headers.length);
      
      const nameMapping = result.mappings.find(m => m.csv_field === 'Full Name');
      expect(nameMapping?.crm_field).toBe('name');
      expect(nameMapping?.confidence).toBeGreaterThan(0.5);
    });

    it('extracts phone numbers with country codes', () => {
      const lead = result.extracted_leads[0];
      expect(lead.country_code).toBe('+91');
      expect(lead.mobile_without_country_code).toBe('9876543210');
    });

    it('handles US phone format', () => {
      const lead = result.extracted_leads[1];
      expect(lead.country_code).toBe('+1');
      expect(lead.mobile_without_country_code).toBe('5551234567');
    });

    it('skips empty rows', () => {
      expect(result.extracted_leads.length).toBe(2);
      expect(result.skipped_records.length).toBe(1);
      expect(result.skipped_records[0].reason).toContain('Missing essential fields');
    });

    it('maps status to valid enum values', () => {
      const lead = result.extracted_leads[0];
      expect(['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE']).toContain(lead.crm_status);
    });

    it('maps source to valid enum values', () => {
      const lead = result.extracted_leads[0];
      expect(['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots', '']).toContain(lead.data_source);
    });
  });

  describe('parsePhoneNumber', () => {
    it('parses +91 format', () => {
      const result = parsePhoneNumber('+91-9876543210');
      expect(result).toEqual({ country_code: '+91', mobile: '9876543210' });
    });

    it('parses +1 format', () => {
      const result = parsePhoneNumber('+1 555 123 4567');
      expect(result).toEqual({ country_code: '+1', mobile: '5551234567' });
    });

    it('handles 00 prefix', () => {
      const result = parsePhoneNumber('00919876543210');
      expect(result).toEqual({ country_code: '+91', mobile: '9876543210' });
    });

    it('returns null for empty string', () => {
      expect(parsePhoneNumber('')).toBeNull();
      expect(parsePhoneNumber(null as any)).toBeNull();
    });
  });

  describe('combineNames', () => {
    it('combines first and last name', () => {
      const mappings: CSVFieldMapping[] = [
        { csv_field: 'First Name', crm_field: 'name', confidence: 0.9, sample_values: [] },
        { csv_field: 'Last Name', crm_field: 'name', confidence: 0.9, sample_values: [] },
      ];
      const row = { 'First Name': 'John', 'Last Name': 'Doe' };
      expect(combineNames(row, mappings)).toBe('John Doe');
    });

    it('uses single name field if no first/last split', () => {
      const mappings: CSVFieldMapping[] = [
        { csv_field: 'Full Name', crm_field: 'name', confidence: 0.9, sample_values: [] },
      ];
      const row = { 'Full Name': 'John Doe' };
      expect(combineNames(row, mappings)).toBe('John Doe');
    });
  });

  describe('buildUserPrompt', () => {
    it('includes headers and sample rows', () => {
      const prompt = buildUserPrompt(headers, sampleRows, rows.length);
      expect(prompt).toContain('Full Name');
      expect(prompt).toContain('John Doe');
      expect(prompt).toContain('Total Rows: 3');
    });
  });
});