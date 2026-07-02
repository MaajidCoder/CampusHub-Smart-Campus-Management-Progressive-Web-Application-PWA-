import { Request, Response, NextFunction } from 'express';
import { Subject } from '../models/subject.model';
import { AppError } from '../utils/appError';

export const getAllSubjects = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const queryObj: any = {};

    // Dynamic role filtering:
    if (req.user!.role === 'student') {
      // Students only see subjects matching their department and semester
      queryObj.department = req.user!.department;
      queryObj.semester = req.user!.semester;
    } else if (req.user!.role === 'faculty') {
      // Faculty members see subjects they teach
      queryObj.faculty = req.user!.id;
    }

    // Admins can search everything, or apply manual department/semester filters
    const { department, semester } = req.query;
    if (department && req.user!.role === 'admin') {
      queryObj.department = department;
    }
    if (semester && req.user!.role === 'admin') {
      queryObj.semester = Number(semester);
    }

    const subjects = await Subject.find(queryObj)
      .populate('faculty', 'name email avatar')
      .populate('department', 'name code')
      .sort({ code: 1 });

    res.status(200).json({
      status: 'success',
      results: subjects.length,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
};

export const createSubject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, code, department, faculty, semester } = req.body;

    // Faculty default to themselves, Admin must provide faculty ID
    let assignedFaculty = req.user!.id;
    if (req.user!.role === 'admin') {
      if (!faculty) {
        next(new AppError('Faculty member reference ID is required', 400));
        return;
      }
      assignedFaculty = faculty;
    }

    const subject = await Subject.create({
      name,
      code: code.toUpperCase(),
      department,
      faculty: assignedFaculty,
      semester: Number(semester),
    });

    await subject.populate([
      { path: 'faculty', select: 'name email avatar' },
      { path: 'department', select: 'name code' }
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Subject created successfully',
      data: subject,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSubject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const subject = await Subject.findById(id);

    if (!subject) {
      next(new AppError('No subject found with that ID', 404));
      return;
    }

    await Subject.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Subject removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
