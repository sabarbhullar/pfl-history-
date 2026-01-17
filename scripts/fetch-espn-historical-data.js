/**
 * PFL Historical Data Fetcher
 *
 * This script fetches all historical data from ESPN Fantasy Football API
 * for the PFL league (ID: 7995) from 2006-2025.
 *
 * ESPN data is available from 2006 onwards.
 * For 2004-2005, you would need to upload CSV data manually.
 *
 * Usage: node scripts/fetch-espn-historical-data.js
 */

const fs = require('fs');
const path = require('path');

// Load owner name mappings
const ownerMappings = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'owner-mappings.json'), 'utf-8')
);

// Function to get canonical owner name
function getCanonicalName(displayName, firstName, lastName) {
  // First check displayName mapping
  if (ownerMappings.byDisplayName[displayName]) {
    return ownerMappings.byDisplayName[displayName];
  }

  // Build full name from firstName + lastName
  const fn = (firstName || '').trim();
  const ln = (lastName || '').trim();
  let fullName = `${fn} ${ln}`.trim();

  // Capitalize properly
  fullName = fullName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  // Check if this name needs fixing
  if (ownerMappings.nameFixes[fullName]) {
    return ownerMappings.nameFixes[fullName];
  }

  // Check original case version too
  const originalCase = `${fn} ${ln}`.trim();
  if (ownerMappings.nameFixes[originalCase]) {
    return ownerMappings.nameFixes[originalCase];
  }

  return fullName || displayName || 'Unknown';
}

// PFL League Configuration
const LEAGUE_ID = 7995;
const ESPN_BASE_URL = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons';

// ESPN Cookies for private league access
const ESPN_SWID = '{AAA9EFEB-6EDF-11D4-820C-00A0C9E58E2D}';
const ESPN_S2 = 'AEBtBympfeqcUg%2BPsY1%2F1WuoW3uSKxcevXRSJ2Odd11BLHYUU1Wybi47UbpLAllqmY6Y5%2Fo9mqrEWTjb7tIUxBQD9dXhcZKg5a9FwE9vDoDFqm5UICWPnMvY2OltFGnjq9ZmQFCPfAESftwzLlPLxKrHRR4atjNzQ30y97MXsiwk0dH4iZlR67CA1gVcXqMmS4JZYnAP5ldx4F3L9HJwCs%2B51qXtFSgNieYRAHpFLf2t%2FctcVMZnu3vW9FaDwv6mEEGEyoCE%2FWSxjZ7q6Evr1n3KXaOwwt4132bh5njK%2F2t817jpgryipCPYD%2B9SikZRL9E%3D';

// Points multiplier (use 1 for standard scoring)
const POINTS_MULTIPLIER = 1;

// Years with ESPN data available (league started in 2004)
const ESPN_YEARS = Array.from({ length: 22 }, (_, i) => 2004 + i);

// ESPN API endpoints
const ESPN_HISTORY_URL = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/leagueHistory';

