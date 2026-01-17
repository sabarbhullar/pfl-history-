import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parseCSV, validateCSV } from '@/lib/csv-processor';
import { mergeSeasonData, buildOwnerRecords } from '@/lib/data-merger';
import { ProcessedESPNData } from '@/types/espn';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Read file content
    const csvContent = await file.text();

    // Validate CSV structure
    const validation = validateCSV(csvContent);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid CSV format',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Parse CSV
    const parseResult = parseCSV(csvContent);

    if (parseResult.errors.length > 0) {
      console.warn('CSV parsing warnings:', parseResult.errors);
    }

    // Load existing ESPN data if available
    const dataDir = join(process.cwd(), 'public', 'data');
    let espnData: Record<number, ProcessedESPNData> = {};

    const currentSeasonPath = join(dataDir, 'current-season.json');
    if (existsSync(currentSeasonPath)) {
      try {
        const espnRaw = JSON.parse(readFileSync(currentSeasonPath, 'utf-8'));
        if (espnRaw.year) {
          espnData[espnRaw.year] = espnRaw;
        }
      } catch (error) {
        console.warn('Failed to load existing ESPN data:', error);
      }
    }

    // Merge CSV data with ESPN data
    const mergedSeasons = mergeSeasonData(parseResult.seasons, espnData);

    // Build owner records
    const owners = buildOwnerRecords(mergedSeasons);

    // Save to files
    writeFileSync(
      join(dataDir, 'seasons.json'),
      JSON.stringify(mergedSeasons, null, 2),
      'utf-8'
    );

    writeFileSync(
      join(dataDir, 'owners.json'),
      JSON.stringify(owners, null, 2),
      'utf-8'
    );

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${parseResult.seasons.length} seasons and ${parseResult.ownerNames.size} owners`,
      data: {
        seasons: parseResult.seasons.length,
        owners: parseResult.ownerNames.size,
        warnings: parseResult.errors,
      },
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process CSV file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
