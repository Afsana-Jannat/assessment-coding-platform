import type { Request, Response } from 'express';
import httpStatus from 'http-status';

import { catchAsync } from '../../utils/catchAsync';
import { AssessmentService } from './assessment.service';

const createAssessment = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new Error('Authentication required');
  }

  const data = req.validated?.body as {
    title: string;
    description?: string | null;
    instructions?: string | null;
    durationMinutes: number;
    totalMarks: number;
    passingMarks: number;
    startAt?: Date | null;
    endAt?: Date | null;
  };

  const assessment = await AssessmentService.createAssessment({
    recruiterId: req.user.userId,
    data,
  });

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Assessment created successfully',
    data: assessment,
  });
});

export const AssessmentController = {
  createAssessment,
};
