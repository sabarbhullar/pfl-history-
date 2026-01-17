export interface Owner {
  id: string; // Slug (e.g., "john-smith")
  name: string; // Full name (e.g., "John Smith")
  teamNames: string[]; // All team names they've used across seasons
  seasonsPlayed: number[]; // Years they participated [2004, 2005, 2010, ...]
  championships: number[]; // Years they won [2010, 2015]
  runnerUps: number[]; // Years they were runner-up
  mostPointsSeasons: number[]; // Years they had most points
  lastPlaceSeasons: number[]; // Years they finished last
  totalSeasons: number;
  playoffAppearances: number;
  playoffRecord: { wins: number; losses: number }; // Playoff W-L
  isActive: boolean; // Currently in the league
  stats: OwnerStats;
}

export interface OwnerStats {
  totalWins: number;
  totalLosses: number;
  totalPointsFor: number;
  totalPointsAgainst: number;
  winPercentage: number;
  playoffPercentage: number;
  bestRecord: SeasonRecord;
  worstRecord: SeasonRecord;
  avgPointsPerSeason: number;
  avgWinsPerSeason: number;
}

export interface SeasonRecord {
  year: number;
  wins: number;
  losses: number;
  ties?: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface OwnerSeasonPerformance {
  year: number;
  ownerName: string;
  teamName: string;
  rank: number;
  wins: number;
  losses: number;
  ties?: number;
  pointsFor: number;
  pointsAgainst: number;
  madePlayoffs: boolean;
  wonChampionship: boolean;
}
