import { CreateContactService } from './services/create-contact.service';
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Put,
} from '@nestjs/common';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PermissionsGuard } from '../../../../common/guards/permissions-guard.guard';
import { UserType } from '../../../../common/types/enums';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { GetUser } from '../../../../common/decorators/get-user.decorator';
import { DeleteContactService } from './services/delete-contact.service';
import { GetMyContactsService } from './services/get-my-contacts.service';
import { GetSingleContactService } from './services/get-single-contact.service';
import { UpdateContactService } from './services/update-contact.service';

@Controller('/users/contacts')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class ContactsController {
  constructor(
    private readonly createContactService: CreateContactService,
    private readonly deleteContactService: DeleteContactService,
    private readonly updateContactService: UpdateContactService,
    private readonly getMyContactsService: GetMyContactsService,
    private readonly getSingleContactService: GetSingleContactService,
  ) {}

  @Get()
  @ResponseMeta({ message: 'contacts.foundAll' })
  public async getAll(@Query() query: QueryDto, @GetUser() authUser: any) {
    return this.getMyContactsService.getAll({ query, authUser });
  }

  @Get('/:contactId')
  @ResponseMeta({ message: 'contacts.foundOne' })
  public async getOne(
    @Param('contactId', ValidateObjectIdPipe) contactId: string,
    @GetUser() authUser: any,
  ) {
    return this.getSingleContactService.getOne({ contactId, authUser });
  }

  @Post()
  @ResponseMeta({ message: 'contacts.created' })
  public async create(@Body() dto: any, @GetUser() authUser: any) {
    return this.createContactService.create({ dto, authUser });
  }

  @Put('/:contactId')
  @ResponseMeta({ message: 'contacts.updated' })
  public async update(
    @Param('contactId', ValidateObjectIdPipe) contactId: string,
    @Body() dto: any,
    @GetUser() authUser: any,
  ) {
    return this.updateContactService.update({ contactId, dto, authUser });
  }

  @Delete('/:contactId')
  @ResponseMeta({ message: 'contacts.deleted' })
  public async delete(
    @Param('contactId', ValidateObjectIdPipe) contactId: string,
    @GetUser() authUser: any,
  ) {
    return this.deleteContactService.delete({ contactId, authUser });
  }
}