async function fetchESPNLeagueData(year) {
  // Try the regular endpoint first (works for recent years)
  const regularUrl = `${ESPN_BASE_URL}/${year}/segments/0/leagues/${LEAGUE_ID}?view=mTeam&view=mRoster&view=mMatchup&view=mSettings`;

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

    // If regular endpoint fails, try the leagueHistory endpoint (works for older years)
    const historyUrl = `${ESPN_HISTORY_URL}/${LEAGUE_ID}?seasonId=${year}&view=mTeam&view=mMatchup&view=mSettings`;

    response = await fetch(historyUrl, {
      headers: {
        'Accept': 'application/json',
        'Cookie': `SWID=${ESPN_SWID}; espn_s2=${ESPN_S2}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      // leagueHistory returns an array, get the first element
      return Array.isArray(data) ? data[0] : data;
    }

    console.error(`ESPN API returned ${response.status} for ${year}`);
    return null;
  } catch (error) {
    console.error(`Failed to fetch ${year}:`, error.message);
    return null;
  }
}

function processESPNData(espnData, year) {
  const { teams, schedule, settings, members } = espnData;

  // Create a map of team ID to owner info
  const teamToOwnerMap = new Map();
  const teamToNameMap = new Map();

  teams.forEach(team => {
    const teamName = `${team.location} ${team.nickname}`.trim();
    teamToNameMap.set(team.id, teamName);

    const ownerId = team.owners?.[0];
    if (ownerId) {
      const member = members?.find(m => m.id === ownerId);
      if (member) {
        // Use canonical name from mappings
        const ownerName = getCanonicalName(
          member.displayName,
          member.firstName,
          member.lastName
        );
        teamToOwnerMap.set(team.id, ownerName);
      }
    }
  });

  // Process standings - use rankCalculatedFinal for actual final standings (after playoffs)
  // playoffSeed is just the seeding BEFORE playoffs start
  const standings = teams
    .map(team => {
      const ownerName = teamToOwnerMap.get(team.id) || 'Unknown';
      const teamName = teamToNameMap.get(team.id) || 'Unknown Team';
      // rankCalculatedFinal = final standings after season/playoffs complete
      // playoffSeed = seeding before playoffs (fallback for older data)
      const finalRank = team.rankCalculatedFinal || team.playoffSeed || 99;

      return {
        rank: finalRank,
        ownerName,
        teamName,
        wins: team.record?.overall?.wins || 0,
        losses: team.record?.overall?.losses || 0,
        ties: team.record?.overall?.ties || 0,
        pointsFor: (team.points || 0) * POINTS_MULTIPLIER,
        pointsAgainst: (team.pointsAgainst || 0) * POINTS_MULTIPLIER,
        madePlayoffs: (team.playoffSeed || 99) <= (settings?.playoffTeamCount || 6),
      };
    })
    .sort((a, b) => a.rank - b.rank);

  // Get settings from correct path (scheduleSettings for most years)
  const scheduleSettings = settings?.scheduleSettings || settings || {};
  const regularSeasonWeeks = scheduleSettings.matchupPeriodCount || settings?.regularSeasonMatchupPeriodCount || 14;

  // Find the max week to determine championship week dynamically
  const maxWeek = Math.max(...schedule.map(m => m.matchupPeriodId));

  // Determine champion and runner-up first (needed to identify the actual championship game)
  const championOverride = ownerMappings.championOverrides?.[String(year)];
  const splitChampions = ownerMappings.splitChampionships?.[String(year)];
  const championStanding = standings[0];
  const runnerUpStanding = standings[1];
  const mostPointsStanding = [...standings].sort((a, b) => b.pointsFor - a.pointsFor)[0];
  const lastPlaceStanding = standings[standings.length - 1];

  // Handle split championships (e.g., "Harbinder Khangura & Amarjit Gill")
  // Use override if available, then split if available, otherwise use standings
  let champion;
  if (splitChampions && splitChampions.length > 0) {
    champion = splitChampions.join(' & '); // "Harbinder Khangura & Amarjit Gill"
  } else {
    champion = championOverride || championStanding?.ownerName || 'Unknown';
  }
  const runnerUp = splitChampions ? '' : (runnerUpStanding?.ownerName || 'Unknown');

  // Process weekly matchups (filter out bye weeks where away is undefined)
  const weeklyMatchups = schedule
    .filter(matchup => matchup.home && matchup.away)
    .map(matchup => {
      const homeOwner = teamToOwnerMap.get(matchup.home.teamId) || 'Unknown';
      const awayOwner = teamToOwnerMap.get(matchup.away.teamId) || 'Unknown';
      const homeTeam = teamToNameMap.get(matchup.home.teamId) || 'Unknown Team';
      const awayTeam = teamToNameMap.get(matchup.away.teamId) || 'Unknown Team';

      const isPlayoff = matchup.matchupPeriodId > regularSeasonWeeks;

      // Championship is ONLY the actual championship game
      const isFinalWeek = matchup.matchupPeriodId === maxWeek && isPlayoff;
      let isChampionship = false;

      if (isFinalWeek) {
        if (splitChampions && splitChampions.length === 2) {
          // For split championships, the game between the two co-champions
          const involvesBothSplitChamps =
            (homeOwner === splitChampions[0] && awayOwner === splitChampions[1]) ||
            (homeOwner === splitChampions[1] && awayOwner === splitChampions[0]);
          isChampionship = involvesBothSplitChamps;
        } else {
          // Normal championship: involves both champion AND runner-up
          const involvesChampion = homeOwner === champion || awayOwner === champion;
          const involvesRunnerUp = homeOwner === runnerUp || awayOwner === runnerUp;
          isChampionship = involvesChampion && involvesRunnerUp;
        }
      }

      return {
        week: matchup.matchupPeriodId,
        matchupId: matchup.id,
        homeTeam: {
          ownerName: homeOwner,
          teamName: homeTeam,
          score: (matchup.home.totalPoints || 0) * POINTS_MULTIPLIER,
        },
        awayTeam: {
          ownerName: awayOwner,
          teamName: awayTeam,
          score: (matchup.away.totalPoints || 0) * POINTS_MULTIPLIER,
        },
        isPlayoff,
        isChampionship,
      };
    });

  return {
    year,
    champion,
    runnerUp,
    mostPoints: {
      owner: mostPointsStanding?.ownerName || 'Unknown',
      teamName: mostPointsStanding?.teamName || 'Unknown',
      points: mostPointsStanding?.pointsFor || 0,
    },
    lastPlace: lastPlaceStanding?.ownerName || 'Unknown',
    standings,
    weeklyScores: weeklyMatchups,
    leagueSize: standings.length,
    regularSeasonWeeks: regularSeasonWeeks,
    playoffWeeks: maxWeek - regularSeasonWeeks,
    keyMoments: [],
  };
}

function buildOwnerRecords(seasons) {
  const ownerMap = new Map();
  const splitChampionships = ownerMappings.splitChampionships || {};

  // Helper to get or create owner record
  function getOrCreateOwner(ownerName) {
    const ownerId = ownerName.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
    if (!ownerMap.has(ownerId)) {
      ownerMap.set(ownerId, {
        id: ownerId,
        name: ownerName,
        teamNames: [],
        seasonsPlayed: [],
        championships: [],
        championshipCount: 0,
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
    return ownerMap.get(ownerId);
  }

  // Pre-process split championships (for owners who may not be in that year's standings)
  Object.entries(splitChampionships).forEach(([yearStr, champions]) => {
    const year = parseInt(yearStr);
    champions.forEach(champName => {
      const owner = getOrCreateOwner(champName);
      if (!owner.championships.includes(year)) {
        owner.championships.push(year);
        owner.championshipCount += 0.5;
      }
    });
  });

  seasons.forEach(season => {
    season.standings.forEach(standing => {
      const ownerName = standing.ownerName;
      const owner = getOrCreateOwner(ownerName);

      if (!owner.teamNames.includes(standing.teamName)) {
        owner.teamNames.push(standing.teamName);
      }

      if (!owner.seasonsPlayed.includes(season.year)) {
        owner.seasonsPlayed.push(season.year);
        owner.totalSeasons++;
      }

      // Handle championships (skip split championships - already pre-processed above)
      const splitChamps = splitChampionships[String(season.year)];
      const isSplitYear = splitChamps && splitChamps.length > 0;

      if (!isSplitYear && season.champion === ownerName && !owner.championships.includes(season.year)) {
        owner.championships.push(season.year);
        owner.championshipCount += 1; // Full championship
      }

      if (season.runnerUp === ownerName && !owner.runnerUps.includes(season.year)) {
        owner.runnerUps.push(season.year);
      }

      if (season.mostPoints.owner === ownerName && !owner.mostPointsSeasons.includes(season.year)) {
        owner.mostPointsSeasons.push(season.year);
      }

      if (season.lastPlace === ownerName && !owner.lastPlaceSeasons.includes(season.year)) {
        owner.lastPlaceSeasons.push(season.year);
      }

      if (standing.madePlayoffs) {
        owner.playoffAppearances++;
      }

      owner.stats.totalWins += standing.wins;
      owner.stats.totalLosses += standing.losses;
      owner.stats.totalPointsFor += standing.pointsFor;
      owner.stats.totalPointsAgainst += standing.pointsAgainst;

      const totalGames = standing.wins + standing.losses;
      const winPct = totalGames > 0 ? (standing.wins / totalGames) * 100 : 0;
      const bestWinPct = (owner.stats.bestRecord.wins + owner.stats.bestRecord.losses) > 0
        ? (owner.stats.bestRecord.wins / (owner.stats.bestRecord.wins + owner.stats.bestRecord.losses)) * 100
        : 0;
      const worstWinPct = (owner.stats.worstRecord.wins + owner.stats.worstRecord.losses) > 0
        ? (owner.stats.worstRecord.wins / (owner.stats.worstRecord.wins + owner.stats.worstRecord.losses)) * 100
        : 100;

      if (winPct > bestWinPct || owner.stats.bestRecord.year === 0) {
        owner.stats.bestRecord = {
          year: season.year,
          wins: standing.wins,
          losses: standing.losses,
          pointsFor: standing.pointsFor,
          pointsAgainst: standing.pointsAgainst,
        };
      }

      if (winPct < worstWinPct || owner.stats.worstRecord.year === 0) {
        owner.stats.worstRecord = {
          year: season.year,
          wins: standing.wins,
          losses: standing.losses,
          pointsFor: standing.pointsFor,
          pointsAgainst: standing.pointsAgainst,
        };
      }
    });
  });

  // Get current owners list from mappings
  const currentOwners = ownerMappings.currentOwners2025 || [];

  // Calculate percentages and set isActive
  ownerMap.forEach(owner => {
    const totalGames = owner.stats.totalWins + owner.stats.totalLosses;
    owner.stats.winPercentage = totalGames > 0 ? Math.round((owner.stats.totalWins / totalGames) * 1000) / 10 : 0;
    owner.stats.playoffPercentage = owner.totalSeasons > 0
      ? Math.round((owner.playoffAppearances / owner.totalSeasons) * 1000) / 10
      : 0;
    owner.stats.avgPointsPerSeason = owner.totalSeasons > 0
      ? Math.round((owner.stats.totalPointsFor / owner.totalSeasons) * 100) / 100
      : 0;
    owner.stats.avgWinsPerSeason = owner.totalSeasons > 0
      ? Math.round((owner.stats.totalWins / owner.totalSeasons) * 10) / 10
      : 0;

    // Set isActive based on current 2025 members
    owner.isActive = currentOwners.includes(owner.name);

    owner.seasonsPlayed.sort((a, b) => a - b);
    owner.championships.sort((a, b) => a - b);
    owner.runnerUps.sort((a, b) => a - b);
    owner.mostPointsSeasons.sort((a, b) => a - b);
    owner.lastPlaceSeasons.sort((a, b) => a - b);
  });

  return Array.from(ownerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

async function main() {
  console.log('PFL Historical Data Fetcher');
  console.log('===========================');
  console.log(`League ID: ${LEAGUE_ID}`);
  console.log(`Fetching years: ${ESPN_YEARS[0]}-${ESPN_YEARS[ESPN_YEARS.length - 1]}`);
  console.log('');

  const dataDir = path.join(__dirname, '..', 'public', 'data');
  const espnHistoricalDir = path.join(dataDir, 'espn-historical');

  // Ensure directories exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(espnHistoricalDir)) {
    fs.mkdirSync(espnHistoricalDir, { recursive: true });
  }

  const seasons = [];
  let successCount = 0;
  let failCount = 0;

  for (const year of ESPN_YEARS) {
    console.log(`Fetching ${year}...`);

    const espnData = await fetchESPNLeagueData(year);

    if (espnData && espnData.teams && espnData.teams.length > 0) {
      // Save raw ESPN data
      fs.writeFileSync(
        path.join(espnHistoricalDir, `${year}.json`),
        JSON.stringify(espnData, null, 2)
      );

      // Process and add to seasons
      const processedSeason = processESPNData(espnData, year);
      seasons.push(processedSeason);

      console.log(`  ✓ ${year}: Champion: ${processedSeason.champion}, ${processedSeason.standings.length} teams`);
      successCount++;
    } else {
      console.log(`  ✗ ${year}: No data available`);
      failCount++;
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Sort seasons by year
  seasons.sort((a, b) => a.year - b.year);

  // Build owner records
  const owners = buildOwnerRecords(seasons);

  // Save processed data
  fs.writeFileSync(
    path.join(dataDir, 'seasons.json'),
    JSON.stringify(seasons, null, 2)
  );

  fs.writeFileSync(
    path.join(dataDir, 'owners.json'),
    JSON.stringify(owners, null, 2)
  );

  console.log('');
  console.log('===========================');
  console.log(`Completed: ${successCount} successful, ${failCount} failed`);
  console.log(`Total seasons: ${seasons.length}`);
  console.log(`Total owners: ${owners.length}`);
  console.log('');
  console.log('Data saved to:');
  console.log(`  - ${path.join(dataDir, 'seasons.json')}`);
  console.log(`  - ${path.join(dataDir, 'owners.json')}`);
  console.log(`  - ${espnHistoricalDir}/*.json (raw ESPN data)`);
}

main().catch(console.error);
