import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/user.model';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/campushub';

const approveFaculty = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[Approve Script] Connected to MongoDB successfully.');

    const email = 'maajidfaculty@gmail.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`[Approve Script] User with email ${email} not found.`);
      process.exit(0);
    }

    user.isApproved = true;
    await user.save();

    console.log(`[Approve Script] Successfully approved faculty user: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('[Approve Script] Error approving user:', error);
    process.exit(1);
  }
};

approveFaculty();
