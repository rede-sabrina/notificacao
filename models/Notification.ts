import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  title: string;
  message: string;
  recipients: string[];
  recurring?: boolean;
  dayOfMonth?: number;
  sendDate?: Date;
  active?: boolean;
  lastSent?: Date;
}

const NotificationSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    recipients: { type: [String], required: true },
    recurring: { type: Boolean, default: false },
    dayOfMonth: { type: Number },
    sendDate: { type: Date },
    active: { type: Boolean, default: true },
    lastSent: { type: Date }
  },
  { timestamps: true }
);

export default (mongoose.models.Notification as mongoose.Model<INotification>) || mongoose.model<INotification>('Notification', NotificationSchema);
