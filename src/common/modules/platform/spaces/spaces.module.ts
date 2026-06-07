import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Space, SpaceSchema } from './schemas/space.schema';
import { SpacesRepository } from './spaces.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Space.name,
        schema: SpaceSchema,
      },
    ]),
  ],
  providers: [SpacesRepository],
  exports: [SpacesRepository],
})
export class BaseSpaceModule {}
