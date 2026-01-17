'use client';

import { useState } from 'react';

interface Player {
  id: number;
  name: string;
  position: string;
  team: string;
  points: number;
}

interface RosterSlot {
  position: string;
  player: Player | null;
}

interface TeamRoster {
  ownerName: string;
  teamName: string;
  totalPoints: number;
  starters: RosterSlot[];
  bench: RosterSlot[];
}

interface MatchupWithRosters {
  week: number;
  matchupId: number;
  homeTeam: TeamRoster;
  awayTeam: TeamRoster;
  isPlayoff: boolean;
  isChampionship: boolean;
}

interface MatchupDetailProps {
  matchup: MatchupWithRosters;
  onClose: () => void;
}

function RosterTable({ roster, isWinner }: { roster: TeamRoster; isWinner: boolean }) {
  return (
    <div className={`flex-1 ${isWinner ? 'bg-green-500/10' : 'bg-bg-secondary'} rounded-lg p-4`}>
      <div className="text-center mb-4">
        <div className={`text-lg font-bold ${isWinner ? 'text-green-400' : 'text-text-primary'}`}>
          {roster.ownerName}
        </div>
        <div className="text-xs text-text-muted">{roster.teamName}</div>
        <div className={`text-2xl font-bold mt-2 ${isWinner ? 'text-green-400' : 'text-text-primary'}`}>
          {roster.totalPoints.toFixed(1)}
        </div>
      </div>

      {/* Starters */}
      <div className="space-y-1">
        <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Starters</div>
        {roster.starters.map((slot, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-1 px-2 rounded bg-bg-tertiary/50 text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="w-10 text-xs font-medium text-text-muted">{slot.position}</span>
              {slot.player ? (
                <div>
                  <span className="text-text-primary">{slot.player.name}</span>
                  <span className="text-xs text-text-muted ml-1">
                    {slot.player.team} - {slot.player.position}
                  </span>
                </div>
              ) : (
                <span className="text-text-muted">Empty</span>
              )}
            </div>
            <span className={`font-medium ${slot.player && slot.player.points > 100 ? 'text-green-400' : 'text-text-secondary'}`}>
              {slot.player ? slot.player.points.toFixed(1) : '-'}
            </span>
          </div>
        ))}
      </div>

      {/* Bench */}
      {roster.bench.length > 0 && (
        <div className="mt-4 space-y-1">
          <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Bench</div>
          {roster.bench.map((slot, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1 px-2 rounded bg-bg-tertiary/30 text-sm opacity-70"
            >
              <div className="flex items-center gap-2">
                <span className="w-10 text-xs font-medium text-text-muted">BN</span>
                {slot.player ? (
                  <div>
                    <span className="text-text-secondary">{slot.player.name}</span>
                    <span className="text-xs text-text-muted ml-1">
                      {slot.player.team}
                    </span>
                  </div>
                ) : (
                  <span className="text-text-muted">Empty</span>
                )}
              </div>
              <span className="text-text-muted">
                {slot.player ? slot.player.points.toFixed(1) : '-'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MatchupDetail({ matchup, onClose }: MatchupDetailProps) {
  const homeWon = matchup.homeTeam.totalPoints > matchup.awayTeam.totalPoints;
  const awayWon = matchup.awayTeam.totalPoints > matchup.homeTeam.totalPoints;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-bg-primary border border-bg-tertiary rounded-lg max-w-5xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-bg-primary border-b border-bg-tertiary p-4 flex items-center justify-between">
          <div>
            <span className={`text-sm font-medium ${matchup.isPlayoff ? 'text-accent-primary' : 'text-text-muted'}`}>
              {matchup.isChampionship ? 'Championship' : matchup.isPlayoff ? 'Playoff' : `Week ${matchup.week}`}
            </span>
            <h2 className="text-xl font-bold text-text-primary">
              {matchup.awayTeam.ownerName} @ {matchup.homeTeam.ownerName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary text-2xl"
          >
            x
          </button>
        </div>

        {/* Score Summary */}
        <div className="p-4 bg-bg-secondary border-b border-bg-tertiary">
          <div className="flex items-center justify-center gap-8">
            <div className={`text-center ${awayWon ? 'text-green-400' : 'text-text-secondary'}`}>
              <div className="text-lg font-bold">{matchup.awayTeam.ownerName}</div>
              <div className="text-3xl font-bold">{matchup.awayTeam.totalPoints.toFixed(1)}</div>
            </div>
            <div className="text-text-muted text-2xl">vs</div>
            <div className={`text-center ${homeWon ? 'text-green-400' : 'text-text-secondary'}`}>
              <div className="text-lg font-bold">{matchup.homeTeam.ownerName}</div>
              <div className="text-3xl font-bold">{matchup.homeTeam.totalPoints.toFixed(1)}</div>
            </div>
          </div>
        </div>

        {/* Rosters Side by Side */}
        <div className="p-4 flex gap-4">
          <RosterTable roster={matchup.awayTeam} isWinner={awayWon} />
          <RosterTable roster={matchup.homeTeam} isWinner={homeWon} />
        </div>
      </div>
    </div>
  );
}

interface WeekMatchupsWithRostersProps {
  matchups: MatchupWithRosters[];
  week: number;
}

export function WeekMatchupsWithRosters({ matchups, week }: WeekMatchupsWithRostersProps) {
  const [selectedMatchup, setSelectedMatchup] = useState<MatchupWithRosters | null>(null);
  const weekMatchups = matchups.filter(m => m.week === week);

  if (weekMatchups.length === 0) {
    return <div className="text-text-muted text-center py-4">No roster data available for this week</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {weekMatchups.map((matchup, i) => {
          const homeWon = matchup.homeTeam.totalPoints > matchup.awayTeam.totalPoints;
          const awayWon = matchup.awayTeam.totalPoints > matchup.homeTeam.totalPoints;

          return (
            <button
              key={i}
              onClick={() => setSelectedMatchup(matchup)}
              className={`bg-bg-tertiary rounded-lg p-3 hover:bg-bg-hover transition-colors text-left ${
                matchup.isChampionship ? 'ring-2 ring-trophy-gold' : ''
              }`}
            >
              <div className={`flex justify-between items-center py-1 ${awayWon ? 'text-green-400' : 'text-text-secondary'}`}>
                <span className="font-medium">{matchup.awayTeam.ownerName}</span>
                <span className="font-bold">{matchup.awayTeam.totalPoints.toFixed(1)}</span>
              </div>
              <div className={`flex justify-between items-center py-1 ${homeWon ? 'text-green-400' : 'text-text-secondary'}`}>
                <span className="font-medium">{matchup.homeTeam.ownerName}</span>
                <span className="font-bold">{matchup.homeTeam.totalPoints.toFixed(1)}</span>
              </div>
              <div className="text-xs text-accent-primary mt-2 text-center">
                Click to view rosters
              </div>
            </button>
          );
        })}
      </div>

      {selectedMatchup && (
        <MatchupDetail
          matchup={selectedMatchup}
          onClose={() => setSelectedMatchup(null)}
        />
      )}
    </>
  );
}
