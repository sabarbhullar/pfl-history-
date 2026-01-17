'use client';

import { LeaderboardTable } from '@/components/ui/leaderboard-table';
import { Owner } from '@/types/owner';
import { createLeaderboard } from '@/lib/stats-calculator';
import { useEffect, useState } from 'react';

export default function AllTimeStatsPage() {
  const [leaderboard, setLeaderboard] = useState<ReturnType<typeof createLeaderboard>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/data/owners.json');
        const owners: Owner[] = await response.json();
        setLeaderboard(createLeaderboard(owners));
      } catch (error) {
        console.error('Failed to load owners:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Separate active and inactive owners
  const activeOwners = leaderboard.filter(o => o.isActive);
  const inactiveOwners = leaderboard.filter(o => !o.isActive);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-text-muted">Loading statistics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          All-Time Statistics
        </h1>
        <p className="text-text-secondary">
          Complete career statistics since 2004 (22 seasons)
        </p>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-bg-secondary rounded-lg p-4 border border-bg-tertiary">
          <div className="text-3xl font-bold text-trophy-gold">22</div>
          <div className="text-sm text-text-secondary">Total Seasons</div>
        </div>
        <div className="bg-bg-secondary rounded-lg p-4 border border-bg-tertiary">
          <div className="text-3xl font-bold text-text-primary">{leaderboard.length}</div>
          <div className="text-sm text-text-secondary">All-Time Owners</div>
        </div>
        <div className="bg-bg-secondary rounded-lg p-4 border border-bg-tertiary">
          <div className="text-3xl font-bold text-green-400">{activeOwners.length}</div>
          <div className="text-sm text-text-secondary">Active Members</div>
        </div>
        <div className="bg-bg-secondary rounded-lg p-4 border border-bg-tertiary">
          <div className="text-3xl font-bold text-trophy-gold">
            {Math.max(...leaderboard.map(o => o.championships), 0)}
          </div>
          <div className="text-sm text-text-secondary">Most Titles</div>
        </div>
      </div>

      {/* Active Owners Table */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Current Members</h2>
        {activeOwners.length > 0 ? (
          <LeaderboardTable
            data={activeOwners}
            columns={[
              {
                key: 'ownerName',
                label: 'Owner',
                className: 'font-semibold text-text-primary text-left',
                headerClassName: 'text-left',
                width: '120px',
                sortable: true,
              },
              {
                key: 'championships',
                label: 'Rings',
                className: 'text-center text-trophy-gold font-bold',
                headerClassName: 'text-center',
                width: '60px',
                sortable: true,
                render: (value) => value > 0 ? `${value}` : '-',
              },
              {
                key: 'runnerUps',
                label: '2nd',
                className: 'text-center text-gray-400',
                headerClassName: 'text-center',
                width: '50px',
                sortable: true,
                render: (value) => value > 0 ? value : '-',
              },
              {
                key: 'mostPointsTitles',
                label: 'MP',
                className: 'text-center text-blue-400',
                headerClassName: 'text-center',
                width: '50px',
                sortable: true,
                render: (value) => value > 0 ? value : '-',
              },
              {
                key: 'totalSeasons',
                label: 'Yrs',
                className: 'text-center',
                headerClassName: 'text-center',
                width: '50px',
                sortable: true,
              },
              {
                key: 'winPercentage',
                label: 'Win%',
                className: 'text-right tabular-nums',
                headerClassName: 'text-right',
                width: '65px',
                sortable: true,
                render: (value) => `${value.toFixed(1)}%`,
              },
              {
                key: 'playoffPercentage',
                label: 'PO%',
                className: 'text-right tabular-nums',
                headerClassName: 'text-right',
                width: '60px',
                sortable: true,
                render: (value) => `${value.toFixed(1)}%`,
              },
              {
                key: 'totalWins',
                label: 'Record',
                className: 'text-center tabular-nums',
                headerClassName: 'text-center',
                width: '75px',
                sortable: true,
                render: (value, row) => (
                  <span className="font-mono">
                    <span className="text-green-400">{row.totalWins}</span>
                    <span className="text-text-muted">-</span>
                    <span className="text-red-400">{row.totalLosses}</span>
                  </span>
                ),
              },
              {
                key: 'playoffWins',
                label: 'PO Rec',
                className: 'text-center tabular-nums',
                headerClassName: 'text-center',
                width: '70px',
                sortable: true,
                render: (value, row) => (
                  <span className="font-mono">
                    <span className="text-green-400">{row.playoffWins}</span>
                    <span className="text-text-muted">-</span>
                    <span className="text-red-400">{row.playoffLosses}</span>
                  </span>
                ),
              },
            ]}
            defaultSortKey="championships"
            defaultSortDirection="desc"
            linkBuilder={(row) => `/owners/${row.ownerId}`}
          />
        ) : (
          <div className="text-center py-12 border border-bg-tertiary rounded-lg">
            <p className="text-text-muted">No active owners data available.</p>
          </div>
        )}
      </section>

      {/* Inactive/Former Owners Table */}
      {inactiveOwners.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">Former Members</h2>
          <LeaderboardTable
            data={inactiveOwners}
            columns={[
              {
                key: 'ownerName',
                label: 'Owner',
                className: 'font-semibold text-text-secondary text-left',
                headerClassName: 'text-left',
                width: '120px',
                sortable: true,
              },
              {
                key: 'championships',
                label: 'Rings',
                className: 'text-center text-trophy-gold font-bold',
                headerClassName: 'text-center',
                width: '60px',
                sortable: true,
                render: (value) => value > 0 ? `${value}` : '-',
              },
              {
                key: 'runnerUps',
                label: '2nd',
                className: 'text-center text-gray-400',
                headerClassName: 'text-center',
                width: '50px',
                sortable: true,
                render: (value) => value > 0 ? value : '-',
              },
              {
                key: 'totalSeasons',
                label: 'Yrs',
                className: 'text-center',
                headerClassName: 'text-center',
                width: '50px',
                sortable: true,
              },
              {
                key: 'winPercentage',
                label: 'Win%',
                className: 'text-right tabular-nums',
                headerClassName: 'text-right',
                width: '65px',
                sortable: true,
                render: (value) => `${value.toFixed(1)}%`,
              },
              {
                key: 'totalWins',
                label: 'Record',
                className: 'text-center tabular-nums',
                headerClassName: 'text-center',
                width: '75px',
                sortable: true,
                render: (value, row) => (
                  <span className="font-mono">
                    <span className="text-green-400">{row.totalWins}</span>
                    <span className="text-text-muted">-</span>
                    <span className="text-red-400">{row.totalLosses}</span>
                  </span>
                ),
              },
            ]}
            defaultSortKey="championships"
            defaultSortDirection="desc"
            linkBuilder={(row) => `/owners/${row.ownerId}`}
          />
        </section>
      )}
    </div>
  );
}
