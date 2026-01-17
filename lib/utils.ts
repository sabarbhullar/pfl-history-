export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatRecord(wins: number, losses: number, ties?: number): string {
  return ties && ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
}

export function calculateWinPercentage(wins: number, losses: number, ties: number = 0): number {
  const totalGames = wins + losses + ties;
  if (totalGames === 0) return 0;
  return Math.round((wins / totalGames) * 1000) / 10; // Round to 1 decimal
}

export function formatPoints(points: number): string {
  return points.toFixed(2);
}

export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}

export function ordinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) {
    return num + 'st';
  }
  if (j === 2 && k !== 12) {
    return num + 'nd';
  }
  if (j === 3 && k !== 13) {
    return num + 'rd';
  }
  return num + 'th';
}

export function getYearRange(years: number[]): string {
  if (years.length === 0) return '';
  if (years.length === 1) return years[0].toString();

  const sorted = [...years].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  if (max - min + 1 === years.length) {
    // Consecutive years
    return `${min}-${max}`;
  } else {
    // Non-consecutive
    return `${min}-${max} (${years.length} seasons)`;
  }
}

export function isPlayoffWeek(week: number, regularSeasonWeeks: number): boolean {
  return week > regularSeasonWeeks;
}

export function isChampionshipWeek(week: number, regularSeasonWeeks: number, playoffWeeks: number): boolean {
  return week === regularSeasonWeeks + playoffWeeks;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
