import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { I18nContext } from 'nestjs-i18n';
import { RESPONSE_META_KEY } from '../decorators/response.decorator';
import { Types } from 'mongoose';

function transformMongoIds(data: any, lang: 'en' | 'ar'): any {
  if (data === null || data === undefined) return data;

  if (data?.toObject) {
    data = data.toObject({ getters: true });
  }

  if (data instanceof Date) return data;
  if (data instanceof Buffer || data instanceof RegExp) return data;
  if (data instanceof Types.ObjectId) return data.toString();

  if (Array.isArray(data)) {
    return data.map((item) => transformMongoIds(item, lang));
  }

  if (typeof data === 'object') {
    const newObj: any = {};

    for (const key in data) {
      if (key === '__v') continue;

      if (key === '_id') {
        newObj.id = transformMongoIds(data[key], lang);
        continue;
      }

      newObj[key] = transformMongoIds(data[key], lang);
    }

    return newObj;
  }

  return data;
}

@Injectable()
export class ResInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const responseMeta = this.reflector.get<{
      status: string;
      message: string;
      statusCode: number;
    }>(RESPONSE_META_KEY, context.getHandler());

    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    const i18n = I18nContext.current(request);

    return next.handle().pipe(
      map((data) => {
        const message = responseMeta?.message
          ? i18n?.t(responseMeta.message)
          : undefined;

        if (responseMeta?.statusCode) {
          response.status(responseMeta.statusCode);
        }

        const baseResponse: any = {
          message,
          status: responseMeta?.status || 'success',
          statusCode: responseMeta?.statusCode || ctx.getResponse().statusCode,
        };

        if (data !== null && data !== undefined) {
          const lang = (i18n?.lang as 'en' | 'ar') || 'ar';
          baseResponse.content = transformMongoIds(data, lang);
        }

        return baseResponse;
      }),
    );
  }
}
