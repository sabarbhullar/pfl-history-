import { Season, Standing } from '@/types/season';
import { Owner } from '@/types/owner';
import { ProcessedESPNData } from '@/types/espn';
import { slugify, calculateWinPercentage } from './utils';

/**
 * Merges CSV historical data with ESPN API data
 * Ensures owner names are tracked consistently
 */
export function mergeSeasonData(
  csvSeasons: Season[],
  espnData: Record<number, ProcessedESPNData>
): Season[] {
  const mergedSeasons = [...csvSeasons];

  // Update or add ESPN data for years 2006-2025
  Object.entries(espnData).forEach(([yearStr, data]) => {
    const year = parseInt(yearStr);
    const existingSeasonIndex = mergedSeasons.findIndex(s => s.year === year);

    if (existingSeasonIndex >= 0) {
      // Update existing season with ESPN data
      const existingSeason = mergedSeasons[existingSeasonIndex];
      mergedSeasons[existingSeasonIndex] = {
        ...existingSeason,
        weeklyScores: data.weeklyMatchups,
        standings: data.standings, // Use ESPN standings as they're more accurate
      };
    } else {
      // Add new season from ESPN data
      const mostPointsStanding = [...data.standings].sort((a, b) => b.pointsFor - a.pointsFor)[0];
      const lastPlaceStanding = data.standings[data.standings.length - 1];

      const newSeason: Season = {
        year,
        champion: data.standings[0]?.ownerName || 'Unknown',
        runnerUp: data.standings[1]?.ownerName || 'Unknown',
        mostPoints: {
          owner: mostPointsStanding?.ownerName || 'Unknown',
          teamName: mostPointsStanding?.teamName || 'Unknown',
          points: mostPointsStanding?.pointsFor || 0,
        },
        lastPlace: lastPlaceStanding?.ownerName || 'Unknown',
        standings: data.standings,
        weeklyScores: data.weeklyMatchups,
        leagueSize: data.standings.length,
        regularSeasonWeeks: 14,
        playoffWeeks: 3,
        keyMoments: [],
      };

      mergedSeasons.push(newSeason);
    }
  });

  return mergedSeasons.sort((a, b) => a.year - b.year);
}

/**
 * Builds comprehensive owner records from season data
 * Combines stats for owners who left and rejoined
 */
