import { SeasonsGrid } from '@/components/ui/season-card';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Season } from '@/types/season';

function loadSeasons(): Season[] {
  const seasonsPath = join(process.cwd(), 'public', 'data', 'seasons.json');
  if (existsSync(seasonsPath)) {
    return JSON.parse(readFileSync(seasonsPath, 'utf-8'));
  }
  return [];
}

export default function SeasonsPage() {
  const seasons = loadSeasons().sort((a, b) => b.year - a.year);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          Season History
        </h1>
        <p className="text-text-secondary">
          {seasons.length} seasons from 2004 to present
        </p>
      </div>

      {seasons.length > 0 ? (
        <SeasonsGrid seasons={seasons} />
      ) : (
        <div className="text-center py-12 border border-bg-tertiary rounded-lg">
          <p className="text-text-muted">
            No season data available yet. Upload CSV data in the admin panel.
          </p>
        </div>
      )}
    </div>
  );
}
