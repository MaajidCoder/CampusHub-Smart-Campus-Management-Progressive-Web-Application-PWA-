import { Schema, model, Document } from 'mongoose';

export type AttendanceStatus = 'present' | 'absent';
export type AttendanceMethod = 'manual' | 'qr';

export interface IAttendance extends Document {
  student: Schema.Types.ObjectId;
  subject: Schema.Types.ObjectId;
  date: string; // Stored in YYYY-MM-DD format for precise daily queries
  status: AttendanceStatus;
  method: AttendanceMethod;
  markedBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ref is required'],
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject ref is required'],
    },
    date: {
      type: String,
      required: [true, 'Attendance date string is required (YYYY-MM-DD)'],
    },
    status: {
      type: String,
      enum: ['present', 'absent'],
      default: 'present',
    },
    method: {
      type: String,
      enum: ['manual', 'qr'],
      default: 'manual',
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Marked by faculty ref is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Form compound index to prevent duplicate attendance entry for a student on the same subject on the same day!
attendanceSchema.index({ student: 1, subject: 1, date: 1 }, { unique: true });

export const Attendance = model<IAttendance>('Attendance', attendanceSchema);
