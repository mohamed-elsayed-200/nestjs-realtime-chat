import { SetMetadata } from '@nestjs/common';

export const USER_TYPE_KEY = 'user_types';
export const UserTypes = (...types: string[]) =>
  SetMetadata(USER_TYPE_KEY, types);
