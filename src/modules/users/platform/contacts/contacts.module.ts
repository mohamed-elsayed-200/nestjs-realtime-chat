import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

@Module({
  imports: [BaseAuthModule],
  controllers: [ContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}
