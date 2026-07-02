import { Request, Response, NextFunction } from 'express';
import { Marketplace } from '../models/marketplace.model';
import { uploadFile, deleteFile } from '../services/cloudinary.service';
import { AppError } from '../utils/appError';
import { socketService } from '../services/socket.service';

export const getAllApprovedListings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category, search, minPrice, maxPrice } = req.query;

    const queryObj: any = { status: 'approved' }; // Only show approved public items

    if (category) {
      queryObj.category = category;
    }

    if (minPrice || maxPrice) {
      queryObj.price = {};
      if (minPrice) queryObj.price.$gte = Number(minPrice);
      if (maxPrice) queryObj.price.$lte = Number(maxPrice);
    }

    if (search) {
      queryObj.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const listings = await Marketplace.find(queryObj)
      .populate('seller', 'name email avatar phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: listings.length,
      data: listings,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyListings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const listings = await Marketplace.find({ seller: req.user!.id })
      .populate('seller', 'name email avatar phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: listings.length,
      data: listings,
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingListings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const listings = await Marketplace.find({ status: 'pending' })
      .populate('seller', 'name email avatar phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: listings.length,
      data: listings,
    });
  } catch (error) {
    next(error);
  }
};

export const createListing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description, category, price, contactDetails } = req.body;

    if (!req.file) {
      next(new AppError('Product photo upload is required to create a listing!', 400));
      return;
    }

    // Upload product photo
    const uploadResult = await uploadFile(req.file.buffer, 'marketplace', req.file.originalname);

    const listing = await Marketplace.create({
      title,
      description,
      category,
      price: Number(price),
      imageUrl: uploadResult.secure_url,
      imagePublicId: uploadResult.public_id,
      seller: req.user!.id,
      contactDetails,
      status: 'pending', // Starts as pending, requires admin approval
    });

    await listing.populate('seller', 'name email avatar phone');

    res.status(201).json({
      status: 'success',
      message: 'Product listed successfully. Waiting for admin approval before it goes public.',
      data: listing,
    });
  } catch (error) {
    next(error);
  }
};

export const updateListingStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' | 'rejected' | 'sold'

    const listing = await Marketplace.findById(id);

    if (!listing) {
      next(new AppError('No listing found with that ID', 404));
      return;
    }

    // Authorization checks:
    if (status === 'approved' || status === 'rejected') {
      // ONLY admins can approve or reject listings
      if (req.user!.role !== 'admin') {
        next(new AppError('Only administrators can moderate listing statuses.', 403));
        return;
      }
    } else if (status === 'sold') {
      // ONLY the seller can mark it as sold
      if (listing.seller.toString() !== req.user!.id && req.user!.role !== 'admin') {
        next(new AppError('You do not have permission to modify this listing status.', 403));
        return;
      }
    } else {
      next(new AppError('Invalid status update parameter.', 400));
      return;
    }

    listing.status = status;
    await listing.save();

    // Notify the listing seller about status updates
    socketService.emitToUser(listing.seller.toString(), 'marketplace-status-updated', {
      id: listing._id,
      title: listing.title,
      status: status,
    });

    res.status(200).json({
      status: 'success',
      message: `Item status marked as ${status}!`,
      data: listing,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteListing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const listing = await Marketplace.findById(id);

    if (!listing) {
      next(new AppError('No listing found with that ID', 404));
      return;
    }

    // Verify owner or admin
    if (listing.seller.toString() !== req.user!.id && req.user!.role !== 'admin') {
      next(new AppError('You do not have permission to delete this listing', 403));
      return;
    }

    // Delete image from host
    if (listing.imagePublicId) {
      await deleteFile(listing.imagePublicId);
    }

    await Marketplace.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Listing removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
