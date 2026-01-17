import Link from 'next/link';
import { Season } from '@/types/season';

interface SeasonCardProps {
  season: Season;
}

export function SeasonCard({ season }: SeasonCardProps) {
  return (
    <Link
      href={`/seasons/${season.year}`}
      className="block rounded-lg border border-bg-tertiary bg-bg-secondary p-6 transition-all hover:border-accent-primary hover:shadow-lg hover:shadow-accent-primary/10"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-2xl font-bold text-text-primary">{season.year}</h3>
        <div className="text-trophy-gold">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Champion</span>
          <span className="text-sm font-semibold text-trophy-gold">
            {season.champion}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Runner-Up</span>
          <span className="text-sm font-medium text-text-secondary">
            {season.runnerUp}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Most Points</span>
          <span className="text-sm font-medium text-text-secondary">
            {season.mostPoints.owner} ({season.mostPoints.points.toFixed(0)})
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">League Size</span>
          <span className="text-sm font-medium text-text-secondary">
            {season.leagueSize} teams
          </span>
        </div>
      </div>

      {season.keyMoments && season.keyMoments.length > 0 && (
        <div className="mt-4 pt-4 border-t border-bg-tertiary">
          <span className="text-xs text-accent-primary">
            {season.keyMoments.length} key moment{season.keyMoments.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </Link>
  );
}

interface SeasonsGridProps {
  seasons: Season[];
}

export function SeasonsGrid({ seasons }: SeasonsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {seasons.map((season) => (
        <SeasonCard key={season.year} season={season} />
      ))}
    </div>
  );
}
