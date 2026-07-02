import { Request, Response, NextFunction } from 'express';
import { Note } from '../models/note.model';
import { uploadFile, deleteFile } from '../services/cloudinary.service';
import { AppError } from '../utils/appError';

export const getAllNotes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { department, semester, subject, search } = req.query;

    const queryObj: any = {};

    if (department) {
      queryObj.department = department;
    }
    if (semester) {
      queryObj.semester = Number(semester);
    }
    if (subject) {
      queryObj.subject = { $regex: subject, $options: 'i' };
    }
    if (search) {
      queryObj.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const notes = await Note.find(queryObj)
      .populate('uploadedBy', 'name role avatar')
      .populate('department', 'name code')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: notes.length,
      data: notes,
    });
  } catch (error) {
    next(error);
  }
};

export const createNote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description, subject, department, semester } = req.body;

    if (!req.file) {
      next(new AppError('Please select a PDF file to upload.', 400));
      return;
    }

    // Upload note PDF using media upload service
    const uploadResult = await uploadFile(req.file.buffer, 'notes', req.file.originalname);

    const note = await Note.create({
      title,
      description,
      subject,
      department,
      semester: Number(semester),
      fileUrl: uploadResult.secure_url,
      filePublicId: uploadResult.public_id,
      uploadedBy: req.user!.id,
    });

    await note.populate([
      { path: 'uploadedBy', select: 'name role avatar' },
      { path: 'department', select: 'name code' }
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Study note uploaded successfully!',
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);

    if (!note) {
      next(new AppError('No note found with that ID', 404));
      return;
    }

    // Verify ownership (uploader) or admin status
    if (note.uploadedBy.toString() !== req.user!.id && req.user!.role !== 'admin') {
      next(new AppError('You do not have permission to delete this note.', 403));
      return;
    }

    // Delete file from Cloudinary/local filesystem
    if (note.filePublicId) {
      await deleteFile(note.filePublicId);
    }

    await Note.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Note deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const incrementDownload = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const note = await Note.findByIdAndUpdate(
      id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );

    if (!note) {
      next(new AppError('No note found with that ID', 404));
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { downloads: note.downloadCount },
    });
  } catch (error) {
    next(error);
  }
};
