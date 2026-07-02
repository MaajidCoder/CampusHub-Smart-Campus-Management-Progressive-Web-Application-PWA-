import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { errorHandler } from './middlewares/error.middleware';
import { AppError } from './utils/appError';
import path from 'path';
import authRoutes from './routes/auth.routes';
import departmentRoutes from './routes/department.routes';
import announcementRoutes from './routes/announcement.routes';
import noteRoutes from './routes/note.routes';
import lostFoundRoutes from './routes/lostFound.routes';
import subjectRoutes from './routes/subject.routes';
import attendanceRoutes from './routes/attendance.routes';
import eventRoutes from './routes/event.routes';
import marketplaceRoutes from './routes/marketplace.routes';
import placementRoutes from './routes/placement.routes';
import aiRoutes from './routes/ai.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { socketService } from './services/socket.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// 1. Global Middlewares
// Security HTTP Headers
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows browser fetching of local fallback images/PDFs
}));

// CORS Setup (allow credentials for cookie transmission)
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Body Parser (reading data from body into req.body)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie Parser (reading cookies into req.cookies)
app.use(cookieParser());

// Serve local fallback uploads statically
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Rate Limiting
const limiter = rateLimit({
  max: 100, // Limit each IP to 100 requests per windowMs
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many requests from this IP, please try again in 15 minutes!',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// 2. Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'CampusHub API Server is healthy and running',
    timestamp: new Date().toISOString(),
  });
});

// 3. API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/notes', noteRoutes);
app.use('/api/v1/lost-found', lostFoundRoutes);
app.use('/api/v1/subjects', subjectRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/marketplace', marketplaceRoutes);
app.use('/api/v1/placements', placementRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// 4. Undefined Route Handler
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 5. Global Error Handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`[Server] CampusHub API Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Initialize Socket.io Real-Time Alert Engine
socketService.init(server);

// Handle unhandled promise rejections (safety valve)
process.on('unhandledRejection', (err: any) => {
  console.error('[Unhandled Rejection] Shutting down server...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

export default app;
