import httpStatus from 'http-status';

import { prisma } from '../../lib/prisma';

type CreateEvaluationInput = {
  recruiterUserId: string;
  answerId: string;
  marksObtained: number;
  feedback?: string;
};

/**
 * Create or update an evaluation for a written/coding answer
 */
const createEvaluation = async ({
  recruiterUserId,
  answerId,
  marksObtained,
  feedback,
}: CreateEvaluationInput) => {
  // 1. Find recruiter from authenticated User ID
  const recruiter = await prisma.recruiter.findUnique({
    where: {
      userId: recruiterUserId,
    },
    select: {
      id: true,
      isDeleted: true,
    },
  });

  if (!recruiter) {
    const error = new Error('Recruiter not found');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  if (recruiter.isDeleted) {
    const error = new Error('Recruiter has been deleted');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  // 2. Find answer with assessment ownership information
  const answer = await prisma.answer.findUnique({
    where: {
      id: answerId,
    },
    select: {
      id: true,
      answerText: true,
      selectedOptionId: true,
      marksObtained: true,
      question: {
        select: {
          id: true,
          questionText: true,
          type: true,
          marks: true,
          assessment: {
            select: {
              id: true,
              title: true,
              recruiterId: true,
            },
          },
        },
      },
      evaluation: {
        select: {
          id: true,
          marksObtained: true,
          feedback: true,
          evaluatedAt: true,
          recruiterId: true,
        },
      },
    },
  });

  if (!answer) {
    const error = new Error('Answer not found');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  // 3. Only written/coding answers can be manually evaluated
  if (answer.question.type !== 'WRITTEN' && answer.question.type !== 'CODING') {
    const error = new Error(
      'Only written and coding answers can be manually evaluated'
    );
    Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
    throw error;
  }

  // 4. Verify recruiter owns the assessment
  if (answer.question.assessment.recruiterId !== recruiter.id) {
    const error = new Error('You are not authorized to evaluate this answer');
    Object.assign(error, { statusCode: httpStatus.FORBIDDEN });
    throw error;
  }

  // 5. Validate marks
  if (marksObtained < 0) {
    const error = new Error('Marks obtained cannot be negative');
    Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
    throw error;
  }

  if (marksObtained > answer.question.marks) {
    const error = new Error(
      `Marks obtained cannot exceed question marks (${answer.question.marks})`
    );
    Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
    throw error;
  }

  // 6. Create or update evaluation
  const evaluation = await prisma.evaluation.upsert({
    where: {
      answerId: answer.id,
    },
    create: {
      answerId: answer.id,
      recruiterId: recruiter.id,
      marksObtained,
      feedback,
    },
    update: {
      recruiterId: recruiter.id,
      marksObtained,
      feedback,
      evaluatedAt: new Date(),
    },
    select: {
      id: true,
      marksObtained: true,
      feedback: true,
      evaluatedAt: true,
      createdAt: true,
      updatedAt: true,
      answerId: true,
      recruiterId: true,
      answer: {
        select: {
          id: true,
          answerText: true,
          question: {
            select: {
              id: true,
              questionText: true,
              type: true,
              marks: true,
              assessmentId: true,
            },
          },
        },
      },
    },
  });

  // 7. Keep Answer.marksObtained synchronized
  await prisma.answer.update({
    where: {
      id: answer.id,
    },
    data: {
      marksObtained,
      isCorrect: null,
    },
  });

  return evaluation;
};

export const EvaluationService = {
  createEvaluation,
};
