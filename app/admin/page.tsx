'use client';

import { CSVUploader } from '@/components/admin/csv-uploader';
import { ESPNRefresher } from '@/components/admin/espn-refresher';
import { useState } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataUpdate = () => {
    setRefreshKey(prev => prev + 1);
    // In a real app, you might want to revalidate the cache here
    window.location.reload();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          Admin Panel
        </h1>
        <p className="text-text-secondary">
          Manage league data and ESPN integration
        </p>
      </div>

      {/* Quick Links */}
      <div className="mb-8 p-4 bg-bg-secondary border border-bg-tertiary rounded-lg">
        <h3 className="font-semibold text-text-primary mb-3">Quick Links</h3>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className="px-3 py-1 bg-bg-tertiary text-text-secondary rounded hover:bg-bg-hover text-sm"
          >
            Homepage
          </Link>
          <Link
            href="/all-time-stats"
            className="px-3 py-1 bg-bg-tertiary text-text-secondary rounded hover:bg-bg-hover text-sm"
          >
            All-Time Stats
          </Link>
          <Link
            href="/owners"
            className="px-3 py-1 bg-bg-tertiary text-text-secondary rounded hover:bg-bg-hover text-sm"
          >
            Owners
          </Link>
          <Link
            href="/seasons"
            className="px-3 py-1 bg-bg-tertiary text-text-secondary rounded hover:bg-bg-hover text-sm"
          >
            Seasons
          </Link>
        </div>
      </div>

      {/* Data Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <CSVUploader onUploadComplete={handleDataUpdate} />
        <ESPNRefresher onRefreshComplete={handleDataUpdate} />
      </div>

      {/* Instructions */}
      <div className="border border-bg-tertiary rounded-lg p-6 bg-bg-secondary">
        <h2 className="text-xl font-bold text-text-primary mb-4">
          Data Management Instructions
        </h2>

        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-accent-primary mb-2">
              1. Refresh ESPN Data (Recommended)
            </h3>
            <p className="text-text-secondary mb-2">
              Click the refresh button to fetch data from ESPN Fantasy Football API.
              This pulls all data directly from ESPN for the PFL league (ID: 7995).
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-1 ml-4">
              <li>ESPN data available from 2006-2025</li>
              <li>Includes standings, weekly scores, and matchups</li>
              <li>Owner names are tracked by ESPN member names</li>
              <li>Select specific years or "All Years" to fetch everything</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-accent-primary mb-2">
              2. Upload Historical CSV Data (Optional)
            </h3>
            <p className="text-text-secondary mb-2">
              Upload a CSV file for years 2004-2005 (before ESPN data availability). The CSV should include:
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-1 ml-4">
              <li>Year: Season year</li>
              <li>OwnerName: Owner's full name (consistent across seasons)</li>
              <li>TeamName: Team name for that season</li>
              <li>Rank: Final standing (1 = champion)</li>
              <li>Wins, Losses, Ties: Season record</li>
              <li>PointsFor, PointsAgainst: Total points</li>
              <li>Champion: "Yes" if they won the championship</li>
              <li>RunnerUp: "Yes" if they were runner-up</li>
              <li>MadePlayoffs: "Yes" if they made the playoffs</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-accent-primary/10 border border-accent-primary/30 rounded">
            <p className="text-sm text-accent-primary">
              <strong>Important:</strong> The OwnerName must be consistent across all seasons.
              If someone changed their team name but is the same person, use the same
              OwnerName so their stats are combined correctly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
