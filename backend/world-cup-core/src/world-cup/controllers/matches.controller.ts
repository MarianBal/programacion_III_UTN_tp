import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AbstractController } from '../../basic/abstract.controller';
import { MatchesQueryRequest } from './request/matches-query.request';
import { MatchesService } from '../services/matches.service';

@ApiTags('world-cup')
@Controller('world-cup')
export class MatchesController extends AbstractController {
  constructor(private readonly matchesService: MatchesService) {
    super();
  }

  @Get('matches')
  @ApiOperation({ summary: 'World Cup - Match details component' })
  @ApiQuery({ name: 'lang', required: false, enum: ['es', 'en'] })
  @ApiQuery({
    name: 'stage',
    required: false,
    enum: [
      'ALL',
      'GROUP_STAGE',
      'ROUND_OF_32',
      'ROUND_OF_16',
      'QUARTER_FINALS',
      'SEMI_FINALS',
      'THIRD_PLACE',
      'FINAL',
    ],
  })
  public async getMatches(@Query() request: MatchesQueryRequest): Promise<unknown> {
    return this.createOkResponse(await this.matchesService.getMatches(request.lang, request.stage));
  }
}
