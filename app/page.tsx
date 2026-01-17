import { ChampionBannersGrid } from '@/components/ui/champion-banner';
import { QuickStats } from '@/components/ui/stat-card';
import { HomeStandingsTable } from '@/components/ui/home-standings-table';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Season } from '@/types/season';
import { Owner } from '@/types/owner';

function loadData() {
  const dataDir = join(process.cwd(), 'public', 'data');

  // Load seasons
  let seasons: Season[] = [];
  const seasonsPath = join(dataDir, 'seasons.json');
  if (existsSync(seasonsPath)) {
    seasons = JSON.parse(readFileSync(seasonsPath, 'utf-8'));
  }

  // Load owners
  let owners: Owner[] = [];
  const ownersPath = join(dataDir, 'owners.json');
  if (existsSync(ownersPath)) {
    owners = JSON.parse(readFileSync(ownersPath, 'utf-8'));
  }

  return { seasons, owners };
}

export default function HomePage() {
  const { seasons, owners } = loadData();

  // Get championship banners (all seasons)
  const championBanners = seasons
    .sort((a, b) => b.year - a.year)
    .map((season) => ({
      year: season.year,
      champion: season.champion,
      ownerId: owners.find(o => o.name === season.champion)?.id || '',
    }));

  // Get current season (most recent by year)
  const currentSeason = seasons.length > 0
    ? seasons.reduce((latest, s) => s.year > latest.year ? s : latest, seasons[0])
    : null;

  // Quick stats
  const totalSeasons = seasons.length;
  const currentMembers = owners.filter(o =>
    o.seasonsPlayed.includes(currentSeason?.year || 0)
  ).length;

  const mostChampionships = owners.reduce(
    (max, owner) =>
      owner.championships.length > max.count
        ? { owner, count: owner.championships.length }
        : max,
    { owner: owners[0], count: 0 }
  );

  const quickStats = [
    {
      title: 'Total Seasons',
      value: totalSeasons || 0,
      subtitle: '2004 - Present',
      variant: 'gold' as const,
    },
    {
      title: 'Current Members',
      value: currentMembers || 0,
      subtitle: `${currentSeason?.year || 2025} Season`,
      variant: 'orange' as const,
    },
    {
      title: 'Most Championships',
      value: mostChampionships?.count || 0,
      subtitle: mostChampionships?.owner?.name || 'N/A',
      variant: 'gold' as const,
    },
    {
      title: 'Reigning Champion',
      value: currentSeason?.champion || 'TBD',
      subtitle: `${currentSeason?.year || 2025} Champion`,
      variant: 'red' as const,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-neon-cyan via-accent-primary to-neon-blue bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,212,255,0.5)]">
          PFL Fantasy Football
        </h1>
        <p className="text-xl text-text-secondary">
          Championship History Since 2004
        </p>
      </div>

      {/* Quick Stats */}
      <div className="mb-12">
        <QuickStats stats={quickStats} />
      </div>

      {/* Championship Banners */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-text-primary mb-6">
          Championship Wall
        </h2>
        {championBanners.length > 0 ? (
          <ChampionBannersGrid banners={championBanners} />
        ) : (
          <div className="text-center py-12 border border-accent-primary/30 rounded-lg shadow-[0_0_10px_rgba(0,212,255,0.1)]">
            <p className="text-text-muted">
              No championship data available yet. Upload CSV data in the admin panel.
            </p>
          </div>
        )}
      </section>

      {/* Current Season Standings */}
      {currentSeason && currentSeason.standings.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-text-primary">
              {currentSeason.year} Season Standings
            </h2>
            <a
              href={`/seasons/${currentSeason.year}`}
              className="text-accent-primary hover:text-accent-primary/80 text-sm font-medium"
            >
              View Full Season →
            </a>
          </div>

          <HomeStandingsTable standings={currentSeason.standings} />
        </section>
      )}

      {/* Recent Champion Spotlight */}
      {currentSeason && (
        <section>
          <div className="rounded-lg border border-trophy-gold/30 bg-gradient-to-br from-trophy-gold/10 via-trophy-orange/10 to-trophy-red/10 p-8 text-center">
            <div className="text-trophy-gold text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold text-trophy-gold mb-2">
              {currentSeason.year} Champion
            </h3>
            <p className="text-4xl font-bold text-text-primary mb-4">
              {currentSeason.champion}
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-text-secondary">
              <div>
                <span className="text-text-muted">Runner-Up: </span>
                <span className="font-semibold">{currentSeason.runnerUp}</span>
              </div>
              <div>
                <span className="text-text-muted">Most Points: </span>
                <span className="font-semibold">
                  {currentSeason.mostPoints.owner} ({currentSeason.mostPoints.points.toFixed(0)})
                </span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
