import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from './session.schema';
import { SessionsRepository } from './sessions.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Session.name,
        schema: SessionSchema,
      },
    ]),
  ],
  providers: [SessionsRepository],
  exports: [SessionsRepository],
})
export class BaseSessionsModule {}
