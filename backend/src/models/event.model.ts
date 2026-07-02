import { Schema, model, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  date: Date;
  time?: string;
  location: string;
  facultyOrganizer: Schema.Types.ObjectId;
  registrations: Schema.Types.ObjectId[]; // Array of student user IDs
  imageUrl?: string;
  imagePublicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    time: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Event location is required'],
      trim: true,
    },
    facultyOrganizer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty organizer is required'],
    },
    registrations: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    imageUrl: {
      type: String,
    },
    imagePublicId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Event = model<IEvent>('Event', eventSchema);
