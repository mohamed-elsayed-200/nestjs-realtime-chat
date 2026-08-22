import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { ContactsController } from './contacts.controller';
import { BaseContactModule } from '../../../../common/modules/platform/contacts/contacts.module';
import { BaseSpaceModule } from '../../../../common/modules/platform/spaces/spaces.module';
import { CreateContactService } from './services/create-contact.service';
import { DeleteContactService } from './services/delete-contact.service';
import { GetMyContactsService } from './services/get-my-contacts.service';
import { GetSingleContactService } from './services/get-single-contact.service';
import { UpdateContactService } from './services/update-contact.service';

@Module({
  imports: [BaseAuthModule, BaseContactModule, BaseSpaceModule],
  controllers: [ContactsController],
  providers: [
    CreateContactService,
    DeleteContactService,
    GetMyContactsService,
    GetSingleContactService,
    UpdateContactService,
  ],
})
export class ContactsModule {}
