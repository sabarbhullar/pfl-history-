import type { ESPNLeague, ProcessedESPNData, OwnerMapping, Standing, WeeklyMatchup } from '@/types/espn';
import type { MatchupWithRosters, TeamRoster, Player, RosterSlot } from '@/types/roster';
import { ESPN_SLOT_MAP, ESPN_POSITION_MAP } from '@/types/roster';

// PFL League Configuration
const LEAGUE_ID = 7995;
const ESPN_BASE_URL = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons';
// ESPN returns fractional points (e.g., 186.25), multiply by 10 to match league display (1862.5)
const POINTS_MULTIPLIER = 10;

// ESPN Cookies for private league access
const ESPN_SWID = '{AAA9EFEB-6EDF-11D4-820C-00A0C9E58E2D}';
const ESPN_S2 = 'AEBtBympfeqcUg%2BPsY1%2F1WuoW3uSKxcevXRSJ2Odd11BLHYUU1Wybi47UbpLAllqmY6Y5%2Fo9mqrEWTjb7tIUxBQD9dXhcZKg5a9FwE9vDoDFqm5UICWPnMvY2OltFGnjq9ZmQFCPfAESftwzLlPLxKrHRR4atjNzQ30y97MXsiwk0dH4iZlR67CA1gVcXqMmS4JZYnAP5ldx4F3L9HJwCs%2B51qXtFSgNieYRAHpFLf2t%2FctcVMZnu3vW9FaDwv6mEEGEyoCE%2FWSxjZ7q6Evr1n3KXaOwwt4132bh5njK%2F2t817jpgryipCPYD%2B9SikZRL9E%3D';

export interface ESPNFetchOptions {
  year: number;
  view?: string[];
}

/**
 * Fetches ESPN Fantasy Football data for a specific year
 * @param options - Year and optional view parameters
 * @returns Raw ESPN league data
 */
export async function fetchESPNLeagueData(options: ESPNFetchOptions): Promise<ESPNLeague> {
  const { year, view = ['mTeam', 'mRoster', 'mMatchup', 'mSettings'] } = options;

  const url = new URL(`${ESPN_BASE_URL}/${year}/segments/0/leagues/${LEAGUE_ID}`);
  url.searchParams.set('view', view.join('&view='));

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Cookie': `SWID=${ESPN_SWID}; espn_s2=${ESPN_S2}`,
      },
    });

    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data as ESPNLeague;
  } catch (error) {
    console.error(`Failed to fetch ESPN data for ${year}:`, error);
    throw error;
  }
}

/**
 * Fetches data for multiple years
 */
