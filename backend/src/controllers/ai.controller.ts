import { Request, Response, NextFunction } from 'express';
import { askGemini } from '../services/ai.service';
import { AppError } from '../utils/appError';

export const chatWithAI = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { message, history } = req.body;

    if (!message) {
      next(new AppError('Prompt message parameter is required', 400));
      return;
    }

    const formattedHistory = Array.isArray(history) ? history : [];

    // Call the Gemini helper service passing the student profile context
    const reply = await askGemini(message, formattedHistory, req.user);

    res.status(200).json({
      status: 'success',
      data: {
        reply,
      },
    });
  } catch (error) {
    next(error);
  }
};
