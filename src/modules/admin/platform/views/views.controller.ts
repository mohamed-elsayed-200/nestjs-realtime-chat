import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { GetViewsService } from './services/get-views.service';

@Controller('/admins/views')
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class ViewsController {
  constructor(private readonly getViewsService: GetViewsService) {}

  @Get('/:target')
  @ResponseMeta({ message: 'views.foundAll' })
  public async getAll(
    @Param('target', ValidateObjectIdPipe) target: string,
    @Query() query: QueryDto,
  ) {
    return this.getViewsService.get({ query, target });
  }
}
