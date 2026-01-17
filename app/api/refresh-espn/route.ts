import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fetchMultipleYears, processESPNData } from '@/lib/espn-api';
import { mergeSeasonData, buildOwnerRecords } from '@/lib/data-merger';
import { OwnerMapping } from '@/types/espn';
import { Season } from '@/types/season';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { years } = body;

    if (!years || !Array.isArray(years) || years.length === 0) {
      return NextResponse.json(
        { error: 'Invalid years parameter. Expected array of years.' },
        { status: 400 }
      );
    }

    const dataDir = join(process.cwd(), 'public', 'data');

    // Load existing data
    let existingSeasons: Season[] = [];
    const seasonsPath = join(dataDir, 'seasons.json');
    if (existsSync(seasonsPath)) {
      existingSeasons = JSON.parse(readFileSync(seasonsPath, 'utf-8'));
    }

    // Create owner mapping from existing data
    const ownerMapping: OwnerMapping[] = [];

    // Build a basic mapping - in production, you'd want a more sophisticated mapping
    existingSeasons.forEach(season => {
      season.standings.forEach(standing => {
        const existingMapping = ownerMapping.find(m => m.ownerName === standing.ownerName);
        if (existingMapping) {
          if (!existingMapping.teamNames.includes(standing.teamName)) {
            existingMapping.teamNames.push(standing.teamName);
          }
        } else {
          ownerMapping.push({
            espnMemberId: '',
            espnDisplayName: standing.ownerName,
            ownerName: standing.ownerName,
            teamNames: [standing.teamName],
          });
        }
      });
    });

    // Fetch ESPN data for requested years
    const espnRawData = await fetchMultipleYears(years);

    // Process ESPN data
    const processedESPNData: Record<number, any> = {};
    for (const [yearStr, espnLeague] of Object.entries(espnRawData)) {
      const year = parseInt(yearStr);
      processedESPNData[year] = processESPNData(espnLeague, year, ownerMapping);
    }

    // Merge with existing seasons
    const mergedSeasons = mergeSeasonData(existingSeasons, processedESPNData);

    // Build updated owner records
    const owners = buildOwnerRecords(mergedSeasons);

    // Save updated data
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

    // Save current season data (most recent year)
    const currentYear = Math.max(...Object.keys(processedESPNData).map(Number));
    if (processedESPNData[currentYear]) {
      writeFileSync(
        join(dataDir, 'current-season.json'),
        JSON.stringify(processedESPNData[currentYear], null, 2),
        'utf-8'
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully refreshed ESPN data for ${years.length} year(s)`,
      data: processedESPNData,
    });
  } catch (error) {
    console.error('ESPN refresh error:', error);
    return NextResponse.json(
      {
        error: 'Failed to refresh ESPN data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
