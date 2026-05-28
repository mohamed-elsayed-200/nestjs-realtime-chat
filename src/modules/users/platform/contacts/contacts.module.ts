import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { BaseContactModule } from '../../../../common/modules/platform/contacts/contacts.module';

@Module({
  imports: [BaseAuthModule, BaseContactModule],
  controllers: [ContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}
