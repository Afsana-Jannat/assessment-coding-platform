import express from 'express';

import { auth } from '../../middleware/checkAuth';
import { Role } from '../../../generated/prisma/client';

import { AttemptController } from './attempt.controller';

const router = express.Router();

router.post(
  '/:assessmentId/start',
  auth(Role.CANDIDATE),
  AttemptController.startAttempt
);

router.get(
  '/:attemptId',
  auth(Role.CANDIDATE),
  AttemptController.getAttemptById
);

router.post(
  '/:attemptId/submit',
  auth(Role.CANDIDATE),
  AttemptController.submitAttempt
);

export const AttemptRoutes = router;
