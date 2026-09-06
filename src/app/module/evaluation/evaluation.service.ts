import httpStatus from 'http-status';
import { prisma } from '../../lib/prisma';

type CreateEvaluationInput = {
  recruiterUserId: string;
  answerId: string;
  marksObtained: number;
  feedback?: string;
};

const createEvaluation = async ({
  recruiterUserId,
  answerId,
  marksObtained,
  feedback,
}: CreateEvaluationInput) => {
  const recruiter = await prisma.recruiter.findUnique({
    where: { userId: recruiterUserId },
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

  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    select: {
      id: true,
      answerText: true,
      selectedOptionId: true,
      marksObtained: true,
      attemptId: true,
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
              totalMarks: true,
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

  if (answer.question.type !== 'WRITTEN' && answer.question.type !== 'CODING') {
    const error = new Error(
      'Only written and coding answers can be manually evaluated'
    );

    Object.assign(error, {
      statusCode: httpStatus.BAD_REQUEST,
    });

    throw error;
  }

  if (answer.question.assessment.recruiterId !== recruiter.id) {
    const error = new Error('You are not authorized to evaluate this answer');

    Object.assign(error, {
      statusCode: httpStatus.FORBIDDEN,
    });

    throw error;
  }

  if (marksObtained < 0) {
    const error = new Error('Marks obtained cannot be negative');

    Object.assign(error, {
      statusCode: httpStatus.BAD_REQUEST,
    });

    throw error;
  }

  if (marksObtained > answer.question.marks) {
    const error = new Error(
      `Marks obtained cannot exceed question marks (${answer.question.marks})`
    );

    Object.assign(error, {
      statusCode: httpStatus.BAD_REQUEST,
    });

    throw error;
  }

  if (!answer.answerText?.trim()) {
    const error = new Error(
      'Cannot evaluate an unanswered written or coding question'
    );

    Object.assign(error, {
      statusCode: httpStatus.BAD_REQUEST,
    });

    throw error;
  }

  const result = await prisma.$transaction(async (tx) => {
    const evaluation = await tx.evaluation.upsert({
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

    await tx.answer.update({
      where: {
        id: answer.id,
      },
      data: {
        marksObtained,
        isCorrect: null,
      },
    });

    const attemptAnswers = await tx.answer.findMany({
      where: {
        attemptId: answer.attemptId,
        marksObtained: {
          not: null,
        },
      },
      select: {
        marksObtained: true,
      },
    });

    const totalScore = attemptAnswers.reduce(
      (sum, currentAnswer) => sum + (currentAnswer.marksObtained ?? 0),
      0
    );

    const percentage =
      answer.question.assessment.totalMarks > 0
        ? (totalScore / answer.question.assessment.totalMarks) * 100
        : 0;

    const updatedAttempt = await tx.attempt.update({
      where: {
        id: answer.attemptId,
      },
      data: {
        score: totalScore,
        percentage,
      },
      select: {
        id: true,
        status: true,
        score: true,
        percentage: true,
      },
    });

    return {
      evaluation,
      attempt: updatedAttempt,
    };
  });

  return result.evaluation;
};

export const EvaluationService = {
  createEvaluation,
};
