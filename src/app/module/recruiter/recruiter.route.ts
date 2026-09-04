import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";

import { RecruiterController } from "./recruiter.controller";

const router = Router();

router.get("/me", auth(Role.RECRUITER), RecruiterController.getMyProfile);

export const RecruiterRoutes = router;
