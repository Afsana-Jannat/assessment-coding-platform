import httpStatus from 'http-status';
import { prisma } from '../../lib/prisma';

type StartAttemptInput = {
  candidateUserId: string;
  assessmentId: string;
};

const startAttempt = async ({
  candidateUserId,
  assessmentId,
}: StartAttemptInput) => {
  // 1. Find candidate from authenticated User ID
  const candidate = await prisma.candidate.findUnique({
    where: {
      userId: candidateUserId,
    },
    select: {
      id: true,
      isDeleted: true,
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

  // 2. Find published assessment
  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      isDeleted: false,
    },
    select: {
      id: true,
      title: true,
      durationMinutes: true,
      totalMarks: true,
      passingMarks: true,
      status: true,
      startAt: true,
      endAt: true,
    },
  });

  if (!assessment) {
    const error = new Error('Assessment not found');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  // 3. Assessment must be published
  if (assessment.status !== 'PUBLISHED') {
    const error = new Error('This assessment is not available to start');
    Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
    throw error;
  }

  const now = new Date();

  // 4. Check assessment start time
  if (assessment.startAt && now < assessment.startAt) {
    const error = new Error('This assessment has not started yet');
    Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
    throw error;
  }

  // 5. Check assessment end time
  if (assessment.endAt && now > assessment.endAt) {
    const error = new Error('This assessment has already ended');
    Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
    throw error;
  }

  // 6. Candidate must have an accepted invitation
  const invitation = await prisma.invitation.findFirst({
    where: {
      candidateId: candidate.id,
      assessmentId: assessment.id,
      status: 'ACCEPTED',
    },
    select: {
      id: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!invitation) {
    const error = new Error(
      'You do not have an accepted invitation for this assessment'
    );
    Object.assign(error, { statusCode: httpStatus.FORBIDDEN });
    throw error;
  }

  // 7. Check invitation expiry
  if (invitation.expiresAt && invitation.expiresAt <= now) {
    await prisma.invitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        status: 'EXPIRED',
      },
    });

    const error = new Error('Your invitation has expired');
    Object.assign(error, { statusCode: httpStatus.FORBIDDEN });
    throw error;
  }

  // 8. Prevent multiple attempts
  const existingAttempt = await prisma.attempt.findFirst({
    where: {
      candidateId: candidate.id,
      assessmentId: assessment.id,
    },
    select: {
      id: true,
      status: true,
      startedAt: true,
      submittedAt: true,
    },
  });

  if (existingAttempt) {
    const error = new Error('You have already started this assessment');
    Object.assign(error, { statusCode: httpStatus.CONFLICT });
    throw error;
  }

  // 9. Create attempt
  const attempt = await prisma.attempt.create({
    data: {
      candidateId: candidate.id,
      assessmentId: assessment.id,
      status: 'IN_PROGRESS',
    },
    select: {
      id: true,
      startedAt: true,
      submittedAt: true,
      status: true,
      score: true,
      percentage: true,
      candidateId: true,
      assessmentId: true,
      createdAt: true,
      updatedAt: true,
      assessment: {
        select: {
          id: true,
          title: true,
          durationMinutes: true,
          totalMarks: true,
          passingMarks: true,
          startAt: true,
          endAt: true,
        },
      },
    },
  });

  // 10. Calculate server-side expiry time
  const expiresAt = new Date(
    attempt.startedAt.getTime() + assessment.durationMinutes * 60 * 1000
  );

  return {
    ...attempt,
    expiresAt,
  };
};

const getAttemptById = async (attemptId: string, candidateUserId: string) => {
  // 1. Find candidate
  const candidate = await prisma.candidate.findUnique({
    where: {
      userId: candidateUserId,
    },
    select: {
      id: true,
      isDeleted: true,
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

  // 2. Find attempt belonging to this candidate
  const attempt = await prisma.attempt.findFirst({
    where: {
      id: attemptId,
      candidateId: candidate.id,
    },
    select: {
      id: true,
      startedAt: true,
      submittedAt: true,
      status: true,
      score: true,
      percentage: true,
      candidateId: true,
      assessmentId: true,
      createdAt: true,
      updatedAt: true,
      assessment: {
        select: {
          id: true,
          title: true,
          durationMinutes: true,
          totalMarks: true,
          passingMarks: true,
          startAt: true,
          endAt: true,
        },
      },
    },
  });

  if (!attempt) {
    const error = new Error('Attempt not found');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  // 3. Calculate server-side expiry time
  const expiresAt = new Date(
    attempt.startedAt.getTime() + attempt.assessment.durationMinutes * 60 * 1000
  );

  return {
    ...attempt,
    expiresAt,
  };
};

export const AttemptService = {
  startAttempt,
  getAttemptById,
};
