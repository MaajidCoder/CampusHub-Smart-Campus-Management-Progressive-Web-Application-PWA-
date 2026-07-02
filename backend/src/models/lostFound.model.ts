import { Schema, model, Document } from 'mongoose';

export type LostFoundStatus = 'lost' | 'found' | 'claimed';

export interface ILostFound extends Document {
  title: string;
  description: string;
  status: LostFoundStatus;
  location?: string;
  dateLostFound?: Date;
  imageUrl?: string;
  imagePublicId?: string;
  reportedBy: Schema.Types.ObjectId;
  contactDetails: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const lostFoundSchema = new Schema<ILostFound>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['lost', 'found', 'claimed'],
      required: [true, 'Status is required'],
    },
    location: {
      type: String,
      trim: true,
    },
    dateLostFound: {
      type: Date,
      default: Date.now,
    },
    imageUrl: {
      type: String,
    },
    imagePublicId: {
      type: String,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
    },
    contactDetails: {
      type: String,
      required: [true, 'Contact details are required'],
      trim: true,
    },
    isApproved: {
      type: Boolean,
      default: true, // Default to true, allow admins to moderate
    },
  },
  {
    timestamps: true,
  }
);

export const LostFound = model<ILostFound>('LostFound', lostFoundSchema);
