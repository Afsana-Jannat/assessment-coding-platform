# Developer Assessment & Coding Platform

A backend system for conducting and managing developer assessments online.

The platform allows recruiters to create assessments, add different types of questions, invite candidates, manage assessment attempts, evaluate submissions, process payments, and view performance reports.

Administrators can manage users and candidates, monitor platform statistics, view revenue information, and track important system activities through audit logs.

The main goal of this project is to build a practical and maintainable assessment platform with a proper backend architecture rather than just a collection of basic CRUD APIs.

---

## What can this platform do?

The platform covers the complete assessment workflow:

Recruiter
↓
Create Assessment
↓
Add Questions
↓
Publish Assessment
↓
Invite Candidate
↓
Candidate Accepts Invitation
↓
Start Assessment
↓
Answer Questions
↓
Submit Assessment
↓
Evaluation
↓
Result
↓
Reports & Analytics

It also includes payment processing and administrative monitoring.

---

## Main Features

### Authentication & User Management

- JWT-based authentication
- Role-based access control
- Three user roles:

  - Admin
  - Recruiter
  - Candidate

- User status management
- Protected routes
- Role-specific access to resources

---

### Candidate Management

Recruiters and administrators can manage candidate information.

Features include:

- Candidate profile
- Email and phone information
- Education
- Experience
- Skills
- Resume URL
- Candidate status
- Candidate listing and management
- Soft delete

---

### Recruiter Management

Recruiters can maintain their professional/company information.

A recruiter profile can contain:

- Name
- Email
- Phone
- Designation
- Company name
- Company logo
- Company website
- Company description

Recruiter-specific resources are protected so that one recruiter cannot access another recruiter's private assessment data.

---

### Assessment Management

Recruiters can create and manage developer assessments.

An assessment contains information such as:

- Title
- Description
- Instructions
- Duration
- Total marks
- Passing marks
- Start/end time
- Assessment status

Assessment statuses include:

text
DRAFT
PUBLISHED
ONGOING
COMPLETED
ARCHIVED

Assessments also support soft deletion.

---

### Question Management

Different types of questions are supported:

MCQ
WRITTEN
CODING

Questions can have:

- Marks
- Order
- Difficulty level
- Explanation
- Reference answer
- MCQ options
- Soft delete support

Difficulty levels:

EASY
MEDIUM
HARD

---

### Candidate Invitations

Recruiters can invite candidates to specific assessments.

The invitation workflow supports:

PENDING
ACCEPTED
DECLINED
EXPIRED

An invitation can also have:

- Invitation date
- Expiration date
- Custom message

A candidate and assessment combination is uniquely controlled to prevent duplicate invitations.

---

### Assessment Attempts & Timer

Candidates can start an assessment after receiving an invitation.

The system keeps track of:

- Start time
- Submission time
- Attempt status
- Score
- Percentage
- Answers

Attempt statuses:

IN_PROGRESS
SUBMITTED
TIME_EXPIRED

The timer-based workflow helps ensure that candidates cannot continue an assessment beyond its allowed duration.

---

### Answer & Submission

Candidates can submit answers for assessment questions.

The system supports:

- Text answers
- MCQ option selection
- Correctness tracking
- Marks obtained
- Answer timestamps

Each question can have only one answer within a particular attempt.

---

### Evaluation

Recruiters can evaluate candidate submissions.

Evaluation includes:

- Marks obtained
- Recruiter feedback
- Evaluation timestamp
- Recruiter information

This is particularly useful for written and coding questions where manual evaluation may be required.

---

### Results

Assessment attempts store the final result information.

The system keeps:

- Score
- Percentage
- Passing marks
- Pass/fail status

The existing attempt result data is reused by the reporting system instead of creating unnecessary duplicate report/result tables.

---

## Payment System

The platform includes payment functionality for assessments.

Currently supported payment methods include:

Stripe
bKash

Payment statuses:

text
PENDING
PAID
FAILED
CANCELLED
REFUNDED

The system tracks:

- Amount
- Currency
- Payment method
- Transaction ID
- Payment status
- Payment date

The payment module is designed so payment information can also be used in revenue reports.

---

## Reports & Analytics

The project includes a separate reporting module.

Reports are generated from existing application data, so there is no unnecessary `Report` database table.

### Recruiter Reports

Recruiters can view:

