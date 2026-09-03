import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";
import { CandidateService } from "./candidate.service";

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
	if (!req.user) {
		throw new Error("Authentication required");
	}

	const candidate = await CandidateService.getMyProfile(req.user.userId);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Candidate profile retrieved successfully",
		data: candidate,
	});
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
	if (!req.user) {
		throw new Error("Authentication required");
	}

	const candidate = await CandidateService.updateMyProfile(
		req.user.userId,
		req.body,
	);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Candidate profile updated successfully",
		data: candidate,
	});
});

const uploadResume = catchAsync(async (req: Request, res: Response) => {
	if (!req.user) {
		throw new Error("Authentication required");
	}

	if (!req.file) {
		throw new Error("Resume file is required");
	}

	const result = await uploadToCloudinary(
		req.file.buffer,
		req.file.originalname,
	);

	const candidate = await CandidateService.uploadResume(
		req.user.userId,
		result.secure_url,
	);

	res.status(httpStatus.OK).json({
		success: true,
		message: "Resume uploaded successfully",
		data: candidate,
	});
});

export const CandidateController = {
	getMyProfile,
	updateMyProfile,
	uploadResume,
};
