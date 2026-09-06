import express from 'express';

import { Role } from '../../../generated/prisma/client';

import { auth } from '../../middleware/checkAuth';

import { validateRequest } from '../../middleware/validateRequest';

import { AnswerController } from './answer.controller';

import { createAnswerSchema } from './answer.validation';

const router = express.Router();

router.post(
  '/',
  auth(Role.CANDIDATE),
  validateRequest(createAnswerSchema),
  AnswerController.createAnswer
);

export const AnswerRoutes = router;
