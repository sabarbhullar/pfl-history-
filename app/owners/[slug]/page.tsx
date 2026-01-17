'use client';

import { Owner } from '@/types/owner';
import { Season } from '@/types/season';
import { QuickStats, StatCard } from '@/components/ui/stat-card';
import { LeaderboardTable } from '@/components/ui/leaderboard-table';
import { formatRecord } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';

export default function OwnerProfilePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [owner, setOwner] = useState<Owner | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [ownersRes, seasonsRes] = await Promise.all([
          fetch('/data/owners.json'),
          fetch('/data/seasons.json')
        ]);
        const owners: Owner[] = await ownersRes.json();
        const seasonsData: Season[] = await seasonsRes.json();

        const foundOwner = owners.find(o => o.id === slug);
        if (!foundOwner) {
          setNotFoundState(true);
        } else {
          setOwner(foundOwner);
          setSeasons(seasonsData);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setNotFoundState(true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-text-muted">Loading owner profile...</div>
        </div>
      </div>
    );
  }

  if (notFoundState || !owner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-text-muted">Owner not found</div>
        </div>
      </div>
    );
  }

  // Get all seasons for this owner
  const ownerSeasons = seasons
    .filter(s => owner.seasonsPlayed.includes(s.year))
    .map(season => {
      const standing = season.standings.find(st => st.ownerName === owner.name);
      return {
        year: season.year,
        rank: standing?.rank || 0,
        wins: standing?.wins || 0,
        losses: standing?.losses || 0,
        ties: standing?.ties || 0,
        pointsFor: standing?.pointsFor || 0,
        pointsAgainst: standing?.pointsAgainst || 0,
        teamName: standing?.teamName || '',
        champion: season.champion === owner.name,
        runnerUp: season.runnerUp === owner.name,
        madePlayoffs: standing?.madePlayoffs || false,
      };
    })
    .sort((a, b) => b.year - a.year);

  const quickStats = [
    {
      title: 'Championships',
      value: owner.championships.length,
      subtitle: owner.championships.length > 0 ? owner.championships.join(', ') : 'None yet',
      variant: 'gold' as const,
    },
    {
      title: 'Runner-Ups',
      value: owner.runnerUps?.length || 0,
      subtitle: owner.runnerUps?.length > 0 ? owner.runnerUps.join(', ') : 'None',
      variant: 'default' as const,
    },
    {
      title: 'Total Seasons',
      value: owner.totalSeasons,
      subtitle: `${owner.seasonsPlayed[owner.seasonsPlayed.length - 1]} - ${owner.seasonsPlayed[0]}`,
      variant: 'orange' as const,
    },
    {
      title: 'Win Percentage',
      value: `${owner.stats.winPercentage.toFixed(1)}%`,
      subtitle: `${owner.stats.totalWins}-${owner.stats.totalLosses}`,
      variant: 'default' as const,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-4xl font-bold text-text-primary">
            {owner.name}
          </h1>
          {owner.championships.length > 0 && (
            <div className="flex items-center gap-2">
              {owner.championships.map((year) => (
                <span key={year} className="text-3xl" title={`${year} Champion`}>
                  🏆
                </span>
              ))}
            </div>
          )}
        </div>
        <p className="text-text-secondary">
          League member since {owner.seasonsPlayed[0]}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="mb-12">
        <QuickStats stats={quickStats} />
      </div>

      {/* Career Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <StatCard
          title="Playoff Rate"
          value={`${owner.stats.playoffPercentage.toFixed(1)}%`}
          subtitle={`${owner.playoffAppearances} of ${owner.totalSeasons} seasons`}
          variant="orange"
        />
        <StatCard
          title="Playoff Record"
          value={`${owner.playoffRecord?.wins || 0}-${owner.playoffRecord?.losses || 0}`}
          subtitle={owner.playoffRecord?.wins > 0 ? `${((owner.playoffRecord.wins / (owner.playoffRecord.wins + owner.playoffRecord.losses)) * 100).toFixed(0)}% win rate` : 'No playoff wins yet'}
          variant="default"
        />
        <StatCard
          title="Most Points Titles"
          value={owner.mostPointsSeasons?.length || 0}
          subtitle={owner.mostPointsSeasons?.length > 0 ? owner.mostPointsSeasons.join(', ') : 'None'}
          variant="default"
        />
        <StatCard
          title="Last Place Finishes"
          value={owner.lastPlaceSeasons?.length || 0}
          subtitle={owner.lastPlaceSeasons?.length > 0 ? owner.lastPlaceSeasons.join(', ') : 'None'}
          variant="red"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        <StatCard
          title="Best Season"
          value={formatRecord(
            owner.stats.bestRecord.wins,
            owner.stats.bestRecord.losses,
            owner.stats.bestRecord.ties
          )}
          subtitle={`${owner.stats.bestRecord.year}`}
          variant="gold"
        />
        <StatCard
          title="Worst Season"
          value={formatRecord(
            owner.stats.worstRecord.wins,
            owner.stats.worstRecord.losses,
            owner.stats.worstRecord.ties
          )}
          subtitle={`${owner.stats.worstRecord.year}`}
          variant="red"
        />
      </div>

      {/* Season by Season History */}
      <section>
        <h2 className="text-2xl font-bold text-text-primary mb-6">
          Season by Season
        </h2>
        <LeaderboardTable
          data={ownerSeasons}
          columns={[
            {
              key: 'year',
              label: 'Year',
              className: 'font-bold text-text-primary',
              render: (value, row) => (
                <div>
                  <div>{value}</div>
                  {row.champion && (
                    <div className="text-trophy-gold text-xs">🏆 Champion</div>
                  )}
                </div>
              ),
            },
            {
              key: 'teamName',
              label: 'Team',
              className: 'text-text-secondary',
            },
            {
              key: 'rank',
              label: 'Rank',
              className: 'text-center font-semibold',
              headerClassName: 'text-center',
              render: (value) => `#${value}`,
            },
            {
              key: 'wins',
              label: 'W',
              className: 'text-center text-green-400',
              headerClassName: 'text-center',
            },
            {
              key: 'losses',
              label: 'L',
              className: 'text-center text-red-400',
              headerClassName: 'text-center',
            },
            {
              key: 'pointsFor',
              label: 'PF',
              className: 'text-right',
              headerClassName: 'text-right',
              render: (value) => value.toFixed(2),
            },
            {
              key: 'pointsAgainst',
              label: 'PA',
              className: 'text-right',
              headerClassName: 'text-right',
              render: (value) => value.toFixed(2),
            },
          ]}
          defaultSortKey="year"
          defaultSortDirection="desc"
          linkBuilder={(row) => `/seasons/${row.year}`}
        />
      </section>
    </div>
  );
}
