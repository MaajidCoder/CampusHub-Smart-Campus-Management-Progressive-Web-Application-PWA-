import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../models/user.model';
import { AppError } from '../utils/appError';

const signAccessToken = (id: string, role: string): string => {
  return jwt.sign(
    { id, role },
    process.env.JWT_ACCESS_SECRET || 'campushub_access_secret_key_12345_super_secure',
    { expiresIn: (process.env.JWT_ACCESS_EXPIRY || '15m') as any }
  );
};

const signRefreshToken = (id: string, role: string): string => {
  return jwt.sign(
    { id, role },
    process.env.JWT_REFRESH_SECRET || 'campushub_refresh_secret_key_67890_super_secure',
    { expiresIn: (process.env.JWT_REFRESH_EXPIRY || '7d') as any }
  );
};

const setRefreshTokenCookie = (res: Response, token: string): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, role, department, semester, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      next(new AppError('Email is already registered', 400));
      return;
    }

    // Faculty needs approval, students are approved by default
    const isApproved = role === 'student';

    const user = await User.create({
      name,
      email,
      password,
      role,
      department,
      semester,
      phone,
      isApproved,
    });

    // Populate department info
    if (department) {
      await user.populate('department');
    }

    // Hide password before returning
    user.password = undefined;

    // Return response. If student, log them in immediately. If faculty, notify that approval is pending.
    if (!isApproved) {
      res.status(201).json({
        status: 'success',
        message: 'Registration successful. Please wait for an administrator to approve your account.',
        data: { user },
      });
      return;
    }

    const accessToken = signAccessToken(user._id.toString(), user.role);
    const refreshToken = signRefreshToken(user._id.toString(), user.role);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      accessToken,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Fetch user and include password and refreshToken
    const user = await User.findOne({ email }).select('+password +refreshToken').populate('department');

    if (!user || !(await user.comparePassword(password))) {
      next(new AppError('Incorrect email or password', 401));
      return;
    }

    if (!user.isApproved) {
      next(new AppError('Your account has not been approved by an administrator yet.', 403));
      return;
    }

    const accessToken = signAccessToken(user._id.toString(), user.role);
    const refreshToken = signRefreshToken(user._id.toString(), user.role);

    // Update refresh token in db
    user.refreshToken = refreshToken;
    await user.save();

    setRefreshTokenCookie(res, refreshToken);

    // Hide password
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      message: 'Logged in successfully',
      accessToken,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Clear refresh token in database
      const decoded = jwt.decode(refreshToken) as { id: string } | null;
      if (decoded && decoded.id) {
        await User.findByIdAndUpdate(decoded.id, { $unset: { refreshToken: 1 } });
      }
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      next(new AppError('Refresh token missing', 401));
      return;
    }

    // Verify token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'campushub_refresh_secret_key_67890_super_secure'
    ) as { id: string; role: string };

    // Fetch user and make sure token matches
    const user = await User.findById(decoded.id).select('+refreshToken').populate('department');

    if (!user || user.refreshToken !== refreshToken) {
      next(new AppError('Token matches no active session. Please log in again.', 401));
      return;
    }

    if (!user.isApproved) {
      next(new AppError('Your account has been deactivated.', 403));
      return;
    }

    // Rotate tokens (generate new ones)
    const newAccessToken = signAccessToken(user._id.toString(), user.role);
    const newRefreshToken = signRefreshToken(user._id.toString(), user.role);

    user.refreshToken = newRefreshToken;
    await user.save();

    setRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({
      status: 'success',
      accessToken: newAccessToken,
      data: { user },
    });
  } catch (error) {
    next(new AppError('Session expired. Please log in again.', 401));
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      next(new AppError('There is no user with that email address.', 404));
      return;
    }

    // Generate random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash and set on schema
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.save();

    // Mock send email - output to console and return in body in development for easy testing
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
    console.log(`[Email Mock] Reset password url: ${resetUrl}`);

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email! (Mocked)',
      // We expose it for development ease
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching token and valid expiry
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() },
    });

    if (!user) {
      next(new AppError('Token is invalid or has expired', 400));
      return;
    }

    // Reset password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    // Save user (triggers encryption pre-save)
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id).populate('department');
    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, phone, avatar, semester } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user!.id,
      {
        $set: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(avatar && { avatar }),
          ...(semester && { semester }),
        },
      },
      { new: true, runValidators: true }
    ).populate('department');

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

export const getStudents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { department, semester } = req.query;

    const queryObj: any = { role: 'student' };

    if (department) {
      queryObj.department = department;
    }
    if (semester) {
      queryObj.semester = Number(semester);
    }

    const students = await User.find(queryObj).populate('department').sort({ name: 1 });

    res.status(200).json({
      status: 'success',
      results: students.length,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } })
      .populate('department')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const approveUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      next(new AppError('User not found', 404));
      return;
    }

    user.isApproved = true;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: `${user.name} has been successfully approved.`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      next(new AppError('User not found', 404));
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

