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

type GetRecruitersQuery = {
	page: number;
	limit: number;
	search?: string;
	sortBy: "name" | "email" | "companyName" | "createdAt" | "updatedAt";
	sortOrder: "asc" | "desc";
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
		Object.assign(error, {
			statusCode: httpStatus.NOT_FOUND,
		});
		throw error;
	}

	if (admin.role !== "ADMIN") {
		const error = new Error("Admin access required");
		Object.assign(error, {
			statusCode: httpStatus.FORBIDDEN,
		});
		throw error;
	}

	if (admin.isDeleted) {
		const error = new Error("Admin account has been deleted");
		Object.assign(error, {
			statusCode: httpStatus.NOT_FOUND,
		});
		throw error;
	}

	return admin;
};

const getRecruiters = async (query: GetRecruitersQuery) => {
	const { page, limit, search, sortBy, sortOrder } = query;

	const skip = (page - 1) * limit;

	const where = {
		isDeleted: false,
		...(search
			? {
					OR: [
						{
							name: {
								contains: search,
								mode: "insensitive" as const,
							},
						},
						{
							email: {
								contains: search,
								mode: "insensitive" as const,
							},
						},
						{
							companyName: {
								contains: search,
								mode: "insensitive" as const,
							},
						},
					],
				}
			: {}),
	};

	const orderBy = {
		[sortBy]: sortOrder,
	};

	const [recruiters, total] = await prisma.$transaction([
		prisma.recruiter.findMany({
			where,
			skip,
			take: limit,
			orderBy,
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
				isDeleted: true,
				deletedAt: true,
				createdAt: true,
				updatedAt: true,
			},
		}),

		prisma.recruiter.count({
			where,
		}),
	]);

	const totalPages = Math.ceil(total / limit);

	return {
		recruiters,
		meta: {
			page,
			limit,
			total,
			totalPages,
		},
	};
};

type UpdateRecruiterStatusInput = {
	id: string;
	status: "ACTIVE" | "BLOCKED";
};

const updateRecruiterStatus = async ({
	id,
	status,
}: UpdateRecruiterStatusInput) => {
	const recruiter = await prisma.recruiter.findUnique({
		where: {
			id,
		},
		select: {
			id: true,
			userId: true,
			name: true,
			email: true,
			isDeleted: true,
		},
	});

	if (!recruiter) {
		const error = new Error("Recruiter not found");
		Object.assign(error, {
			statusCode: httpStatus.NOT_FOUND,
		});
		throw error;
	}

	if (recruiter.isDeleted) {
		const error = new Error("Recruiter has been deleted");
		Object.assign(error, {
			statusCode: httpStatus.NOT_FOUND,
		});
		throw error;
	}

	const updatedUser = await prisma.user.update({
		where: {
			id: recruiter.userId,
		},
		data: {
			status,
		},
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			status: true,
			updatedAt: true,
		},
	});

	return updatedUser;
};

export const AdminService = {
	getMyProfile,
	createRecruiter,
	getRecruiters,
	updateRecruiterStatus,
};
