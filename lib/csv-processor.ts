import Papa from 'papaparse';
import { Season, Standing } from '@/types/season';
import { slugify } from './utils';

export interface CSVRow {
  Year: string;
  OwnerName: string;
  TeamName: string;
  Rank: string;
  Wins: string;
  Losses: string;
  Ties?: string;
  PointsFor: string;
  PointsAgainst: string;
  Champion?: string; // "Yes" if they won
  RunnerUp?: string; // "Yes" if they were runner-up
  MadePlayoffs?: string; // "Yes" if they made playoffs
}

export interface CSVProcessResult {
  seasons: Season[];
  ownerNames: Set<string>;
  errors: string[];
}

/**
 * Parses CSV file and converts it to structured season data
 * CSV Expected Format:
 * Year, OwnerName, TeamName, Rank, Wins, Losses, Ties, PointsFor, PointsAgainst, Champion, RunnerUp, MadePlayoffs
 */
export function parseCSV(csvContent: string): CSVProcessResult {
  const errors: string[] = [];
  const ownerNames = new Set<string>();
  const seasonMap = new Map<number, Standing[]>();
  const championMap = new Map<number, string>();
  const runnerUpMap = new Map<number, string>();

  // Parse CSV
  const parseResult = Papa.parse<CSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parseResult.errors.length > 0) {
    parseResult.errors.forEach(error => {
      errors.push(`CSV Parse Error: ${error.message}`);
    });
  }

  // Process each row
  parseResult.data.forEach((row, index) => {
    try {
      const year = parseInt(row.Year);
      if (isNaN(year) || year < 2004 || year > 2025) {
        errors.push(`Row ${index + 2}: Invalid year "${row.Year}"`);
        return;
      }

      const ownerName = row.OwnerName?.trim();
      if (!ownerName) {
        errors.push(`Row ${index + 2}: Missing owner name`);
        return;
      }
      ownerNames.add(ownerName);

      const teamName = row.TeamName?.trim() || 'Unknown Team';
      const rank = parseInt(row.Rank) || 0;
      const wins = parseInt(row.Wins) || 0;
      const losses = parseInt(row.Losses) || 0;
      const ties = parseInt(row.Ties || '0') || 0;
      const pointsFor = parseFloat(row.PointsFor) || 0;
      const pointsAgainst = parseFloat(row.PointsAgainst) || 0;

      // Track champions and runner-ups
      if (row.Champion?.toLowerCase() === 'yes') {
        championMap.set(year, ownerName);
      }
      if (row.RunnerUp?.toLowerCase() === 'yes') {
        runnerUpMap.set(year, ownerName);
      }

      // Create standing entry
      const standing: Standing = {
        rank,
        ownerName,
        teamName,
        wins,
        losses,
        ties: ties > 0 ? ties : undefined,
        pointsFor,
        pointsAgainst,
        madePlayoffs: row.MadePlayoffs?.toLowerCase() === 'yes',
      };

      // Add to season map
      if (!seasonMap.has(year)) {
        seasonMap.set(year, []);
      }
      seasonMap.get(year)!.push(standing);
    } catch (error) {
      errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Convert season map to Season objects
  const seasons: Season[] = Array.from(seasonMap.entries())
    .map(([year, standings]) => {
      // Sort standings by rank
      standings.sort((a, b) => a.rank - b.rank);

      // Find most points
      const mostPointsStanding = [...standings].sort((a, b) => b.pointsFor - a.pointsFor)[0];
      const lastPlaceStanding = standings[standings.length - 1];

      const season: Season = {
        year,
        champion: championMap.get(year) || standings[0]?.ownerName || 'Unknown',
        runnerUp: runnerUpMap.get(year) || standings[1]?.ownerName || 'Unknown',
        mostPoints: {
          owner: mostPointsStanding?.ownerName || 'Unknown',
          teamName: mostPointsStanding?.teamName || 'Unknown',
          points: mostPointsStanding?.pointsFor || 0,
        },
        lastPlace: lastPlaceStanding?.ownerName || 'Unknown',
        standings,
        leagueSize: standings.length,
        regularSeasonWeeks: 14, // Default, can be overridden
        playoffWeeks: 3, // Default, can be overridden
        keyMoments: [],
      };

      return season;
    })
    .sort((a, b) => a.year - b.year);

  return {
    seasons,
    ownerNames,
    errors,
  };
}

/**
 * Validates CSV structure before processing
 */
export function validateCSV(csvContent: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!csvContent || csvContent.trim().length === 0) {
    errors.push('CSV content is empty');
    return { valid: false, errors };
  }

  const parseResult = Papa.parse<CSVRow>(csvContent, {
    header: true,
    preview: 1,
  });

  const requiredColumns = ['Year', 'OwnerName', 'TeamName', 'Wins', 'Losses', 'PointsFor', 'PointsAgainst'];
  const headers = parseResult.meta.fields || [];

  requiredColumns.forEach(col => {
    if (!headers.includes(col)) {
      errors.push(`Missing required column: ${col}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Helper to create owner name to team name mapping
 */
export function createOwnerTeamMapping(seasons: Season[]): Map<string, Set<string>> {
  const mapping = new Map<string, Set<string>>();

  seasons.forEach(season => {
    season.standings.forEach(standing => {
      if (!mapping.has(standing.ownerName)) {
        mapping.set(standing.ownerName, new Set());
      }
      mapping.get(standing.ownerName)!.add(standing.teamName);
    });
  });

  return mapping;
}
