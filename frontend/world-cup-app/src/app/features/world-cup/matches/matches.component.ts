import { Component, OnInit } from '@angular/core';
import {
  MatchCardApiItem,
  MatchCardDetailItem,
  MatchMinuteDetailItem,
  MatchStageCode,
  MatchSubstitutionDetailItem,
} from './model/matches-api.interface';
import { MatchesService } from './service/matches.service';

@Component({
  selector: 'app-matches-page',
  standalone: false,
  templateUrl: './matches.component.html',
  styleUrls: ['./matches.component.css'],
})
export class MatchesPageComponent implements OnInit {
  constructor(private readonly matchesService: MatchesService) {}

  get pageState() {
    return this.matchesService.getViewModel();
  }

  ngOnInit(): void {
    this.matchesService.initialize();
  }

  onStageChange(stage: MatchStageCode): void {
    this.matchesService.setStage(stage);
  }

  onMatchSelect(match: MatchCardApiItem): void {
    this.matchesService.selectMatch(match);
  }

  hasAnyDetail(match: MatchCardApiItem | null): boolean {
    return this.matchesService.hasAnyDetail(match);
  }

  getMinuteText(detail: MatchMinuteDetailItem | MatchCardDetailItem | MatchSubstitutionDetailItem): string {
    return `${detail.minute}'`;
  }
}
