import { Request, Response, NextFunction } from 'express';
import { Event } from '../models/event.model';
import { uploadFile, deleteFile } from '../services/cloudinary.service';
import { AppError } from '../utils/appError';

export const getAllEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { registered, search } = req.query;

    const queryObj: any = {};

    // Filter to show only events the user is registered for
    if (registered === 'true') {
      queryObj.registrations = req.user!.id;
    }

    if (search) {
      queryObj.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    // Return events, sorting newest or upcoming first
    const events = await Event.find(queryObj)
      .populate('facultyOrganizer', 'name role email avatar')
      .sort({ date: 1 }); // Sort upcoming events first

    res.status(200).json({
      status: 'success',
      results: events.length,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description, date, time, location } = req.body;

    let imageUrl = '';
    let imagePublicId = '';

    // If banner cover image is uploaded
    if (req.file) {
      const uploadResult = await uploadFile(req.file.buffer, 'events', req.file.originalname);
      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    }

    const event = await Event.create({
      title,
      description,
      date: new Date(date),
      time,
      location,
      facultyOrganizer: req.user!.id,
      imageUrl: imageUrl || undefined,
      imagePublicId: imagePublicId || undefined,
    });

    await event.populate('facultyOrganizer', 'name role email avatar');

    res.status(201).json({
      status: 'success',
      message: 'Campus event published successfully!',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      next(new AppError('No event found with that ID', 404));
      return;
    }

    // Verify organizer or admin
    if (event.facultyOrganizer.toString() !== req.user!.id && req.user!.role !== 'admin') {
      next(new AppError('You do not have permission to cancel this event', 403));
      return;
    }

    // Delete image from host if exists
    if (event.imagePublicId) {
      await deleteFile(event.imagePublicId);
    }

    await Event.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const registerForEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const studentId = req.user!.id;

    const event = await Event.findById(id);
    if (!event) {
      next(new AppError('No event found with that ID', 404));
      return;
    }

    // Add student to registrations array atomically (prevent duplicates)
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $addToSet: { registrations: studentId } },
      { new: true }
    ).populate('facultyOrganizer', 'name role email avatar');

    res.status(200).json({
      status: 'success',
      message: 'Successfully registered for this event!',
      data: updatedEvent,
    });
  } catch (error) {
    next(error);
  }
};

export const unregisterFromEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const studentId = req.user!.id;

    const event = await Event.findById(id);
    if (!event) {
      next(new AppError('No event found with that ID', 404));
      return;
    }

    // Remove student from registrations array
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $pull: { registrations: studentId } },
      { new: true }
    ).populate('facultyOrganizer', 'name role email avatar');

    res.status(200).json({
      status: 'success',
      message: 'RSVP cancelled successfully',
      data: updatedEvent,
    });
  } catch (error) {
    next(error);
  }
};
