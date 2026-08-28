import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session } from './session.schema';
import { ConfigService } from '@nestjs/config';
import { FindOneProps } from '../../../types/interfaces';
import getLocationFromIp from '../../../utils/get-location-from-ip';
import { aggregateQuery } from '../../data-access/aggregate-query';
import ms from 'ms';
import { ActivationStatus } from '../../../types/enums';
@Injectable()
export class SessionsRepository {
  constructor(
    @InjectModel(Session.name) private readonly sessionModel: Model<Session>,
    private readonly configService: ConfigService,
  ) {}

  public async findAllByPaginate({ query, options }) {
    return aggregateQuery({
      options: {
        model: this.sessionModel,
        ...options,
      },
      query,
    });
  }

  public async findAll({ query, populate, select }: FindOneProps) {
    if (query?.user) query.user = new Types.ObjectId(query?.user);
    let item = this.sessionModel.find(query);
    if (populate) item.populate(populate);
    if (select) item.select(select);
    return await item.exec();
  }

  public async findOne({ query, populate, select }: FindOneProps) {
    if (query?.user) query.user = new Types.ObjectId(query?.user);
    let item = this.sessionModel.findOne(query);
    if (populate) item.populate(populate);
    if (select) item.select(select);
    return await item.exec();
  }

  private generateFakeIp(): string {
    const octet = () => Math.floor(Math.random() * 223) + 1;
    let ip: string;

    do {
      ip = `${octet()}.${Math.floor(Math.random() * 256)}.${Math.floor(
        Math.random() * 256,
      )}.${Math.floor(Math.random() * 256)}`;
    } while (
      ip.startsWith('10.') ||
      ip.startsWith('127.') ||
      ip.startsWith('169.254.') ||
      ip.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
    );

    return ip;
  }

  public async createOne({ dto }) {
    const jwtExpiresIn =
      this.configService.get<string>('JWT_EXPIRES_IN') ?? '30d';
    const expiresInMs = ms(jwtExpiresIn);
    const expiresIn = new Date(Date.now() + expiresInMs);

    const location = await getLocationFromIp(dto?.ip);

    if (dto?.user) dto.user = new Types.ObjectId(dto.user);
    const ip = this.generateFakeIp();
    let session = await this.sessionModel.findOne({
      user: dto.user,
      ip: dto.ip,
      userAgent: dto.userAgent,
      status: ActivationStatus.ACTIVE,
    });

    if (session) {
      session.expiresIn = expiresIn;
      session.lastUsedAt = new Date();
      session.location = location;
      await session.save();
    } else {
      session = await this.sessionModel.create({
        user: dto?.user,
        // ip: dto?.ip || '',
        ip: '0.0.0.0',
        userAgent: dto?.userAgent,
        expiresIn,
        location,
        lastUsedAt: new Date(),
        deviceId: 'unknown',
        status: ActivationStatus.ACTIVE,
      });
    }
    return session;
  }

  public async updateOne({ query, dto }) {
    if (dto?.user) dto.user = new Types.ObjectId(dto.user);
    return this.sessionModel.findOneAndUpdate(query, dto, { new: true });
  }

  public async deleteOne({ query }) {
    return this.sessionModel.findOneAndDelete(query, { new: true });
  }

  public async validateSession({ sessionId, userId }) {
    if (!sessionId) return null;

    const session = await this.sessionModel.findOne({
      _id: sessionId,
      user: userId,
      status: ActivationStatus.ACTIVE,
    });

    const isMatch = sessionId === session?._id?.toString();
    if (isMatch) return session;

    return null;
  }
}
