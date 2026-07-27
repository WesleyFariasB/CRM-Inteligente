import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { SearchService } from './search.service';
class SearchQueryDto {
  @IsString() @MinLength(2) @MaxLength(100) q!: string;
}
@ApiTags('Search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}
  @Get() search(@CurrentActor() actor: AuthenticatedActor, @Query() query: SearchQueryDto) {
    return this.searchService.search(actor, query.q);
  }
}
