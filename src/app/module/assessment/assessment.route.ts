import { Router } from 'express';

import { Role } from '../../../generated/prisma/enums';

import { auth } from '../../middleware/checkAuth';
import { validateRequest } from '../../middleware/validateRequest';

import { AssessmentController } from './assessment.controller';
import { AssessmentValidation } from './assessment.validation';

const router = Router();

router.post(
  '/',
  auth(Role.RECRUITER),
  validateRequest(AssessmentValidation.createAssessmentSchema),
  AssessmentController.createAssessment
);

export const AssessmentRoutes = router;
