import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  IssueCategory,
  IssuePriority,
  IssueStatus,
} from '../../../../types/enums';

export type SystemIssueDocument = HydratedDocument<SystemIssue>;

@Schema({ timestamps: true })
export class SystemIssue {
  @Prop({ required: true, trim: true, index: 'text' })
  title: string;

  @Prop({ type: String, enum: IssueCategory, required: true, index: true })
  category: IssueCategory;

  @Prop({
    type: String,
    enum: IssuePriority,
    default: IssuePriority.MEDIUM,
    index: true,
  })
  priority: IssuePriority;

  @Prop({
    type: String,
    enum: IssueStatus,
    default: IssueStatus.OPEN,
    index: true,
  })
  status: IssueStatus;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  reportedBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  assignedTo?: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  attachments?: string[];

  @Prop({ type: String, trim: true })
  resolutionNotes?: string;

  @Prop({ type: Date })
  resolvedAt?: Date;

  @Prop({ type: Date })
  closedAt?: Date;

  @Prop({ type: Number, default: 0 })
  reopenCount: number;
}

export const SystemIssueSchema = SchemaFactory.createForClass(SystemIssue);

SystemIssueSchema.index({ status: 1, priority: -1, createdAt: -1 });
SystemIssueSchema.index({ category: 1, status: 1 });
SystemIssueSchema.index({ assignedTo: 1, status: 1 });
SystemIssueSchema.index({ reportedBy: 1, createdAt: -1 });
SystemIssueSchema.index({ title: 'text', description: 'text' });
