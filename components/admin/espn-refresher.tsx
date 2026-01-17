'use client';

import * as React from 'react';

interface ESPNRefresherProps {
  onRefreshComplete?: () => void;
}

export function ESPNRefresher({ onRefreshComplete }: ESPNRefresherProps) {
  const [refreshing, setRefreshing] = React.useState(false);
  const [result, setResult] = React.useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);
  const [selectedYears, setSelectedYears] = React.useState<number[]>([
    new Date().getFullYear(),
  ]);

  // PFL has ESPN data from 2006-2025
  const availableYears = Array.from({ length: 20 }, (_, i) => 2006 + i);

  const handleRefresh = async () => {
    if (selectedYears.length === 0) {
      setResult({
        success: false,
        message: 'Please select at least one year to refresh',
      });
      return;
    }

    setRefreshing(true);
    setResult(null);

    try {
      const response = await fetch('/api/refresh-espn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ years: selectedYears }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'ESPN data refreshed successfully!',
          data: data.data,
        });
        onRefreshComplete?.();
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to refresh ESPN data',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'An error occurred while fetching ESPN data',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const toggleYear = (year: number) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const selectRecentYears = () => {
    setSelectedYears([2022, 2023, 2024, 2025]);
  };

  const selectAllYears = () => {
    setSelectedYears([...availableYears]);
  };

  const clearSelection = () => {
    setSelectedYears([]);
  };

  return (
    <div className="rounded-lg border border-bg-tertiary bg-bg-secondary p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Refresh ESPN Data
      </h3>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-text-secondary">
              Select Years to Refresh
            </label>
            <div className="flex gap-2">
              <button
                onClick={selectRecentYears}
                className="text-xs px-2 py-1 bg-bg-tertiary text-text-secondary rounded hover:bg-bg-hover"
              >
                Recent (2022-2025)
              </button>
              <button
                onClick={selectAllYears}
                className="text-xs px-2 py-1 bg-bg-tertiary text-text-secondary rounded hover:bg-bg-hover"
              >
                All Years
              </button>
              <button
                onClick={clearSelection}
                className="text-xs px-2 py-1 bg-bg-tertiary text-text-secondary rounded hover:bg-bg-hover"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => toggleYear(year)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedYears.includes(year)
                    ? 'bg-accent-primary text-bg-primary'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-text-muted">
            Fetches current standings, weekly scores, and rosters from ESPN Fantasy Football API
            (League ID: 7995)
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing || selectedYears.length === 0}
          className="w-full px-4 py-2 bg-accent-primary text-bg-primary font-semibold rounded-md
            hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors"
        >
          {refreshing ? `Refreshing ${selectedYears.length} year(s)...` : `Refresh ESPN Data (${selectedYears.length} selected)`}
        </button>

        {result && (
          <div
            className={`p-4 rounded-md ${
              result.success
                ? 'bg-green-500/10 border border-green-500/30'
                : 'bg-red-500/10 border border-red-500/30'
            }`}
          >
            <p
              className={`text-sm font-medium ${
                result.success ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {result.message}
            </p>
            {result.data && (
              <div className="mt-2 text-xs text-text-muted">
                <p>Updated {Object.keys(result.data).length} season(s)</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
