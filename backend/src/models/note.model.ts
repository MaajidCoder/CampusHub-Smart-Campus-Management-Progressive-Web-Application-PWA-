import { Schema, model, Document } from 'mongoose';

export interface INote extends Document {
  title: string;
  description?: string;
  subject: string;
  department: Schema.Types.ObjectId;
  semester: number;
  fileUrl: string;
  filePublicId?: string; // Cloudinary identifier (null if using local fallback)
  uploadedBy: Schema.Types.ObjectId;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 8,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    filePublicId: {
      type: String,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader is required'],
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Note = model<INote>('Note', noteSchema);
