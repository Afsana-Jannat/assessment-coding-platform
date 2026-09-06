import httpStatus from 'http-status';
import { prisma } from '../../lib/prisma';

type CreateInvitationInput = {
  recruiterUserId: string;
  data: {
    candidateId: string;
    assessmentId: string;
    message?: string | null;
    expiresAt?: Date | null;
  };
};

const createInvitation = async ({
  recruiterUserId,
  data,
}: CreateInvitationInput) => {
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

  // 2. Check assessment belongs to this recruiter
  const assessment = await prisma.assessment.findFirst({
    where: {
      id: data.assessmentId,
      recruiterId: recruiter.id,
      isDeleted: false,
    },
    select: {
      id: true,
      title: true,
      status: true,
      startAt: true,
      endAt: true,
    },
  });

  if (!assessment) {
    const error = new Error(
      'Assessment not found or you do not have permission to use it'
    );
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  // 3. Only published assessments can receive invitations
  if (assessment.status !== 'PUBLISHED') {
    const error = new Error(
      'Only published assessments can be used for invitations'
    );
    Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
    throw error;
  }

  // 4. Check candidate exists and is active
  const candidate = await prisma.candidate.findFirst({
    where: {
      id: data.candidateId,
      isDeleted: false,
      user: {
        isDeleted: false,
        status: 'ACTIVE',
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!candidate) {
    const error = new Error('Candidate not found or is not active');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  // 5. Validate invitation expiry
  if (data.expiresAt && data.expiresAt <= new Date()) {
    const error = new Error('Invitation expiry time must be in the future');
    Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
    throw error;
  }

  // 6. If assessment has an end time, invitation cannot expire after it
  if (data.expiresAt && assessment.endAt && data.expiresAt > assessment.endAt) {
    const error = new Error(
      'Invitation expiry time cannot be later than the assessment end time'
    );
    Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
    throw error;
  }

  // 7. Prevent duplicate invitation
  const existingInvitation = await prisma.invitation.findUnique({
    where: {
      candidateId_assessmentId: {
        candidateId: candidate.id,
        assessmentId: assessment.id,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (existingInvitation) {
    const error = new Error(
      'This candidate has already been invited to this assessment'
    );
    Object.assign(error, { statusCode: httpStatus.CONFLICT });
    throw error;
  }

  // 8. Create invitation
  const invitation = await prisma.invitation.create({
    data: {
      candidateId: candidate.id,
      assessmentId: assessment.id,
      message: data.message,
      expiresAt: data.expiresAt,
    },
    select: {
      id: true,
      invitedAt: true,
      expiresAt: true,
      status: true,
      message: true,
      candidateId: true,
      assessmentId: true,
      createdAt: true,
      updatedAt: true,
      candidate: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assessment: {
        select: {
          id: true,
          title: true,
          status: true,
          startAt: true,
          endAt: true,
        },
      },
    },
  });

  return invitation;
};

type AcceptInvitationInput = {
  candidateUserId: string;
  invitationId: string;
};

const acceptInvitation = async ({
  candidateUserId,
  invitationId,
}: AcceptInvitationInput) => {
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

  // 2. Find invitation belonging to this candidate
  const invitation = await prisma.invitation.findFirst({
    where: {
      id: invitationId,
      candidateId: candidate.id,
    },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      assessmentId: true,
    },
  });

  if (!invitation) {
    const error = new Error('Invitation not found');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  // 3. Only pending invitations can be accepted
  if (invitation.status !== 'PENDING') {
    const error = new Error(
      `Invitation cannot be accepted because its current status is ${invitation.status}`
    );
    Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
    throw error;
  }

  // 4. Check invitation expiry
  if (invitation.expiresAt && invitation.expiresAt <= new Date()) {
    await prisma.invitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        status: 'EXPIRED',
      },
    });

    const error = new Error('This invitation has expired');
    Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
    throw error;
  }

  // 5. Accept invitation
  const acceptedInvitation = await prisma.invitation.update({
    where: {
      id: invitation.id,
    },
    data: {
      status: 'ACCEPTED',
    },
    select: {
      id: true,
      invitedAt: true,
      expiresAt: true,
      status: true,
      message: true,
      candidateId: true,
      assessmentId: true,
      updatedAt: true,
    },
  });

  return acceptedInvitation;
};

type DeclineInvitationInput = {
  candidateUserId: string;
  invitationId: string;
};

const declineInvitation = async ({
  candidateUserId,
  invitationId,
}: DeclineInvitationInput) => {
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

  // 2. Find invitation belonging to this candidate
  const invitation = await prisma.invitation.findFirst({
    where: {
      id: invitationId,
      candidateId: candidate.id,
    },
    select: {
      id: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!invitation) {
    const error = new Error('Invitation not found');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  // 3. Only pending invitations can be declined
  if (invitation.status !== 'PENDING') {
    const error = new Error(
      `Invitation cannot be declined because its current status is ${invitation.status}`
    );
    Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
    throw error;
  }

  // 4. Check invitation expiry
  if (invitation.expiresAt && invitation.expiresAt <= new Date()) {
    await prisma.invitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        status: 'EXPIRED',
      },
    });

    const error = new Error('This invitation has expired');
    Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
    throw error;
  }

  // 5. Decline invitation
  const declinedInvitation = await prisma.invitation.update({
    where: {
      id: invitation.id,
    },
    data: {
      status: 'DECLINED',
    },
    select: {
      id: true,
      invitedAt: true,
      expiresAt: true,
      status: true,
      message: true,
      candidateId: true,
      assessmentId: true,
      updatedAt: true,
    },
  });

  return declinedInvitation;
};

export const InvitationService = {
  createInvitation,
  acceptInvitation,
  declineInvitation,
};
