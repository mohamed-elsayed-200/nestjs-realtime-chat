import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { useContainer } from 'class-validator';
import { I18nValidationPipe } from 'nestjs-i18n';
import { I18nValidationExceptionFilter } from './common/filters/http-exception.filter';
import { ResInterceptor } from './common/interceptors/response.interceptor';
import { Response } from 'express';
import helmet from 'helmet';
const cookieParser = require('cookie-parser');
import { SocketIoAdapter } from './modules/socket/adapters/socket-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.setGlobalPrefix('api');
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.use(cookieParser());

  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const reflector = app.get(Reflector);

  app.useGlobalFilters(
    app.select(AppModule).get(I18nValidationExceptionFilter),
  );

  app.useGlobalInterceptors(new ResInterceptor(reflector));

  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization', 'x-lang'],
  });

  app.useWebSocketAdapter(new SocketIoAdapter(app));

  app.getHttpAdapter().get('/', (req: Request, res: Response) => {
    res.redirect('/api');
  });

  const port = process.env.PORT || 27019;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
