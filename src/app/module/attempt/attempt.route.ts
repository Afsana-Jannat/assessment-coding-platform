import express from 'express';

import { Role } from '../../../generated/prisma/client';

import { auth } from '../../middleware/checkAuth';
import { validateRequest } from '../../middleware/validateRequest';

import { AttemptController } from './attempt.controller';
import { startAttemptSchema, submitAttemptSchema } from './attempt.validation';

const router = express.Router();

router.post(
  '/:assessmentId/start',
  auth(Role.CANDIDATE),
  validateRequest(startAttemptSchema),
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
  validateRequest(submitAttemptSchema),
  AttemptController.submitAttempt
);

export const AttemptRoutes = router;
