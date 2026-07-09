import { NextRequest, NextResponse } from 'next/server';
import { parseCSV, validateCSVFile } from '@/lib/csv';
import { extractLeadsWithAI, buildParseResult } from '@/lib/ai';
import { CSVRow, ExtractRequest, ExtractResponse, ParseResult } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' } as ExtractResponse,
        { status: 400 }
      );
    }

    const validation = validateCSVFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error } as ExtractResponse,
        { status: 400 }
      );
    }

    const parseResult = await parseCSV(file);
    
    if (parseResult.totalRows === 0) {
      return NextResponse.json(
        { success: false, error: 'CSV file is empty or has no valid rows' } as ExtractResponse,
        { status: 400 }
      );
    }

    const extraction = await extractLeadsWithAI(
      parseResult.headers,
      parseResult.rows,
      parseResult.previewRows
    );

    const result: ParseResult = buildParseResult(extraction);

    return NextResponse.json({
      success: true,
      result,
    } as ExtractResponse);
  } catch (error) {
    console.error('Extract API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      } as ExtractResponse,
      { status: 500 }
    );
  }
}