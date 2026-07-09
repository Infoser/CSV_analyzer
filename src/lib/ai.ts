import { CRMField, ExtractedLead, SkippedRecord, CSVFieldMapping, AIExtractionResult } from '@/types';

const CRM_FIELDS: (keyof CRMField)[] = [
  'created_at',
  'name',
  'email',
  'country_code',
  'mobile_without_country_code',
  'company',
  'city',
  'state',
  'country',
  'lead_owner',
  'crm_status',
  'crm_note',
];

const CRM_FIELD_DESCRIPTIONS: Record<keyof CRMField, string> = {
  created_at: 'Lead creation date (date/time when lead was created)',
  name: 'Full name of the lead/contact person',
  email: 'Primary email address',
  country_code: 'Country calling code (e.g., +1, +91, +44)',
  mobile_without_country_code: 'Mobile phone number without country code',
  company: 'Company/organization name',
  city: 'City name',
  state: 'State/province name',
  country: 'Country name',
  lead_owner: 'Name of the sales rep or account owner',
  crm_status: 'Lead status (e.g., New, Contacted, Qualified, Lost, Won)',
  crm_note: 'Any notes or comments about the lead',
  data_source: 'Source of the lead (e.g., leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots)',
  possession_time: 'Property possession time',
  description: 'Additional description',
  original_data: 'Original row data for reference',
};

const SYSTEM_PROMPT = `You are an AI that maps CSV columns to CRM lead fields. 

Given a CSV with arbitrary column names, you must intelligently map each column to the appropriate CRM field.

CRM Fields to extract:
${CRM_FIELDS.map(f => `- ${f}: ${CRM_FIELD_DESCRIPTIONS[f]}`).join('\n')}

Rules:
1. Map each CSV column to the BEST matching CRM field based on column name and sample values
2. Use semantic understanding - e.g., "Phone", "Mobile", "Contact Number" → mobile_without_country_code
3. Handle variations: "First Name" + "Last Name" → combine into "name"
4. Handle dates in various formats for created_at
5. Handle country codes in phone numbers for phone numbers
6. Extract country_code from phone numbers if present (e.g., +91 9876543210 → country_code: +91, mobile: 9876543210)
7. If a column doesn't match any CRM field well, map to original_data
8. Assign confidence scores (0-1) for each mapping
9. For each row, extract values and assign confidence based on mapping quality
10. Skip rows with very low confidence (< 0.3) or missing essential fields (name OR email OR mobile)

Return JSON with:
{
  "mappings": [{"csv_field": "...", "crm_field": "...", "confidence": 0.9, "sample_values": ["...", "..."]}],
  "extracted_leads": [{"id": "...", "created_at": "...", "name": "...", "email": "...", "country_code": "...", "mobile_without_country_code": "...", "company": "...", "city": "...", "state": "...", "country": "...", "lead_owner": "...", "crm_status": "...", "crm_note": "...", "confidence": 0.9, "matched_fields": ["name", "email", ...]}],
  "skipped_records": [{"id": "...", "original_data": {...}, "reason": "...", "confidence": 0.2}]
}`;

function buildUserPrompt(headers: string[], sampleRows: Record<string, string>[], totalRows: number): string {
  const sampleData = sampleRows.slice(0, 5).map((row, i) => 
    `Row ${i + 1}: ${JSON.stringify(row)}`
  ).join('\n');

  return `CSV Headers: ${headers.join(', ')}
Total Rows: ${totalRows}

Sample Rows:
${sampleData}

Analyze and map columns to CRM fields. Extract all leads.`;
}

function parsePhoneNumber(phone: string): { country_code: string; mobile: string } | null {
  if (!phone) return null;
  
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Check for international format
  const intlMatch = cleaned.match(/^\+(\d{1,3})(\d+)$/);
  if (intlMatch) {
    return { country_code: `+${intlMatch[1]}`, mobile: intlMatch[2] };
  }
  
  // Check for 00 prefix
  const zeroMatch = cleaned.match(/^00(\d{1,3})(\d+)$/);
  if (zeroMatch) {
    return { country_code: `+${zeroMatch[1]}`, mobile: zeroMatch[2] };
  }
  
  // Default: assume no country code
  return { country_code: '', mobile: cleaned };
}

