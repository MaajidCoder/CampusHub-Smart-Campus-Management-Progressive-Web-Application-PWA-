import { Request, Response, NextFunction } from 'express';
import { Job } from '../models/job.model';
import { Application } from '../models/application.model';
import { uploadFile, deleteFile } from '../services/cloudinary.service';
import { AppError } from '../utils/appError';
import { socketService } from '../services/socket.service';

export const getAllJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const jobs = await Job.find()
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: jobs.length,
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

export const createJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { company, title, description, ctc, location, eligibility, deadline } = req.body;

    const job = await Job.create({
      company,
      title,
      description,
      ctc,
      location,
      eligibility,
      deadline: new Date(deadline),
      postedBy: req.user!.id,
    });

    // Broadcast job posting notification globally to everyone
    socketService.emitGlobal('new-placement-job', {
      id: job._id,
      company: job.company,
      title: job.title,
      ctc: job.ctc,
    });

    res.status(201).json({
      status: 'success',
      message: 'Job posting published successfully!',
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);

    if (!job) {
      next(new AppError('No job opening found with that ID', 404));
      return;
    }

    // TPO/Admin check
    if (req.user!.role !== 'admin' && job.postedBy.toString() !== req.user!.id) {
      next(new AppError('You do not have permission to delete this posting.', 403));
      return;
    }

    // Clean up applications and resume files associated with this job
    const applications = await Application.find({ job: id });
    await Promise.all(
      applications.map(async (app) => {
        if (app.resumePublicId) {
          await deleteFile(app.resumePublicId);
        }
      })
    );

    await Application.deleteMany({ job: id });
    await Job.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Job opening and associated applications deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const applyToJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params; // jobId
    const { contactDetails } = req.body;

    const job = await Job.findById(id);
    if (!job) {
      next(new AppError('No job opening found with that ID', 404));
      return;
    }

    // Validate deadline
    if (new Date(job.deadline).getTime() < Date.now()) {
      next(new AppError('The deadline to apply to this job has already passed.', 400));
      return;
    }

    // Check if already applied
    const existingApplication = await Application.findOne({ job: id, student: req.user!.id });
    if (existingApplication) {
      next(new AppError('You have already applied for this position.', 400));
      return;
    }

    // Verify PDF uploader exists
    if (!req.file) {
      next(new AppError('Resume PDF file attachment is required.', 400));
      return;
    }

    // Upload Resume PDF
    const uploadResult = await uploadFile(req.file.buffer, 'resumes', req.file.originalname);

    const application = await Application.create({
      job: id,
      student: req.user!.id,
      resumeUrl: uploadResult.secure_url,
      resumePublicId: uploadResult.public_id,
      status: 'applied',
    });

    res.status(201).json({
      status: 'success',
      message: 'Application submitted successfully!',
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyApplications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const applications = await Application.find({ student: req.user!.id })
      .populate({
        path: 'job',
        select: 'company title ctc location deadline eligibility',
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: applications.length,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

export const getJobApplicants = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params; // jobId

    const job = await Job.findById(id);
    if (!job) {
      next(new AppError('No job opening found with that ID', 404));
      return;
    }

    // Restrict applicant review to Admins/TPOs
    if (req.user!.role !== 'admin' && job.postedBy.toString() !== req.user!.id) {
      next(new AppError('You do not have permission to view applicants for this job.', 403));
      return;
    }

    const applicants = await Application.find({ job: id })
      .populate('student', 'name email avatar semester department')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: applicants.length,
      data: applicants,
    });
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params; // applicationId
    const { status } = req.body; // 'shortlisted' | 'technical_round' | 'interview' | 'selected' | 'rejected'

    const application = await Application.findById(id).populate('job');
    if (!application) {
      next(new AppError('No application found with that ID', 404));
      return;
    }

    // TPO/Admin check
    const job = application.job as any;
    if (req.user!.role !== 'admin' && job.postedBy.toString() !== req.user!.id) {
      next(new AppError('You do not have permission to update candidate status.', 403));
      return;
    }

    application.status = status;
    await application.save();

    res.status(200).json({
      status: 'success',
      message: `Applicant status advanced to ${status}!`,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};
