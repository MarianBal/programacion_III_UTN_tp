import { HttpStatus, Injectable } from '@nestjs/common';
import { AdminService } from '../../admin/admin.service';
import { AbstractBaseService } from '../../basic/abstract-base.service';
import { ApiErrorMappingRule, ApiErrorStatusMap, ErrorUtils } from '../../basic/error/error.utils';
import { LanguageEnum } from '../../basic/model/language.enum';
import { WorldCupCoreErrorCode } from '../../basic/model/world-cup-core-error-code.enum';
import { WorldCupFeatureApiService } from '../../basic/world-cup-feature-api.service';
import {
  MatchCardDetailApiItem,
  MatchMinuteDetailApiItem,
  MatchSubstitutionDetailApiItem,
  WorldCupMatchApiItem,
} from './model/simulation-service.interface';
import {
  MatchCardApiItem,
  MatchCardDetailItem,
  MatchesApiResponse,
  MatchMinuteDetailItem,
  MatchStageCode,
  MatchStageFilterItem,
  MatchSubstitutionDetailItem,
} from './model/matches-service.interface';

const MATCH_STAGE_ORDER: MatchStageCode[] = [
  'GROUP_STAGE',
  'ROUND_OF_32',
  'ROUND_OF_16',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'THIRD_PLACE',
  'FINAL',
];

const MATCHES_API_ERROR_STATUS_MAP: ApiErrorStatusMap = {
  [HttpStatus.NOT_FOUND]: {
    messageCode: WorldCupCoreErrorCode.WC_MATCHES_UNAVAILABLE,
    message: 'World Cup matches are not available yet. Run simulation first.',
    statusCode: HttpStatus.CONFLICT,
  },
  [HttpStatus.CONFLICT]: {
    messageCode: WorldCupCoreErrorCode.WC_MATCHES_UNAVAILABLE,
    message: 'World Cup matches are not available right now.',
    statusCode: HttpStatus.CONFLICT,
  },
};

const MATCHES_API_ERROR_FALLBACK: ApiErrorMappingRule = {
  messageCode: WorldCupCoreErrorCode.WC_MATCHES_UNAVAILABLE,
  message: 'Unable to load match details from World Cup API.',
  statusCode: HttpStatus.BAD_GATEWAY,
};

@Injectable()
export class MatchesService extends AbstractBaseService {
  constructor(
    private readonly worldCupFeatureApiService: WorldCupFeatureApiService,
    adminService: AdminService,
  ) {
    super(adminService);
  }

  public async getMatches(lang?: string, stage?: string): Promise<MatchesApiResponse> {
    const resolvedLang = this.resolveLang(lang);
    const selectedStage = this.parseStage(stage);

    try {
      const matches = await this.worldCupFeatureApiService.getCurrentWorldCupMatches(resolvedLang);
      const mappedMatches = this.sortMatches(matches).map((match) => this.mapMatch(match, resolvedLang));
      const filteredMatches =
        selectedStage === 'ALL'
          ? mappedMatches
          : mappedMatches.filter((match) => match.stage === selectedStage);

      return {
        teamId: this.getCurrentTeamId(),
        lang: resolvedLang,
        selectedStage,
        availableStages: this.buildAvailableStages(mappedMatches, resolvedLang),
        totalMatches: mappedMatches.length,
        playedMatches: mappedMatches.filter((match) => !match.isPending).length,
        pendingMatches: mappedMatches.filter((match) => match.isPending).length,
        matches: filteredMatches,
      };
    } catch (error) {
      ErrorUtils.mapWorldCupApiError(
        error,
        MATCHES_API_ERROR_STATUS_MAP,
        MATCHES_API_ERROR_FALLBACK,
      );
    }
  }

  private sortMatches(matches: WorldCupMatchApiItem[]): WorldCupMatchApiItem[] {
    return [...(Array.isArray(matches) ? matches : [])].sort((left, right) => {
      const leftStage = this.getStageOrder(left.stage);
      const rightStage = this.getStageOrder(right.stage);

      if (leftStage !== rightStage) {
        return leftStage - rightStage;
      }

      return this.getMatchSequence(left.matchCode) - this.getMatchSequence(right.matchCode);
    });
  }