function combineNames(row: Record<string, string>, mappings: CSVFieldMapping[]): string {
  const nameFields = mappings.filter(m => 
    m.crm_field === 'name' && row[m.csv_field]
  );
  
  if (nameFields.length === 0) return '';
  
  // Check for first/last name splits
  const firstName = mappings.find(m => 
    m.csv_field.toLowerCase().includes('first') && row[m.csv_field]
  );
  const lastName = mappings.find(m => 
    m.csv_field.toLowerCase().includes('last') && row[m.csv_field]
  );
  
  if (firstName && lastName) {
    return `${row[firstName.csv_field]} ${row[lastName.csv_field]}`.trim();
  }
  
  // Use the first name field found
  return row[nameFields[0].csv_field] || '';
}

export async function extractLeadsWithAI(
  headers: string[],
  rows: Record<string, string>[],
  sampleRows: Record<string, string>[]
): Promise<AIExtractionResult> {
  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  const apiBase = process.env.NVIDIA_NIM_API_BASE || 'https://integrate.api.nvidia.com/v1';
  const model = process.env.NVIDIA_NIM_MODEL || 'meta/llama-3.1-70b-instruct';

  if (!apiKey) {
    // Fallback: simple heuristic mapping without AI
    return fallbackExtraction(headers, rows, sampleRows);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(headers, sampleRows, rows.length) },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
        max_tokens: 4000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      console.error('NVIDIA NIM API error:', error);
      return fallbackExtraction(headers, rows, sampleRows);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    // Validate and enhance results
    return validateAndEnhanceResult(result, rows, headers);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('AI extraction timeout after 60s, falling back to heuristic extraction');
    } else {
      console.error('AI extraction error:', error);
    }
    return fallbackExtraction(headers, rows, sampleRows);
  }
}

