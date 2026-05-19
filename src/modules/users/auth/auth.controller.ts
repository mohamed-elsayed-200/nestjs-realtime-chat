import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Request } from 'express';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { AuthService } from './auth.service';
import { ResponseMeta } from '../../../common/decorators/response.decorator';
import { SendOtpDto } from './dto/send-otp.dto';
import { RegisterDto } from './dto/register.dto';
import getClientIp from '../../../common/utils/get-client-ip';
import getClientUserAgent from '../../../common/utils/get-client-user-agent';

@Controller('/users/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  @ResponseMeta({
    message: 'auth.registerSuccess',
    statusCode: 200,
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register({ dto });
  }

  @Post('/login')
  @ResponseMeta({
    message: 'auth.loginSuccess',
    statusCode: 200,
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: any,
    @Req() req: Request,
  ) {
    const ip = getClientIp(req);
    const userAgent = getClientUserAgent(req);
    return this.authService.login({ ip, res, dto, userAgent });
  }

  @Post('/logout')
  @ResponseMeta({
    message: 'auth.logoutSuccess',
    statusCode: 200,
  })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const userId = req['userId'];
    const token = req.cookies['token'];
    return this.authService.logout({ res, token, userId });
  }

  @Post('/forgot-password')
  @ResponseMeta({
    message: 'auth.otpCodeSended',
    statusCode: 200,
  })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('/verify-forgot-password')
  @ResponseMeta({
    message: 'auth.verifiedAccount',
    statusCode: 200,
  })
  async verifyPasswordResetOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyForgotPassword(dto);
  }

  @Post('/verify-account')
  @ResponseMeta({
    message: 'auth.verifiedAccount',
    statusCode: 200,
  })
  async verifyAccount(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: any,
    @Req() req: Request,
  ) {
    const ip = getClientIp(req);
    const userAgent = getClientUserAgent(req);
    return this.authService.verifyAccount({ ip, res, userAgent, ...dto });
  }

  @Get('/verify-token')
  @ResponseMeta({
    message: 'auth.tokenVerified',
    statusCode: 200,
  })
  async verifyToken(@Res({ passthrough: true }) res: any, @Req() req: Request) {
    const ip = getClientIp(req);
    const token = req.cookies?.token;
    return this.authService.verifyToken({ ip, res, token });
  }

  @Post('/reset-password')
  @ResponseMeta({
    message: 'auth.passwordResetSuccess',
    statusCode: 200,
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('/send-otp')
  @ResponseMeta({
    message: 'auth.otpCodeSended',
    statusCode: 200,
  })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }
}
