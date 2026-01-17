import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Owner } from '@/types/owner';
import { Season } from '@/types/season';
import { calculateRivalries } from '@/lib/stats-calculator';
import { HeadToHeadPicker } from '@/components/ui/head-to-head-picker';

function loadData() {
  const dataDir = join(process.cwd(), 'public', 'data');

  const ownersPath = join(dataDir, 'owners.json');
  const seasonsPath = join(dataDir, 'seasons.json');

  let owners: Owner[] = [];
  let seasons: Season[] = [];

  if (existsSync(ownersPath)) {
    owners = JSON.parse(readFileSync(ownersPath, 'utf-8'));
  }

  if (existsSync(seasonsPath)) {
    seasons = JSON.parse(readFileSync(seasonsPath, 'utf-8'));
  }

  return { owners, seasons };
}

export default function RivalriesPage() {
  const { owners, seasons } = loadData();
  const rivalries = calculateRivalries(seasons, owners).slice(0, 10); // Top 10 rivalries
  // Include all owners for H2H lookup, sorted alphabetically
  const allOwnerNames = owners.map(o => o.name).sort((a, b) => a.localeCompare(b));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          Rivalries & Head-to-Head
        </h1>
        <p className="text-text-secondary">
          The greatest matchups in league history
        </p>
      </div>

      {/* Head-to-Head Lookup Tool */}
      <HeadToHeadPicker seasons={seasons} activeOwners={allOwnerNames} />

      <h2 className="text-2xl font-bold text-text-primary mb-4">Top Rivalries</h2>

      {rivalries.length > 0 ? (
        <div className="space-y-6">
          {rivalries.map((rivalry, index) => (
            <div
              key={index}
              className="border border-bg-tertiary bg-bg-secondary rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-trophy-gold">
                    #{index + 1}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-text-primary">
                      {rivalry.owner1} vs {rivalry.owner2}
                    </h3>
                    <p className="text-sm text-text-muted">
                      Rivalry Score: {rivalry.rivalryScore}
                    </p>
                  </div>
                </div>
              </div>

              {/* Head to Head Record */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-bg-tertiary rounded">
                  <div className="text-3xl font-bold text-green-400">
                    {rivalry.headToHead.owner1Wins}
                  </div>
                  <div className="text-sm text-text-muted mt-1">{rivalry.owner1} Wins</div>
                </div>

                <div className="text-center p-4 bg-bg-tertiary rounded">
                  <div className="text-2xl font-bold text-text-secondary">
                    {rivalry.headToHead.totalMatchups}
                  </div>
                  <div className="text-sm text-text-muted mt-1">Total Matchups</div>
                  {rivalry.headToHead.ties > 0 && (
                    <div className="text-xs text-text-muted mt-1">
                      ({rivalry.headToHead.ties} ties)
                    </div>
                  )}
                </div>

                <div className="text-center p-4 bg-bg-tertiary rounded">
                  <div className="text-3xl font-bold text-green-400">
                    {rivalry.headToHead.owner2Wins}
                  </div>
                  <div className="text-sm text-text-muted mt-1">{rivalry.owner2} Wins</div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-text-muted mb-1">Close Games</div>
                  <div className="font-semibold text-accent-primary">
                    {rivalry.closeGames}
                  </div>
                </div>

                <div>
                  <div className="text-text-muted mb-1">Playoff Meetings</div>
                  <div className="font-semibold text-accent-primary">
                    {rivalry.playoffMeetings}
                  </div>
                </div>

                <div>
                  <div className="text-text-muted mb-1">Championship Games</div>
                  <div className="font-semibold text-trophy-gold">
                    {rivalry.championshipMeetings}
                  </div>
                </div>

                <div>
                  <div className="text-text-muted mb-1">Biggest Blowout</div>
                  <div className="font-semibold text-text-primary">
                    {rivalry.headToHead.biggestBlowout.margin.toFixed(1)} pts
                  </div>
                  <div className="text-xs text-text-muted">
                    {rivalry.headToHead.biggestBlowout.winner} ({rivalry.headToHead.biggestBlowout.year})
                  </div>
                </div>
              </div>

              {/* Points Comparison */}
              <div className="mt-6 pt-6 border-t border-bg-tertiary">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-text-muted">Avg Points: </span>
                    <span className="font-semibold text-text-primary">
                      {(rivalry.headToHead.owner1PointsFor / rivalry.headToHead.totalMatchups).toFixed(1)}
                    </span>
                  </div>
                  <div className="text-text-muted">vs</div>
                  <div>
                    <span className="text-text-muted">Avg Points: </span>
                    <span className="font-semibold text-text-primary">
                      {(rivalry.headToHead.owner2PointsFor / rivalry.headToHead.totalMatchups).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-bg-tertiary rounded-lg">
          <p className="text-text-muted">
            No rivalry data available yet. Weekly matchup data is needed from ESPN API.
          </p>
        </div>
      )}
    </div>
  );
}