export async function fetchMultipleYears(years: number[]): Promise<Record<number, ESPNLeague>> {
  const results: Record<number, ESPNLeague> = {};

  for (const year of years) {
    try {
      const data = await fetchESPNLeagueData({ year });
      results[year] = data;
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to fetch data for ${year}:`, error);
    }
  }

  return results;
}

/**
 * Processes raw ESPN data into our app format
 * Requires owner mapping to convert ESPN names to canonical owner names
 */
export function processESPNData(
  espnData: ESPNLeague,
  year: number,
  ownerMapping: OwnerMapping[]
): ProcessedESPNData {
  const { teams, schedule, settings, members } = espnData;

  // Create a map of ESPN member ID to owner name
  const memberToOwnerMap = new Map<string, string>();
  const memberToTeamMap = new Map<number, string>();

  // Build mapping from ESPN data to our owner names
  teams.forEach(team => {
    const teamName = `${team.location} ${team.nickname}`.trim();
    memberToTeamMap.set(team.id, teamName);

    // Get the owner ID (usually the first owner)
    const ownerId = team.owners?.[0];
    if (ownerId) {
      const member = members.find(m => m.id === ownerId);
      if (member) {
        // Try to find this member in our owner mapping
        const mapping = ownerMapping.find(m =>
          m.espnMemberId === member.id ||
          m.espnDisplayName === member.displayName
        );

        if (mapping) {
          memberToOwnerMap.set(team.id.toString(), mapping.ownerName);
        } else {
          // Fallback to display name if no mapping found
          memberToOwnerMap.set(team.id.toString(), member.displayName);
        }
      }
    }
  });

  // Process standings
  const standings: Standing[] = teams
    .map(team => {
      const ownerName = memberToOwnerMap.get(team.id.toString()) || 'Unknown';
      const teamName = memberToTeamMap.get(team.id) || 'Unknown Team';
      const rank = team.playoffSeed || team.rankCalculatedFinal || 0;

      return {
        rank,
        ownerName,
        teamName,
        wins: team.record?.overall?.wins || 0,
        losses: team.record?.overall?.losses || 0,
        ties: team.record?.overall?.ties || 0,
        pointsFor: (team.points || 0) * POINTS_MULTIPLIER,
        pointsAgainst: (team.pointsAgainst || 0) * POINTS_MULTIPLIER,
        madePlayoffs: (rank <= (settings.playoffTeamCount || 6)),
      };
    })
    .sort((a, b) => a.rank - b.rank);

  // Process weekly matchups
  const weeklyMatchups: WeeklyMatchup[] = schedule.map(matchup => {
    const homeOwner = memberToOwnerMap.get(matchup.home.teamId.toString()) || 'Unknown';
    const awayOwner = memberToOwnerMap.get(matchup.away.teamId.toString()) || 'Unknown';
    const homeTeam = memberToTeamMap.get(matchup.home.teamId) || 'Unknown Team';
    const awayTeam = memberToTeamMap.get(matchup.away.teamId) || 'Unknown Team';

    const regularSeasonWeeks = settings.regularSeasonMatchupPeriodCount || 14;
    const playoffWeeks = settings.playoffMatchupPeriodLength || 3;
    const isPlayoff = matchup.matchupPeriodId > regularSeasonWeeks;
    const isChampionship = matchup.matchupPeriodId === regularSeasonWeeks + playoffWeeks;

    return {
      week: matchup.matchupPeriodId,
      matchupId: matchup.id,
      homeTeam: {
        ownerName: homeOwner,
        teamName: homeTeam,
        score: (matchup.home.totalPoints || 0) * POINTS_MULTIPLIER,
        projected: matchup.home.totalProjectedPoints ? matchup.home.totalProjectedPoints * POINTS_MULTIPLIER : undefined,
      },
      awayTeam: {
        ownerName: awayOwner,
        teamName: awayTeam,
        score: (matchup.away.totalPoints || 0) * POINTS_MULTIPLIER,
        projected: matchup.away.totalProjectedPoints ? matchup.away.totalProjectedPoints * POINTS_MULTIPLIER : undefined,
      },
      isPlayoff,
      isChampionship,
    };
  });

  return {
    year,
    leagueId: LEAGUE_ID,
    teams: standings.map(s => ({
      espnTeamId: 0, // We'd need to track this
      teamName: s.teamName,
      ownerName: s.ownerName,
      wins: s.wins,
      losses: s.losses,
      ties: s.ties || 0,
      pointsFor: s.pointsFor,
      pointsAgainst: s.pointsAgainst,
      rank: s.rank,
    })),
    standings,
    weeklyMatchups,
    ownerMapping,
  };
}

/**
 * Gets current season data
 */
export async function getCurrentSeasonData(ownerMapping: OwnerMapping[]): Promise<ProcessedESPNData> {
  const currentYear = new Date().getFullYear();
  const espnData = await fetchESPNLeagueData({ year: currentYear });
  return processESPNData(espnData, currentYear, ownerMapping);
}

/**
 * Fetches boxscore data for a specific week with full roster details
 */
export async function fetchWeekBoxscores(year: number, week: number): Promise<any> {
  const url = new URL(`${ESPN_BASE_URL}/${year}/segments/0/leagues/${LEAGUE_ID}`);
  url.searchParams.set('view', 'mMatchupScore');
  url.searchParams.set('scoringPeriodId', week.toString());

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Cookie': `SWID=${ESPN_SWID}; espn_s2=${ESPN_S2}`,
      },
    });

    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch boxscores for ${year} week ${week}:`, error);
    throw error;
  }
}

/**
 * Fetches full roster data for all teams in a specific week
 */
