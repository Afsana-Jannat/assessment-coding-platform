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
    recruiterUserId: req.user.userId,
    data,
  });

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Assessment created successfully',
    data: assessment,
  });
});

const createQuestion = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new Error('Authentication required');
  }

  const assessmentId = req.validated?.params as {
    assessmentId: string;
  };

  const data = req.validated?.body as {
    questionText: string;
    type: 'MCQ' | 'WRITTEN' | 'CODING';
    marks: number;
    order: number;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    explanation?: string | null;
    referenceAnswer?: string | null;
    options?: {
      optionText: string;
      isCorrect: boolean;
    }[];
  };

  const question = await AssessmentService.createQuestion({
    recruiterUserId: req.user.userId,
    assessmentId: assessmentId.assessmentId,
    data,
  });

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Question created successfully',
    data: question,
  });
});

const getQuestions = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new Error('Authentication required');
  }

  const params = req.validated?.params as {
    assessmentId: string;
  };

  const query = req.validated?.query as {
    type?: 'MCQ' | 'WRITTEN' | 'CODING';
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    page: number;
    limit: number;
  };

  const result = await AssessmentService.getQuestions({
    recruiterUserId: req.user.userId,
    assessmentId: params.assessmentId,
    filters: query,
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Questions retrieved successfully',
    data: result.questions,
    pagination: result.pagination,
  });
});

const getQuestionById = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new Error('Authentication required');
  }

  const params = req.validated?.params as {
    assessmentId: string;
    questionId: string;
  };

  const question = await AssessmentService.getQuestionById({
    recruiterUserId: req.user.userId,
    assessmentId: params.assessmentId,
    questionId: params.questionId,
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Question retrieved successfully',
    data: question,
  });
});

const updateQuestion = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new Error('Authentication required');
  }

  const params = req.validated?.params as {
    assessmentId: string;
    questionId: string;
  };

  const data = req.validated?.body as {
    questionText?: string;
    type?: 'MCQ' | 'WRITTEN' | 'CODING';
    marks?: number;
    order?: number;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    explanation?: string | null;
    referenceAnswer?: string | null;
    options?: {
      optionText: string;
      isCorrect: boolean;
    }[];
  };

  const question = await AssessmentService.updateQuestion({
    recruiterUserId: req.user.userId,
    assessmentId: params.assessmentId,
    questionId: params.questionId,
    data,
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Question updated successfully',
    data: question,
  });
});

const deleteQuestion = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new Error('Authentication required');
  }

  const params = req.validated?.params as {
    assessmentId: string;
    questionId: string;
  };

  const question = await AssessmentService.deleteQuestion({
    recruiterUserId: req.user.userId,
    assessmentId: params.assessmentId,
    questionId: params.questionId,
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Question deleted successfully',
    data: question,
  });
});

export const AssessmentController = {
  createAssessment,
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
};
