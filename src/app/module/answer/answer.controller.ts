import httpStatus from 'http-status';

import type { Request, Response } from 'express';

import { AnswerService } from './answer.service';

import { sendResponse } from '../../utils/sendResponse';

import { catchAsync } from '../../utils/catchAsync';

const createAnswer = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new Error('Authentication required');
  }

  const { attemptId, questionId, answerText, selectedOptionId } = req.body;

  const answer = await AnswerService.createAnswer({
    candidateUserId: req.user.userId,
    attemptId,
    questionId,
    answerText,
    selectedOptionId,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Answer saved successfully',
    data: answer,
  });
});

export const AnswerController = {
  createAnswer,
};
