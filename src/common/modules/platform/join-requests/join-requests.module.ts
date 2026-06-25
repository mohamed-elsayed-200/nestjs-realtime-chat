import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JoinRequest, JoinRequestSchema } from './join-request.schema';
import { JoinRequestsRepository } from './join-requests.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: JoinRequest.name,
        schema: JoinRequestSchema,
      },
    ]),
  ],
  providers: [JoinRequestsRepository],
  exports: [JoinRequestsRepository],
})
export class BaseJoinRequests {}
