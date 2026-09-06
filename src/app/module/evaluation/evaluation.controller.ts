import httpStatus from 'http-status';

import type { Request, Response } from 'express';

import { EvaluationService } from './evaluation.service';

import { sendResponse } from '../../utils/sendResponse';

import { catchAsync } from '../../utils/catchAsync';

const createEvaluation = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new Error('Authentication required');
  }

  const { answerId, marksObtained, feedback } = req.body;

  const evaluation = await EvaluationService.createEvaluation({
    recruiterUserId: req.user.userId,
    answerId,
    marksObtained,
    feedback,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Answer evaluated successfully',
    data: evaluation,
  });
});

export const EvaluationController = {
  createEvaluation,
};
