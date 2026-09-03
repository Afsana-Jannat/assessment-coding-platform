import { z } from "zod";

const updateCandidateProfileSchema = z.object({
	body: z.object({
		name: z
			.string()
			.trim()
			.min(2, "Name must be at least 2 characters long")
			.max(100, "Name must not exceed 100 characters")
			.optional(),

		skills: z
			.array(z.string().trim().min(1, "Skill cannot be empty"))
			.max(20, "You can add up to 20 skills")
			.optional(),

		experience: z
			.string()
			.trim()
			.max(2000, "Experience must not exceed 2000 characters")
			.nullable()
			.optional(),

		education: z
			.string()
			.trim()
			.max(2000, "Education must not exceed 2000 characters")
			.nullable()
			.optional(),

		phone: z
			.string()
			.trim()
			.regex(/^[0-9+\-\s()]{7,20}$/, "Please provide a valid phone number")
			.nullable()
			.optional(),

		dateOfBirth: z.coerce.date().nullable().optional(),

		gender: z.enum(["MALE", "FEMALE", "OTHER"]).nullable().optional(),

		address: z
			.string()
			.trim()
			.max(500, "Address must not exceed 500 characters")
			.nullable()
			.optional(),
	}),
});

export const CandidateValidation = {
	updateCandidateProfileSchema,
};
