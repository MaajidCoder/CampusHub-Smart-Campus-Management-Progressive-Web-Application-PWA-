import { Schema, model, Document } from 'mongoose';

export interface IQRSession extends Document {
  subject: Schema.Types.ObjectId;
  faculty: Schema.Types.ObjectId;
  token: string;
  latitude: number;
  longitude: number;
  radius: number; // geofence radius in meters (default: 30m)
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
}

const qrSessionSchema = new Schema<IQRSession>(
  {
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject ref is required'],
    },
    faculty: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty ref is required'],
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Classroom latitude coordinate is required'],
    },
    longitude: {
      type: Number,
      required: [true, 'Classroom longitude coordinate is required'],
    },
    radius: {
      type: Number,
      default: 30, // 30 meters default geofence allowance
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically remove expired QR sessions from DB after they expire
qrSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const QRSession = model<IQRSession>('QRSession', qrSessionSchema);
