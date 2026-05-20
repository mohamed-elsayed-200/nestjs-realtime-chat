import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          transport: {
            host: 'smtp.gmail.com',
            port: 587, // ✅ STARTTLS (أستقر من 465)
            secure: false, // ✅ false للـ 587
            requireTLS: true, // ✅ يفرض TLS upgrade
            auth: {
              user: config.get<string>('GMAIL'),
              pass: config.get<string>('GMAIL_APP_PASSWORD'),
            },
            tls: {
              rejectUnauthorized: false, // لو فيه certificate issue في dev
            },
            debug: true, // شغلها لو عايز تشوف اللوج
            logger: true,
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new EjsAdapter(),
            options: {
              strict: false,
            },
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class BaseMailModule {}
