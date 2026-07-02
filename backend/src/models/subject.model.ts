import { Schema, model, Document } from 'mongoose';

export interface ISubject extends Document {
  name: string;
  code: string;
  department: Schema.Types.ObjectId;
  faculty: Schema.Types.ObjectId; // Professor teaching the course
  semester: number; // Semester (1-8)
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    faculty: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty member is required'],
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be at least 1'],
      max: [8, 'Semester cannot exceed 8'],
    },
  },
  {
    timestamps: true,
  }
);

export const Subject = model<ISubject>('Subject', subjectSchema);