function fallbackExtraction(
  headers: string[],
  rows: Record<string, string>[],
  sampleRows: Record<string, string>[]
): AIExtractionResult {
  const mappings: CSVFieldMapping[] = [];
  const headerLower = headers.map(h => h.toLowerCase());

  // Heuristic mapping based on column names
  const fieldPatterns: Record<keyof CRMField, string[]> = {
    created_at: ['created', 'date', 'time', 'lead_date', 'entry_date', 'registered'],
    name: ['name', 'full_name', 'contact', 'person', 'lead_name', 'first_name', 'last_name'],
    email: ['email', 'e-mail', 'mail', 'email_address', 'contact_email'],
    country_code: ['country_code', 'calling_code', 'phone_code', 'isd_code'],
    mobile_without_country_code: ['mobile', 'phone', 'telephone', 'cell', 'contact', 'number', 'whatsapp'],
    company: ['company', 'organization', 'org', 'firm', 'business', 'account'],
    city: ['city', 'town', 'location_city'],
    state: ['state', 'province', 'region', 'territory'],
    country: ['country', 'nation', 'location_country'],
    lead_owner: ['owner', 'assigned', 'sales_rep', 'agent', 'representative', 'executive'],
    crm_status: ['status', 'stage', 'lead_status', 'pipeline_stage', 'deal_stage'],
    crm_note: ['note', 'notes', 'comment', 'comments', 'description', 'remarks'],
    data_source: ['source', 'data_source', 'lead_source', 'origin'],
    possession_time: ['possession', 'possession_time', 'move_in', 'handover'],
    description: ['description', 'desc', 'details', 'summary'],
    original_data: [],
  };

  headers.forEach((header, idx) => {
    const lower = header.toLowerCase();
    let bestMatch: keyof CRMField | null = null;
    let bestScore = 0;

    for (const [field, patterns] of Object.entries(fieldPatterns)) {
      for (const pattern of patterns) {
        if (lower.includes(pattern)) {
          const score = pattern.length / lower.length;
          if (score > bestScore) {
            bestScore = score;
            bestMatch = field as keyof CRMField;
          }
        }
      }
    }

    // Special handling for phone numbers - check if it might contain country code
    if (!bestMatch && (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact'))) {
      const sample = sampleRows[0]?.[header] || '';
      if (sample.match(/^\+?\d{1,3}[\s\-]?\d+/)) {
        bestMatch = 'mobile_without_country_code';
        bestScore = 0.7;
      }
    }

    if (bestMatch && bestScore > 0.3) {
      mappings.push({
        csv_field: header,
        crm_field: bestMatch,
        confidence: Math.min(0.9, bestScore + 0.3),
        sample_values: sampleRows.slice(0, 3).map(r => r[header]).filter(Boolean),
      });
    } else {
      mappings.push({
        csv_field: header,
        crm_field: 'original_data',
        confidence: 0.1,
        sample_values: sampleRows.slice(0, 3).map(r => r[header]).filter(Boolean),
      });
    }
  });

  // Extract leads
  const extractedLeads: ExtractedLead[] = [];
  const skippedRecords: SkippedRecord[] = [];

  rows.forEach((row, index) => {
    const lead: Partial<ExtractedLead> = {
      id: `lead_${index}`,
      original_data: row,
      matched_fields: [],
      confidence: 0,
    };

    let confidenceSum = 0;
    let mappedCount = 0;

    mappings.forEach(mapping => {
      const value = row[mapping.csv_field];
      if (!value) return;

      if (mapping.crm_field === 'original_data') return;

      if (mapping.crm_field === 'mobile_without_country_code') {
        const parsed = parsePhoneNumber(value);
        if (parsed) {
          (lead as any)[mapping.crm_field] = parsed.mobile;
          if (parsed.country_code) {
            (lead as any).country_code = parsed.country_code;
            lead.matched_fields!.push('country_code');
            confidenceSum += 0.8;
            mappedCount++;
          }
        }
        lead.matched_fields!.push(mapping.crm_field);
      } else if (mapping.crm_field === 'name') {
        const combined = combineNames(row, mappings);
        (lead as any)[mapping.crm_field] = combined;
        lead.matched_fields!.push('name');
      } else {
        (lead as any)[mapping.crm_field] = value;
        lead.matched_fields!.push(mapping.crm_field);
      }
      confidenceSum += mapping.confidence;
      mappedCount++;
    });

    lead.confidence = mappedCount > 0 ? confidenceSum / mappedCount : 0;

    // Check if lead has minimum required fields
    const hasEssential = lead.name || lead.email || lead.mobile_without_country_code;
    
    if (hasEssential && lead.confidence >= 0.3) {
      extractedLeads.push(lead as ExtractedLead);
    } else {
      skippedRecords.push({
        id: `skipped_${index}`,
        original_data: row,
        reason: hasEssential ? 'Low confidence mapping' : 'Missing essential fields (name, email, or mobile)',
        confidence: lead.confidence,
      });
    }
  });

  return { mappings, extracted_leads: extractedLeads, skipped_records: skippedRecords };
}

function validateAndEnhanceResult(
  result: AIExtractionResult,
  rows: Record<string, string>[],
  headers: string[]
): AIExtractionResult {
  // Ensure all leads have IDs and required structure
  result.extracted_leads = result.extracted_leads.map((lead, i) => ({
    ...lead,
    id: lead.id || `lead_${i}`,
    original_data: lead.original_data || rows[i] || {},
    matched_fields: lead.matched_fields || [],
    confidence: typeof lead.confidence === 'number' ? lead.confidence : 0.5,
  }));

  result.skipped_records = result.skipped_records.map((skipped, i) => ({
    ...skipped,
    id: skipped.id || `skipped_${i}`,
    original_data: skipped.original_data || {},
    reason: skipped.reason || 'Unknown reason',
    confidence: typeof skipped.confidence === 'number' ? skipped.confidence : 0,
  }));

  return result;
}

export function buildParseResult(extraction: AIExtractionResult): {
  success: boolean;
  data: ExtractedLead[];
  skipped: SkippedRecord[];
  total_imported: number;
  total_skipped: number;
} {
  return {
    success: true,
    data: extraction.extracted_leads,
    skipped: extraction.skipped_records,
    total_imported: extraction.extracted_leads.length,
    total_skipped: extraction.skipped_records.length,
  };
}