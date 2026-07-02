import { Router, Request, Response, NextFunction } from 'express';
import { Department } from '../models/department.model';

const router = Router();

// GET /api/v1/departments - Get all departments
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.status(200).json({
      status: 'success',
      data: departments,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
