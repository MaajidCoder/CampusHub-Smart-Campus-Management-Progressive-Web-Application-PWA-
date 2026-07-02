import { Schema, model, Document } from 'mongoose';

export type ApplicationStatus = 'applied' | 'shortlisted' | 'technical_round' | 'interview' | 'selected' | 'rejected';

export interface IApplication extends Document {
  job: Schema.Types.ObjectId;
  student: Schema.Types.ObjectId;
  resumeUrl: string;
  resumePublicId: string;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job reference is required'],
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student applicant reference is required'],
    },
    resumeUrl: {
      type: String,
      required: [true, 'Resume document URL is required'],
    },
    resumePublicId: {
      type: String,
      required: [true, 'Resume document public ID is required'],
    },
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'technical_round', 'interview', 'selected', 'rejected'],
      default: 'applied',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent a student from applying to the same job multiple times
applicationSchema.index({ job: 1, student: 1 }, { unique: true });

export const Application = model<IApplication>('Application', applicationSchema);
