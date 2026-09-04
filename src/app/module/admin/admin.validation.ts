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

export const AdminValidation = {
	createRecruiter,
};
