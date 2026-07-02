import { Schema, model, Document } from 'mongoose';

export type MarketplaceCategory = 'books' | 'calculator' | 'lab_coat' | 'laptop' | 'cycle' | 'other';
export type MarketplaceStatus = 'pending' | 'approved' | 'rejected' | 'sold';

export interface IMarketplace extends Document {
  title: string;
  description: string;
  category: MarketplaceCategory;
  price: number;
  imageUrl: string;
  imagePublicId: string;
  seller: Schema.Types.ObjectId;
  contactDetails: string;
  status: MarketplaceStatus;
  createdAt: Date;
  updatedAt: Date;
}

const marketplaceSchema = new Schema<IMarketplace>(
  {
    title: {
      type: String,
      required: [true, 'Item title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['books', 'calculator', 'lab_coat', 'laptop', 'cycle', 'other'],
      required: [true, 'Category is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    imageUrl: {
      type: String,
      required: [true, 'Item image URL is required'],
    },
    imagePublicId: {
      type: String,
      required: [true, 'Item image public ID is required'],
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller reference is required'],
    },
    contactDetails: {
      type: String,
      required: [true, 'Contact details are required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'sold'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

export const Marketplace = model<IMarketplace>('Marketplace', marketplaceSchema);
