import { Module } from '@nestjs/common';
import { PermissionsRepository } from './permissions.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Permission, PermissionSchema } from './permission.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Permission.name,
        schema: PermissionSchema,
      },
    ]),
  ],
  providers: [PermissionsRepository],
  exports: [PermissionsRepository],
})
export class BasePermissionsModule {}
