export interface CSVRow {
  [key: string]: string;
}

export interface CSVParseResult {
  headers: string[];
  rows: CSVRow[];
  totalRows: number;
  previewRows: CSVRow[];
}

export interface CSVFieldMapping {
  csv_field: string;
  crm_field: keyof CRMField | 'original_data';
  confidence: number;
  sample_values: string[];
}

export interface CRMField {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: CRMStatus;
  crm_note: string;
  original_data: string;
  data_source: DataSource;
  possession_time: string;
  description: string;
}

export type CRMStatus = 
  | 'GOOD_LEAD_FOLLOW_UP'
  | 'DID_NOT_CONNECT'
  | 'BAD_LEAD'
  | 'SALE_DONE';

export type DataSource = 
  | 'leads_on_demand'
  | 'meridian_tower'
  | 'eden_park'
  | 'varah_swamy'
  | 'sarjapur_plots'
  | '';

export interface ExtractedLead {
  id: string;
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: CRMStatus;
  crm_note: string;
  original_data: CSVRow;
  matched_fields: string[];
  confidence: number;
  data_source: DataSource;
  possession_time: string;
  description: string;
}

export interface SkippedRecord {
  id: string;
  original_data: CSVRow;
  reason: string;
  confidence: number;
}

export interface AIExtractionResult {
  mappings: CSVFieldMapping[];
  extracted_leads: ExtractedLead[];
  skipped_records: SkippedRecord[];
}

export interface ParseResult {
  success: boolean;
  data: ExtractedLead[];
  skipped: SkippedRecord[];
  total_imported: number;
  total_skipped: number;
}

export interface ExtractRequest {
  file: File;
}

export interface ExtractResponse {
  success: boolean;
  result?: ParseResult;
  error?: string;
}

export interface PreviewResponse {
  success: boolean;
  result?: CSVParseResult;
  error?: string;
}