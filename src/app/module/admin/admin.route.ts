import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AdminController } from "./admin.controller";
import { AdminValidation } from "./admin.validation";

const router = Router();

router.get("/me", auth(Role.ADMIN), AdminController.getMyProfile);

router.post(
	"/recruiters",
	auth(Role.ADMIN),
	validateRequest(AdminValidation.createRecruiter),
	AdminController.createRecruiter,
);

export const AdminRoutes = router;
