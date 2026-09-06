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

export const AttemptRoutes = router;
