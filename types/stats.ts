export interface LeaderboardEntry {
  ownerName: string;
  ownerId: string;
  championships: number;
  runnerUps: number;
  mostPointsTitles: number;
  lastPlaceFinishes: number;
  playoffPercentage: number;
  winPercentage: number;
  totalSeasons: number;
  totalWins: number;
  totalLosses: number;
  totalPointsFor: number;
  playoffWins: number;
  playoffLosses: number;
  bestRecord: string; // e.g., "12-1 (2015)"
  worstRecord: string; // e.g., "2-11 (2010)"
  avgPointsPerSeason: number;
  isActive: boolean;
}

export interface Record {
  title: string;
  description: string;
  ownerName: string;
  value: string | number;
  year?: number;
  details?: string;
}

export interface HeadToHeadRecord {
  owner1: string;
  owner2: string;
  owner1Wins: number;
  owner2Wins: number;
  ties: number;
  totalMatchups: number;
  owner1PointsFor: number;
  owner2PointsFor: number;
  biggestBlowout: {
    winner: string;
    margin: number;
    year: number;
    week: number;
  };
}

export interface Rivalry {
  owner1: string;
  owner2: string;
  rivalryScore: number; // Calculated based on close games, playoff matchups, etc.
  headToHead: HeadToHeadRecord;
  playoffMeetings: number;
  championshipMeetings: number;
  closeGames: number; // Games decided by < 10 points
}

export interface AllTimeStats {
  totalSeasons: number;
  totalGamesPlayed: number;
  totalPointsScored: number;
  averagePointsPerGame: number;
  highestScoringGame: {
    ownerName: string;
    points: number;
    year: number;
    week: number;
  };
  lowestScoringGame: {
    ownerName: string;
    points: number;
    year: number;
    week: number;
  };
  mostChampionships: {
    ownerName: string;
    count: number;
  };
  longestWinStreak: {
    ownerName: string;
    streak: number;
    years: string;
  };
  longestLoseStreak: {
    ownerName: string;
    streak: number;
    years: string;
  };
}
