import httpStatus from 'http-status';

import { prisma } from '../../lib/prisma';

type CreateAssessmentInput = {
  recruiterId: string;
  data: {
    title: string;
    description?: string | null;
    instructions?: string | null;
    durationMinutes: number;
    totalMarks: number;
    passingMarks: number;
    startAt?: Date | null;
    endAt?: Date | null;
  };
};

const createAssessment = async ({
  recruiterId,
  data,
}: CreateAssessmentInput) => {
  const recruiter = await prisma.recruiter.findUnique({
    where: {
      id: recruiterId,
    },
    select: {
      id: true,
      isDeleted: true,
    },
  });

  if (!recruiter) {
    const error = new Error('Recruiter not found');

    Object.assign(error, {
      statusCode: httpStatus.NOT_FOUND,
    });

    throw error;
  }

  if (recruiter.isDeleted) {
    const error = new Error('Recruiter has been deleted');

    Object.assign(error, {
      statusCode: httpStatus.NOT_FOUND,
    });

    throw error;
  }

  if (data.passingMarks > data.totalMarks) {
    const error = new Error('Passing marks cannot exceed total marks');

    Object.assign(error, {
      statusCode: httpStatus.BAD_REQUEST,
    });

    throw error;
  }

  if (data.startAt && data.endAt && data.endAt <= data.startAt) {
    const error = new Error('End time must be later than start time');

    Object.assign(error, {
      statusCode: httpStatus.BAD_REQUEST,
    });

    throw error;
  }

  const assessment = await prisma.assessment.create({
    data: {
      title: data.title,
      description: data.description,
      instructions: data.instructions,
      durationMinutes: data.durationMinutes,
      totalMarks: data.totalMarks,
      passingMarks: data.passingMarks,
      startAt: data.startAt,
      endAt: data.endAt,
      recruiterId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      instructions: true,
      durationMinutes: true,
      totalMarks: true,
      passingMarks: true,
      status: true,
      startAt: true,
      endAt: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true,
      recruiterId: true,
    },
  });

  return assessment;
};

export const AssessmentService = {
  createAssessment,
};
