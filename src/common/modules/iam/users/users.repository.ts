import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserType } from '../../../types/enums';
import { FindManyProps, FindOneProps } from '../../../types/interfaces';
import { aggregateQuery } from '../../data-access/aggregate-query';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  public async findAll({ query, options }) {
    return aggregateQuery({
      query,
      options: {
        model: this.userModel,
        ...options,
      },
    });
  }

  public async findMany({ query, sort, select }: FindManyProps) {
    if (query?.space) query.space = new Types.ObjectId(query.space);
    if (query?.user) query.user = new Types.ObjectId(query.user);
    let base = this.userModel.find(query);
    if (sort) base.sort(sort);
    if (select) base.select(select);
    return await base.lean().exec();
  }

  public async findStatics({ pipelines }) {
    return this.userModel.aggregate(pipelines);
  }

  public async findOne({ query, select, populate }: FindOneProps) {
    const item = this.userModel.findOne(query);
    if (select) item.select(select);
    if (populate) item.populate(populate);

    const result = await item.exec();
    return result;
  }

  public async createOne({ dto }) {
    const hasPassword = await bcrypt.hash(dto.password, 10);
    const userType =
      dto.userType === UserType.ADMIN ? UserType.STAFF : dto.userType;

    if (dto?.roles) {
      dto.roles = dto?.roles?.map((r) => new Types.ObjectId(r));
    }
    await this.userModel.create({
      ...dto,
      userType,
      password: hasPassword,
      profileColor: this.getRandomColor(),
    });
    return {
      ...dto,
      userType,
      profileColor: this.getRandomColor(),
    };
  }

  public async updateOne({ query, dto }) {
    if (dto.password) {
      const hashPassword = await bcrypt.hash(dto.password, 10);
      dto.password = hashPassword;
    }
    if (dto?.roles) {
      dto.roles = dto?.roles?.map((r) => new Types.ObjectId(r));
    }
    await this.userModel.findOneAndUpdate(query, dto, {
      new: true,
    });
    return dto;
  }

  public async deleteOne({ query }) {
    const user = await this.userModel.findOneAndDelete(query, { new: true });
    return user;
  }

  public colors: string[] = [
    '#FF6B6B',
    '#FF9F43',
    '#FECA57',
    '#48DBFB',
    '#0ABDE3',
    '#10AC84',
    '#EE5A24',
    '#5F27CD',
    '#341F97',
    '#FF6FB7',
    '#8395A7',
    '#222F3E',
  ];

  public getRandomColor(): string {
    const randomIndex = Math.floor(Math.random() * this.colors.length);
    return this.colors[randomIndex];
  }
}
