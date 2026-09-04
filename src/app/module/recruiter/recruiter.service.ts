import httpStatus from 'http-status';
import { prisma } from '../../lib/prisma';

const getMyProfile = async (userId: string) => {
  const recruiter = await prisma.recruiter.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      userId: true,
      name: true,
      email: true,
      phone: true,
      designation: true,
      companyName: true,
      companyLogo: true,
      companyWebsite: true,
      companyDescription: true,
      isDeleted: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!recruiter) {
    const error = new Error('Recruiter profile not found');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  if (recruiter.isDeleted) {
    const error = new Error('Recruiter profile has been deleted');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  return recruiter;
};

export const RecruiterService = {
  getMyProfile,
};
