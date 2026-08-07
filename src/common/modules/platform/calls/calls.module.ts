import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Call, CallSchema } from './schemas/call.schema';
import { CallsRepository } from './calls.repository';
import { Participant, ParticipantSchema } from './schemas/participant.schema';
import { ParticipantsRepository } from './participants.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Call.name,
        schema: CallSchema,
      },
      {
        name: Participant.name,
        schema: ParticipantSchema,
      },
    ]),
  ],
  providers: [CallsRepository, ParticipantsRepository],
  exports: [CallsRepository, ParticipantsRepository],
})
export class BaseCallsModule {}
