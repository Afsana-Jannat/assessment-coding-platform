import { Router } from 'express';

import { Role } from '../../../generated/prisma/enums';
import { auth } from '../../middleware/checkAuth';
import { AuthController } from './auth.controller';

const router = Router();

router.post('/register', AuthController.registerCandidate);

router.post('/login', AuthController.loginUser);

router.get(
  '/me',
  auth(Role.ADMIN, Role.RECRUITER, Role.CANDIDATE),
  AuthController.getMe
);

router.post('/refresh-token', AuthController.refreshToken);

router.post('/google', AuthController.googleLogin);

export const AuthRoutes = router;
