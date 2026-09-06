import httpStatus from 'http-status';
import type { Request } from 'express';

import { InvitationService } from './invitation.service';
import { catchAsync } from '../../utils/catchAsync';

const createInvitation = catchAsync(async (req: Request, res) => {
  if (!req.user) {
    throw new Error('Authentication required');
  }

  const body = req.validated?.body as {
    candidateId: string;
    assessmentId: string;
    message?: string | null;
    expiresAt?: Date | null;
  };

  const invitation = await InvitationService.createInvitation({
    recruiterUserId: req.user.userId,
    data: body,
  });

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Candidate invited successfully',
    data: invitation,
  });
});

const acceptInvitation = catchAsync(async (req: Request, res) => {
  if (!req.user) {
    throw new Error('Authentication required');
  }

  const invitationId = req.params.invitationId as string;

  if (!invitationId) {
    throw new Error('Invitation ID is required');
  }

  const invitation = await InvitationService.acceptInvitation({
    candidateUserId: req.user.userId,
    invitationId,
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Invitation accepted successfully',
    data: invitation,
  });
});

const declineInvitation = catchAsync(async (req: Request, res) => {
  if (!req.user) {
    throw new Error('Authentication required');
  }

  const invitationId = req.params.invitationId as string;

  if (!invitationId) {
    throw new Error('Invitation ID is required');
  }

  const invitation = await InvitationService.declineInvitation({
    candidateUserId: req.user.userId,
    invitationId,
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Invitation declined successfully',
    data: invitation,
  });
});

export const InvitationController = {
  createInvitation,
  acceptInvitation,
  declineInvitation,
};
