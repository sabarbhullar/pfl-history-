/**
 * PFL Roster Data Fetcher
 *
 * Fetches roster/boxscore data for each matchup from ESPN API
 * This includes player-level scoring for each week.
 *
 * Usage: node scripts/fetch-roster-data.js
 */

const fs = require('fs');
const path = require('path');

// Load owner name mappings
const ownerMappings = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'owner-mappings.json'), 'utf-8')
);

// Function to get canonical owner name
function getCanonicalName(displayName, firstName, lastName) {
  if (ownerMappings.byDisplayName[displayName]) {
    return ownerMappings.byDisplayName[displayName];
  }
  const fn = (firstName || '').trim();
  const ln = (lastName || '').trim();
  let fullName = `${fn} ${ln}`.trim();
  fullName = fullName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  if (ownerMappings.nameFixes[fullName]) {
    return ownerMappings.nameFixes[fullName];
  }
  return fullName || displayName || 'Unknown';
}

// PFL League Configuration
const LEAGUE_ID = 7995;
const ESPN_BASE_URL = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons';
const ESPN_HISTORY_URL = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/leagueHistory';

// ESPN Cookies for private league access
const ESPN_SWID = '{AAA9EFEB-6EDF-11D4-820C-00A0C9E58E2D}';
const ESPN_S2 = 'AEBtBympfeqcUg%2BPsY1%2F1WuoW3uSKxcevXRSJ2Odd11BLHYUU1Wybi47UbpLAllqmY6Y5%2Fo9mqrEWTjb7tIUxBQD9dXhcZKg5a9FwE9vDoDFqm5UICWPnMvY2OltFGnjq9ZmQFCPfAESftwzLlPLxKrHRR4atjNzQ30y97MXsiwk0dH4iZlR67CA1gVcXqMmS4JZYnAP5ldx4F3L9HJwCs%2B51qXtFSgNieYRAHpFLf2t%2FctcVMZnu3vW9FaDwv6mEEGEyoCE%2FWSxjZ7q6Evr1n3KXaOwwt4132bh5njK%2F2t817jpgryipCPYD%2B9SikZRL9E%3D';

// Position mapping (includes IDP positions)
const POSITION_MAP = {
  1: 'QB', 2: 'RB', 3: 'WR', 4: 'TE', 5: 'K', 16: 'D/ST',
  0: 'QB', 6: 'K', 17: 'D/ST', 20: 'Bench', 21: 'IR', 23: 'FLEX',
  // IDP positions
  7: 'DT', 8: 'DE', 9: 'LB', 10: 'CB', 11: 'S', 12: 'DB', 13: 'DP', 14: 'DL'
};

const SLOT_MAP = {
  0: 'QB', 2: 'RB', 4: 'WR', 6: 'TE', 16: 'D/ST', 17: 'K',
  20: 'Bench', 21: 'IR', 23: 'FLEX', 3: 'WR/TE'
};

// NFL Team abbreviations
const NFL_TEAMS = {
  1: 'ATL', 2: 'BUF', 3: 'CHI', 4: 'CIN', 5: 'CLE', 6: 'DAL', 7: 'DEN', 8: 'DET',
  9: 'GB', 10: 'TEN', 11: 'IND', 12: 'KC', 13: 'LV', 14: 'LAR', 15: 'MIA', 16: 'MIN',
  17: 'NE', 18: 'NO', 19: 'NYG', 20: 'NYJ', 21: 'PHI', 22: 'ARI', 23: 'PIT', 24: 'LAC',
  25: 'SF', 26: 'SEA', 27: 'TB', 28: 'WAS', 29: 'CAR', 30: 'JAX', 33: 'BAL', 34: 'HOU'
};

