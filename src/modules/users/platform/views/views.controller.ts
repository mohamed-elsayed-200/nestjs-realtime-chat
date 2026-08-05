import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { ViewsService } from './views.service';

@Controller('/users/views')
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class ViewsController {
  constructor(private readonly viewsService: ViewsService) {}

  @Get('/:target')
  @ResponseMeta({ message: 'views.foundAll' })
  public async getAll(
    @Param('target', ValidateObjectIdPipe) target: string,
    @Query() query: QueryDto,
  ) {
    return this.viewsService.getAll({ query, target });
  }
}
