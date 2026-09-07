import express from 'express';

import { auth } from '../../middleware/checkAuth';
import { validateRequest } from '../../middleware/validateRequest';
import { ReportsController } from './reports.controller';
import { ReportsValidation } from './reports.validation';

const router = express.Router();

router.get(
  '/overview',
  auth('RECRUITER'),
  validateRequest(ReportsValidation.dateFilterSchema),
  ReportsController.getRecruiterOverview
);

router.get(
  '/assessments/:assessmentId',
  auth('RECRUITER'),
  ReportsController.getAssessmentReport
);

router.get(
  '/candidates/:candidateId',
  auth('RECRUITER'),
  ReportsController.getCandidateReport
);

router.get(
  '/revenue',
  auth('RECRUITER'),
  validateRequest(ReportsValidation.dateFilterSchema),
  ReportsController.getRecruiterRevenue
);

router.get(
  '/admin/overview',
  auth('ADMIN'),
  validateRequest(ReportsValidation.dateFilterSchema),
  ReportsController.getAdminOverview
);

router.get(
  '/admin/revenue',
  auth('ADMIN'),
  validateRequest(ReportsValidation.dateFilterSchema),
  ReportsController.getAdminRevenue
);

router.get(
  '/admin/assessments',
  auth('ADMIN'),
  validateRequest(ReportsValidation.dateFilterSchema),
  ReportsController.getAdminAssessmentReport
);

router.get(
  '/admin/candidates',
  auth('ADMIN'),
  validateRequest(ReportsValidation.dateFilterSchema),
  ReportsController.getAdminCandidateReport
);

export const ReportsRoutes = router;