export async function fetchWeekRosters(year: number, week: number): Promise<any> {
  const url = new URL(`${ESPN_BASE_URL}/${year}/segments/0/leagues/${LEAGUE_ID}`);
  url.searchParams.set('view', 'mRoster');
  url.searchParams.set('scoringPeriodId', week.toString());

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Cookie': `SWID=${ESPN_SWID}; espn_s2=${ESPN_S2}`,
      },
    });

    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch rosters for ${year} week ${week}:`, error);
    throw error;
  }
}

/**
 * Process roster entries into our format
 */
function processRosterEntry(entry: any): RosterSlot {
  const slotId = entry.lineupSlotId;
  const position = ESPN_SLOT_MAP[slotId] || 'Unknown';

  if (!entry.playerPoolEntry) {
    return { position, player: null };
  }

  const playerData = entry.playerPoolEntry.player;
  const positionId = playerData.defaultPositionId;

  // Get the actual points scored (from stats)
  let points = 0;
  if (entry.playerPoolEntry.appliedStatTotal !== undefined) {
    points = entry.playerPoolEntry.appliedStatTotal * POINTS_MULTIPLIER;
  }

  const player: Player = {
    id: playerData.id,
    name: playerData.fullName,
    position: ESPN_POSITION_MAP[positionId] || 'Unknown',
    team: playerData.proTeamId?.toString() || '',
    points: points,
    projected: entry.playerPoolEntry.player.stats?.[0]?.appliedTotal
      ? entry.playerPoolEntry.player.stats[0].appliedTotal * POINTS_MULTIPLIER
      : undefined,
  };

  return { position, player };
}

/**
 * Fetches and processes matchups with full roster data for a season
 */
export async function fetchSeasonWithRosters(
  year: number,
  ownerMapping: OwnerMapping[]
): Promise<MatchupWithRosters[]> {
  // First get the basic season data to know the schedule
  const leagueData = await fetchESPNLeagueData({ year });
  const { teams, schedule, settings, members } = leagueData;

  // Build team ID to owner mapping
  const teamToOwnerMap = new Map<number, string>();
  const teamToNameMap = new Map<number, string>();

  teams.forEach(team => {
    const teamName = `${team.location} ${team.nickname}`.trim();
    teamToNameMap.set(team.id, teamName);

    const ownerId = team.owners?.[0];
    if (ownerId) {
      const member = members.find(m => m.id === ownerId);
      if (member) {
        const mapping = ownerMapping.find(m =>
          m.espnMemberId === member.id ||
          m.espnDisplayName === member.displayName
        );
        teamToOwnerMap.set(team.id, mapping?.ownerName || member.displayName);
      }
    }
  });

  const regularSeasonWeeks = settings.regularSeasonMatchupPeriodCount || 14;
  const playoffWeeks = settings.playoffMatchupPeriodLength || 3;
  const totalWeeks = regularSeasonWeeks + playoffWeeks;

  const matchupsWithRosters: MatchupWithRosters[] = [];

  // Fetch roster data for each week
  for (let week = 1; week <= totalWeeks; week++) {
    console.log(`Fetching rosters for ${year} week ${week}...`);

    try {
      const rosterData = await fetchWeekRosters(year, week);

      // Process each matchup for this week
      const weekMatchups = schedule.filter(m => m.matchupPeriodId === week);

      for (const matchup of weekMatchups) {
        const homeTeamData = rosterData.teams?.find((t: any) => t.id === matchup.home.teamId);
        const awayTeamData = rosterData.teams?.find((t: any) => t.id === matchup.away.teamId);

        const homeRoster = processTeamRoster(
          homeTeamData,
          teamToOwnerMap.get(matchup.home.teamId) || 'Unknown',
          teamToNameMap.get(matchup.home.teamId) || 'Unknown',
          matchup.home.totalPoints
        );

        const awayRoster = processTeamRoster(
          awayTeamData,
          teamToOwnerMap.get(matchup.away.teamId) || 'Unknown',
          teamToNameMap.get(matchup.away.teamId) || 'Unknown',
          matchup.away.totalPoints
        );

        const isPlayoff = week > regularSeasonWeeks;
        const isChampionship = week === totalWeeks;

        matchupsWithRosters.push({
          week,
          matchupId: matchup.id,
          homeTeam: homeRoster,
          awayTeam: awayRoster,
          isPlayoff,
          isChampionship,
        });
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`Failed to fetch week ${week}:`, error);
    }
  }

  return matchupsWithRosters;
}

/**
 * Process team roster data
 */
function processTeamRoster(
  teamData: any,
  ownerName: string,
  teamName: string,
  totalPoints: number
): TeamRoster {
  const starters: RosterSlot[] = [];
  const bench: RosterSlot[] = [];

  if (teamData?.roster?.entries) {
    for (const entry of teamData.roster.entries) {
      const slot = processRosterEntry(entry);

      // Bench slots have lineupSlotId of 20 or 21 (IR)
      if (entry.lineupSlotId === 20 || entry.lineupSlotId === 21) {
        bench.push(slot);
      } else {
        starters.push(slot);
      }
    }
  }

  // Sort starters by position order
  const positionOrder = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'D/ST'];
  starters.sort((a, b) => {
    return positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position);
  });

  return {
    ownerName,
    teamName,
    starters,
    bench,
    totalPoints: totalPoints * POINTS_MULTIPLIER,
  };
}
