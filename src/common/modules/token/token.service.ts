import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  public async verifyToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch (error) {
      throw new UnauthorizedException('auth.invalidToken');
    }
  }

  public async generateToken(payload: any): Promise<string> {
    const JWT_SECRET = this.configService.get<string>('JWT_SECRET');
    const JWT_EXPIRES_IN =
      this.configService.get<string>('JWT_EXPIRES_IN') ?? '30d';

    const token = await this.jwtService.signAsync(payload, {
      secret: JWT_SECRET,
      expiresIn: JWT_EXPIRES_IN,
    });

    return token;
  }
}
