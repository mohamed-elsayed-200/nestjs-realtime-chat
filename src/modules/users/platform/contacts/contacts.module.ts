import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { BaseContactModule } from '../../../../common/modules/platform/contacts/contacts.module';
import { BaseSpaceModule } from '../../../../common/modules/platform/spaces/spaces.module';

@Module({
  imports: [BaseAuthModule, BaseContactModule, BaseSpaceModule],
  controllers: [ContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}
