import { z } from "zod";

const createRecruiter = z.object({
	body: z.object({
		name: z.string().trim().min(2, "Name must be at least 2 characters long"),

		email: z.string().trim().email("Please provide a valid email address"),

		password: z.string().min(8, "Password must be at least 8 characters long"),

		phone: z.string().trim().optional(),

		designation: z.string().trim().optional(),

		companyName: z.string().trim().optional(),

		companyWebsite: z
			.string()
			.trim()
			.url("Please provide a valid company website URL")
			.optional(),

		companyDescription: z.string().trim().optional(),
	}),
});

const getRecruiters = z.object({
	query: z.object({
		page: z
			.string()
			.regex(/^\d+$/, "Page must be a positive number")
			.transform(Number)
			.refine((value) => value >= 1, {
				message: "Page must be at least 1",
			})
			.optional()
			.default(1),

		limit: z
			.string()
			.regex(/^\d+$/, "Limit must be a positive number")
			.transform(Number)
			.refine((value) => value >= 1 && value <= 100, {
				message: "Limit must be between 1 and 100",
			})
			.optional()
			.default(10),

		search: z.string().trim().min(1, "Search value cannot be empty").optional(),

		sortBy: z
			.enum(["name", "email", "companyName", "createdAt", "updatedAt"])
			.optional()
			.default("createdAt"),

		sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
	}),
});

const updateRecruiterStatus = z.object({
	params: z.object({
		id: z.string().uuid("Invalid recruiter ID"),
	}),

	body: z.object({
		status: z.enum(["ACTIVE", "BLOCKED"], {
			message: "Status must be either ACTIVE or BLOCKED",
		}),
	}),
});

export const AdminValidation = {
	createRecruiter,
	getRecruiters,
	updateRecruiterStatus,
};
