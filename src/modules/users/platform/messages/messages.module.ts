import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseMessageModule } from '../../../../common/modules/platform/messages/messages.module';
import { BaseSpaceModule } from '../../../../common/modules/platform/spaces/spaces.module';
import { BaseMemberModule } from '../../../../common/modules/platform/members/members.module';
import { CreateMessageService } from './service/create-message.service';
import { DeleteMessageService } from './service/delete-message.service';
import { ForwardMessageService } from './service/forward-message.service';
import { GetMessagesService } from './service/get-messages.service';
import { TogglePinMessageService } from './service/toggle-pin.service';
import { UpdateMessageService } from './service/update-message.service';

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
