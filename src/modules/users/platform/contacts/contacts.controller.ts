import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PermissionsGuard } from '../../../../common/guards/permissions-guard.guard';
import { UserType } from '../../../../common/types/enums';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { ContactsService } from './contacts.service';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@Controller('/users/contacts')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}
  @Get()
  @ResponseMeta({ message: 'contacts.foundAll' })
  public async getAll(@Query() query: QueryDto, @GetUser() authUser: any) {
    return this.contactsService.getAll({ query, authUser });
  }

  @Get('/:contactId')
  @ResponseMeta({ message: 'contacts.foundOne' })
  public async getOne(
    @Param('contactId', ValidateObjectIdPipe)
    contactId: ValidateObjectIdPipe,
  ) {
    return this.contactsService.getOne({ contactId });
  }
}
