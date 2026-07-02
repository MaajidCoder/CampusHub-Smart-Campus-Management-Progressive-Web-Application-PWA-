import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'student' | 'faculty' | 'admin';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  department?: Schema.Types.ObjectId;
  semester?: number; // Only relevant for students
  phone?: string;
  avatar?: string;
  isApproved: boolean; // Especially for faculty/marketplace listings
  isEmailVerified: boolean;
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  emailVerificationToken?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default in queries
    },
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
      default: 'student',
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    semester: {
      type: Number,
      min: [1, 'Semester must be at least 1'],
      max: [8, 'Semester cannot exceed 8'],
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    emailVerificationToken: String,
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password || '');
};

export const User = model<IUser>('User', userSchema);
