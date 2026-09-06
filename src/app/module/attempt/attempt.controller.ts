import httpStatus from 'http-status';

import type { Request, Response } from 'express';

import { AttemptService } from './attempt.service';

import { sendResponse } from '../../utils/sendResponse';

import { catchAsync } from '../../utils/catchAsync';

const startAttempt = catchAsync(async (req: Request, res: Response) => {
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

const getAttemptById = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new Error('Authentication required');
  }

  const attemptId = req.params.attemptId as string;

  if (!attemptId) {
    throw new Error('Attempt ID is required');
  }

  const result = await AttemptService.getAttemptById(
    attemptId,
    req.user.userId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Attempt retrieved successfully',
    data: result,
  });
});

const submitAttempt = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new Error('Authentication required');
  }

  const attemptId = req.params.attemptId as string;

  if (!attemptId) {
    throw new Error('Attempt ID is required');
  }

  const result = await AttemptService.submitAttempt(attemptId, req.user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Assessment attempt submitted successfully',
    data: result,
  });
});

export const AttemptController = {
  startAttempt,
  getAttemptById,
  submitAttempt,
};
