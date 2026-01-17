'use client';

import { LeaderboardTable } from './leaderboard-table';
import { Standing } from '@/types/season';

interface HomeStandingsTableProps {
  standings: Standing[];
}

export function HomeStandingsTable({ standings }: HomeStandingsTableProps) {
  return (
    <LeaderboardTable
      data={standings}
      columns={[
        {
          key: 'rank',
          label: '#',
          className: 'font-bold text-text-primary',
          headerClassName: 'w-8 md:w-12',
        },
        {
          key: 'ownerName',
          label: 'Owner',
          className: 'font-semibold text-text-primary max-w-[100px] md:max-w-none',
          render: (value, row) => (
            <div className="min-w-0">
              <div className="font-semibold text-text-primary truncate">{value}</div>
              <div className="text-xs text-text-muted truncate hidden md:block">{row.teamName}</div>
            </div>
          ),
        },
        {
          key: 'wins',
          label: 'W',
          headerClassName: 'text-center w-8 md:w-12',
          className: 'text-center text-green-400 w-8 md:w-12',
        },
        {
          key: 'losses',
          label: 'L',
          headerClassName: 'text-center w-8 md:w-12',
          className: 'text-center text-red-400 w-8 md:w-12',
        },
        {
          key: 'pointsFor',
          label: 'PF',
          headerClassName: 'text-right',
          className: 'text-right text-xs md:text-sm',
          render: (value) => value.toFixed(1),
        },
        {
          key: 'pointsAgainst',
          label: 'PA',
          headerClassName: 'text-right',
          className: 'text-right text-xs md:text-sm',
          render: (value) => value.toFixed(1),
        },
      ]}
      defaultSortKey="rank"
      defaultSortDirection="asc"
    />
  );
}