  private mapMatch(match: WorldCupMatchApiItem, lang: LanguageEnum): MatchCardApiItem {
    const homeTeamId = this.normalizeTeamId(match.homeTeamId);
    const awayTeamId = this.normalizeTeamId(match.awayTeamId);
    const winnerTeamId = match.winnerTeamId ? this.normalizeTeamId(match.winnerTeamId) : null;
    const playerOfMatchTeamId = match.playerOfMatch?.teamId
      ? this.normalizeTeamId(match.playerOfMatch.teamId)
      : null;

    return {
      stage: this.parseStage(match.stage) as Exclude<MatchStageCode, 'ALL'>,
      stageLabel: this.getStageLabel(this.parseStage(match.stage), lang),
      groupName: match.groupName ?? null,
      matchCode: (match.matchCode ?? '').trim(),
      homeTeamId,
      homeTeamName: this.normalizeLabel(match.homeTeamName, homeTeamId.toUpperCase()),
      homeFlag: this.getTeamFlag(homeTeamId),
      awayTeamId,
      awayTeamName: this.normalizeLabel(match.awayTeamName, awayTeamId.toUpperCase()),
      awayFlag: this.getTeamFlag(awayTeamId),
      scoreLabel: this.buildScoreLabel(match),
      penaltyLabel: this.buildPenaltyLabel(match, lang),
      resolution: this.normalizeLabel(match.resolution, 'PENDING'),
      resolutionLabel: this.getResolutionLabel(match.resolution, Boolean(match.isPending), lang),
      isPending: Boolean(match.isPending),
      winnerTeamId,
      winnerTeamName: match.winnerTeamName ? this.normalizeLabel(match.winnerTeamName) : null,
      winnerFlag: winnerTeamId ? this.getTeamFlag(winnerTeamId) : null,
      playerOfMatchName: match.playerOfMatch?.playerName
        ? this.normalizeLabel(match.playerOfMatch.playerName)
        : null,
      playerOfMatchTeamId,
      playerOfMatchFlag: playerOfMatchTeamId ? this.getTeamFlag(playerOfMatchTeamId) : null,
      goalsSummary: this.buildGoalsSummary(match, lang),
      cardsSummary: this.buildCardsSummary(match, lang),
      homeGoalsDetails: this.mapMinuteDetails(match.homeTeamGoalsDetails),
      awayGoalsDetails: this.mapMinuteDetails(match.awayTeamGoalsDetails),
      homeCardsDetails: this.mapCardDetails(match.homeTeamCardsDetails, lang),
      awayCardsDetails: this.mapCardDetails(match.awayTeamCardsDetails, lang),
      homeInjuriesDetails: this.mapMinuteDetails(match.homeTeamInjuriesDetails),
      awayInjuriesDetails: this.mapMinuteDetails(match.awayTeamInjuriesDetails),
      homeSubstitutionsDetails: this.mapSubstitutionDetails(match.homeTeamSubstitutionsDetails),
      awaySubstitutionsDetails: this.mapSubstitutionDetails(match.awayTeamSubstitutionsDetails),
    };
  }

  private buildAvailableStages(
    matches: MatchCardApiItem[],
    lang: LanguageEnum,
  ): MatchStageFilterItem[] {
    return [
      {
        stage: 'ALL',
        label: lang === 'en' ? 'All' : 'Todos',
        count: matches.length,
      },
      ...MATCH_STAGE_ORDER.map((stageCode) => ({
        stage: stageCode,
        label: this.getStageLabel(stageCode, lang),
        count: matches.filter((match) => match.stage === stageCode).length,
      })).filter((stageItem) => stageItem.count > 0),
    ];
  }

  private mapMinuteDetails(details?: MatchMinuteDetailApiItem[]): MatchMinuteDetailItem[] {
    return (Array.isArray(details) ? details : [])
      .map((detail) => ({
        playerName: this.normalizeLabel(detail?.playerName),
        minute: this.normalizeMinute(detail?.minute),
      }))
      .filter((detail) => Boolean(detail.playerName))
      .sort((left, right) => left.minute - right.minute);
  }

  private mapCardDetails(details?: MatchCardDetailApiItem[], lang?: LanguageEnum): MatchCardDetailItem[] {
    return (Array.isArray(details) ? details : [])
      .map((detail) => {
        const cardType = this.normalizeLabel(detail?.cardType, 'YELLOW').toUpperCase();
        return {
          playerName: this.normalizeLabel(detail?.playerName),
          minute: this.normalizeMinute(detail?.minute),
          cardType,
          cardTypeLabel: this.getCardTypeLabel(cardType, lang),
        };
      })
      .filter((detail) => Boolean(detail.playerName))
      .sort((left, right) => left.minute - right.minute);
  }

  private mapSubstitutionDetails(
    details?: MatchSubstitutionDetailApiItem[],
  ): MatchSubstitutionDetailItem[] {
    return (Array.isArray(details) ? details : [])
      .map((detail) => ({
        playerInName: this.normalizeLabel(detail?.playerInName),
        playerOutName: this.normalizeLabel(detail?.playerOutName),
        minute: this.normalizeMinute(detail?.minute),
      }))
      .filter((detail) => Boolean(detail.playerInName || detail.playerOutName))
      .sort((left, right) => left.minute - right.minute);
  }

  private buildScoreLabel(match: WorldCupMatchApiItem): string {
    if (match.isPending || match.homeGoals === null || match.awayGoals === null) {
      return 'vs';
    }

    return `${this.normalizeScore(match.homeGoals)} - ${this.normalizeScore(match.awayGoals)}`;
  }

  private buildPenaltyLabel(match: WorldCupMatchApiItem, lang: LanguageEnum): string | null {
    if (match.homePenaltyGoals === null || match.awayPenaltyGoals === null) {
      return null;
    }

    const prefix = lang === 'en' ? 'Penalties' : 'Penales';
    return `${prefix}: ${this.normalizeScore(match.homePenaltyGoals)} - ${this.normalizeScore(match.awayPenaltyGoals)}`;
  }

