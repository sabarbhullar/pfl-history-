import { Owner } from '@/types/owner';
import { Season, WeeklyMatchup } from '@/types/season';
import {
  LeaderboardEntry,
  Record,
  HeadToHeadRecord,
  Rivalry,
  AllTimeStats,
} from '@/types/stats';
import { formatRecord } from './utils';

/**
 * Creates leaderboard entries for all-time stats page
 */
export function createLeaderboard(owners: Owner[]): LeaderboardEntry[] {
  return owners.map(owner => ({
    ownerName: owner.name,
    ownerId: owner.id,
    championships: (owner as any).championshipCount ?? owner.championships.length,
    runnerUps: owner.runnerUps?.length || 0,
    mostPointsTitles: owner.mostPointsSeasons?.length || 0,
    lastPlaceFinishes: owner.lastPlaceSeasons?.length || 0,
    playoffPercentage: owner.stats.playoffPercentage,
    winPercentage: owner.stats.winPercentage,
    totalSeasons: owner.totalSeasons,
    totalWins: owner.stats.totalWins,
    totalLosses: owner.stats.totalLosses,
    totalPointsFor: owner.stats.totalPointsFor,
    playoffWins: owner.playoffRecord?.wins || 0,
    playoffLosses: owner.playoffRecord?.losses || 0,
    bestRecord: `${formatRecord(
      owner.stats.bestRecord.wins,
      owner.stats.bestRecord.losses,
      owner.stats.bestRecord.ties
    )} (${owner.stats.bestRecord.year})`,
    worstRecord: `${formatRecord(
      owner.stats.worstRecord.wins,
      owner.stats.worstRecord.losses,
      owner.stats.worstRecord.ties
    )} (${owner.stats.worstRecord.year})`,
    avgPointsPerSeason: owner.stats.avgPointsPerSeason,
    isActive: owner.isActive ?? true,
  }));
}

/**
 * Calculates all-time league records
 */
