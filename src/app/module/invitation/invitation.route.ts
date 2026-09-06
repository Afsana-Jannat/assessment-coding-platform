import express from 'express';

import { auth } from '../../middleware/checkAuth';
import { validateRequest } from '../../middleware/validateRequest';
import { Role } from '../../../generated/prisma/client';

import { createInvitationSchema } from './invitation.validation';
import { InvitationController } from './invitation.controller';

const router = express.Router();

router.post(
  '/',
  auth(Role.RECRUITER),
  validateRequest(createInvitationSchema),
  InvitationController.createInvitation
);

router.patch(
  '/:invitationId/accept',
  auth(Role.CANDIDATE),
  InvitationController.acceptInvitation
);

router.patch(
  '/:invitationId/decline',
  auth(Role.CANDIDATE),
  InvitationController.declineInvitation
);

export const InvitationRoutes = router;
