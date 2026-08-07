import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PermissionsGuard } from '../../../../common/guards/permissions-guard.guard';
import { UserType } from '../../../../common/types/enums';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { GetUser } from '../../../../common/decorators/get-user.decorator';
import { CallsService } from './calls.service';

@Controller('/users/calls')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Get()
  @ResponseMeta({ message: 'calls.foundAll' })
  public async getAll(@Query() query: QueryDto, @GetUser() authUser: any) {}

  @Get('/:callId')
  @ResponseMeta({ message: 'calls.foundOne' })
  public async getOne(
    @Param('callId', ValidateObjectIdPipe) callId: string,
    @GetUser() authUser: any,
  ) {}
}