export function calculateRecords(owners: Owner[], seasons: Season[]): Record[] {
  const records: Record[] = [];

  // Most championships
  if (owners.length > 0) {
    const getChampCount = (o: Owner) => (o as any).championshipCount ?? o.championships.length;
    const mostChampionships = owners.reduce(
      (max, owner) => (getChampCount(owner) > max.count ? { owner, count: getChampCount(owner) } : max),
      { owner: owners[0], count: 0 }
    );
    if (mostChampionships.owner && mostChampionships.count > 0) {
      records.push({
        title: 'Most Championships',
        description: 'Most league championships won',
        ownerName: mostChampionships.owner.name,
        value: mostChampionships.count,
        details: `Years: ${mostChampionships.owner.championships.join(', ')}`,
      });
    }
  }

  // Best win percentage (min 3 seasons)
  const eligibleOwners = owners.filter(o => o.totalSeasons >= 3);
  if (eligibleOwners.length > 0) {
    const bestWinPct = eligibleOwners.reduce((max, owner) =>
      owner.stats.winPercentage > max.stats.winPercentage ? owner : max
    );
    records.push({
      title: 'Best Win Percentage',
      description: 'Highest career win percentage (min. 3 seasons)',
      ownerName: bestWinPct.name,
      value: `${bestWinPct.stats.winPercentage.toFixed(1)}%`,
      details: `${bestWinPct.stats.totalWins}-${bestWinPct.stats.totalLosses} over ${bestWinPct.totalSeasons} seasons`,
    });
  }

  // Most wins in a season
  let mostWins = { owner: '', wins: 0, year: 0, losses: 0 };
  seasons.forEach(season => {
    season.standings.forEach(standing => {
      if (standing.wins > mostWins.wins) {
        mostWins = {
          owner: standing.ownerName,
          wins: standing.wins,
          year: season.year,
          losses: standing.losses,
        };
      }
    });
  });
  if (mostWins.wins > 0) {
    records.push({
      title: 'Most Wins in a Season',
      description: 'Best single-season record',
      ownerName: mostWins.owner,
      value: formatRecord(mostWins.wins, mostWins.losses),
      year: mostWins.year,
    });
  }

  // Most points in a season
  let mostPointsSeason = { owner: '', points: 0, year: 0 };
  seasons.forEach(season => {
    season.standings.forEach(standing => {
      if (standing.pointsFor > mostPointsSeason.points) {
        mostPointsSeason = {
          owner: standing.ownerName,
          points: standing.pointsFor,
          year: season.year,
        };
      }
    });
  });
  if (mostPointsSeason.points > 0) {
    records.push({
      title: 'Most Points in a Season',
      description: 'Highest scoring season',
      ownerName: mostPointsSeason.owner,
      value: mostPointsSeason.points.toFixed(2),
      year: mostPointsSeason.year,
    });
  }

  // Highest single-week score (from weekly matchups)
  let highestWeeklyScore = { owner: '', score: 0, year: 0, week: 0 };
  seasons.forEach(season => {
    if (season.weeklyScores) {
      season.weeklyScores.forEach(matchup => {
        if (matchup.homeTeam.score > highestWeeklyScore.score) {
          highestWeeklyScore = {
            owner: matchup.homeTeam.ownerName,
            score: matchup.homeTeam.score,
            year: season.year,
            week: matchup.week,
          };
        }
        if (matchup.awayTeam.score > highestWeeklyScore.score) {
          highestWeeklyScore = {
            owner: matchup.awayTeam.ownerName,
            score: matchup.awayTeam.score,
            year: season.year,
            week: matchup.week,
          };
        }
      });
    }
  });
  if (highestWeeklyScore.score > 0) {
    records.push({
      title: 'Highest Single-Week Score',
      description: 'Best weekly performance',
      ownerName: highestWeeklyScore.owner,
      value: highestWeeklyScore.score.toFixed(2),
      year: highestWeeklyScore.year,
      details: `Week ${highestWeeklyScore.week}`,
    });
  }

  // Most playoff appearances
  const mostPlayoffs = owners.reduce((max, owner) =>
    owner.playoffAppearances > max.playoffAppearances ? owner : max
  );
  records.push({
    title: 'Most Playoff Appearances',
    description: 'Most times making the playoffs',
    ownerName: mostPlayoffs.name,
    value: mostPlayoffs.playoffAppearances,
    details: `${mostPlayoffs.stats.playoffPercentage.toFixed(1)}% playoff rate`,
  });

  // Most "Most Points" titles
  const mostPointsTitles = owners.reduce(
    (max, owner) => {
      const count = owner.mostPointsSeasons?.length || 0;
      return count > max.count ? { owner, count } : max;
    },
    { owner: owners[0], count: 0 }
  );
  if (mostPointsTitles.owner && mostPointsTitles.count > 0) {
    records.push({
      title: 'Most "Most Points" Titles',
      description: 'Most times leading the league in points',
      ownerName: mostPointsTitles.owner.name,
      value: mostPointsTitles.count,
      details: `Years: ${mostPointsTitles.owner.mostPointsSeasons?.join(', ')}`,
    });
  }

  // Most Last Place Finishes
  const mostLastPlaces = owners.reduce(
    (max, owner) => {
      const count = owner.lastPlaceSeasons?.length || 0;
      return count > max.count ? { owner, count } : max;
    },
    { owner: owners[0], count: 0 }
  );
  if (mostLastPlaces.owner && mostLastPlaces.count > 0) {
    records.push({
      title: 'Most Last Place Finishes',
      description: 'Most times finishing in last place',
      ownerName: mostLastPlaces.owner.name,
      value: mostLastPlaces.count,
      details: `Years: ${mostLastPlaces.owner.lastPlaceSeasons?.join(', ')}`,
    });
  }

  // Iron Man (most consecutive seasons)
  const consecutiveSeasons = calculateConsecutiveSeasons(owners);
  if (consecutiveSeasons.length > 0) {
    const ironMan = consecutiveSeasons[0];
    records.push({
      title: 'Iron Man Award',
      description: 'Most consecutive seasons played',
      ownerName: ironMan.ownerName,
      value: ironMan.consecutive,
      details: `${ironMan.startYear}-${ironMan.endYear}`,
    });
  }

  return records;
}

