import { InjectModel } from '@nestjs/mongoose';
import { Call } from './schemas/call.schema';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { aggregateQuery } from '../../data-access/aggregate-query';
import {
  CreateOneProps,
  FindOneProps,
  UpdateOneProps,
} from '../../../types/interfaces';

const CALLER_RECEIVER_POPULATE = [
  { path: 'caller', select: 'name avatar profileColor' },
  { path: 'receiver', select: 'name avatar profileColor' },
  { path: 'space', select: 'name avatar profileColor type settings.call' },
];

@Injectable()
export class CallsRepository {
  constructor(
    @InjectModel(Call.name) private readonly callModel: Model<Call>,
  ) {}

  public async findAll({ query, options }) {
    return aggregateQuery({
      query,
      options: {
        model: this.callModel,
        ...options,
      },
    });
  }
  public async count({ query }: { query: any }) {
    return this.callModel.countDocuments(query);
  }

  public async aggregate({ pipeline }: { pipeline: any[] }) {
    return this.callModel.aggregate(pipeline);
  }
  public async findOne({ query, populate, select, sort }: FindOneProps) {
    const base = this.callModel.findOne(query);
    if (select) base.select(select);
    if (sort) base.sort(sort);
    base.populate(populate ?? CALLER_RECEIVER_POPULATE);
    return await base.lean({ virtuals: true }).exec();
  }

  public async createOne({ dto, populate }: CreateOneProps) {
    if (dto.caller) dto.caller = new Types.ObjectId(dto.caller);
    if (dto.receiver) dto.receiver = new Types.ObjectId(dto.receiver);
    if (dto.space) dto.space = new Types.ObjectId(dto.space);
    if (dto.createdBy) dto.createdBy = new Types.ObjectId(dto.createdBy);
    if (dto.endedBy) dto.endedBy = new Types.ObjectId(dto.endedBy);

    const doc = await this.callModel.create(dto);
    await doc.populate(populate ?? CALLER_RECEIVER_POPULATE);

    return doc.toObject({ virtuals: true });
  }

  public async updateOne({ query, dto, populate }: UpdateOneProps) {
    if (dto.caller) dto.caller = new Types.ObjectId(dto.caller);
    if (dto.receiver) dto.receiver = new Types.ObjectId(dto.receiver);
    if (dto.space) dto.space = new Types.ObjectId(dto.space);
    if (dto.createdBy) dto.createdBy = new Types.ObjectId(dto.createdBy);
    if (dto.endedBy) dto.endedBy = new Types.ObjectId(dto.endedBy);

    return this.callModel
      .findOneAndUpdate(query, dto, { new: true })
      .populate(populate ?? CALLER_RECEIVER_POPULATE)
      .lean({ virtuals: true })
      .exec();
  }

  public async deleteOne({ query }) {
    return this.callModel.findOneAndDelete(query);
  }

  public toPersonInfo = (user: any) => {
    if (!user) return undefined;
    return {
      id: user._id?.toString() ?? user.id,
      name: user.name,
      avatar: user.avatar,
      profileColor: user.profileColor,
      bio: user.bio,
    };
  };

  public toSpaceInfo = (space: any) => {
    if (!space) return undefined;
    return {
      id: space._id?.toString() ?? space.id,
      name: space.name,
      avatar: space.avatar,
      profileColor: space.profileColor,
      type: space.type,
      settings: space.settings?.call,
    };
  };

  public toCallResponse = (call: any) => {
    if (!call) return call;

    return {
      ...call,
      id: call?._id?.toString() ?? call?.id,
      caller: call?.caller?._id?.toString() ?? call?.caller?.toString(),
      receiver: call?.receiver?._id?.toString() ?? call?.receiver?.toString(),
      space: call?.space?._id?.toString() ?? call?.space?.toString(),
      callerUser: this.toPersonInfo(call?.caller),
      receiverUser: this.toPersonInfo(call?.receiver),
      spaceInfo: this.toSpaceInfo(call?.space),
    };
  };

  public toParticipantResponse = (participant: any) => {
    if (!participant) return participant;

    return {
      ...participant,
      id: participant._id?.toString() ?? participant.id,
      user: participant.user?._id?.toString() ?? participant.user?.toString(),
      call: participant.call?.toString(),
      space: participant.space?.toString(),
      userInfo: this.toPersonInfo(participant.user),
      memberRole: participant.member?.role,
      memberPermissions: participant.member?.permissions,
      adminTag: participant.member?.adminTag,
      adminTagColor: participant.member?.adminTagColor,
    };
  };
}
