import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './schemas/message.schema';
import { MessagesRepository } from './repository/messages.repository';
import {
  DeletedMessage,
  DeletedMessageSchema,
} from './schemas/deleted-message.schema';
import { DeletedMessagesRepository } from './repository/deleted-messages.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Message.name,
        schema: MessageSchema,
      },
      {
        name: DeletedMessage.name,
        schema: DeletedMessageSchema,
      },
    ]),
  ],
  providers: [MessagesRepository, DeletedMessagesRepository],
  exports: [MessagesRepository, DeletedMessagesRepository],
})
export class BaseMessageModule {}
