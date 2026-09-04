import bcrypt from "bcryptjs";
import httpStatus from "http-status";

import { prisma } from "../../lib/prisma";

type CreateRecruiterInput = {
	name: string;
	email: string;
	password: string;
	phone?: string;
	designation?: string;
	companyName?: string;
	companyWebsite?: string;
	companyDescription?: string;
};

const createRecruiter = async (data: CreateRecruiterInput) => {
	const hashedPassword = await bcrypt.hash(data.password, 10);

	const recruiter = await prisma.$transaction(async (tx) => {
		const user = await tx.user.create({
			data: {
				name: data.name,
				email: data.email,
				password: hashedPassword,
				role: "RECRUITER",
				status: "ACTIVE",
				authProvider: "CREDENTIAL",
				emailVerified: true,
			},
		});

		const recruiterProfile = await tx.recruiter.create({
			data: {
				userId: user.id,
				name: data.name,
				email: data.email,
				phone: data.phone,
				designation: data.designation,
				companyName: data.companyName,
				companyWebsite: data.companyWebsite,
				companyDescription: data.companyDescription,
			},
			select: {
				id: true,
				userId: true,
				name: true,
				email: true,
				phone: true,
				designation: true,
				companyName: true,
				companyLogo: true,
				companyWebsite: true,
				companyDescription: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		return recruiterProfile;
	});

	return recruiter;
};

const getMyProfile = async (userId: string) => {
	const admin = await prisma.user.findUnique({
		where: {
			id: userId,
		},
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			status: true,
			emailVerified: true,
			isDeleted: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	if (!admin) {
		const error = new Error("Admin profile not found");
		Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
		throw error;
	}

	if (admin.role !== "ADMIN") {
		const error = new Error("Admin access required");
		Object.assign(error, { statusCode: httpStatus.FORBIDDEN });
		throw error;
	}

	if (admin.isDeleted) {
		const error = new Error("Admin account has been deleted");
		Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
		throw error;
	}

	return admin;
};

export const AdminService = {
	getMyProfile,
	createRecruiter,
};