export function buildOwnerRecords(seasons: Season[]): Owner[] {
  const ownerMap = new Map<string, Owner>();

  // First pass: collect all data per owner
  seasons.forEach(season => {
    season.standings.forEach(standing => {
      const ownerName = standing.ownerName;
      const ownerId = slugify(ownerName);

      if (!ownerMap.has(ownerId)) {
        ownerMap.set(ownerId, {
          id: ownerId,
          name: ownerName,
          teamNames: [],
          seasonsPlayed: [],
          championships: [],
          runnerUps: [],
          mostPointsSeasons: [],
          lastPlaceSeasons: [],
          totalSeasons: 0,
          playoffAppearances: 0,
          playoffRecord: { wins: 0, losses: 0 },
          isActive: true,
          stats: {
            totalWins: 0,
            totalLosses: 0,
            totalPointsFor: 0,
            totalPointsAgainst: 0,
            winPercentage: 0,
            playoffPercentage: 0,
            bestRecord: { year: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 },
            worstRecord: { year: 0, wins: 999, losses: 0, pointsFor: 0, pointsAgainst: 0 },
            avgPointsPerSeason: 0,
            avgWinsPerSeason: 0,
          },
        });
      }

      const owner = ownerMap.get(ownerId)!;

      // Track team names
      if (!owner.teamNames.includes(standing.teamName)) {
        owner.teamNames.push(standing.teamName);
      }

      // Track season
      if (!owner.seasonsPlayed.includes(season.year)) {
        owner.seasonsPlayed.push(season.year);
        owner.totalSeasons++;
      }

      // Track championship
      if (season.champion === ownerName) {
        owner.championships.push(season.year);
      }

      // Track runner-up
      if (season.runnerUp === ownerName) {
        owner.runnerUps.push(season.year);
      }

      // Track most points
      if (season.mostPoints.owner === ownerName) {
        owner.mostPointsSeasons.push(season.year);
      }

      // Track last place
      if (season.lastPlace === ownerName) {
        owner.lastPlaceSeasons.push(season.year);
      }

      // Track playoff appearance
      if (standing.madePlayoffs) {
        owner.playoffAppearances++;
      }

      // Aggregate stats
      owner.stats.totalWins += standing.wins;
      owner.stats.totalLosses += standing.losses;
      owner.stats.totalPointsFor += standing.pointsFor;
      owner.stats.totalPointsAgainst += standing.pointsAgainst;

      // Track best/worst records
      const winPct = calculateWinPercentage(standing.wins, standing.losses, standing.ties);
      const bestWinPct = calculateWinPercentage(
        owner.stats.bestRecord.wins,
        owner.stats.bestRecord.losses
      );
      const worstWinPct = calculateWinPercentage(
        owner.stats.worstRecord.wins,
        owner.stats.worstRecord.losses
      );

      if (winPct > bestWinPct || owner.stats.bestRecord.year === 0) {
        owner.stats.bestRecord = {
          year: season.year,
          wins: standing.wins,
          losses: standing.losses,
          ties: standing.ties,
          pointsFor: standing.pointsFor,
          pointsAgainst: standing.pointsAgainst,
        };
      }

      if (winPct < worstWinPct || owner.stats.worstRecord.year === 0) {
        owner.stats.worstRecord = {
          year: season.year,
          wins: standing.wins,
          losses: standing.losses,
          ties: standing.ties,
          pointsFor: standing.pointsFor,
          pointsAgainst: standing.pointsAgainst,
        };
      }
    });
  });

  // Second pass: calculate percentages and averages
  ownerMap.forEach(owner => {
    owner.stats.winPercentage = calculateWinPercentage(
      owner.stats.totalWins,
      owner.stats.totalLosses
    );
    owner.stats.playoffPercentage = owner.totalSeasons > 0
      ? Math.round((owner.playoffAppearances / owner.totalSeasons) * 1000) / 10
      : 0;
    owner.stats.avgPointsPerSeason = owner.totalSeasons > 0
      ? Math.round((owner.stats.totalPointsFor / owner.totalSeasons) * 100) / 100
      : 0;
    owner.stats.avgWinsPerSeason = owner.totalSeasons > 0
      ? Math.round((owner.stats.totalWins / owner.totalSeasons) * 10) / 10
      : 0;

    // Sort arrays
    owner.seasonsPlayed.sort((a, b) => a - b);
    owner.championships.sort((a, b) => a - b);
    owner.runnerUps.sort((a, b) => a - b);
    owner.mostPointsSeasons.sort((a, b) => a - b);
    owner.lastPlaceSeasons.sort((a, b) => a - b);
  });

  return Array.from(ownerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Finds an owner by name (case-insensitive, handles variations)
 */
export function findOwnerByName(ownerName: string, owners: Owner[]): Owner | undefined {
  const normalizedName = ownerName.toLowerCase().trim();

  return owners.find(owner => {
    const ownerNameNormalized = owner.name.toLowerCase().trim();
    return (
      ownerNameNormalized === normalizedName ||
      owner.teamNames.some(teamName => teamName.toLowerCase().trim() === normalizedName)
    );
  });
}

/**
 * Updates owner mapping for ESPN integration
 * Maps ESPN display names to canonical owner names
 */
export function createOwnerMapping(
  owners: Owner[],
  espnDisplayName: string,
  teamName?: string
): string {
  // Try exact match first
  let owner = findOwnerByName(espnDisplayName, owners);

  // Try matching by team name if provided
  if (!owner && teamName) {
    owner = findOwnerByName(teamName, owners);
  }

  // If still no match, return the ESPN display name as-is
  return owner ? owner.name : espnDisplayName;
}
