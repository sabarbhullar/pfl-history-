import Link from 'next/link';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Owner } from '@/types/owner';
import { Season } from '@/types/season';

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

export default function OwnersPage() {
  const { owners, seasons } = loadData();

  // Find the most recent year (max year in seasons array)
  const currentYear = seasons.length > 0
    ? Math.max(...seasons.map(s => s.year))
    : new Date().getFullYear();

  // Separate current and past owners based on isActive flag
  const currentOwners = owners.filter(o => o.isActive);
  const pastOwners = owners.filter(o => !o.isActive);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          League Owners
        </h1>
        <p className="text-text-secondary">
          {owners.length} total owners across {seasons.length} seasons
        </p>
      </div>

      {/* Current Owners */}
      {currentOwners.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Current Members ({currentYear})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentOwners.map((owner) => (
              <OwnerCard key={owner.id} owner={owner} />
            ))}
          </div>
        </section>
      )}

      {/* Past Owners */}
      {pastOwners.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Past Members
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastOwners.map((owner) => (
              <OwnerCard key={owner.id} owner={owner} />
            ))}
          </div>
        </section>
      )}

      {owners.length === 0 && (
        <div className="text-center py-12 border border-accent-primary/30 rounded-lg shadow-[0_0_10px_rgba(0,212,255,0.1)]">
          <p className="text-text-muted">
            No owner data available yet. Upload CSV data in the admin panel.
          </p>
        </div>
      )}
    </div>
  );
}

function OwnerCard({ owner }: { owner: Owner }) {
  // Use championshipCount if available (supports 0.5 for split championships)
  const champCount = (owner as any).championshipCount ?? owner.championships.length;

  return (
    <Link
      href={`/owners/${owner.id}`}
      className="block rounded-lg border border-accent-primary/30 bg-bg-secondary p-6 transition-all hover:border-accent-primary hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-bold text-text-primary">{owner.name}</h3>
        {champCount > 0 && (
          <div className="flex items-center gap-1 text-trophy-gold">
            <span className="text-2xl">🏆</span>
            <span className="text-lg font-bold">{champCount}</span>
          </div>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-text-muted">Seasons</span>
          <span className="text-text-secondary font-medium">{owner.totalSeasons}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Record</span>
          <span className="text-text-secondary font-medium">
            {owner.stats.totalWins}-{owner.stats.totalLosses}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Win %</span>
          <span className="text-text-secondary font-medium">
            {owner.stats.winPercentage.toFixed(1)}%
          </span>
        </div>
        {owner.championships.length > 0 && (
          <div className="pt-2 border-t border-accent-primary/20">
            <span className="text-xs text-trophy-gold">
              Champion: {owner.championships.join(', ')}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
