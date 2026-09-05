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

router.get(
  '/',
  auth(Role.RECRUITER),
  validateRequest(AssessmentValidation.getAssessmentsSchema),
  AssessmentController.getAssessments
);

router.get(
  '/:assessmentId',
  auth(Role.RECRUITER),
  validateRequest(AssessmentValidation.getAssessmentByIdSchema),
  AssessmentController.getAssessmentById
);

router.patch(
  '/:assessmentId',
  auth(Role.RECRUITER),
  validateRequest(AssessmentValidation.updateAssessmentSchema),
  AssessmentController.updateAssessment
);

router.delete(
  '/:assessmentId',
  auth(Role.RECRUITER),
  validateRequest(AssessmentValidation.deleteAssessmentSchema),
  AssessmentController.deleteAssessment
);

router.post(
  '/:assessmentId/questions',
  auth(Role.RECRUITER),
  validateRequest(AssessmentValidation.createQuestionSchema),
  AssessmentController.createQuestion
);

router.get(
  '/:assessmentId/questions',
  auth(Role.RECRUITER),
  validateRequest(AssessmentValidation.getQuestionsSchema),
  AssessmentController.getQuestions
);

router.get(
  '/:assessmentId/questions/:questionId',
  auth(Role.RECRUITER),
  validateRequest(AssessmentValidation.getQuestionByIdSchema),
  AssessmentController.getQuestionById
);

router.patch(
  '/:assessmentId/questions/:questionId',
  auth(Role.RECRUITER),
  validateRequest(AssessmentValidation.updateQuestionSchema),
  AssessmentController.updateQuestion
);

router.delete(
  '/:assessmentId/questions/:questionId',
  auth(Role.RECRUITER),
  validateRequest(AssessmentValidation.deleteQuestionSchema),
  AssessmentController.deleteQuestion
);

export const AssessmentRoutes = router;
