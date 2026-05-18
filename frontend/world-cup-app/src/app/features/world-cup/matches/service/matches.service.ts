import { Injectable } from '@angular/core';
import { Observable, catchError, combineLatest, finalize, map, of, switchMap, tap } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { MatchCardApiItem, MatchesApiResponse, MatchStageCode } from '../model/matches-api.interface';
import { MatchesViewModel } from '../model/matches-view-model.interface';

@Injectable({ providedIn: 'root' })
export class MatchesService extends BaseApiService {
  private readonly pageState: MatchesViewModel = {
    lang: 'es',
    loading: false,
    errorMessage: '',
    showNoSimulationState: false,
    selectedStage: 'ALL',
    stages: [],
    totalMatches: 0,
    playedMatches: 0,
    pendingMatches: 0,
    matches: [],
    selectedMatchCode: '',
    selectedMatch: null,
  };

  private hasInitialized = false;

  getViewModel(): MatchesViewModel {
    return this.pageState;
  }

  initialize(): void {
    if (this.hasInitialized) {
      this.loadMatches(this.pageState.selectedStage).subscribe();
      return;
    }

    this.hasInitialized = true;

    combineLatest([this.appContextService.currentTeamId$, this.appContextService.lang$])
      .pipe(
        tap(([, lang]) => {
          this.pageState.lang = lang === 'en' ? 'en' : 'es';
        }),
        switchMap(() => this.loadMatches(this.pageState.selectedStage)),
      )
      .subscribe();
  }

  setStage(stage: MatchStageCode): void {
    this.pageState.selectedStage = stage;
    this.pageState.selectedMatchCode = '';
    this.pageState.selectedMatch = null;
    this.loadMatches(stage).subscribe();
  }

  selectMatch(match: MatchCardApiItem): void {
    this.pageState.selectedMatchCode = match.matchCode;
    this.pageState.selectedMatch = match;
  }

  hasAnyDetail(match: MatchCardApiItem | null): boolean {
    if (!match) {
      return false;
    }

    return (
      match.homeGoalsDetails.length +
        match.awayGoalsDetails.length +
        match.homeCardsDetails.length +
        match.awayCardsDetails.length +
        match.homeInjuriesDetails.length +
        match.awayInjuriesDetails.length +
        match.homeSubstitutionsDetails.length +
        match.awaySubstitutionsDetails.length >
      0
    );
  }

  private loadMatches(stage: MatchStageCode): Observable<void> {
    const lang = this.getCurrentLang();
    this.pageState.lang = lang;
    this.pageState.loading = true;
    this.pageState.errorMessage = '';
    this.pageState.showNoSimulationState = false;

    return this.get<MatchesApiResponse>('/world-cup/matches', {
      lang,
      stage,
    }).pipe(
      map((response) => response.data),
      tap((payload) => {
        this.pageState.selectedStage = payload?.selectedStage ?? stage;
        this.pageState.stages = payload?.availableStages ?? [];
        this.pageState.totalMatches = payload?.totalMatches ?? 0;
        this.pageState.playedMatches = payload?.playedMatches ?? 0;
        this.pageState.pendingMatches = payload?.pendingMatches ?? 0;
        this.pageState.matches = payload?.matches ?? [];
        this.syncSelectedMatch();
      }),
      map(() => undefined),
      catchError(() => {
        this.pageState.matches = [];
        this.pageState.stages = [];
        this.pageState.totalMatches = 0;
        this.pageState.playedMatches = 0;
        this.pageState.pendingMatches = 0;
        this.pageState.selectedMatch = null;
        this.pageState.selectedMatchCode = '';
        this.pageState.showNoSimulationState = true;
        this.pageState.errorMessage = 'No se pudieron cargar los partidos. Simula el mundial e intenta nuevamente.';
        return of(undefined);
      }),
      finalize(() => (this.pageState.loading = false)),
    );
  }

  private syncSelectedMatch(): void {
    const currentMatch = this.pageState.matches.find(
      (match) => match.matchCode === this.pageState.selectedMatchCode,
    );

    if (currentMatch) {
      this.pageState.selectedMatch = currentMatch;
      return;
    }

    const firstMatch = this.pageState.matches[0] ?? null;
    this.pageState.selectedMatch = firstMatch;
    this.pageState.selectedMatchCode = firstMatch?.matchCode ?? '';
  }
}
