import httpStatus from 'http-status';

import { prisma } from '../../lib/prisma';

interface CreateAnswerPayload {
  candidateUserId: string;
  attemptId: string;
  questionId: string;
  answerText?: string;
  selectedOptionId?: string;
}

const createAnswer = async ({
  candidateUserId,
  attemptId,
  questionId,
  answerText,
  selectedOptionId,
}: CreateAnswerPayload) => {
  // 1. Find candidate
  const candidate = await prisma.candidate.findUnique({
    where: {
      userId: candidateUserId,
    },
  });

  if (!candidate) {
    const error = new Error('Candidate not found');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  if (candidate.isDeleted) {
    const error = new Error('Candidate has been deleted');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  // 2. Find attempt and verify ownership
  const attempt = await prisma.attempt.findFirst({
    where: {
      id: attemptId,
      candidateId: candidate.id,
    },
    include: {
      assessment: true,
    },
  });

  if (!attempt) {
    const error = new Error('Attempt not found');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  // 3. Attempt must still be in progress
  if (attempt.status !== 'IN_PROGRESS') {
    const error = new Error('This attempt is no longer active');
    Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
    throw error;
  }

  // 4. Server-side time check
  const now = new Date();

  const expiresAt = new Date(
    attempt.startedAt.getTime() + attempt.assessment.durationMinutes * 60 * 1000
  );

  if (now > expiresAt) {
    await prisma.attempt.update({
      where: {
        id: attempt.id,
      },
      data: {
        status: 'TIME_EXPIRED',
      },
    });

    const error = new Error('Assessment time has expired');
    Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
    throw error;
  }

  // 5. Verify question belongs to this assessment
  const question = await prisma.question.findFirst({
    where: {
      id: questionId,
      assessmentId: attempt.assessmentId,
      isDeleted: false,
    },
  });

  if (!question) {
    const error = new Error('Question not found for this assessment');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  // 6. Validate MCQ option
  if (selectedOptionId) {
    if (question.type !== 'MCQ') {
      const error = new Error(
        'Selected option can only be used for MCQ questions'
      );
      Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
      throw error;
    }

    const option = await prisma.option.findFirst({
      where: {
        id: selectedOptionId,
        questionId: question.id,
      },
    });

    if (!option) {
      const error = new Error(
        'Selected option does not belong to this question'
      );
      Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
      throw error;
    }
  }

  // 7. Evaluate MCQ answer
  let isCorrect: boolean | null = null;
  let marksObtained: number | null = null;

  if (question.type === 'MCQ') {
    if (!selectedOptionId) {
      throw new Error('MCQ question requires a selected option');
    }

    const selectedOption = await prisma.option.findUnique({
      where: {
        id: selectedOptionId,
      },
    });

    if (!selectedOption) {
      const error = new Error('Selected option not found');
      Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
      throw error;
    }

    isCorrect = selectedOption.isCorrect;
    marksObtained = isCorrect ? question.marks : 0;
  }

  // 8. Create or update answer
  const answer = await prisma.answer.upsert({
    where: {
      attemptId_questionId: {
        attemptId: attempt.id,
        questionId: question.id,
      },
    },
    create: {
      attemptId: attempt.id,
      questionId: question.id,
      answerText,
      selectedOptionId,
      isCorrect,
      marksObtained,
    },
    update: {
      answerText,
      selectedOptionId,
      isCorrect,
      marksObtained,
      answeredAt: new Date(),
    },
    include: {
      question: true,
      selectedOption: true,
    },
  });

  return answer;
};

export const AnswerService = {
  createAnswer,
};
