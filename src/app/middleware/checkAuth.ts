import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import type { Role } from "../../generated/prisma/enums";
import config from "../config";
import { prisma } from "../lib/prisma";
import { catchAsync } from "../utils/catchAsync";
import { jwtUtils } from "../utils/jwt";

declare global {
	namespace Express {
		interface Request {
			user?: {
				email: string;
				name: string;
				userId: string;
				role: Role;
			};
		}
	}
}

export const auth = (...requiredRoles: Role[]) => {
	return catchAsync(
		async (req: Request, _res: Response, next: NextFunction) => {
			/*
			 * Get access token from:
			 * 1. HTTP-only cookie
			 * 2. Authorization Bearer header
			 */
			const token = req.cookies.accessToken
				? req.cookies.accessToken
				: req.headers.authorization?.startsWith("Bearer ")
					? req.headers.authorization.split(" ")[1]
					: undefined;

			if (!token) {
				throw new Error(
					"You are not logged in. Please log in to access this resource.",
				);
			}

			/*
			 * Verify JWT
			 */
			const verifiedToken = jwtUtils.verifyToken(
				token,
				config.jwt_access_secret,
			);

			if (!verifiedToken.success) {
				throw new Error(verifiedToken.error);
			}

			const payload = verifiedToken.data as JwtPayload;

			const { email, name, userId, role } = payload;

			/*
			 * Validate required JWT payload fields
			 */
			if (
				typeof email !== "string" ||
				typeof name !== "string" ||
				typeof userId !== "string" ||
				!role
			) {
				throw new Error("Invalid authentication token");
			}

			/*
			 * Role-based authorization
			 */
			if (requiredRoles.length > 0 && !requiredRoles.includes(role)) {
				throw new Error(
					"Forbidden. You don't have permission to access this resource.",
				);
			}

			/*
			 * Verify user still exists and account is active
			 */
			const user = await prisma.user.findUnique({
				where: {
					id: userId,
				},
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
					status: true,
					isDeleted: true,
				},
			});

			if (!user) {
				throw new Error("User not found. Please log in again.");
			}

			if (user.isDeleted || user.status === "DELETED") {
				throw new Error("Your account has been deleted.");
			}

			if (user.status === "BLOCKED") {
				throw new Error(
					"Your account has been blocked. Please contact support.",
				);
			}

			/*
			 * Make sure the JWT still matches the current user data
			 */
			if (user.email !== email || user.name !== name || user.role !== role) {
				throw new Error("Authentication information is no longer valid.");
			}

			/*
			 * Attach authenticated user to request
			 */
			req.user = {
				email: user.email,
				name: user.name,
				userId: user.id,
				role: user.role,
			};

			next();
		},
	);
};
