import { SetMetadata } from '@nestjs/common';

export const RESPONSE_META_KEY = 'response_meta';

export interface ResponseMetaOptions {
  message?: string;
  status?: string;
  statusCode?: number;
}

export const ResponseMeta = (options: ResponseMetaOptions) =>
  SetMetadata(RESPONSE_META_KEY, options);
