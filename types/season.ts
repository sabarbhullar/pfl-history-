export interface Season {
  year: number;
  champion: string; // Owner name (not team name)
  runnerUp: string; // Owner name
  mostPoints: {
    owner: string; // Owner name
    teamName: string;
    points: number;
  };
  lastPlace: string; // Owner name
  standings: Standing[];
  weeklyScores?: WeeklyMatchup[]; // Only for 2006-2025 from ESPN API
  keyMoments?: KeyMoment[]; // Notable events, trades, drama
  leagueSize: number; // Number of teams
  regularSeasonWeeks: number; // Number of weeks in regular season
  playoffWeeks: number; // Number of playoff weeks
}

export interface Standing {
  rank: number;
  ownerName: string; // Person name (not team name)
  teamName: string; // Team name for that season
  wins: number;
  losses: number;
  ties?: number;
  pointsFor: number;
  pointsAgainst: number;
  madePlayoffs: boolean;
}

export interface WeeklyMatchup {
  week: number;
  matchupId: number;
  homeTeam: TeamScore;
  awayTeam: TeamScore;
  isPlayoff: boolean;
  isChampionship: boolean;
}

export interface TeamScore {
  ownerName: string; // Person name
  teamName: string;
  score: number;
  projected?: number;
}

export interface KeyMoment {
  week?: number;
  type: 'trade' | 'record' | 'comeback' | 'blowout' | 'upset' | 'other';
  title: string;
  description: string;
  involvedOwners: string[]; // Owner names
}
