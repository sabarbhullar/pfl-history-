'use client';

import { Owner } from '@/types/owner';
import { Season } from '@/types/season';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface RecordData {
  title: string;
  description: string;
  ownerName: string;
  value: string | number;
  year?: number;
  details?: string;
  topTen?: { name: string; value: string | number; details?: string }[];
}

export default function RecordsPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [ownersRes, seasonsRes] = await Promise.all([
          fetch('/data/owners.json'),
          fetch('/data/seasons.json')
        ]);
        const ownersData = await ownersRes.json();
        const seasonsData = await seasonsRes.json();
        setOwners(ownersData);
        setSeasons(seasonsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-text-muted">Loading records...</div>
        </div>
      </div>
    );
  }

  // Calculate all records with top 10 lists
  const records = calculateRecordsWithTopTen(owners, seasons);

  const toggleRecord = (title: string) => {
    setExpandedRecord(expandedRecord === title ? null : title);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          League Records
        </h1>
        <p className="text-text-secondary">
          Click any record to see the top 10 leaderboard
        </p>
      </div>

      {records.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {records.map((record, index) => (
            <RecordCard
              key={index}
              record={record}
              owners={owners}
              isExpanded={expandedRecord === record.title}
              onToggle={() => toggleRecord(record.title)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-bg-tertiary rounded-lg">
          <p className="text-text-muted">
            No record data available yet. Refresh ESPN data in the admin panel.
          </p>
        </div>
      )}
    </div>
  );
}

function RecordCard({
  record,
  owners,
  isExpanded,
  onToggle
}: {
  record: RecordData;
  owners: Owner[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const owner = owners.find(o => o.name === record.ownerName);

  return (
    <div
      className={`border rounded-lg p-6 transition-all cursor-pointer ${
        isExpanded
          ? 'border-accent-primary bg-bg-secondary shadow-lg shadow-accent-primary/10'
          : 'border-bg-tertiary bg-bg-secondary hover:border-accent-primary hover:shadow-lg hover:shadow-accent-primary/10'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-trophy-gold mb-1">
            {record.title}
          </h3>
          <p className="text-sm text-text-muted">{record.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xl">🏅</span>
          <span className={`text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-text-primary">
            {record.value}
          </span>
          {record.year && (
            <span className="text-sm text-text-muted">({record.year})</span>
          )}
        </div>

        {owner ? (
          <Link
            href={`/owners/${owner.id}`}
            className="text-lg font-semibold text-accent-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {record.ownerName}
          </Link>
        ) : (
          <div className="text-lg font-semibold text-accent-primary">
            {record.ownerName}
          </div>
        )}

        {record.details && (
          <p className="text-sm text-text-secondary">{record.details}</p>
        )}
      </div>

      {/* Expandable Top 10 List */}
      {isExpanded && record.topTen && record.topTen.length > 0 && (
        <div className="mt-6 pt-6 border-t border-bg-tertiary">
          <h4 className="text-sm font-bold text-text-muted mb-3 uppercase tracking-wide">
            Top 10
          </h4>
          <div className="space-y-2">
            {record.topTen.map((item, idx) => {
              const itemOwner = owners.find(o => o.name === item.name);
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between py-2 px-3 rounded ${
                    idx === 0 ? 'bg-trophy-gold/10' : 'bg-bg-tertiary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold w-6 ${
                      idx === 0 ? 'text-trophy-gold' : 'text-text-muted'
                    }`}>
                      #{idx + 1}
                    </span>
                    {itemOwner ? (
                      <Link
                        href={`/owners/${itemOwner.id}`}
                        className="text-text-primary hover:text-accent-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <span className="text-text-primary">{item.name}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-text-primary">{item.value}</span>
                    {item.details && (
                      <span className="text-xs text-text-muted ml-2">{item.details}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function calculateRecordsWithTopTen(owners: Owner[], seasons: Season[]): RecordData[] {
  const records: RecordData[] = [];
  const getChampCount = (o: Owner) => (o as any).championshipCount ?? o.championships.length;

  // Most Championships
  const champsSorted = [...owners]
    .filter(o => getChampCount(o) > 0)
    .sort((a, b) => getChampCount(b) - getChampCount(a))
    .slice(0, 10);

  if (champsSorted.length > 0) {
    records.push({
      title: 'Most Championships',
      description: 'Most league championships won',
      ownerName: champsSorted[0].name,
      value: getChampCount(champsSorted[0]),
      details: `Years: ${champsSorted[0].championships.join(', ')}`,
      topTen: champsSorted.map(o => ({
        name: o.name,
        value: getChampCount(o),
        details: o.championships.join(', ')
      }))
    });
  }

  // Best Win Percentage (min 3 seasons)
  const eligibleOwners = owners.filter(o => o.totalSeasons >= 3);
  const winPctSorted = [...eligibleOwners]
    .sort((a, b) => b.stats.winPercentage - a.stats.winPercentage)
    .slice(0, 10);

  if (winPctSorted.length > 0) {
    records.push({
      title: 'Best Win Percentage',
      description: 'Highest career win percentage (min. 3 seasons)',
      ownerName: winPctSorted[0].name,
      value: `${winPctSorted[0].stats.winPercentage.toFixed(1)}%`,
      details: `${winPctSorted[0].stats.totalWins}-${winPctSorted[0].stats.totalLosses}`,
      topTen: winPctSorted.map(o => ({
        name: o.name,
        value: `${o.stats.winPercentage.toFixed(1)}%`,
        details: `${o.stats.totalWins}-${o.stats.totalLosses}`
      }))
    });
  }

  // Most Wins in a Season
  const seasonRecords: { owner: string; wins: number; losses: number; year: number }[] = [];
  seasons.forEach(season => {
    season.standings.forEach(standing => {
      seasonRecords.push({
        owner: standing.ownerName,
        wins: standing.wins,
        losses: standing.losses,
        year: season.year
      });
    });
  });
  const mostWinsSorted = [...seasonRecords]
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
    .slice(0, 10);

  if (mostWinsSorted.length > 0) {
    records.push({
      title: 'Most Wins in a Season',
      description: 'Best single-season record',
      ownerName: mostWinsSorted[0].owner,
      value: `${mostWinsSorted[0].wins}-${mostWinsSorted[0].losses}`,
      year: mostWinsSorted[0].year,
      topTen: mostWinsSorted.map(r => ({
        name: r.owner,
        value: `${r.wins}-${r.losses}`,
        details: `${r.year}`
      }))
    });
  }

  // Most Points in a Season
  const pointsRecords: { owner: string; points: number; year: number }[] = [];
  seasons.forEach(season => {
    season.standings.forEach(standing => {
      pointsRecords.push({
        owner: standing.ownerName,
        points: standing.pointsFor,
        year: season.year
      });
    });
  });
  const mostPointsSorted = [...pointsRecords]
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);

  if (mostPointsSorted.length > 0) {
    records.push({
      title: 'Most Points in a Season',
      description: 'Highest scoring season',
      ownerName: mostPointsSorted[0].owner,
      value: mostPointsSorted[0].points.toFixed(2),
      year: mostPointsSorted[0].year,
      topTen: mostPointsSorted.map(r => ({
        name: r.owner,
        value: r.points.toFixed(2),
        details: `${r.year}`
      }))
    });
  }

  // Highest Single-Week Score
  const weeklyScores: { owner: string; score: number; year: number; week: number }[] = [];
  seasons.forEach(season => {
    if (season.weeklyScores) {
      season.weeklyScores.forEach(matchup => {
        weeklyScores.push({
          owner: matchup.homeTeam.ownerName,
          score: matchup.homeTeam.score,
          year: season.year,
          week: matchup.week
        });
        weeklyScores.push({
          owner: matchup.awayTeam.ownerName,
          score: matchup.awayTeam.score,
          year: season.year,
          week: matchup.week
        });
      });
    }
  });
  const highestWeeklySorted = [...weeklyScores]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  if (highestWeeklySorted.length > 0) {
    records.push({
      title: 'Highest Single-Week Score',
      description: 'Best weekly performance',
      ownerName: highestWeeklySorted[0].owner,
      value: highestWeeklySorted[0].score.toFixed(2),
      year: highestWeeklySorted[0].year,
      details: `Week ${highestWeeklySorted[0].week}`,
      topTen: highestWeeklySorted.map(r => ({
        name: r.owner,
        value: r.score.toFixed(2),
        details: `${r.year} Wk ${r.week}`
      }))
    });
  }

  // Most Playoff Appearances
  const playoffsSorted = [...owners]
    .sort((a, b) => b.playoffAppearances - a.playoffAppearances)
    .slice(0, 10);

  if (playoffsSorted.length > 0) {
    records.push({
      title: 'Most Playoff Appearances',
      description: 'Most times making the playoffs',
      ownerName: playoffsSorted[0].name,
      value: playoffsSorted[0].playoffAppearances,
      details: `${playoffsSorted[0].stats.playoffPercentage.toFixed(1)}% playoff rate`,
      topTen: playoffsSorted.map(o => ({
        name: o.name,
        value: o.playoffAppearances,
        details: `${o.stats.playoffPercentage.toFixed(1)}%`
      }))
    });
  }

  // Most "Most Points" Titles
  const mostPointsTitlesSorted = [...owners]
    .filter(o => (o.mostPointsSeasons?.length || 0) > 0)
    .sort((a, b) => (b.mostPointsSeasons?.length || 0) - (a.mostPointsSeasons?.length || 0))
    .slice(0, 10);

  if (mostPointsTitlesSorted.length > 0) {
    records.push({
      title: 'Most "Most Points" Titles',
      description: 'Most times leading the league in points',
      ownerName: mostPointsTitlesSorted[0].name,
      value: mostPointsTitlesSorted[0].mostPointsSeasons?.length || 0,
      details: `Years: ${mostPointsTitlesSorted[0].mostPointsSeasons?.join(', ')}`,
      topTen: mostPointsTitlesSorted.map(o => ({
        name: o.name,
        value: o.mostPointsSeasons?.length || 0,
        details: o.mostPointsSeasons?.join(', ')
      }))
    });
  }

  // Most Last Place Finishes
  const lastPlaceSorted = [...owners]
    .filter(o => (o.lastPlaceSeasons?.length || 0) > 0)
    .sort((a, b) => (b.lastPlaceSeasons?.length || 0) - (a.lastPlaceSeasons?.length || 0))
    .slice(0, 10);

  if (lastPlaceSorted.length > 0) {
    records.push({
      title: 'Most Last Place Finishes',
      description: 'Most times finishing in last place',
      ownerName: lastPlaceSorted[0].name,
      value: lastPlaceSorted[0].lastPlaceSeasons?.length || 0,
      details: `Years: ${lastPlaceSorted[0].lastPlaceSeasons?.join(', ')}`,
      topTen: lastPlaceSorted.map(o => ({
        name: o.name,
        value: o.lastPlaceSeasons?.length || 0,
        details: o.lastPlaceSeasons?.join(', ')
      }))
    });
  }

  // Most Total Wins
  const totalWinsSorted = [...owners]
    .sort((a, b) => b.stats.totalWins - a.stats.totalWins)
    .slice(0, 10);

  if (totalWinsSorted.length > 0) {
    records.push({
      title: 'Most Career Wins',
      description: 'Most total regular season wins',
      ownerName: totalWinsSorted[0].name,
      value: totalWinsSorted[0].stats.totalWins,
      details: `${totalWinsSorted[0].stats.totalWins}-${totalWinsSorted[0].stats.totalLosses} record`,
      topTen: totalWinsSorted.map(o => ({
        name: o.name,
        value: o.stats.totalWins,
        details: `${o.stats.totalWins}-${o.stats.totalLosses}`
      }))
    });
  }

  // Most Seasons Played
  const seasonsSorted = [...owners]
    .sort((a, b) => b.totalSeasons - a.totalSeasons)
    .slice(0, 10);

  if (seasonsSorted.length > 0) {
    records.push({
      title: 'Most Seasons Played',
      description: 'Most seasons in the league',
      ownerName: seasonsSorted[0].name,
      value: seasonsSorted[0].totalSeasons,
      details: `${seasonsSorted[0].seasonsPlayed[0]}-${seasonsSorted[0].seasonsPlayed[seasonsSorted[0].seasonsPlayed.length - 1]}`,
      topTen: seasonsSorted.map(o => ({
        name: o.name,
        value: o.totalSeasons,
        details: `${o.seasonsPlayed[0]}-${o.seasonsPlayed[o.seasonsPlayed.length - 1]}`
      }))
    });
  }

  // Most Total Points
  const totalPointsSorted = [...owners]
    .sort((a, b) => b.stats.totalPointsFor - a.stats.totalPointsFor)
    .slice(0, 10);

  if (totalPointsSorted.length > 0) {
    records.push({
      title: 'Most Career Points',
      description: 'Most total points scored',
      ownerName: totalPointsSorted[0].name,
      value: totalPointsSorted[0].stats.totalPointsFor.toFixed(0),
      details: `${totalPointsSorted[0].totalSeasons} seasons`,
      topTen: totalPointsSorted.map(o => ({
        name: o.name,
        value: o.stats.totalPointsFor.toFixed(0),
        details: `${o.totalSeasons} seasons`
      }))
    });
  }

  // Runner-Up Appearances
  const runnerUpsSorted = [...owners]
    .filter(o => (o.runnerUps?.length || 0) > 0)
    .sort((a, b) => (b.runnerUps?.length || 0) - (a.runnerUps?.length || 0))
    .slice(0, 10);

  if (runnerUpsSorted.length > 0) {
    records.push({
      title: 'Most Runner-Up Finishes',
      description: 'Most times finishing second',
      ownerName: runnerUpsSorted[0].name,
      value: runnerUpsSorted[0].runnerUps?.length || 0,
      details: `Years: ${runnerUpsSorted[0].runnerUps?.join(', ')}`,
      topTen: runnerUpsSorted.map(o => ({
        name: o.name,
        value: o.runnerUps?.length || 0,
        details: o.runnerUps?.join(', ')
      }))
    });
  }

  return records;
}
