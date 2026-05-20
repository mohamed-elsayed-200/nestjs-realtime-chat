import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly i18n: I18nService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  private async sendMailAsync(mailOptions: any) {
    this.mailerService.sendMail(mailOptions).catch((err) => {
      console.error('Error sending email:', err);
    });
  }

  public async sendAccountVerificationEmail({
    username,
    email,
    otpCode,
  }: {
    username: string;
    email: string;
    otpCode: string;
  }): Promise<boolean> {
    const appName = this.configService.get<string>('APP_NAME');
    const appEmail = this.configService.get<string>('GMAIL');
    const expireInMin = this.configService.get<string>(
      'OTP_EXPIRATION_MINUTES',
    );

    const msgs = {
      welcome: this.i18n.t('ejs.welcome'),
      thankYouForRegistering: this.i18n.t('ejs.thankYouForRegistering'),
      verificationCode: this.i18n.t('ejs.verificationCode'),
      enterCodeInApp: this.i18n.t('ejs.enterCodeInApp'),
      codeWillExpireIn: this.i18n.t('ejs.codeWillExpireIn', {
        args: { minutes: expireInMin },
      }),
      orClickVerifyAccount: this.i18n.t('ejs.orClickVerifyAccount'),
      verifyAccount: this.i18n.t('ejs.verifyAccount'),
      note: this.i18n.t('ejs.note'),
      ignoreEmailIfNotYou: this.i18n.t('ejs.ignoreEmailIfNotYou'),
      needHelp: this.i18n.t('ejs.needHelp'),
      contactSupport: this.i18n.t('ejs.contactSupport'),
      allRightsReserved: this.i18n.t('ejs.allRightsReserved'),
    };

    this.sendMailAsync({
      to: email,
      from: `"${appName}" <${appEmail}>`,
      subject: `${msgs.verifyAccount}`,
      template: 'email-verification',
      context: {
        username,
        otpCode,
        msgs,
        appName,
      },
    });

    return true;
  }

  public async sendPasswordRecoveryEmail({
    email,
    otpCode,
    username,
  }: {
    email: string;
    otpCode: string;
    username: string;
  }): Promise<boolean> {
    const appName = this.configService.get<string>('APP_NAME');
    const appEmail = this.configService.get<string>('GMAIL');
    const expireInMin = this.configService.get<string>(
      'OTP_EXPIRATION_MINUTES',
    );

    const msgs = {
      welcome: this.i18n.t('ejs.welcome'),
      resetRequest: this.i18n.t('ejs.resetRequest'),
      requestReceived: this.i18n.t('ejs.requestReceived'),
      important: this.i18n.t('ejs.important'),
      ignoreRequest: this.i18n.t('ejs.ignoreRequest'),
      codeWillExpireIn: this.i18n.t('ejs.codeWillExpireIn', {
        args: { minutes: expireInMin },
      }),
      note: this.i18n.t('ejs.note'),
      needHelp: this.i18n.t('ejs.needHelp'),
      contactSupport: this.i18n.t('ejs.contactSupport'),
      allRightsReserved: this.i18n.t('ejs.allRightsReserved'),
    };

    // fire-and-forget
    this.sendMailAsync({
      to: email,
      from: `"${appName}" <${appEmail}>`,
      subject: `${msgs.resetRequest}`,
      template: 'rest-password',
      context: {
        msgs,
        otpCode,
        username,
        appName,
      },
    });

    return true;
  }
}
