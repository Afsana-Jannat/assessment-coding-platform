import type { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { RecruiterService } from "./recruiter.service";

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
	if (!req.user) {
		throw new Error("Authentication required");
	}

	const recruiter = await RecruiterService.getMyProfile(req.user.userId);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Recruiter profile retrieved successfully",
		data: recruiter,
	});
});

export const RecruiterController = {
	getMyProfile,
};
