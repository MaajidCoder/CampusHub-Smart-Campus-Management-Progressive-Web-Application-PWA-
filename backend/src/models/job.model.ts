import { Schema, model, Document } from 'mongoose';

export interface IJob extends Document {
  company: string;
  title: string;
  description: string;
  ctc: string; // CTC details (e.g. "12 LPA", "45k/month")
  location: string;
  eligibility: string; // Eligibility details (e.g. "CGPA >= 7.5, CSE only")
  deadline: Date;
  postedBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Job position title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
    },
    ctc: {
      type: String,
      required: [true, 'CTC package details are required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Job location details are required'],
      trim: true,
    },
    eligibility: {
      type: String,
      required: [true, 'Eligibility criteria information is required'],
      trim: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Application submission deadline is required'],
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'TPO reference ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

export const Job = model<IJob>('Job', jobSchema);
