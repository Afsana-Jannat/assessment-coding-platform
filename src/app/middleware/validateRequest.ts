import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodType } from "zod";

type ValidatedRequest = {
	body?: unknown;
	query?: unknown;
	params?: unknown;
};

declare global {
	namespace Express {
		interface Request {
			validated?: ValidatedRequest;
		}
	}
}

export const validateRequest = (schema: ZodType) => {
	return (req: Request, res: Response, next: NextFunction) => {
		try {
			const validatedData = schema.parse({
				body: req.body,
				query: req.query,
				params: req.params,
			}) as ValidatedRequest;

			req.validated = validatedData;

			next();
		} catch (error) {
			if (error instanceof ZodError) {
				res.status(400).json({
					success: false,
					message: "Validation failed",
					errors: error.issues.map((issue) => ({
						field: issue.path.join("."),
						message: issue.message,
					})),
				});
				return;
			}

			next(error);
		}
	};
};
