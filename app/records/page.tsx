import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Owner } from '@/types/owner';
import { Season } from '@/types/season';
import { calculateRecords } from '@/lib/stats-calculator';
import Link from 'next/link';

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

export default function RecordsPage() {
  const { owners, seasons } = loadData();
  const records = calculateRecords(owners, seasons);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          League Records
        </h1>
        <p className="text-text-secondary">
          All-time achievements and milestones
        </p>
      </div>

      {records.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {records.map((record, index) => (
            <RecordCard key={index} record={record} owners={owners} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-bg-tertiary rounded-lg">
          <p className="text-text-muted">
            No record data available yet. Refresh ESPN data in the admin panel.
          </p>
        </div>
      )}
    </div>
  );
}

function RecordCard({ record, owners }: { record: any; owners: Owner[] }) {
  const owner = owners.find(o => o.name === record.ownerName);

  const content = (
    <div className="h-full border border-bg-tertiary bg-bg-secondary rounded-lg p-6 transition-all hover:border-accent-primary hover:shadow-lg hover:shadow-accent-primary/10">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-trophy-gold mb-1">
            {record.title}
          </h3>
          <p className="text-sm text-text-muted">{record.description}</p>
        </div>
        <div className="text-3xl">🏅</div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-text-primary">
            {record.value}
          </span>
          {record.year && (
            <span className="text-sm text-text-muted">({record.year})</span>
          )}
        </div>

        <div className="text-lg font-semibold text-accent-primary">
          {record.ownerName}
        </div>

        {record.details && (
          <p className="text-sm text-text-secondary">{record.details}</p>
        )}
      </div>
    </div>
  );

  if (owner) {
    return (
      <Link href={`/owners/${owner.id}`}>
        {content}
      </Link>
    );
  }

  return content;
}
