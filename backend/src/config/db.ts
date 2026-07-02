import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { Department } from '../models/department.model';
import { User } from '../models/user.model';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/campushub';

const seedDepartments = async (): Promise<void> => {
  try {
    // Always delete and re-seed to ensure the latest department list is in sync
    await Department.deleteMany({});
    const depts = [
      { name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of CSE' },
      { name: 'Electronics & Communication Engineering', code: 'ECE', description: 'Department of ECE' },
      { name: 'Electrical & Electronics Engineering', code: 'EEE', description: 'Department of EEE' },
      { name: 'Information Technology', code: 'IT', description: 'Department of IT' },
      { name: 'Computer Science & Business Systems', code: 'CSBS', description: 'Department of CSBS' },
      { name: 'Mechanical Engineering', code: 'MECH', description: 'Department of MECH' },
      { name: 'Artificial Intelligence & Data Science', code: 'AIDS', description: 'Department of AIDS' },
    ];
    await Department.insertMany(depts);
    console.log('[Database] Seeded campus departments successfully.');
  } catch (err) {
    console.error(`[Database] Seeding departments failed: ${(err as Error).message}`);
  }
};

const seedAdmin = async (): Promise<void> => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'System Administrator',
        email: 'admin@campushub.edu',
        password: 'adminpassword123', // Encrypted pre-save
        role: 'admin',
        isApproved: true,
        isEmailVerified: true,
      });
      console.log('[Database] Default admin seeded successfully: admin@campushub.edu / adminpassword123');
    }
  } catch (err) {
    console.error(`[Database] Seeding admin failed: ${(err as Error).message}`);
  }
};

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    
    // Seed default departments if database is empty
    await seedDepartments();
    // Seed default admin if no admin exists
    await seedAdmin();
  } catch (error) {
    console.error(`[Database] Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('[Database] MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`[Database] MongoDB connection error: ${err}`);
});
