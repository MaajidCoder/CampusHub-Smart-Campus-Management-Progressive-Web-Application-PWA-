import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Subject } from '../models/subject.model';
import { User } from '../models/user.model';
import { Department } from '../models/department.model'; // Import to register schema

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/campushub';

const checkSubjects = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Force model registration
    console.log(`Registered model: ${Department.modelName}`);

    const faculty = await User.findOne({ email: 'maajidfaculty@gmail.com' });
    if (!faculty) {
      console.log('Faculty user not found');
      process.exit(0);
    }

    const subjects = await Subject.find({ faculty: faculty._id }).populate('department');
    console.log(`Found ${subjects.length} subjects for Maajid:`);
    
    subjects.forEach((subj) => {
      console.log({
        id: subj._id,
        name: subj.name,
        code: subj.code,
        department: subj.department,
        semester: subj.semester
      });
    });

    process.exit(0);
  } catch (error) {
    console.error('Error checking subjects:', error);
    process.exit(1);
  }
};

checkSubjects();
