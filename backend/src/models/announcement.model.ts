import { Schema, model, Document } from 'mongoose';

export type AnnouncementCategory = 'general' | 'academic' | 'exam' | 'event' | 'placement';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  category: AnnouncementCategory;
  author: Schema.Types.ObjectId;
  department?: Schema.Types.ObjectId; // Optional - targets a specific dept
  isPinned: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['general', 'academic', 'exam', 'event', 'placement'],
      default: 'general',
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Announcement = model<IAnnouncement>('Announcement', announcementSchema);
