import { InjectModel } from '@nestjs/mongoose';
import { Contact } from './contact.schema';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { aggregateQuery } from '../../data-access/aggregate-query';
import { CreateOneProps, FindOneProps } from '../../../types/interfaces';

@Injectable()
export class ContactsRepository {
  constructor(
    @InjectModel(Contact.name) private readonly contactModel: Model<Contact>,
  ) {}

  public async findAll({ query, options }) {
    return aggregateQuery({
      query,
      options: {
        model: this.contactModel,
        ...options,
      },
    });
  }

  public async findOne({ query, populate, select }: FindOneProps) {
    const base = this.contactModel.findOne(query);
    if (select) base.select(select);
    if (populate) base.populate(populate);
    const contact = await base;
    return contact;
  }

  public async createOne({ dto, populate }: CreateOneProps) {
    if (dto?.contact) dto.contact = new Types.ObjectId(dto.contact);
    if (dto?.me) dto.me = new Types.ObjectId(dto.me);

    let query = this.contactModel.create(dto);

    const doc = await query;

    if (populate?.length) {
      await doc.populate(populate);
    }

    return doc;
  }

  public async updateOne({ query, dto }) {
    if (dto?.contact) dto.contact = new Types.ObjectId(dto?.contact);
    if (dto?.me) dto.me = new Types.ObjectId(dto?.me);
    return this.contactModel.findOneAndUpdate(query, dto, { new: true });
  }

  public async deleteOne({ query }) {
    return this.contactModel.findOneAndDelete(query);
  }
}
