import { NextRequest, NextResponse } from 'next/server';
import { parseCSV, validateCSVFile } from '@/lib/csv';
import { CSVParseResult } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const validation = validateCSVFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const parseResult = await parseCSV(file);

    if (parseResult.totalRows === 0) {
      return NextResponse.json(
        { success: false, error: 'CSV file is empty or has no valid rows' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      result: parseResult,
    });
  } catch (error) {
    console.error('Preview API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}