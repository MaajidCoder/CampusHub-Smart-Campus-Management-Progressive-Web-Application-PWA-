import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { Subject } from '../models/subject.model';
import { Attendance } from '../models/attendance.model';
import { QRSession } from '../models/qrSession.model';
import { User } from '../models/user.model';
import { AppError } from '../utils/appError';
import { socketService } from '../services/socket.service';

// Helper to compute spatial distance in meters using the Haversine formula
const calculateHaversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const phi1 = lat1 * rad;
  const phi2 = lat2 * rad;
  const deltaPhi = (lat2 - lat1) * rad;
  const deltaLambda = (lon2 - lon1) * rad;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export const getStudentStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const studentId = req.user!.id;

    // Find all subjects for student's department and semester
    const subjects = await Subject.find({
      department: req.user!.department,
      semester: req.user!.semester,
    }).populate('faculty', 'name');

    const stats = await Promise.all(
      subjects.map(async (subj) => {
        const total = await Attendance.countDocuments({
          student: studentId,
          subject: subj._id,
        });

        const present = await Attendance.countDocuments({
          student: studentId,
          subject: subj._id,
          status: 'present',
        });

        const percentage = total > 0 ? Math.round((present / total) * 100) : 100;

        return {
          subjectId: subj._id,
          subjectName: subj.name,
          subjectCode: subj.code,
          facultyName: (subj.faculty as any).name,
          totalClasses: total,
          presentClasses: present,
          percentage,
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getSubjectAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { subjectId } = req.params;
    const { date } = req.query;

    const queryObj: any = { subject: subjectId };

    if (date) {
      queryObj.date = date;
    }

    // Students can only see their own attendance record for the course
    if (req.user!.role === 'student') {
      queryObj.student = req.user!.id;
    }

    const records = await Attendance.find(queryObj)
      .populate('student', 'name email semester avatar')
      .sort({ date: -1 });

    res.status(200).json({
      status: 'success',
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

export const markAttendanceBulk = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { subjectId, date, records } = req.body; // records: [{studentId: string, status: 'present'|'absent'}]

    // Verify subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      next(new AppError('No subject found with that ID', 404));
      return;
    }

    // Faculty member verification
    if (subject.faculty.toString() !== req.user!.id && req.user!.role !== 'admin') {
      next(new AppError('You do not have permission to mark attendance for this subject', 403));
      return;
    }

    // Bulk write/upsert records
    await Promise.all(
      records.map((rec: { studentId: string; status: 'present' | 'absent' }) => {
        return Attendance.findOneAndUpdate(
          {
            student: rec.studentId,
            subject: subjectId,
            date: date, // e.g., '2026-07-02'
          },
          {
            $set: {
              status: rec.status,
              method: 'manual',
              markedBy: req.user!.id,
            },
          },
          { upsert: true, new: true, runValidators: true }
        );
      })
    );

    res.status(200).json({
      status: 'success',
      message: 'Attendance record submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const createQRSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { subjectId, latitude, longitude, radius } = req.body;

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      next(new AppError('No subject found with that ID', 404));
      return;
    }

    // Verify faculty ownership
    if (subject.faculty.toString() !== req.user!.id && req.user!.role !== 'admin') {
      next(new AppError('You do not have permission to create sessions for this course.', 403));
      return;
    }

    // Generate random secure token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set decay expiration to 30 seconds
    const expiresAt = new Date(Date.now() + 30 * 1000);

    // Save session
    const session = await QRSession.create({
      subject: subjectId,
      faculty: req.user!.id,
      token,
      latitude,
      longitude,
      radius: radius || 30, // Default 30 meters
      expiresAt,
    });

    // Generate Base64 QR Image Data URI containing the frontend check-in URL
    const checkinUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/attendance?token=${token}`;
    const qrDataUrl = await QRCode.toDataURL(checkinUrl);

    res.status(201).json({
      status: 'success',
      data: {
        token: session.token,
        qrDataUrl,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const qrCheckin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, latitude, longitude } = req.body;

    // Find the session in DB
    const session = await QRSession.findOne({ token, isActive: true });
    
    if (!session || session.expiresAt.getTime() < Date.now()) {
      next(new AppError('This QR Code has expired. Please ask the instructor to refresh the code.', 400));
      return;
    }

    // Geofencing verification
    const distance = calculateHaversineDistance(
      latitude,
      longitude,
      session.latitude,
      session.longitude
    );

    if (distance > session.radius) {
      next(
        new AppError(
          `Geofencing check failed. You are physically located too far away (${Math.round(
            distance
          )}m) from the classroom coordinates.`,
          400
        )
      );
      return;
    }

    // Marked date
    const todayStr = new Date().toISOString().split('T')[0];

    // Upsert record to prevent double checking-in on the same day
    await Attendance.findOneAndUpdate(
      {
        student: req.user!.id,
        subject: session.subject,
        date: todayStr,
      },
      {
        $set: {
          status: 'present',
          method: 'qr',
          markedBy: session.faculty,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Broadcast check-in event to the instructor's subject session room
    socketService.emitToSubject(session.subject.toString(), 'student-checked-in', {
      studentId: req.user!.id,
      studentName: req.user!.name,
    });

    res.status(201).json({
      status: 'success',
      message: 'Attendance check-in verified successfully!',
    });
  } catch (error) {
    next(error);
  }
};
