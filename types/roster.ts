// Player and Roster types for weekly matchups

export interface Player {
  id: number;
  name: string;
  position: string; // QB, RB, WR, TE, K, DEF
  team: string; // NFL team abbreviation
  points: number;
  projected?: number;
  stats?: PlayerStats;
}

export interface PlayerStats {
  // Passing
  passingYards?: number;
  passingTDs?: number;
  interceptions?: number;
  // Rushing
  rushingYards?: number;
  rushingTDs?: number;
  // Receiving
  receptions?: number;
  receivingYards?: number;
  receivingTDs?: number;
  // Kicking
  fieldGoalsMade?: number;
  extraPointsMade?: number;
  // Defense
  sacks?: number;
  defensiveTDs?: number;
  pointsAllowed?: number;
}

export interface RosterSlot {
  position: string; // Lineup slot: QB, RB, WR, TE, FLEX, K, DEF, Bench
  player: Player | null;
}

export interface TeamRoster {
  ownerName: string;
  teamName: string;
  starters: RosterSlot[];
  bench: RosterSlot[];
  totalPoints: number;
  projectedPoints?: number;
}

export interface MatchupWithRosters {
  week: number;
  matchupId: number;
  homeTeam: TeamRoster;
  awayTeam: TeamRoster;
  isPlayoff: boolean;
  isChampionship: boolean;
}

// ESPN position slot IDs
export const ESPN_SLOT_MAP: Record<number, string> = {
  0: 'QB',
  2: 'RB',
  4: 'WR',
  6: 'TE',
  16: 'D/ST',
  17: 'K',
  20: 'Bench',
  21: 'IR',
  23: 'FLEX',
};

// ESPN position IDs
export const ESPN_POSITION_MAP: Record<number, string> = {
  1: 'QB',
  2: 'RB',
  3: 'WR',
  4: 'TE',
  5: 'K',
  16: 'D/ST',
};
