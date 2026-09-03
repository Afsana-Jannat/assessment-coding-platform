import httpStatus from 'http-status';
import { prisma } from '../../lib/prisma';

const getMyProfile = async (userId: string) => {
  const candidate = await prisma.candidate.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      userId: true,
      name: true,
      email: true,
      skills: true,
      experience: true,
      education: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
      address: true,
      resumeUrl: true,
      isDeleted: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!candidate) {
    const error = new Error('Candidate profile not found');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  return candidate;
};

const updateMyProfile = async (
  userId: string,
  payload: {
    name?: string;
    skills?: string[];
    experience?: string | null;
    education?: string | null;
    phone?: string | null;
    dateOfBirth?: Date | null;
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
    address?: string | null;
  }
) => {
  const candidate = await prisma.candidate.findUnique({
    where: {
      userId,
    },
  });

  if (!candidate) {
    const error = new Error('Candidate profile not found');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  const updatedCandidate = await prisma.candidate.update({
    where: {
      userId,
    },
    data: payload,
    select: {
      id: true,
      userId: true,
      name: true,
      email: true,
      skills: true,
      experience: true,
      education: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
      address: true,
      resumeUrl: true,
      isDeleted: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedCandidate;
};

const uploadResume = async (userId: string, resumeUrl: string) => {
  const candidate = await prisma.candidate.findUnique({
    where: {
      userId,
    },
  });

  if (!candidate) {
    const error = new Error('Candidate profile not found');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  const updatedCandidate = await prisma.candidate.update({
    where: {
      userId,
    },
    data: {
      resumeUrl,
    },
    select: {
      id: true,
      userId: true,
      name: true,
      email: true,
      resumeUrl: true,
      updatedAt: true,
    },
  });

  return updatedCandidate;
};
export const CandidateService = {
  getMyProfile,
  updateMyProfile,
  uploadResume,
};
