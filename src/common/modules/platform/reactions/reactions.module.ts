import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Reaction, ReactionSchema } from './reaction.schema';
import { ReactionsRepository } from './reactions.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Reaction.name,
        schema: ReactionSchema,
      },
    ]),
  ],
  providers: [ReactionsRepository],
  exports: [ReactionsRepository],
})
export class BaseReactionModule {}