async function fetchRosterData(year, week) {
  // Try regular endpoint first (recent years)
  const regularUrl = `${ESPN_BASE_URL}/${year}/segments/0/leagues/${LEAGUE_ID}?view=mMatchupScore&view=mBoxscore&view=mRoster&view=mTeam&scoringPeriodId=${week}`;

  try {
    let response = await fetch(regularUrl, {
      headers: {
        'Accept': 'application/json',
        'Cookie': `SWID=${ESPN_SWID}; espn_s2=${ESPN_S2}`,
      },
    });

    if (response.ok) {
      return await response.json();
    }

    // Try history endpoint for older years
    const historyUrl = `${ESPN_HISTORY_URL}/${LEAGUE_ID}?seasonId=${year}&view=mMatchupScore&view=mBoxscore&view=mRoster&view=mTeam&scoringPeriodId=${week}`;

    response = await fetch(historyUrl, {
      headers: {
        'Accept': 'application/json',
        'Cookie': `SWID=${ESPN_SWID}; espn_s2=${ESPN_S2}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) ? data[0] : data;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching ${year} week ${week}:`, error.message);
    return null;
  }
}

function processRosterData(espnData, week, seasonData) {
  const { teams, schedule, members, settings } = espnData;

  if (!teams || !schedule) return [];

  // Build team/owner maps
  const teamToOwnerMap = new Map();
  const teamToNameMap = new Map();

  teams.forEach(team => {
    const teamName = `${team.location || ''} ${team.nickname || ''}`.trim() || 'Unknown Team';
    teamToNameMap.set(team.id, teamName);

    const ownerId = team.owners?.[0];
    if (ownerId && members) {
      const member = members.find(m => m.id === ownerId);
      if (member) {
        const ownerName = getCanonicalName(member.displayName, member.firstName, member.lastName);
        teamToOwnerMap.set(team.id, ownerName);
      }
    }
  });

  // Get schedule settings
  const scheduleSettings = settings?.scheduleSettings || settings || {};
  const regularSeasonWeeks = scheduleSettings.matchupPeriodCount || 14;
  const maxWeek = Math.max(...schedule.map(m => m.matchupPeriodId || 0));

  // Process matchups for this week
  const weekMatchups = schedule.filter(m =>
    m.matchupPeriodId === week && m.home && m.away
  );

  const matchupsWithRosters = [];

  for (const matchup of weekMatchups) {
    const homeTeamData = teams.find(t => t.id === matchup.home.teamId);
    const awayTeamData = teams.find(t => t.id === matchup.away.teamId);

    if (!homeTeamData || !awayTeamData) continue;

    const isPlayoff = week > regularSeasonWeeks;
    const isChampionship = week === maxWeek && isPlayoff;

    // Use rosterForMatchupPeriod if available (has accurate per-week player scores)
    // Fall back to team roster data for recent years
    const homeRosterData = matchup.home.rosterForMatchupPeriod || null;
    const awayRosterData = matchup.away.rosterForMatchupPeriod || null;

    const homeRoster = homeRosterData
      ? extractRosterFromMatchup(homeRosterData, week)
      : extractRosterFromTeam(homeTeamData, week);
    const awayRoster = awayRosterData
      ? extractRosterFromMatchup(awayRosterData, week)
      : extractRosterFromTeam(awayTeamData, week);

    matchupsWithRosters.push({
      week,
      matchupId: matchup.id,
      homeTeam: {
        ownerName: teamToOwnerMap.get(matchup.home.teamId) || 'Unknown',
        teamName: teamToNameMap.get(matchup.home.teamId) || 'Unknown Team',
        totalPoints: matchup.home.totalPoints || 0,
        starters: homeRoster.starters,
        bench: homeRoster.bench,
      },
      awayTeam: {
        ownerName: teamToOwnerMap.get(matchup.away.teamId) || 'Unknown',
        teamName: teamToNameMap.get(matchup.away.teamId) || 'Unknown Team',
        totalPoints: matchup.away.totalPoints || 0,
        starters: awayRoster.starters,
        bench: awayRoster.bench,
      },
      isPlayoff,
      isChampionship,
    });
  }

  return matchupsWithRosters;
}

// Extract roster from rosterForMatchupPeriod (has accurate per-week player scores)
function extractRosterFromMatchup(rosterData, week) {
  const starters = [];
  const bench = [];

  const entries = rosterData.entries || [];

  for (const entry of entries) {
    const playerPool = entry.playerPoolEntry || {};
    const player = playerPool.player || {};
    const playerId = entry.playerId || playerPool.id || player.id;

    // Get points from appliedStatTotal (this is the per-week fantasy score)
    const points = playerPool.appliedStatTotal || 0;

    const slotId = entry.lineupSlotId;
    // For historical data, lineupSlotId is often 0 for all entries
    // In that case, use the player's default position
    const isStarter = slotId !== 20 && slotId !== 21; // Not bench or IR

    // Determine position: if slotId is valid use it, otherwise use player's default position
    let position;
    if (slotId === 0) {
      // Historical data often has all slotIds as 0, use player's default position
      position = POSITION_MAP[player.defaultPositionId] || 'FLEX';
    } else {
      position = SLOT_MAP[slotId] || POSITION_MAP[player.defaultPositionId] || 'FLEX';
    }

    const playerData = {
      position: isStarter ? position : 'BN',
      player: {
        id: playerId,
        name: player.fullName || 'Unknown Player',
        position: POSITION_MAP[player.defaultPositionId] || 'FLEX',
        team: NFL_TEAMS[player.proTeamId] || 'FA',
        points: points,
      }
    };

    if (isStarter) {
      starters.push(playerData);
    } else {
      bench.push(playerData);
    }
  }

  // Sort starters by position order
  const posOrder = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'WR/TE', 'D/ST', 'K'];
  starters.sort((a, b) => {
    const aIdx = posOrder.indexOf(a.position);
    const bIdx = posOrder.indexOf(b.position);
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });

  return { starters, bench };
}

// Fallback: Extract roster from team data (for recent years where rosterForMatchupPeriod isn't available)
function extractRosterFromTeam(teamData, week) {
  const starters = [];
  const bench = [];

  const roster = teamData.roster?.entries || [];

  for (const entry of roster) {
    const player = entry.playerPoolEntry?.player || entry.player || {};
    const playerId = entry.playerId || player.id;

    // Get points for this specific week from stats array
    let points = 0;
    const stats = player.stats || [];
    for (const stat of stats) {
      if (stat.scoringPeriodId === week && stat.statSourceId === 0) {
        points = stat.appliedTotal || 0;
        break;
      }
    }

    const slotId = entry.lineupSlotId;
    const isStarter = slotId !== 20 && slotId !== 21; // Not bench or IR
    const position = SLOT_MAP[slotId] || POSITION_MAP[player.defaultPositionId] || 'FLEX';

    const playerData = {
      position: isStarter ? position : 'BN',
      player: {
        id: playerId,
        name: player.fullName || 'Unknown Player',
        position: POSITION_MAP[player.defaultPositionId] || 'FLEX',
        team: NFL_TEAMS[player.proTeamId] || 'FA',
        points: points,
      }
    };

    if (isStarter) {
      starters.push(playerData);
    } else {
      bench.push(playerData);
    }
  }

  // Sort starters by position order
  const posOrder = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'WR/TE', 'D/ST', 'K'];
  starters.sort((a, b) => {
    const aIdx = posOrder.indexOf(a.position);
    const bIdx = posOrder.indexOf(b.position);
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });

  return { starters, bench };
}

