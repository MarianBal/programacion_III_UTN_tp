export interface CurrentWorldCupApiResponse {
  worldCupId?: string;
  edition?: number;
  status?: string;
  hasActiveFinal?: boolean;
  canResimulate?: boolean;
  canStartFinal?: boolean;
  selectedTeamId?: string;
  selectedTeamName?: string;
  finalHomeTeamId?: string;
  finalHomeTeamName?: string;
  finalAwayTeamId?: string;
  finalAwayTeamName?: string;
  finalMatchId?: string | null;
}

export interface TeamStatsApiResponse {
  attack?: number;
  defense?: number;
  midfield?: number;
  overall?: number;
  current_strategy?: string;
  current_formation?: string;
}

export interface TeamCatalogApiItem {
  id?: string;
  name?: string;
  coach?: string;
}

export interface MatchMinuteDetailApiItem {
  playerName?: string;
  minute?: number;
}

export interface MatchCardDetailApiItem extends MatchMinuteDetailApiItem {
  cardType?: string;
}

export interface MatchSubstitutionDetailApiItem {
  playerInName?: string;
  playerOutName?: string;
  minute?: number;
}

export interface MatchPlayerOfMatchApiItem {
  playerName?: string;
  teamId?: string;
  teamName?: string;
}

export interface WorldCupMatchApiItem {
  stage?: string;
  groupName?: string | null;
  matchCode?: string;
  homeTeamId?: string;
  homeTeamName?: string;
  awayTeamId?: string;
  awayTeamName?: string;
  homeGoals?: number | null;
  awayGoals?: number | null;
  homePenaltyGoals?: number | null;
  awayPenaltyGoals?: number | null;
  winnerTeamId?: string | null;
  winnerTeamName?: string | null;
  resolution?: string;
  isPending?: boolean;
  playerOfMatch?: MatchPlayerOfMatchApiItem | null;
  homeTeamTotalYellowCards?: number;
  homeTeamTotalRedCards?: number;
  awayTeamTotalYellowCards?: number;
  awayTeamTotalRedCards?: number;
  homeTeamGoalsDetails?: MatchMinuteDetailApiItem[];
  awayTeamGoalsDetails?: MatchMinuteDetailApiItem[];
  homeTeamCardsDetails?: MatchCardDetailApiItem[];
  awayTeamCardsDetails?: MatchCardDetailApiItem[];
  homeTeamInjuriesDetails?: MatchMinuteDetailApiItem[];
  awayTeamInjuriesDetails?: MatchMinuteDetailApiItem[];
  homeTeamSubstitutionsDetails?: MatchSubstitutionDetailApiItem[];
  awayTeamSubstitutionsDetails?: MatchSubstitutionDetailApiItem[];
}

export interface FinalistPreview {
  teamId: string;
  teamName: string;
  attack: number;
  defense: number;
  midfield: number;
  overall: number;
  coachName: string;
  formation: string;
  strategy: string;
  strategyLabel: string;
}

export interface SimulationScreenResponse {
  teamId: string;
  worldCupId: string;
  edition: number;
  status: string;
  hasActiveFinal: boolean;
  canResimulate: boolean;
  canStartFinal: boolean;
  selectedTeamId: string;
  selectedTeamName: string;
  selectedTeamInFinal: boolean;
  finalMatchId: string | null;
  finalHomeTeam: FinalistPreview;
  finalAwayTeam: FinalistPreview;
}
