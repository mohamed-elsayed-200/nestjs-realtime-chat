import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Banned, BannedSchema } from './banned.schema';
import { BannedRepository } from './banned.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Banned.name,
        schema: BannedSchema,
      },
    ]),
  ],
  providers: [BannedRepository],
  exports: [BannedRepository],
})
export class BaseBannedModule {}