- Overall assessment statistics
- Published assessments
- Invitation statistics
- Candidate attempts
- Submission statistics
- Pass/fail statistics
- Average percentage
- Assessment-specific performance
- Candidate-specific performance
- Revenue information

Available endpoints:

http
GET /api/v1/reports/overview
GET /api/v1/reports/assessments/:assessmentId
GET /api/v1/reports/candidates/:candidateId
GET /api/v1/reports/revenue

Recruiters can only access reports related to their own resources.

---

## Admin Statistics

Administrators have access to platform-wide statistics.

Admin reports include:

### User Statistics

- Total users
- Admins
- Recruiters
- Candidates
- Active users
- Blocked users

### Assessment Statistics

- Total assessments
- Published
- Draft
- Ongoing
- Completed
- Archived

### Invitation Statistics

- Total invitations
- Accepted
- Pending
- Declined
- Expired

### Attempt Statistics

- Total attempts
- Submitted
- In progress
- Time expired

### Performance Statistics

- Average percentage
- Pass rate
- Passed candidates
- Failed candidates

### Revenue Statistics

- Total payments
- Paid payments
- Pending payments
- Failed payments
- Cancelled payments
- Refunded payments
- Total payment amount
- Actual paid revenue
- Payment-method breakdown

Admin endpoints:

http
GET /api/v1/reports/admin/overview
GET /api/v1/reports/admin/revenue
GET /api/v1/reports/admin/assessments
GET /api/v1/reports/admin/candidates

---

## Audit Logs

Important system activities can be tracked through audit logs.

Each log stores information such as:

text
Action
Entity
Entity ID
Details
User
Created At

The audit log API is available only to administrators.

http
GET /api/v1/audit-logs

It supports:

- Pagination
- Action filtering
- Entity filtering
- User filtering
- Date filtering
- Latest-first sorting

Example:

http
GET /api/v1/audit-logs?page=1&limit=10

or:

http
GET /api/v1/audit-logs?action=BLOCK&entity=CANDIDATE

This makes it easier to understand who performed important actions and when they happened.

---

# Tech Stack

## Backend

- Node.js
- Express.js
- TypeScript

## Database

- PostgreSQL
- Prisma ORM

## Authentication

- JWT
- Role-Based Access Control

## Validation

- Zod

## Payment

- Stripe
- bKash

## API Testing

- Postman

## Development

- Git
- npm
- Prisma CLI

---

# Project Structure

The project follows a modular backend architecture.

text
src/
├── app/
│ ├── middleware/
│ ├── module/
│ │ ├── admin/
│ │ ├── answer/
│ │ ├── assessment/
│ │ ├── attempt/
│ │ ├── auth/
│ │ ├── candidate/
│ │ ├── evaluation/
│ │ ├── invitation/
│ │ ├── payment/
│ │ ├── recruiter/
│ │ ├── reports/
│ │ └── auditLog/
│ ├── ...
│ ├── app.ts
│ └── server.ts
│
prisma/
├── migrations/
├── schema/
│ ├── answer.prisma
│ ├── assessment.prisma
│ ├── attempt.prisma
│ ├── audit-log.prisma
│ ├── candidate.prisma
│ ├── config.prisma
│ ├── enums.prisma
│ ├── evaluation.prisma
│ ├── invitation.prisma
│ ├── option.prisma
│ ├── payment.prisma
│ ├── question.prisma
│ ├── recruiter.prisma
│ └── user.prisma
└── seed.ts

Each module follows a simple structure:

text
module/
├── controller.ts
├── route.ts
├── service.ts
└── validation.ts

This keeps routing, business logic, validation, and HTTP responses separated from each other.

---

# Database Models

The main database entities are:

text
User
Candidate
Recruiter
Assessment
Question
Option
Invitation
Attempt
Answer
Evaluation
Payment
AuditLog

Relationship overview:

text
User
├── Candidate
└── Recruiter

Recruiter
├── Assessments
├── Payments
└── Evaluations

Assessment
├── Questions
├── Invitations
├── Attempts
└── Payments

Attempt
└── Answers

Answer
└── Evaluation

User
└── Audit Logs

The database also uses indexes and unique constraints for better query performance and data integrity.

---

# Soft Delete

Some important resources use soft deletion instead of immediately removing database records.

Currently this approach is used for entities such as:

- Candidates
- Recruiters
- Assessments
- Questions

The records use:

text
isDeleted
deletedAt

This helps preserve historical information and keeps reporting/audit data meaningful.

