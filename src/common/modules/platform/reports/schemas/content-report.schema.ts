import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  ReportType,
  ReportStatus,
  ReportReason,
} from '../../../../types/enums';

export type ContentReportDocument = HydratedDocument<ContentReport>;

@Schema({ timestamps: true })
export class ContentReport {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  reporter: Types.ObjectId;

  @Prop({ type: String, enum: ReportType, required: true, index: true })
  targetType: ReportType;

  @Prop({
    type: Types.ObjectId,
    refPath: 'targetType',
    required: true,
    index: true,
  })
  targetId: Types.ObjectId;

  @Prop({ type: String, enum: ReportReason, required: true })
  reason: ReportReason;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: [String], default: [] })
  evidenceFiles?: string[];

  @Prop({
    type: String,
    enum: ReportStatus,
    default: ReportStatus.PENDING,
    index: true,
  })
  status: ReportStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  resolvedBy?: Types.ObjectId;

  @Prop({ type: String, trim: true })
  resolutionNotes?: string;

  @Prop({ type: Date })
  resolvedAt?: Date;

  @Prop({ type: Boolean, default: false })
  isActionTaken?: boolean;

  @Prop({ type: String, trim: true })
  actionTaken?: string;
}

export const ContentReportSchema = SchemaFactory.createForClass(ContentReport);

ContentReportSchema.index({ reporter: 1, createdAt: -1 });
ContentReportSchema.index({ targetType: 1, targetId: 1 });
ContentReportSchema.index({ status: 1, createdAt: -1 });
ContentReportSchema.index({ reason: 1 });
ContentReportSchema.index({ reporter: 1, targetId: 1 }, { unique: true });
