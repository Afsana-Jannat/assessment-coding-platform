import type { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { AdminService } from "./admin.service";

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
	if (!req.user) {
		throw new Error("Authentication required");
	}

	const admin = await AdminService.getMyProfile(req.user.userId);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Admin profile retrieved successfully",
		data: admin,
	});
});

const createRecruiter = catchAsync(async (req: Request, res: Response) => {
	const recruiter = await AdminService.createRecruiter(req.body);

	res.status(httpStatus.CREATED).json({
		success: true,
		message: "Recruiter created successfully",
		data: recruiter,
	});
});

export const AdminController = {
	getMyProfile,
	createRecruiter,
};
