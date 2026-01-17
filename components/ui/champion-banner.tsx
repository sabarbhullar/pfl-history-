import Link from 'next/link';

interface ChampionBannerProps {
  year: number;
  champion: string;
  ownerId: string;
}

export function ChampionBanner({ year, champion, ownerId }: ChampionBannerProps) {
  return (
    <Link
      href={`/seasons/${year}`}
      className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-trophy-gold/20 via-trophy-orange/20 to-trophy-red/20 border border-trophy-gold/30 p-4 transition-all hover:scale-105 hover:border-trophy-gold hover:shadow-lg hover:shadow-trophy-gold/20"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-trophy-gold/0 via-trophy-orange/0 to-trophy-red/0 group-hover:from-trophy-gold/10 group-hover:via-trophy-orange/10 group-hover:to-trophy-red/10 transition-all" />

      <div className="relative z-10 text-center">
        <div className="text-3xl font-bold text-trophy-gold mb-1">{year}</div>
        <div className="text-sm text-text-secondary mb-2">Champion</div>
        <div className="text-lg font-semibold text-text-primary truncate">
          {champion}
        </div>
      </div>

      <div className="absolute top-2 right-2 text-trophy-gold/40 group-hover:text-trophy-gold/60 transition-colors">
        <svg
          className="w-8 h-8"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      </div>
    </Link>
  );
}

interface ChampionBannersGridProps {
  banners: Array<{
    year: number;
    champion: string;
    ownerId: string;
  }>;
}

export function ChampionBannersGrid({ banners }: ChampionBannersGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {banners.map((banner) => (
        <ChampionBanner key={banner.year} {...banner} />
      ))}
    </div>
  );
}
