'use client';

import { Season, WeeklyMatchup } from '@/types/season';
import { Owner } from '@/types/owner';
import { LeaderboardTable } from '@/components/ui/leaderboard-table';
import { StatCard } from '@/components/ui/stat-card';
import { WeekMatchupsWithRosters, MatchupDetail } from '@/components/ui/matchup-detail';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

// Calculate season records from matchups
function calculateSeasonRecords(matchups: WeeklyMatchup[]) {
  if (!matchups || matchups.length === 0) return null;

  let highestScore = { owner: '', score: 0, week: 0, opponent: '', opponentScore: 0 };
  let lowestWinningScore = { owner: '', score: Infinity, week: 0, opponent: '', opponentScore: 0 };
  let biggestBlowout = { winner: '', loser: '', margin: 0, week: 0, winnerScore: 0, loserScore: 0 };
  let closestGame = { winner: '', loser: '', margin: Infinity, week: 0, winnerScore: 0, loserScore: 0 };
  let highestCombined = { home: '', away: '', total: 0, week: 0, homeScore: 0, awayScore: 0 };

  const weeklyHighScores: { week: number; owner: string; score: number; isPlayoff: boolean }[] = [];

  // Group matchups by week
  const matchupsByWeek = matchups.reduce((acc, m) => {
    if (!acc[m.week]) acc[m.week] = [];
    acc[m.week].push(m);
    return acc;
  }, {} as Record<number, WeeklyMatchup[]>);

  for (const matchup of matchups) {
    const homeScore = matchup.homeTeam.score;
    const awayScore = matchup.awayTeam.score;
    const combined = homeScore + awayScore;
    const margin = Math.abs(homeScore - awayScore);
    const winner = homeScore > awayScore ? matchup.homeTeam : matchup.awayTeam;
    const loser = homeScore > awayScore ? matchup.awayTeam : matchup.homeTeam;

    // Highest single score
    if (homeScore > highestScore.score) {
      highestScore = {
        owner: matchup.homeTeam.ownerName,
        score: homeScore,
        week: matchup.week,
        opponent: matchup.awayTeam.ownerName,
        opponentScore: awayScore
      };
    }
    if (awayScore > highestScore.score) {
      highestScore = {
        owner: matchup.awayTeam.ownerName,
        score: awayScore,
        week: matchup.week,
        opponent: matchup.homeTeam.ownerName,
        opponentScore: homeScore
      };
    }

    // Lowest winning score
    if (winner.score < lowestWinningScore.score) {
      lowestWinningScore = {
        owner: winner.ownerName,
        score: winner.score,
        week: matchup.week,
        opponent: loser.ownerName,
        opponentScore: loser.score
      };
    }

    // Biggest blowout
    if (margin > biggestBlowout.margin) {
      biggestBlowout = {
        winner: winner.ownerName,
        loser: loser.ownerName,
        margin,
        week: matchup.week,
        winnerScore: winner.score,
        loserScore: loser.score
      };
    }

    // Closest game
    if (margin < closestGame.margin && margin > 0) {
      closestGame = {
        winner: winner.ownerName,
        loser: loser.ownerName,
        margin,
        week: matchup.week,
        winnerScore: winner.score,
        loserScore: loser.score
      };
    }

    // Highest combined
    if (combined > highestCombined.total) {
      highestCombined = {
        home: matchup.homeTeam.ownerName,
        away: matchup.awayTeam.ownerName,
        total: combined,
        week: matchup.week,
        homeScore,
        awayScore
      };
    }
  }

  // Calculate weekly high scores
  for (const [weekStr, weekMatchups] of Object.entries(matchupsByWeek)) {
    const week = parseInt(weekStr);
    let weekHigh = { owner: '', score: 0 };
    const isPlayoff = weekMatchups[0]?.isPlayoff || false;

    for (const m of weekMatchups) {
      if (m.homeTeam.score > weekHigh.score) {
        weekHigh = { owner: m.homeTeam.ownerName, score: m.homeTeam.score };
      }
      if (m.awayTeam.score > weekHigh.score) {
        weekHigh = { owner: m.awayTeam.ownerName, score: m.awayTeam.score };
      }
    }
    weeklyHighScores.push({ week, ...weekHigh, isPlayoff });
  }

  // Count weekly wins per owner
  const weeklyWinCounts: Record<string, number> = {};
  for (const hs of weeklyHighScores) {
    weeklyWinCounts[hs.owner] = (weeklyWinCounts[hs.owner] || 0) + 1;
  }
  const mostWeeklyHighScores = Object.entries(weeklyWinCounts)
    .sort((a, b) => b[1] - a[1])[0];

  return {
    highestScore,
    lowestWinningScore: lowestWinningScore.score < Infinity ? lowestWinningScore : null,
    biggestBlowout,
    closestGame: closestGame.margin < Infinity ? closestGame : null,
    highestCombined,
    weeklyHighScores: weeklyHighScores.sort((a, b) => a.week - b.week),
    mostWeeklyHighScores: mostWeeklyHighScores ? { owner: mostWeeklyHighScores[0], count: mostWeeklyHighScores[1] } : null
  };
}

