import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({
	connectionString,
});

const prisma = new PrismaClient({
	adapter,
});

const DEMO_PASSWORD = "Demo@123456";

const seed = async () => {
	// =========================
	// Environment Configuration
	// =========================

	const realAdminEmail = process.env.ADMIN_EMAIL;
	const realAdminPassword = process.env.ADMIN_PASSWORD;

	if (!realAdminEmail || !realAdminPassword) {
		throw new Error(
			"ADMIN_EMAIL and ADMIN_PASSWORD must be configured in .env",
		);
	}

	if (realAdminEmail === "admin@assessment.com") {
		throw new Error("ADMIN_EMAIL cannot be the same as the demo admin email");
	}

	const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
	const realAdminHashedPassword = await bcrypt.hash(realAdminPassword, 10);

	// =========================
	// Real Admin
	// =========================

	const realAdmin = await prisma.user.upsert({
		where: {
			email: realAdminEmail,
		},
		update: {
			name: "Platform Admin",
			role: "ADMIN",
			status: "ACTIVE",
			isDeleted: false,
			deletedAt: null,
			password: realAdminHashedPassword,
			authProvider: "CREDENTIAL",
			emailVerified: true,
		},
		create: {
			name: "Platform Admin",
			email: realAdminEmail,
			password: realAdminHashedPassword,
			role: "ADMIN",
			status: "ACTIVE",
			authProvider: "CREDENTIAL",
			emailVerified: true,
		},
	});

	// =========================
	// Demo Admin
	// =========================

	const admin = await prisma.user.upsert({
		where: {
			email: "admin@assessment.com",
		},
		update: {
			name: "Demo Admin",
			role: "ADMIN",
			status: "ACTIVE",
			isDeleted: false,
			deletedAt: null,
			password: hashedPassword,
			authProvider: "CREDENTIAL",
			emailVerified: true,
		},
		create: {
			name: "Demo Admin",
			email: "admin@assessment.com",
			password: hashedPassword,
			role: "ADMIN",
			status: "ACTIVE",
			authProvider: "CREDENTIAL",
			emailVerified: true,
		},
	});

	// =========================
	// Demo Recruiter User
	// =========================

	const recruiterUser = await prisma.user.upsert({
		where: {
			email: "recruiter@assessment.com",
		},
		update: {
			name: "Demo Recruiter",
			role: "RECRUITER",
			status: "ACTIVE",
			isDeleted: false,
			deletedAt: null,
			password: hashedPassword,
			authProvider: "CREDENTIAL",
			emailVerified: true,
		},
		create: {
			name: "Demo Recruiter",
			email: "recruiter@assessment.com",
			password: hashedPassword,
			role: "RECRUITER",
			status: "ACTIVE",
			authProvider: "CREDENTIAL",
			emailVerified: true,
		},
	});

	// =========================
	// Demo Recruiter Profile
	// =========================

	await prisma.recruiter.upsert({
		where: {
			userId: recruiterUser.id,
		},
		update: {
			name: "Demo Recruiter",
			email: "recruiter@assessment.com",
			companyName: "Assessment Tech Ltd.",
			designation: "Technical Recruiter",
			companyWebsite: "https://example.com",
			isDeleted: false,
			deletedAt: null,
		},
		create: {
			userId: recruiterUser.id,
			name: "Demo Recruiter",
			email: "recruiter@assessment.com",
			companyName: "Assessment Tech Ltd.",
			designation: "Technical Recruiter",
			companyWebsite: "https://example.com",
		},
	});

	// =========================
	// Demo Candidate User
	// =========================

	const candidateUser = await prisma.user.upsert({
		where: {
			email: "candidate@assessment.com",
		},
		update: {
			name: "Demo Candidate",
			role: "CANDIDATE",
			status: "ACTIVE",
			isDeleted: false,
			deletedAt: null,
			password: hashedPassword,
			authProvider: "CREDENTIAL",
			emailVerified: true,
		},
		create: {
			name: "Demo Candidate",
			email: "candidate@assessment.com",
			password: hashedPassword,
			role: "CANDIDATE",
			status: "ACTIVE",
			authProvider: "CREDENTIAL",
			emailVerified: true,
		},
	});

	// =========================
	// Demo Candidate Profile
	// =========================

	await prisma.candidate.upsert({
		where: {
			userId: candidateUser.id,
		},
		update: {
			name: "Demo Candidate",
			email: "candidate@assessment.com",
			isDeleted: false,
			deletedAt: null,
		},
		create: {
			userId: candidateUser.id,
			name: "Demo Candidate",
			email: "candidate@assessment.com",
			skills: ["JavaScript", "TypeScript", "React", "Node.js"],
		},
	});

	// =========================
	// Seed Summary
	// =========================

	console.log("✅ Seed completed successfully!");
	console.log("");

	console.log("Demo Accounts:");
	console.log("Admin:     admin@assessment.com");
	console.log("Recruiter: recruiter@assessment.com");
	console.log("Candidate: candidate@assessment.com");
	console.log(`Password:  ${DEMO_PASSWORD}`);

	console.log("");

	console.log(`Real Admin: ${realAdmin.email}`);

	console.log("");

	console.log(`Demo Admin ID: ${admin.id}`);
	console.log(`Real Admin ID: ${realAdmin.id}`);
	console.log(`Recruiter User ID: ${recruiterUser.id}`);
	console.log(`Candidate User ID: ${candidateUser.id}`);
};

seed()
	.catch((error) => {
		console.error("❌ Seed failed:", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
