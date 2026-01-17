import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Owner } from '@/types/owner';
import Link from 'next/link';

function loadOwners(): Owner[] {
  const ownersPath = join(process.cwd(), 'public', 'data', 'owners.json');
  if (existsSync(ownersPath)) {
    return JSON.parse(readFileSync(ownersPath, 'utf-8'));
  }
  return [];
}

export default function HallOfFamePage() {
  const owners = loadOwners();

  // Helper to get championship count (supports 0.5 for split championships)
  const getChampCount = (o: Owner) => (o as any).championshipCount ?? o.championships.length;

  // Hall of Fame criteria: 2+ championships OR exceptional achievements (5+ most points seasons)
  const hallOfFamers = owners.filter(
    o => getChampCount(o) >= 2 ||
    (o.mostPointsSeasons && o.mostPointsSeasons.length >= 5)
  ).sort((a, b) => getChampCount(b) - getChampCount(a));

  // Other notable achievements
  const ironMen = owners
    .filter(o => o.totalSeasons >= 15)
    .sort((a, b) => b.totalSeasons - a.totalSeasons);

  const winningOwners = owners
    .filter(o => o.totalSeasons >= 5 && o.stats.winPercentage >= 55)
    .sort((a, b) => b.stats.winPercentage - a.stats.winPercentage);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          Hall of Fame
        </h1>
        <p className="text-text-secondary">
          Honoring the greatest in league history
        </p>
      </div>

      {/* Hall of Fame Members */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-trophy-gold mb-6 flex items-center gap-2">
          <span>🏆</span>
          <span>Hall of Fame Members</span>
        </h2>
        {hallOfFamers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hallOfFamers.map((owner) => {
              const champCount = getChampCount(owner);
              return (
              <Link
                key={owner.id}
                href={`/owners/${owner.id}`}
                className="block border-2 border-trophy-gold bg-gradient-to-br from-trophy-gold/10 via-trophy-orange/10 to-trophy-red/10 rounded-lg p-6 hover:scale-105 transition-all"
              >
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">
                    {champCount >= 3 ? '👑' : owner.mostPointsSeasons && owner.mostPointsSeasons.length >= 5 ? '📊' : '🏆'}
                  </div>
                  <h3 className="text-xl font-bold text-trophy-gold mb-1">
                    {owner.name}
                  </h3>
                  {champCount >= 3 ? (
                    <p className="text-sm text-text-muted">
                      {champCount}x Champion
                    </p>
                  ) : owner.mostPointsSeasons && owner.mostPointsSeasons.length >= 5 ? (
                    <p className="text-sm text-text-muted">
                      {owner.mostPointsSeasons.length}x Most Points Leader
                    </p>
                  ) : champCount > 0 ? (
                    <p className="text-sm text-text-muted">
                      {champCount}x Champion
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Championships</span>
                    <span className="font-bold text-trophy-gold">
                      {champCount}
                    </span>
                  </div>
                  {owner.mostPointsSeasons && owner.mostPointsSeasons.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Most Points Titles</span>
                      <span className="font-bold text-green-400">
                        {owner.mostPointsSeasons.length}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-muted">Seasons</span>
                    <span className="text-text-secondary">{owner.totalSeasons}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Win %</span>
                    <span className="text-text-secondary">
                      {owner.stats.winPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Playoff %</span>
                    <span className="text-text-secondary">
                      {owner.stats.playoffPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {owner.championships.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-trophy-gold/30">
                    <p className="text-xs text-trophy-gold text-center">
                      {owner.championships.join(', ')}
                    </p>
                  </div>
                )}
              </Link>
            );
            })}
          </div>
        ) : (
          <p className="text-text-muted text-center py-8">
            No Hall of Fame members yet. Criteria: 2+ championships or exceptional achievements
          </p>
        )}
      </section>

      {/* Iron Man Award */}
      {ironMen.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <span>💪</span>
            <span>Iron Man Award</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ironMen.slice(0, 6).map((owner) => (
              <Link
                key={owner.id}
                href={`/owners/${owner.id}`}
                className="block border border-bg-tertiary bg-bg-secondary rounded-lg p-4 hover:border-accent-primary transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-text-primary">{owner.name}</h4>
                    <p className="text-sm text-text-muted">
                      {owner.seasonsPlayed[0]} - {owner.seasonsPlayed[owner.seasonsPlayed.length - 1]}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-accent-primary">
                      {owner.totalSeasons}
                    </div>
                    <div className="text-xs text-text-muted">seasons</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Elite Winners */}
      {winningOwners.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <span>🎯</span>
            <span>Elite Winners (55%+ Win Rate)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {winningOwners.slice(0, 6).map((owner) => (
              <Link
                key={owner.id}
                href={`/owners/${owner.id}`}
                className="block border border-bg-tertiary bg-bg-secondary rounded-lg p-4 hover:border-accent-primary transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-text-primary">{owner.name}</h4>
                    <p className="text-sm text-text-muted">
                      {owner.stats.totalWins}-{owner.stats.totalLosses} ({owner.totalSeasons} seasons)
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">
                      {owner.stats.winPercentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-text-muted">win rate</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
