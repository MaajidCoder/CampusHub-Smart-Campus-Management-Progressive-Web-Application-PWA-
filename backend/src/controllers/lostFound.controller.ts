import { Request, Response, NextFunction } from 'express';
import { LostFound } from '../models/lostFound.model';
import { uploadFile, deleteFile } from '../services/cloudinary.service';
import { AppError } from '../utils/appError';

export const getAllItems = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, search } = req.query;

    const queryObj: any = {};

    if (status) {
      queryObj.status = status;
    }

    if (search) {
      queryObj.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await LostFound.find(queryObj)
      .populate('reportedBy', 'name role email phone avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

export const createItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description, status, location, dateLostFound, contactDetails } = req.body;

    let imageUrl = '';
    let imagePublicId = '';

    // If file is provided, upload image to Cloudinary/local fallback
    if (req.file) {
      const uploadResult = await uploadFile(req.file.buffer, 'lostfound', req.file.originalname);
      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    }

    const item = await LostFound.create({
      title,
      description,
      status,
      location,
      dateLostFound: dateLostFound ? new Date(dateLostFound) : undefined,
      imageUrl: imageUrl || undefined,
      imagePublicId: imagePublicId || undefined,
      reportedBy: req.user!.id,
      contactDetails,
      isApproved: true, // Auto approved by default, can be modified
    });

    await item.populate('reportedBy', 'name role email phone avatar');

    res.status(201).json({
      status: 'success',
      message: 'Item reported successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const updateItemStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const item = await LostFound.findById(id);

    if (!item) {
      next(new AppError('No item found with that ID', 404));
      return;
    }

    // Verify reporter or admin
    if (item.reportedBy.toString() !== req.user!.id && req.user!.role !== 'admin') {
      next(new AppError('You do not have permission to update this item listing', 403));
      return;
    }

    item.status = status;
    await item.save();

    res.status(200).json({
      status: 'success',
      message: `Item status updated to ${status}`,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await LostFound.findById(id);

    if (!item) {
      next(new AppError('No item found with that ID', 404));
      return;
    }

    // Verify reporter or admin
    if (item.reportedBy.toString() !== req.user!.id && req.user!.role !== 'admin') {
      next(new AppError('You do not have permission to delete this listing', 403));
      return;
    }

    // Delete image from hosting if exists
    if (item.imagePublicId) {
      await deleteFile(item.imagePublicId);
    }

    await LostFound.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Listing removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
