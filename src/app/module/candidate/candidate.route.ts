import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { uploadResume } from "../../middleware/upload";
import { validateRequest } from "../../middleware/validateRequest";
import { CandidateController } from "./candidate.controller";
import { CandidateValidation } from "./candidate.validation";

const router = Router();

router.get("/me", auth(Role.CANDIDATE), CandidateController.getMyProfile);

router.patch(
	"/me",
	auth(Role.CANDIDATE),
	validateRequest(CandidateValidation.updateCandidateProfileSchema),
	CandidateController.updateMyProfile,
);

router.post(
	"/resume",
	auth(Role.CANDIDATE),
	uploadResume.single("resume"),
	CandidateController.uploadResume,
);

export const CandidateRoutes = router;