/**
 * Helper to calculate consecutive seasons
 */
function calculateConsecutiveSeasons(
  owners: Owner[]
): Array<{ ownerName: string; consecutive: number; startYear: number; endYear: number }> {
  const results: Array<{ ownerName: string; consecutive: number; startYear: number; endYear: number }> = [];

  owners.forEach(owner => {
    const sortedSeasons = [...owner.seasonsPlayed].sort((a, b) => a - b);
    let currentStreak = 1;
    let maxStreak = 1;
    let streakStart = sortedSeasons[0];
    let maxStreakStart = sortedSeasons[0];
    let maxStreakEnd = sortedSeasons[0];

    for (let i = 1; i < sortedSeasons.length; i++) {
      if (sortedSeasons[i] === sortedSeasons[i - 1] + 1) {
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
          maxStreakStart = streakStart;
          maxStreakEnd = sortedSeasons[i];
        }
      } else {
        currentStreak = 1;
        streakStart = sortedSeasons[i];
      }
    }

    results.push({
      ownerName: owner.name,
      consecutive: maxStreak,
      startYear: maxStreakStart,
      endYear: maxStreakEnd,
    });
  });

  return results.sort((a, b) => b.consecutive - a.consecutive);
}

/**
 * Calculates head-to-head records between all owners
 */
export function calculateHeadToHead(seasons: Season[]): HeadToHeadRecord[] {
  const h2hMap = new Map<string, HeadToHeadRecord>();

  seasons.forEach(season => {
    if (!season.weeklyScores) return;

    season.weeklyScores.forEach(matchup => {
      const owner1 = matchup.homeTeam.ownerName;
      const owner2 = matchup.awayTeam.ownerName;
      const key = [owner1, owner2].sort().join('|');

      if (!h2hMap.has(key)) {
        h2hMap.set(key, {
          owner1,
          owner2,
          owner1Wins: 0,
          owner2Wins: 0,
          ties: 0,
          totalMatchups: 0,
          owner1PointsFor: 0,
          owner2PointsFor: 0,
          biggestBlowout: {
            winner: '',
            margin: 0,
            year: 0,
            week: 0,
          },
        });
      }

      const record = h2hMap.get(key)!;
      record.totalMatchups++;

      const homeScore = matchup.homeTeam.score;
      const awayScore = matchup.awayTeam.score;
      const margin = Math.abs(homeScore - awayScore);

      if (matchup.homeTeam.ownerName === owner1) {
        record.owner1PointsFor += homeScore;
        record.owner2PointsFor += awayScore;

        if (homeScore > awayScore) {
          record.owner1Wins++;
          if (margin > record.biggestBlowout.margin) {
            record.biggestBlowout = {
              winner: owner1,
              margin,
              year: season.year,
              week: matchup.week,
            };
          }
        } else if (awayScore > homeScore) {
          record.owner2Wins++;
          if (margin > record.biggestBlowout.margin) {
            record.biggestBlowout = {
              winner: owner2,
              margin,
              year: season.year,
              week: matchup.week,
            };
          }
        } else {
          record.ties++;
        }
      } else {
        record.owner2PointsFor += homeScore;
        record.owner1PointsFor += awayScore;

        if (homeScore > awayScore) {
          record.owner2Wins++;
          if (margin > record.biggestBlowout.margin) {
            record.biggestBlowout = {
              winner: owner2,
              margin,
              year: season.year,
              week: matchup.week,
            };
          }
        } else if (awayScore > homeScore) {
          record.owner1Wins++;
          if (margin > record.biggestBlowout.margin) {
            record.biggestBlowout = {
              winner: owner1,
              margin,
              year: season.year,
              week: matchup.week,
            };
          }
        } else {
          record.ties++;
        }
      }
    });
  });

  return Array.from(h2hMap.values());
}

