// ESPN Fantasy Football API response types

export interface ESPNLeague {
  id: number;
  seasonId: number;
  size: number;
  scoringPeriodId: number;
  finalScoringPeriod: number;
  currentMatchupPeriod: number;
  teams: ESPNTeam[];
  members: ESPNMember[];
  schedule: ESPNMatchup[];
  settings: ESPNSettings;
}

export interface ESPNTeam {
  id: number;
  abbrev: string;
  location: string;
  nickname: string;
  owners: string[]; // Array of member IDs
  record: {
    overall: {
      wins: number;
      losses: number;
      ties: number;
      percentage: number;
    };
  };
  points: number;
  pointsAgainst: number;
  playoffSeed?: number;
  rankCalculatedFinal?: number;
}

export interface ESPNMember {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  isLeagueManager: boolean;
}

export interface ESPNMatchup {
  id: number;
  matchupPeriodId: number;
  playoffTierType?: string;
  away: ESPNMatchupTeam;
  home: ESPNMatchupTeam;
  winner?: 'HOME' | 'AWAY';
}

export interface ESPNMatchupTeam {
  teamId: number;
  totalPoints: number;
  totalProjectedPoints?: number;
  rosterForCurrentScoringPeriod?: {
    entries: ESPNRosterEntry[];
  };
}

export interface ESPNRosterEntry {
  playerId: number;
  playerPoolEntry: {
    player: {
      fullName: string;
      defaultPositionId: number;
    };
  };
  lineupSlotId: number;
}

export interface ESPNSettings {
  name: string;
  regularSeasonMatchupPeriodCount: number;
  playoffTeamCount: number;
  playoffMatchupPeriodLength: number;
  isPublic: boolean;
}

// Processed ESPN data for our app
export interface ProcessedESPNData {
  year: number;
  leagueId: number;
  teams: ProcessedTeam[];
  standings: Standing[];
  weeklyMatchups: WeeklyMatchup[];
  ownerMapping: OwnerMapping[];
}

export interface ProcessedTeam {
  espnTeamId: number;
  teamName: string; // location + nickname
  ownerName: string; // Mapped from member display name
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  rank: number;
}

export interface OwnerMapping {
  espnMemberId: string;
  espnDisplayName: string;
  ownerName: string; // Canonical owner name in our system
  teamNames: string[]; // Team names used
}

export interface Standing {
  rank: number;
  ownerName: string;
  teamName: string;
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
  homeTeam: {
    ownerName: string;
    teamName: string;
    score: number;
    projected?: number;
  };
  awayTeam: {
    ownerName: string;
    teamName: string;
    score: number;
    projected?: number;
  };
  isPlayoff: boolean;
  isChampionship: boolean;
}
