import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { fetchSeasonWithRosters } from '@/lib/espn-api';
import { OwnerMapping } from '@/types/espn';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, ownerMapping = [] } = body;

    if (!year || typeof year !== 'number') {
      return NextResponse.json(
        { error: 'Invalid year parameter. Expected number.' },
        { status: 400 }
      );
    }

    // Fetch roster data
    const matchupsWithRosters = await fetchSeasonWithRosters(year, ownerMapping);

    // Save roster data
    const dataDir = join(process.cwd(), 'public', 'data', 'rosters');
    writeFileSync(
      join(dataDir, `${year}.json`),
      JSON.stringify(matchupsWithRosters, null, 2),
      'utf-8'
    );

    return NextResponse.json({
      success: true,
      message: `Successfully fetched roster data for ${year}`,
      data: {
        matchups: matchupsWithRosters.length,
      },
    });
  } catch (error) {
    console.error('Roster fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch roster data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
