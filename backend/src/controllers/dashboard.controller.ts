import { Request, Response, NextFunction } from 'express';
import { Subject } from '../models/subject.model';
import { Attendance } from '../models/attendance.model';
import { Marketplace } from '../models/marketplace.model';
import { Event } from '../models/event.model';
import { User } from '../models/user.model';
import { Department } from '../models/department.model';
import { Announcement } from '../models/announcement.model';

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const role = req.user!.role;

    if (role === 'student') {
      const studentId = req.user!.id;

      // 1. Calculate average attendance across their subjects
      const totalClasses = await Attendance.countDocuments({ student: studentId });
      const presentClasses = await Attendance.countDocuments({ student: studentId, status: 'present' });
      const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 100;

      // 2. Count active listings
      const marketplaceCount = await Marketplace.countDocuments({ seller: studentId });

      // 3. Count RSVPs joined
      const eventCount = await Event.countDocuments({ registrations: studentId });

      // 4. Get recent 3 announcements
      const recentAnnouncements = await Announcement.find({
        $or: [
          { department: req.user!.department },
          { department: { $exists: false } },
          { department: null },
        ],
      })
        .populate('author', 'name role')
        .sort({ isPinned: -1, createdAt: -1 })
        .limit(3);

      res.status(200).json({
        status: 'success',
        data: {
          attendanceRate,
          marketplaceCount,
          eventCount,
          recentAnnouncements,
        },
      });
      return;
    }

    if (role === 'faculty') {
      const facultyId = req.user!.id;

      // 1. Fetch subjects taught
      const subjects = await Subject.find({ faculty: facultyId });
      
      // 2. Fetch total students enrolled in their classes (matching dept & semester)
      const criteria = subjects.map((sub) => ({
        department: sub.department,
        semester: sub.semester,
      }));

      const totalStudents =
        criteria.length > 0
          ? await User.countDocuments({ role: 'student', $or: criteria })
          : 0;

      // 3. Count events hosted
      const eventsCount = await Event.countDocuments({ facultyOrganizer: facultyId });

      // 4. Count total lectures marked/completed
      const checkinsCount = await Attendance.countDocuments({ markedBy: facultyId });

      res.status(200).json({
        status: 'success',
        data: {
          subjectsCount: subjects.length,
          totalStudents,
          eventsCount,
          checkinsCount,
        },
      });
      return;
    }

    if (role === 'admin') {
      // 1. Count students & faculty
      const studentCount = await User.countDocuments({ role: 'student' });
      const facultyCount = await User.countDocuments({ role: 'faculty' });
      const pendingFacultyCount = await User.countDocuments({ role: 'faculty', isApproved: false });

      // 2. Count pending approvals
      const pendingMarketplaceCount = await Marketplace.countDocuments({ status: 'pending' });

      // 3. Count departments
      const departmentCount = await Department.countDocuments();

      res.status(200).json({
        status: 'success',
        data: {
          studentCount,
          facultyCount,
          pendingFacultyCount,
          pendingMarketplaceCount,
          departmentCount,
        },
      });
      return;
    }

    res.status(400).json({
      status: 'fail',
      message: 'Unknown role context',
    });
  } catch (error) {
    next(error);
  }
};
