import { Request, Response, NextFunction } from 'express';
import { Announcement } from '../models/announcement.model';
import { AppError } from '../utils/appError';
import { socketService } from '../services/socket.service';

export const getAllAnnouncements = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category, department, isPinned } = req.query;

    const queryObj: any = {};

    // Filter by category if provided
    if (category) {
      queryObj.category = category;
    }

    // Filter by department if provided (allow general/null department announcements for everyone)
    if (department) {
      queryObj.$or = [
        { department: department },
        { department: { $exists: false } },
        { department: null },
      ];
    }

    if (isPinned) {
      queryObj.isPinned = isPinned === 'true';
    }

    // Execute query, sorting by:
    // 1. isPinned (descending, true first)
    // 2. createdAt (descending, newest first)
    const announcements = await Announcement.find(queryObj)
      .populate('author', 'name role avatar')
      .populate('department', 'name code')
      .sort({ isPinned: -1, createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: announcements.length,
      data: announcements,
    });
  } catch (error) {
    next(error);
  }
};

export const createAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, content, category, department, isPinned, expiresAt } = req.body;

    const announcement = await Announcement.create({
      title,
      content,
      category,
      department: department || undefined,
      author: req.user!.id,
      isPinned: isPinned || false,
      expiresAt: expiresAt || undefined,
    });

    await announcement.populate([
      { path: 'author', select: 'name role avatar' },
      { path: 'department', select: 'name code' }
    ]);

    // Broadcast announcement notification to all active clients
    socketService.emitGlobal('new-announcement', {
      id: announcement._id,
      title: announcement.title,
      category: announcement.category,
      departmentCode: (announcement.department as any)?.code || 'Global',
    });

    res.status(201).json({
      status: 'success',
      message: 'Announcement posted successfully',
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, category, department, isPinned, expiresAt } = req.body;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      next(new AppError('No announcement found with that ID', 404));
      return;
    }

    // Verify authorship or admin role
    if (announcement.author.toString() !== req.user!.id && req.user!.role !== 'admin') {
      next(new AppError('You do not have permission to edit this announcement.', 403));
      return;
    }

    const updated = await Announcement.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(title && { title }),
          ...(content && { content }),
          ...(category && { category }),
          department: department === '' ? null : department || announcement.department,
          ...(isPinned !== undefined && { isPinned }),
          ...(expiresAt !== undefined && { expiresAt }),
        },
      },
      { new: true, runValidators: true }
    )
      .populate('author', 'name role avatar')
      .populate('department', 'name code');

    res.status(200).json({
      status: 'success',
      message: 'Announcement updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);

    if (!announcement) {
      next(new AppError('No announcement found with that ID', 404));
      return;
    }

    // Verify authorship or admin role
    if (announcement.author.toString() !== req.user!.id && req.user!.role !== 'admin') {
      next(new AppError('You do not have permission to delete this announcement.', 403));
      return;
    }

    await Announcement.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