export default function SeasonDetailPage() {
  const params = useParams();
  const yearParam = params.year as string;
  const year = parseInt(yearParam);

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [rosterMatchups, setRosterMatchups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [seasonsRes, ownersRes] = await Promise.all([
          fetch('/data/seasons.json'),
          fetch('/data/owners.json')
        ]);
        setSeasons(await seasonsRes.json());
        setOwners(await ownersRes.json());

        // Load roster data for years with roster files
        try {
          const rosterRes = await fetch(`/data/rosters/${year}.json`);
          if (rosterRes.ok) {
            setRosterMatchups(await rosterRes.json());
          }
        } catch (e) {
          console.log('No roster data available for', year);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [year]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-text-muted">Loading season data...</div>
        </div>
      </div>
    );
  }

  const season = seasons.find(s => s.year === year);

  if (!season) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-text-muted">Season not found</div>
        </div>
      </div>
    );
  }

  // Navigation to prev/next season
  const allYears = seasons.map(s => s.year).sort((a, b) => a - b);
  const currentIndex = allYears.indexOf(year);
  const prevYear = currentIndex > 0 ? allYears[currentIndex - 1] : null;
  const nextYear = currentIndex < allYears.length - 1 ? allYears[currentIndex + 1] : null;

  // Calculate season records
  const records = calculateSeasonRecords(season.weeklyScores || []);

  // Find championship matchup
  const championshipMatchup = season.weeklyScores?.find(m => m.isChampionship);

  // Group matchups by week for display
  const matchupsByWeek = (season.weeklyScores || []).reduce((acc, m) => {
    if (!acc[m.week]) acc[m.week] = [];
    acc[m.week].push(m);
    return acc;
  }, {} as Record<number, WeeklyMatchup[]>);

  const weeks = Object.keys(matchupsByWeek).map(Number).sort((a, b) => a - b);
  const regularSeasonWeeks = weeks.filter(w => !matchupsByWeek[w][0]?.isPlayoff);
  const playoffWeeks = weeks.filter(w => matchupsByWeek[w][0]?.isPlayoff);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between mb-8">
        <div>
          {prevYear && (
            <Link
              href={`/seasons/${prevYear}`}
              className="text-sm text-accent-primary hover:text-accent-primary/80"
            >
              ← {prevYear}
            </Link>
          )}
        </div>
        <h1 className="text-4xl font-bold text-text-primary">
          {year} Season
        </h1>
        <div>
          {nextYear && (
            <Link
              href={`/seasons/${nextYear}`}
              className="text-sm text-accent-primary hover:text-accent-primary/80"
            >
              {nextYear} →
            </Link>
          )}
        </div>
      </div>

      {/* Championship Banner */}
      {championshipMatchup ? (
        <div className="mb-8 rounded-lg border-2 border-trophy-gold bg-gradient-to-br from-trophy-gold/20 via-trophy-orange/10 to-trophy-red/10 p-6">
          <div className="text-center mb-4">
            <span className="text-4xl">🏆</span>
            <h2 className="text-2xl font-bold text-trophy-gold mt-2">Championship Game</h2>
          </div>
          <div className="flex items-center justify-center gap-4 md:gap-8">
            <div className={`text-center flex-1 p-4 rounded-lg ${
              championshipMatchup.homeTeam.score > championshipMatchup.awayTeam.score
                ? 'bg-green-500/20 border border-green-500/50'
                : 'bg-bg-tertiary'
            }`}>
              <div className="text-lg font-bold text-text-primary">{championshipMatchup.homeTeam.ownerName}</div>
              <div className="text-3xl font-bold text-trophy-gold mt-1">{championshipMatchup.homeTeam.score.toFixed(2)}</div>
              {championshipMatchup.homeTeam.score > championshipMatchup.awayTeam.score && (
                <div className="text-sm text-green-400 mt-1">CHAMPION</div>
              )}
            </div>
            <div className="text-2xl font-bold text-text-muted">VS</div>
            <div className={`text-center flex-1 p-4 rounded-lg ${
              championshipMatchup.awayTeam.score > championshipMatchup.homeTeam.score
                ? 'bg-green-500/20 border border-green-500/50'
                : 'bg-bg-tertiary'
            }`}>
              <div className="text-lg font-bold text-text-primary">{championshipMatchup.awayTeam.ownerName}</div>
              <div className="text-3xl font-bold text-trophy-gold mt-1">{championshipMatchup.awayTeam.score.toFixed(2)}</div>
              {championshipMatchup.awayTeam.score > championshipMatchup.homeTeam.score && (
                <div className="text-sm text-green-400 mt-1">CHAMPION</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 rounded-lg border-2 border-trophy-gold bg-gradient-to-br from-trophy-gold/20 via-trophy-orange/10 to-trophy-red/10 p-6">
          <div className="text-center mb-4">
            <span className="text-4xl">🏆</span>
            <h2 className="text-2xl font-bold text-trophy-gold mt-2">Championship</h2>
          </div>
          <div className="flex items-center justify-center gap-4 md:gap-8">
            <div className="text-center flex-1 p-4 rounded-lg bg-green-500/20 border border-green-500/50">
              <div className="text-lg font-bold text-text-primary">{season.champion}</div>
              <div className="text-sm text-green-400 mt-1">CHAMPION</div>
            </div>
            <div className="text-2xl font-bold text-text-muted">VS</div>
            <div className="text-center flex-1 p-4 rounded-lg bg-bg-tertiary">
              <div className="text-lg font-bold text-text-primary">{season.runnerUp}</div>
              <div className="text-sm text-text-muted mt-1">RUNNER-UP</div>
            </div>
          </div>
        </div>
      )}

      {/* Season Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Champion"
          value={season.champion}
          variant="gold"
        />
        <StatCard
          title="Runner-Up"
          value={season.runnerUp}
          variant="orange"
        />
        <StatCard
          title="Most Points"
          value={season.mostPoints.points > 0 ? season.mostPoints.points.toFixed(0) : season.mostPoints.owner}
          subtitle={season.mostPoints.points > 0 ? season.mostPoints.owner : 'Season leader'}
        />
        <StatCard
          title="Last Place"
          value={season.lastPlace}
          variant="red"
        />
      </div>

      {/* Season Records */}
      {records && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Season Records</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-4">
              <div className="text-sm text-text-muted mb-1">Highest Single Game Score</div>
              <div className="text-2xl font-bold text-green-400">{records.highestScore.score.toFixed(2)}</div>
              <div className="text-sm text-text-secondary">
                {records.highestScore.owner} (Week {records.highestScore.week})
              </div>
              <div className="text-xs text-text-muted mt-1">
                vs {records.highestScore.opponent} ({records.highestScore.opponentScore.toFixed(2)})
              </div>
            </div>

            <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-4">
              <div className="text-sm text-text-muted mb-1">Biggest Blowout</div>
              <div className="text-2xl font-bold text-red-400">+{records.biggestBlowout.margin.toFixed(2)}</div>
              <div className="text-sm text-text-secondary">
                {records.biggestBlowout.winner} def. {records.biggestBlowout.loser}
              </div>
              <div className="text-xs text-text-muted mt-1">
                {records.biggestBlowout.winnerScore.toFixed(2)} - {records.biggestBlowout.loserScore.toFixed(2)} (Week {records.biggestBlowout.week})
              </div>
            </div>

            {records.closestGame && (
              <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-4">
                <div className="text-sm text-text-muted mb-1">Closest Game</div>
                <div className="text-2xl font-bold text-yellow-400">{records.closestGame.margin.toFixed(2)}</div>
                <div className="text-sm text-text-secondary">
                  {records.closestGame.winner} def. {records.closestGame.loser}
                </div>
                <div className="text-xs text-text-muted mt-1">
                  {records.closestGame.winnerScore.toFixed(2)} - {records.closestGame.loserScore.toFixed(2)} (Week {records.closestGame.week})
                </div>
              </div>
            )}

            <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-4">
              <div className="text-sm text-text-muted mb-1">Highest Combined Score</div>
              <div className="text-2xl font-bold text-blue-400">{records.highestCombined.total.toFixed(2)}</div>
              <div className="text-sm text-text-secondary">
                {records.highestCombined.home} vs {records.highestCombined.away}
              </div>
              <div className="text-xs text-text-muted mt-1">
                {records.highestCombined.homeScore.toFixed(2)} - {records.highestCombined.awayScore.toFixed(2)} (Week {records.highestCombined.week})
              </div>
            </div>

            {records.lowestWinningScore && (
              <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-4">
                <div className="text-sm text-text-muted mb-1">Lowest Winning Score</div>
                <div className="text-2xl font-bold text-orange-400">{records.lowestWinningScore.score.toFixed(2)}</div>
                <div className="text-sm text-text-secondary">
                  {records.lowestWinningScore.owner} (Week {records.lowestWinningScore.week})
                </div>
                <div className="text-xs text-text-muted mt-1">
                  vs {records.lowestWinningScore.opponent} ({records.lowestWinningScore.opponentScore.toFixed(2)})
                </div>
              </div>
            )}

            {records.mostWeeklyHighScores && (
              <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-4">
                <div className="text-sm text-text-muted mb-1">Most Weekly High Scores</div>
                <div className="text-2xl font-bold text-purple-400">{records.mostWeeklyHighScores.count}</div>
                <div className="text-sm text-text-secondary">
                  {records.mostWeeklyHighScores.owner}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Weekly High Scorers */}
      {records && records.weeklyHighScores.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Weekly High Scorers</h2>
          <div className="overflow-x-auto">
            <div className="flex gap-2 pb-2">
              {records.weeklyHighScores.map((hs) => (
                <div
                  key={hs.week}
                  className={`flex-shrink-0 w-24 p-2 rounded-lg text-center ${
                    hs.isPlayoff ? 'bg-accent-primary/20 border border-accent-primary/50' : 'bg-bg-tertiary'
                  }`}
                >
                  <div className="text-xs text-text-muted">
                    {hs.isPlayoff ? 'PO' : 'Wk'} {hs.week}
                  </div>
                  <div className="text-sm font-bold text-text-primary truncate">{hs.owner}</div>
                  <div className="text-xs text-green-400">{hs.score.toFixed(1)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final Standings */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-4">
          Final Standings
        </h2>
        <LeaderboardTable
          data={season.standings}
          columns={[
            {
              key: 'rank',
              label: '#',
              className: 'font-bold text-text-primary',
              headerClassName: 'w-8 md:w-12',
              render: (value, row) => (
                <div>
                  <div>{value}</div>
                  {row.madePlayoffs && (
                    <div className="text-green-500 text-xs">P</div>
                  )}
                </div>
              ),
            },
            {
              key: 'ownerName',
              label: 'Owner',
              className: 'font-semibold text-text-primary max-w-[100px] md:max-w-none',
              render: (value, row) => (
                <div className="min-w-0">
                  <div className="font-semibold text-text-primary truncate">
                    {value}
                    {value === season.champion && <span className="ml-1">🏆</span>}
                    {value === season.runnerUp && <span className="ml-1">🥈</span>}
                  </div>
                  <div className="text-xs text-text-muted truncate hidden md:block">{row.teamName}</div>
                </div>
              ),
            },
            {
              key: 'wins',
              label: 'W',
              className: 'text-center text-green-400 w-8 md:w-12',
              headerClassName: 'text-center w-8 md:w-12',
            },
            {
              key: 'losses',
              label: 'L',
              className: 'text-center text-red-400 w-8 md:w-12',
              headerClassName: 'text-center w-8 md:w-12',
            },
            {
              key: 'pointsFor',
              label: 'PF',
              className: 'text-right text-xs md:text-sm',
              headerClassName: 'text-right',
              render: (value) => value.toFixed(1),
            },
            {
              key: 'pointsAgainst',
              label: 'PA',
              className: 'text-right text-xs md:text-sm',
              headerClassName: 'text-right',
              render: (value) => value.toFixed(1),
            },
          ]}
          defaultSortKey="rank"
          defaultSortDirection="asc"
          linkBuilder={(row) => {
            const owner = owners.find(o => o.name === row.ownerName);
            return owner ? `/owners/${owner.id}` : '#';
          }}
        />
        <p className="text-xs text-text-muted mt-2">P = Made Playoffs</p>
      </section>

      {/* Playoff Bracket */}
      {playoffWeeks.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Playoffs</h2>
          {rosterMatchups.length > 0 && (
            <p className="text-sm text-accent-primary mb-4">Click on any matchup to see full rosters and player scores</p>
          )}
          <div className="space-y-4">
            {playoffWeeks.map(week => {
              const weekMatchups = matchupsByWeek[week];
              const isChampWeek = weekMatchups.some(m => m.isChampionship);

              return (
                <div key={week} className={`border rounded-lg p-4 ${
                  isChampWeek
                    ? 'border-trophy-gold bg-gradient-to-r from-trophy-gold/10 to-transparent'
                    : 'border-accent-primary/50 bg-accent-primary/5'
                }`}>
                  <h3 className="font-bold text-lg text-text-primary mb-3">
                    {isChampWeek ? '🏆 Championship Week' : `Playoff Week ${week - season.regularSeasonWeeks}`}
                    <span className="text-sm font-normal text-text-muted ml-2">(Week {week})</span>
                  </h3>
                  {rosterMatchups.length > 0 ? (
                    <WeekMatchupsWithRosters matchups={rosterMatchups} week={week} />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {weekMatchups.map((matchup, i) => {
                        const homeWon = matchup.homeTeam.score > matchup.awayTeam.score;
                        const awayWon = matchup.awayTeam.score > matchup.homeTeam.score;

                        return (
                          <div key={i} className={`rounded-lg p-3 ${
                            matchup.isChampionship ? 'bg-trophy-gold/20' : 'bg-bg-tertiary'
                          }`}>
                            <div className={`flex justify-between items-center py-1 px-2 rounded ${awayWon ? 'bg-green-500/20' : ''}`}>
                              <span className={`font-medium ${awayWon ? 'text-green-400' : 'text-text-secondary'}`}>
                                {matchup.awayTeam.ownerName}
                              </span>
                              <span className={`font-bold ${awayWon ? 'text-green-400' : 'text-text-muted'}`}>
                                {matchup.awayTeam.score.toFixed(2)}
                              </span>
                            </div>
                            <div className={`flex justify-between items-center py-1 px-2 rounded ${homeWon ? 'bg-green-500/20' : ''}`}>
                              <span className={`font-medium ${homeWon ? 'text-green-400' : 'text-text-secondary'}`}>
                                {matchup.homeTeam.ownerName}
                              </span>
                              <span className={`font-bold ${homeWon ? 'text-green-400' : 'text-text-muted'}`}>
                                {matchup.homeTeam.score.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Regular Season Week by Week */}
      {regularSeasonWeeks.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Regular Season</h2>
          {rosterMatchups.length > 0 && (
            <p className="text-sm text-accent-primary mb-4">Click on any matchup to see full rosters and player scores</p>
          )}
          <div className="space-y-3">
            {regularSeasonWeeks.map(week => {
              const weekMatchups = matchupsByWeek[week];
              const weekHighScore = Math.max(
                ...weekMatchups.flatMap(m => [m.homeTeam.score, m.awayTeam.score])
              );

              return (
                <details key={week} className="border border-bg-tertiary rounded-lg group">
                  <summary className="p-4 cursor-pointer hover:bg-bg-tertiary/50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-text-primary">Week {week}</span>
                      <span className="text-sm text-text-muted">
                        High: {weekHighScore.toFixed(2)}
                      </span>
                    </div>
                    <span className="text-text-muted group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="p-4 pt-0">
                    {rosterMatchups.length > 0 ? (
                      <WeekMatchupsWithRosters matchups={rosterMatchups} week={week} />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {weekMatchups.map((matchup, i) => {
                          const homeWon = matchup.homeTeam.score > matchup.awayTeam.score;
                          const awayWon = matchup.awayTeam.score > matchup.homeTeam.score;
                          const isHighScore = matchup.homeTeam.score === weekHighScore || matchup.awayTeam.score === weekHighScore;

                          return (
                            <div key={i} className={`bg-bg-tertiary rounded-lg p-3 ${isHighScore ? 'ring-1 ring-green-500/50' : ''}`}>
                              <div className={`flex justify-between items-center py-1 ${awayWon ? 'text-green-400' : 'text-text-secondary'}`}>
                                <span className="font-medium">
                                  {matchup.awayTeam.ownerName}
                                  {matchup.awayTeam.score === weekHighScore && <span className="ml-1 text-xs">*</span>}
                                </span>
                                <span className="font-bold">{matchup.awayTeam.score.toFixed(2)}</span>
                              </div>
                              <div className={`flex justify-between items-center py-1 ${homeWon ? 'text-green-400' : 'text-text-secondary'}`}>
                                <span className="font-medium">
                                  {matchup.homeTeam.ownerName}
                                  {matchup.homeTeam.score === weekHighScore && <span className="ml-1 text-xs">*</span>}
                                </span>
                                <span className="font-bold">{matchup.homeTeam.score.toFixed(2)}</span>
                              </div>
                              <div className="text-xs text-text-muted mt-1 text-center">
                                Margin: {Math.abs(matchup.homeTeam.score - matchup.awayTeam.score).toFixed(2)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      )}

      {/* Key Moments */}
      {season.keyMoments && season.keyMoments.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            Key Moments
          </h2>
          <div className="space-y-3">
            {season.keyMoments.map((moment, i) => (
              <div
                key={i}
                className="border border-bg-tertiary rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">📌</div>
                  <div>
                    <h4 className="font-semibold text-text-primary">{moment.title}</h4>
                    <p className="text-sm text-text-secondary mt-1">{moment.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
