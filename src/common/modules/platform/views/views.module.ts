import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { View, ViewSchema } from './view.schema';
import { ViewsRepository } from './views.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: View.name, schema: ViewSchema }]),
  ],
  providers: [ViewsRepository],
  exports: [ViewsRepository, MongooseModule],
})
export class BaseViewsModule {}
