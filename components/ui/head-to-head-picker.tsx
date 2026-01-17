'use client';

import { useState, useMemo } from 'react';
import { Season, WeeklyMatchup } from '@/types/season';

interface HeadToHeadPickerProps {
  seasons: Season[];
  activeOwners: string[];
}

interface MatchupResult {
  year: number;
  week: number;
  player1Score: number;
  player2Score: number;
  winner: string;
  margin: number;
  isPlayoff: boolean;
  isChampionship: boolean;
}

interface H2HStats {
  player1Wins: number;
  player2Wins: number;
  ties: number;
  totalMatchups: number;
  player1AvgPoints: number;
  player2AvgPoints: number;
  player1TotalPoints: number;
  player2TotalPoints: number;
  playoffMeetings: number;
  championshipMeetings: number;
  closestGame: MatchupResult | null;
  biggestBlowout: MatchupResult | null;
  matchups: MatchupResult[];
}

export function HeadToHeadPicker({ seasons, activeOwners }: HeadToHeadPickerProps) {
  const [player1, setPlayer1] = useState<string>('');
  const [player2, setPlayer2] = useState<string>('');

  const h2hStats = useMemo(() => {
    if (!player1 || !player2 || player1 === player2) return null;

    const stats: H2HStats = {
      player1Wins: 0,
      player2Wins: 0,
      ties: 0,
      totalMatchups: 0,
      player1AvgPoints: 0,
      player2AvgPoints: 0,
      player1TotalPoints: 0,
      player2TotalPoints: 0,
      playoffMeetings: 0,
      championshipMeetings: 0,
      closestGame: null,
      biggestBlowout: null,
      matchups: [],
    };

    // Helper to match owner names (case-insensitive full name comparison)
    const matchesPlayer = (ownerName: string, player: string) => {
      return ownerName.toLowerCase().trim() === player.toLowerCase().trim();
    };

    seasons.forEach(season => {
      if (!season.weeklyScores) return;

      season.weeklyScores.forEach(matchup => {
        const homeOwner = matchup.homeTeam.ownerName;
        const awayOwner = matchup.awayTeam.ownerName;

        const p1IsHome = matchesPlayer(homeOwner, player1);
        const p1IsAway = matchesPlayer(awayOwner, player1);
        const p2IsHome = matchesPlayer(homeOwner, player2);
        const p2IsAway = matchesPlayer(awayOwner, player2);

        if ((p1IsHome && p2IsAway) || (p1IsAway && p2IsHome)) {
          const p1Score = p1IsHome ? matchup.homeTeam.score : matchup.awayTeam.score;
          const p2Score = p2IsHome ? matchup.homeTeam.score : matchup.awayTeam.score;
          const margin = Math.abs(p1Score - p2Score);

          stats.totalMatchups++;
          stats.player1TotalPoints += p1Score;
          stats.player2TotalPoints += p2Score;

          if (matchup.isChampionship) stats.championshipMeetings++;
          else if (matchup.isPlayoff) stats.playoffMeetings++;

          let winner = '';
          if (p1Score > p2Score) {
            stats.player1Wins++;
            winner = player1;
          } else if (p2Score > p1Score) {
            stats.player2Wins++;
            winner = player2;
          } else {
            stats.ties++;
            winner = 'Tie';
          }

          const result: MatchupResult = {
            year: season.year,
            week: matchup.week,
            player1Score: p1Score,
            player2Score: p2Score,
            winner,
            margin,
            isPlayoff: matchup.isPlayoff,
            isChampionship: matchup.isChampionship,
          };

          stats.matchups.push(result);

          if (!stats.closestGame || margin < stats.closestGame.margin) {
            stats.closestGame = result;
          }
          if (!stats.biggestBlowout || margin > stats.biggestBlowout.margin) {
            stats.biggestBlowout = result;
          }
        }
      });
    });

    if (stats.totalMatchups > 0) {
      stats.player1AvgPoints = stats.player1TotalPoints / stats.totalMatchups;
      stats.player2AvgPoints = stats.player2TotalPoints / stats.totalMatchups;
    }

    // Sort matchups by year descending, then week descending
    stats.matchups.sort((a, b) => b.year - a.year || b.week - a.week);

    return stats;
  }, [player1, player2, seasons]);

  return (
    <div className="border border-accent-primary/40 bg-accent-primary/5 rounded-lg p-6 mb-8 shadow-[0_0_15px_rgba(0,212,255,0.15)]">
      <h2 className="text-2xl font-bold text-text-primary mb-4">Head-to-Head Lookup</h2>
      <p className="text-sm text-text-muted mb-4">Select any two players to see their matchup history</p>

      {/* Player Selectors */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm text-text-muted mb-1">Player 1</label>
          <select
            value={player1}
            onChange={(e) => setPlayer1(e.target.value)}
            className="w-full bg-bg-tertiary border border-accent-primary/30 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-primary focus:shadow-[0_0_10px_rgba(0,212,255,0.2)]"
          >
            <option value="">Select player...</option>
            {activeOwners.map(owner => (
              <option key={owner} value={owner} disabled={owner === player2}>
                {owner}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end justify-center pb-2">
          <span className="text-xl font-bold text-text-muted">VS</span>
        </div>

        <div className="flex-1">
          <label className="block text-sm text-text-muted mb-1">Player 2</label>
          <select
            value={player2}
            onChange={(e) => setPlayer2(e.target.value)}
            className="w-full bg-bg-tertiary border border-accent-primary/30 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-primary focus:shadow-[0_0_10px_rgba(0,212,255,0.2)]"
          >
            <option value="">Select player...</option>
            {activeOwners.map(owner => (
              <option key={owner} value={owner} disabled={owner === player1}>
                {owner}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {h2hStats && h2hStats.totalMatchups > 0 && (
        <div className="space-y-6">
          {/* Head to Head Record */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-bg-tertiary rounded-lg">
              <div className={`text-3xl font-bold ${h2hStats.player1Wins > h2hStats.player2Wins ? 'text-green-400' : 'text-text-primary'}`}>
                {h2hStats.player1Wins}
              </div>
              <div className="text-sm text-text-muted mt-1">{player1} Wins</div>
            </div>

            <div className="text-center p-4 bg-bg-tertiary rounded-lg">
              <div className="text-2xl font-bold text-text-secondary">
                {h2hStats.totalMatchups}
              </div>
              <div className="text-sm text-text-muted mt-1">Total Games</div>
              {h2hStats.ties > 0 && (
                <div className="text-xs text-text-muted">({h2hStats.ties} ties)</div>
              )}
            </div>

            <div className="text-center p-4 bg-bg-tertiary rounded-lg">
              <div className={`text-3xl font-bold ${h2hStats.player2Wins > h2hStats.player1Wins ? 'text-green-400' : 'text-text-primary'}`}>
                {h2hStats.player2Wins}
              </div>
              <div className="text-sm text-text-muted mt-1">{player2} Wins</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-bg-secondary p-3 rounded">
              <div className="text-text-muted mb-1">Avg Points</div>
              <div className="font-semibold text-text-primary">{player1}: {h2hStats.player1AvgPoints.toFixed(1)}</div>
              <div className="font-semibold text-text-primary">{player2}: {h2hStats.player2AvgPoints.toFixed(1)}</div>
            </div>

            <div className="bg-bg-secondary p-3 rounded">
              <div className="text-text-muted mb-1">Playoff Meetings</div>
              <div className="font-semibold text-accent-primary">{h2hStats.playoffMeetings}</div>
            </div>

            <div className="bg-bg-secondary p-3 rounded">
              <div className="text-text-muted mb-1">Championships</div>
              <div className="font-semibold text-trophy-gold">{h2hStats.championshipMeetings}</div>
            </div>

            <div className="bg-bg-secondary p-3 rounded">
              <div className="text-text-muted mb-1">Closest Game</div>
              {h2hStats.closestGame && (
                <>
                  <div className="font-semibold text-yellow-400">{h2hStats.closestGame.margin.toFixed(1)} pts</div>
                  <div className="text-xs text-text-muted">{h2hStats.closestGame.year} Wk {h2hStats.closestGame.week}</div>
                </>
              )}
            </div>
          </div>

          {/* Matchup History */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">Matchup History</h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {h2hStats.matchups.map((matchup, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    matchup.isChampionship
                      ? 'bg-trophy-gold/20 border border-trophy-gold/50'
                      : matchup.isPlayoff
                      ? 'bg-accent-primary/10 border border-accent-primary/30'
                      : 'bg-bg-tertiary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-muted w-16">
                      {matchup.year} W{matchup.week}
                    </span>
                    {matchup.isChampionship && <span className="text-xs">🏆</span>}
                    {matchup.isPlayoff && !matchup.isChampionship && <span className="text-xs text-accent-primary">PO</span>}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-medium ${matchup.winner === player1 ? 'text-green-400' : 'text-text-secondary'}`}>
                      {matchup.player1Score.toFixed(1)}
                    </span>
                    <span className="text-text-muted">-</span>
                    <span className={`font-medium ${matchup.winner === player2 ? 'text-green-400' : 'text-text-secondary'}`}>
                      {matchup.player2Score.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-xs text-text-muted w-20 text-right">
                    +{matchup.margin.toFixed(1)} {matchup.winner !== 'Tie' ? matchup.winner : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {h2hStats && h2hStats.totalMatchups === 0 && player1 && player2 && (
        <div className="text-center py-8 text-text-muted">
          No matchups found between {player1} and {player2}
        </div>
      )}

      {(!player1 || !player2) && (
        <div className="text-center py-8 text-text-muted">
          Select two players to see their head-to-head history
        </div>
      )}
    </div>
  );
}
