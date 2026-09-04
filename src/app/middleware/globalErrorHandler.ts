import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { ZodError } from "zod";
import { Prisma } from "../../generated/prisma/client";

import config from "../config";

type AppError = Error & {
	statusCode?: number;
};

export const globalErrorHandler = (
	err: unknown,
	_req: Request,
	res: Response,
	_next: NextFunction,
) => {
	if (config.node_env === "development") {
		console.error("Error from Global Error Handler:", err);
	}

	let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
	let message = "Internal Server Error";
	let errors: unknown[] = [];

	if (err instanceof ZodError) {
		statusCode = httpStatus.BAD_REQUEST;
		message = "Validation failed";
		errors = err.issues.map((issue) => ({
			field: issue.path.join("."),
			message: issue.message,
		}));
	} else if (err instanceof Prisma.PrismaClientValidationError) {
		statusCode = httpStatus.BAD_REQUEST;
		message = "Invalid data provided";
	} else if (err instanceof Prisma.PrismaClientKnownRequestError) {
		if (err.code === "P2002") {
			statusCode = httpStatus.CONFLICT;
			message = "A record with this value already exists";
		} else if (err.code === "P2003") {
			statusCode = httpStatus.BAD_REQUEST;
			message = "Foreign key constraint failed";
		} else if (err.code === "P2025") {
			statusCode = httpStatus.NOT_FOUND;
			message = "The requested record was not found";
		}
	} else if (err instanceof Prisma.PrismaClientInitializationError) {
		if (err.errorCode === "P1000") {
			statusCode = httpStatus.UNAUTHORIZED;
			message = "Database authentication failed";
		} else if (err.errorCode === "P1001") {
			statusCode = httpStatus.SERVICE_UNAVAILABLE;
			message = "Database server is unreachable";
		} else {
			statusCode = httpStatus.INTERNAL_SERVER_ERROR;
			message = "Database initialization failed";
		}
	} else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
		statusCode = httpStatus.INTERNAL_SERVER_ERROR;
		message = "An error occurred during database operation";
	} else if (err instanceof Error) {
		const appError = err as AppError;

		if (appError.statusCode) {
			statusCode = appError.statusCode;
		}

		message = appError.message || "Internal Server Error";
	}

	res.status(statusCode).json({
		success: false,
		message,
		errors,
	});
};