  private buildGoalsSummary(match: WorldCupMatchApiItem, lang: LanguageEnum): string | null {
    const totalGoals =
      this.mapMinuteDetails(match.homeTeamGoalsDetails).length +
      this.mapMinuteDetails(match.awayTeamGoalsDetails).length;

    if (totalGoals === 0) {
      return match.isPending ? null : lang === 'en' ? 'No goals' : 'Sin goles';
    }

    return lang === 'en'
      ? `${totalGoals} goal${totalGoals === 1 ? '' : 's'}`
      : `${totalGoals} gol${totalGoals === 1 ? '' : 'es'}`;
  }

  private buildCardsSummary(match: WorldCupMatchApiItem, lang: LanguageEnum): string | null {
    const yellowCards =
      this.normalizeScore(match.homeTeamTotalYellowCards) +
      this.normalizeScore(match.awayTeamTotalYellowCards);
    const redCards =
      this.normalizeScore(match.homeTeamTotalRedCards) +
      this.normalizeScore(match.awayTeamTotalRedCards);

    if (yellowCards + redCards === 0) {
      return null;
    }

    return lang === 'en'
      ? `${yellowCards} yellow, ${redCards} red`
      : `${yellowCards} amarillas, ${redCards} rojas`;
  }

  private parseStage(stage?: string): MatchStageCode {
    const normalizedStage = (stage ?? 'ALL').trim().toUpperCase() as MatchStageCode;
    const allowedStages: MatchStageCode[] = ['ALL', ...MATCH_STAGE_ORDER];
    return allowedStages.includes(normalizedStage) ? normalizedStage : 'ALL';
  }

  private getStageOrder(stage?: string): number {
    const parsedStage = this.parseStage(stage);
    const index = MATCH_STAGE_ORDER.indexOf(parsedStage);
    return index >= 0 ? index : 99;
  }

  private getStageLabel(stage?: string, lang?: LanguageEnum): string {
    const labelsEs: Record<MatchStageCode, string> = {
      ALL: 'Todos',
      GROUP_STAGE: 'Fase de grupos',
      ROUND_OF_32: '32avos',
      ROUND_OF_16: 'Octavos',
      QUARTER_FINALS: 'Cuartos',
      SEMI_FINALS: 'Semifinales',
      THIRD_PLACE: 'Tercer puesto',
      FINAL: 'Final',
    };
    const labelsEn: Record<MatchStageCode, string> = {
      ALL: 'All',
      GROUP_STAGE: 'Group stage',
      ROUND_OF_32: 'Round of 32',
      ROUND_OF_16: 'Round of 16',
      QUARTER_FINALS: 'Quarter-finals',
      SEMI_FINALS: 'Semi-finals',
      THIRD_PLACE: 'Third place',
      FINAL: 'Final',
    };

    const parsedStage = this.parseStage(stage);
    return lang === 'en' ? labelsEn[parsedStage] : labelsEs[parsedStage];
  }

  private getResolutionLabel(resolution?: string, isPending?: boolean, lang?: LanguageEnum): string {
    if (isPending) {
      return lang === 'en' ? 'Pending' : 'Pendiente';
    }

    const normalizedResolution = this.normalizeLabel(resolution, 'REGULAR_TIME').toUpperCase();
    const labelsEs: Record<string, string> = {
      REGULAR_TIME: 'Tiempo regular',
      EXTRA_TIME: 'Tiempo extra',
      PENALTIES: 'Penales',
      PENDING: 'Pendiente',
    };
    const labelsEn: Record<string, string> = {
      REGULAR_TIME: 'Regular time',
      EXTRA_TIME: 'Extra time',
      PENALTIES: 'Penalties',
      PENDING: 'Pending',
    };

    return lang === 'en'
      ? labelsEn[normalizedResolution] ?? normalizedResolution
      : labelsEs[normalizedResolution] ?? normalizedResolution;
  }

  private getCardTypeLabel(cardType?: string, lang?: LanguageEnum): string {
    const normalizedType = this.normalizeLabel(cardType, 'YELLOW').toUpperCase();

    if (normalizedType === 'RED') {
      return lang === 'en' ? 'Red' : 'Roja';
    }

    return lang === 'en' ? 'Yellow' : 'Amarilla';
  }

  private getMatchSequence(matchCode?: string): number {
    const match = (matchCode ?? '').match(/(\d+)$/);
    return match ? Number(match[1]) : 0;
  }

  private normalizeTeamId(teamId?: string): string {
    return (teamId ?? '').trim().toLowerCase();
  }

  private normalizeLabel(value?: string | null, fallback = ''): string {
    return (value ?? fallback).trim();
  }

  private normalizeScore(value?: number | null): number {
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  }

  private normalizeMinute(value?: number | null): number {
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  }

  private getTeamFlag(teamId?: string): string {
    const normalizedTeamId = this.normalizeTeamId(teamId);
    return normalizedTeamId ? normalizedTeamId.toUpperCase() : 'TBD';
  }
}
