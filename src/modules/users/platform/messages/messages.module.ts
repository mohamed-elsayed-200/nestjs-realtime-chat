import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseMessageModule } from '../../../../common/modules/platform/messages/messages.module';
import { BaseSpaceModule } from '../../../../common/modules/platform/spaces/spaces.module';
import { BaseMemberModule } from '../../../../common/modules/platform/members/members.module';
import { CreateMessageService } from './services/create-message.service';
import { DeleteMessageService } from './services/delete-message.service';
import { ForwardMessageService } from './services/forward-message.service';
import { GetMessagesService } from './services/get-messages.service';
import { TogglePinMessageService } from './services/toggle-pin.service';
import { UpdateMessageService } from './services/update-message.service';

@Module({
  imports: [
    BaseMessageModule,
    BaseSpaceModule,
    BaseAuthModule,
    BaseMemberModule,
  ],
  controllers: [MessagesController],
  providers: [
    CreateMessageService,
    DeleteMessageService,
    ForwardMessageService,
    GetMessagesService,
    TogglePinMessageService,
    UpdateMessageService,
  ],
  exports: [
    CreateMessageService,
    DeleteMessageService,
    ForwardMessageService,
    GetMessagesService,
    TogglePinMessageService,
    UpdateMessageService,
  ],
})
export class MessagesModule {}