async function fetchYearRosters(year) {
  console.log(`\nFetching rosters for ${year}...`);

  // Load season data to get week count
  const seasonsData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'public', 'data', 'seasons.json'), 'utf-8')
  );
  const seasonData = seasonsData.find(s => s.year === year);

  if (!seasonData) {
    console.log(`  No season data for ${year}`);
    return [];
  }

  const totalWeeks = seasonData.regularSeasonWeeks + seasonData.playoffWeeks;
  const allMatchups = [];

  for (let week = 1; week <= totalWeeks; week++) {
    process.stdout.write(`  Week ${week}/${totalWeeks}...`);

    const data = await fetchRosterData(year, week);

    if (data) {
      const matchups = processRosterData(data, week, seasonData);
      allMatchups.push(...matchups);
      console.log(` ${matchups.length} matchups`);
    } else {
      console.log(' no data');
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return allMatchups;
}

async function main() {
  console.log('PFL Roster Data Fetcher');
  console.log('=======================');

  const rostersDir = path.join(__dirname, '..', 'public', 'data', 'rosters');

  if (!fs.existsSync(rostersDir)) {
    fs.mkdirSync(rostersDir, { recursive: true });
  }

  // Fetch for years 2005-2025
  const years = [];
  for (let y = 2005; y <= 2025; y++) {
    years.push(y);
  }

  for (const year of years) {
    const matchups = await fetchYearRosters(year);

    if (matchups.length > 0) {
      const filePath = path.join(rostersDir, `${year}.json`);
      fs.writeFileSync(filePath, JSON.stringify(matchups, null, 2));
      console.log(`  Saved ${matchups.length} matchups to ${year}.json`);
    } else {
      console.log(`  No roster data available for ${year}`);
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);
