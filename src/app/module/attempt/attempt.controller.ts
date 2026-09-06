import httpStatus from 'http-status';
import type { Request } from 'express';

import { AttemptService } from './attempt.service';
import { catchAsync } from '../../utils/catchAsync';

const startAttempt = catchAsync(async (req: Request, res) => {
  if (!req.user) {
    throw new Error('Authentication required');
  }

  const assessmentId = req.params.assessmentId as string;

  if (!assessmentId) {
    throw new Error('Assessment ID is required');
  }

  const attempt = await AttemptService.startAttempt({
    candidateUserId: req.user.userId,
    assessmentId,
  });

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Assessment attempt started successfully',
    data: attempt,
  });
});

export const AttemptController = {
  startAttempt,
};
