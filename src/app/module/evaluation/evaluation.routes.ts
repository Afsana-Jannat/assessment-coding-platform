import express from 'express';

import { Role } from '../../../generated/prisma/client';

import { auth } from '../../middleware/checkAuth';
import { validateRequest } from '../../middleware/validateRequest';

import { EvaluationController } from './evaluation.controller';
import { createEvaluationSchema } from './evaluation.validation';

const router = express.Router();

router.post(
  '/',
  auth(Role.RECRUITER),
  validateRequest(createEvaluationSchema),
  EvaluationController.createEvaluation
);

export const EvaluationRoutes = router;