---

# Getting Started

## 1. Clone the repository

git clone <your-repository-url>
cd <project-directory>

## 2. Install dependencies

npm install

## 3. Configure environment variables

Create a `.env` file in the project root.

Example:

env
NODE_ENV=development
PORT=5000

DATABASE_URL="your-postgresql-database-url"

JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"

JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

STRIPE_SECRET_KEY="your-stripe-secret-key"

BKASH_APP_KEY="your-bkash-app-key"
BKASH_APP_SECRET="your-bkash-app-secret"
BKASH_USERNAME="your-bkash-username"
BKASH_PASSWORD="your-bkash-password"
BKASH_BASE_URL="your-bkash-base-url"

FRONTEND_URL="http://localhost:3000"

> Never commit your `.env` file or real API credentials to GitHub.

---

## 4. Generate Prisma Client

npx prisma generate

## 5. Run database migrations

For development:

npx prisma migrate dev

For production:

npx prisma migrate deploy

## 6. Seed the database

If seed data is configured:

npx prisma db seed

## 7. Run the server

npm run dev

The API will run on the configured port.

---

# API Base URL

The API uses:
/api/v1

Main modules:
/api/v1/auth
/api/v1/admin
/api/v1/candidates
/api/v1/recruiters
/api/v1/assessments
/api/v1/questions
/api/v1/invitations
/api/v1/attempts
/api/v1/answers
/api/v1/evaluation
/api/v1/payment
/api/v1/reports
/api/v1/audit-logs

# API Authentication

Protected endpoints require a JWT access token.
Use:
Authorization: Bearer <access-token>

For JSON requests:
Content-Type: application/json

Access is controlled according to the authenticated user's role.

For example:
Admin → Administrative resources
Recruiter → Recruitment and assessment resources
Candidate → Candidate assessment workflow

# Validation & Error Handling

The API uses request validation to prevent invalid data from reaching the business logic.

Zod is used for validation.

The backend also follows centralized error handling so API errors return a consistent response structure.

Typical response format:

{
"success": false,
"statusCode": 400,
"message": "Validation failed"
}

Successful responses follow a similar consistent structure:

{
"success": true,
"statusCode": 200,
"message": "Request successful",
"data": {}
}

---

# Testing

The API has been tested during development using Postman.

Important areas to test before production deployment:

- Authentication
- Role-based authorization
- Candidate management
- Assessment CRUD
- Question CRUD
- Assessment publishing
- Invitations
- Attempt and timer workflow
- Answer submission
- Evaluation
- Results
- Payments
- Recruiter reports
- Admin statistics
- Audit logs
- Validation errors
- Unauthorized requests

Basic project checks:

npx prisma validate

npx prisma migrate status

npm run build

# Security

Some of the security practices used in this project include:

- JWT authentication
- Role-based authorization
- Request validation
- Protected API routes
- Centralized error handling
- Environment variables for secrets
- Database constraints
- Database indexes
- Soft deletion
- Resource ownership checks
- Admin-only audit logs

For production, the application should also be configured with HTTPS, secure production secrets, appropriate CORS settings, rate limiting, secure headers, and production payment credentials.

A typical production deployment involves:

1. Configure PostgreSQL
2. Add production environment variables
3. Install dependencies
4. Generate Prisma Client
5. Run Prisma migrations
6. Build TypeScript
7. Start the production server
8. Configure CORS
9. Configure payment credentials
10. Test the production API

# Project Status

The main development workflow is complete.

Current status:

Authentication & User System ✅
Admin Candidate Management ✅
Assessment CRUD ✅
Question CRUD ✅
Assessment Publishing ✅
Invitation System ✅
Attempt & Timer ✅
Answer & Submission ✅
Evaluation ✅
Result ✅
Payment ✅
Reports & Analytics ✅
Admin Statistics ✅
Audit Logs API ✅
Testing & Quality Checks ✅

# Why I Built This Project

I built this project to work on a real-world backend problem rather than only implementing basic CRUD operations.

While developing it, I focused on:

- Designing a modular backend
- Working with relational database relationships
- Implementing role-based access control
- Handling timed assessment workflows
- Managing candidate and recruiter data
- Integrating payment systems
- Building meaningful analytics
- Maintaining audit history
- Validating API requests
- Keeping business logic inside service layers
- Making the application easier to test and extend

The project helped me practice how different backend features work together in a larger application.
