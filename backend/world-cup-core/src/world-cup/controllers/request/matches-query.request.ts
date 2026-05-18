import { IsIn, IsOptional, IsString } from 'class-validator';

export const MATCH_STAGE_FILTERS = [
  'ALL',
  'GROUP_STAGE',
  'ROUND_OF_32',
  'ROUND_OF_16',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'THIRD_PLACE',
  'FINAL',
] as const;

export class MatchesQueryRequest {
  @IsOptional()
  @IsString()
  @IsIn(['es', 'en'])
  lang?: string;

  @IsOptional()
  @IsString()
  @IsIn(MATCH_STAGE_FILTERS)
  stage?: string;
}