/**
 * Identifies top rivalries based on head-to-head history
 */
export function calculateRivalries(seasons: Season[], owners: Owner[]): Rivalry[] {
  const h2hRecords = calculateHeadToHead(seasons);

  return h2hRecords
    .map(h2h => {
      let playoffMeetings = 0;
      let championshipMeetings = 0;
      let closeGames = 0;

      seasons.forEach(season => {
        if (!season.weeklyScores) return;

        season.weeklyScores.forEach(matchup => {
          const isThisMatchup =
            (matchup.homeTeam.ownerName === h2h.owner1 && matchup.awayTeam.ownerName === h2h.owner2) ||
            (matchup.homeTeam.ownerName === h2h.owner2 && matchup.awayTeam.ownerName === h2h.owner1);

          if (isThisMatchup) {
            if (matchup.isChampionship) championshipMeetings++;
            else if (matchup.isPlayoff) playoffMeetings++;

            const margin = Math.abs(matchup.homeTeam.score - matchup.awayTeam.score);
            if (margin < 10) closeGames++;
          }
        });
      });

      // Calculate rivalry score (higher = better rivalry)
      const competitiveness = Math.min(h2h.owner1Wins, h2h.owner2Wins); // More competitive if wins are close
      const rivalryScore =
        competitiveness * 2 +
        playoffMeetings * 5 +
        championshipMeetings * 10 +
        closeGames * 3 +
        h2h.totalMatchups;

      const rivalry: Rivalry = {
        owner1: h2h.owner1,
        owner2: h2h.owner2,
        rivalryScore,
        headToHead: h2h,
        playoffMeetings,
        championshipMeetings,
        closeGames,
      };

      return rivalry;
    })
    .sort((a, b) => b.rivalryScore - a.rivalryScore);
}

/**
 * Calculates overall league statistics
 */
export function calculateAllTimeStats(owners: Owner[], seasons: Season[]): AllTimeStats {
  const totalSeasons = seasons.length;
  let totalGamesPlayed = 0;
  let totalPointsScored = 0;

  let highestGame = { ownerName: '', points: 0, year: 0, week: 0 };
  let lowestGame = { ownerName: '', points: Infinity, year: 0, week: 0 };

  seasons.forEach(season => {
    totalGamesPlayed += season.standings.length;
    season.standings.forEach(s => {
      totalPointsScored += s.pointsFor;
    });

    if (season.weeklyScores) {
      season.weeklyScores.forEach(matchup => {
        [matchup.homeTeam, matchup.awayTeam].forEach(team => {
          if (team.score > highestGame.points) {
            highestGame = {
              ownerName: team.ownerName,
              points: team.score,
              year: season.year,
              week: matchup.week,
            };
          }
          if (team.score < lowestGame.points && team.score > 0) {
            lowestGame = {
              ownerName: team.ownerName,
              points: team.score,
              year: season.year,
              week: matchup.week,
            };
          }
        });
      });
    }
  });

  const getChampCount = (o: Owner) => (o as any).championshipCount ?? o.championships.length;
  const mostChampionships = owners.reduce((max, owner) =>
    getChampCount(owner) > getChampCount(max) ? owner : max
  );

  return {
    totalSeasons,
    totalGamesPlayed,
    totalPointsScored,
    averagePointsPerGame: totalGamesPlayed > 0 ? totalPointsScored / totalGamesPlayed : 0,
    highestScoringGame: highestGame.points > 0 ? highestGame : { ownerName: 'N/A', points: 0, year: 0, week: 0 },
    lowestScoringGame: lowestGame.points < Infinity ? lowestGame : { ownerName: 'N/A', points: 0, year: 0, week: 0 },
    mostChampionships: {
      ownerName: mostChampionships.name,
      count: getChampCount(mostChampionships),
    },
    longestWinStreak: { ownerName: 'TBD', streak: 0, years: 'TBD' },
    longestLoseStreak: { ownerName: 'TBD', streak: 0, years: 'TBD' },
  };
}
