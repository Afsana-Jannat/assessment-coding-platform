import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";

import { auth } from "../../middleware/checkAuth";
import { authRateLimiter } from "../../middleware/rateLimiter";
import { validateRequest } from "../../middleware/validateRequest";

import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = Router();

router.post(
	"/register",
	authRateLimiter,
	validateRequest(AuthValidation.registerCandidateSchema),
	AuthController.registerCandidate,
);

router.post(
	"/login",
	authRateLimiter,
	validateRequest(AuthValidation.loginUserSchema),
	AuthController.loginUser,
);

router.get(
	"/me",
	auth(Role.ADMIN, Role.RECRUITER, Role.CANDIDATE),
	AuthController.getMe,
);

router.post("/refresh-token", AuthController.refreshToken);

router.post(
	"/google",
	authRateLimiter,
	validateRequest(AuthValidation.googleLoginSchema),
	AuthController.googleLogin,
);

export const AuthRoutes = router;
