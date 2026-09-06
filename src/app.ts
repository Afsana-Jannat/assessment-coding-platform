import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, {
  type Application,
  type Request,
  type Response,
} from 'express';
import helmet from 'helmet';
import httpStatus from 'http-status';
import config from './app/config';
import { globalErrorHandler } from './app/middleware/globalErrorHandler';
import { notFound } from './app/middleware/notFound';
import { AdminRoutes } from './app/module/admin/admin.route';
import { AuthRoutes } from './app/module/auth/auth.route';
import { CandidateRoutes } from './app/module/candidate/candidate.route';
import { RecruiterRoutes } from './app/module/recruiter/recruiter.route';
import { AssessmentRoutes } from './app/module/assessment/assessment.route';
import { InvitationRoutes } from './app/module/invitation/invitation.route';
import { AttemptRoutes } from './app/module/attempt/attempt.route';
import { AnswerRoutes } from './app/module/answer/answer.route';
import { EvaluationRoutes } from './app/module/evaluation/evaluation.routes';

const app: Application = express();

app.use(helmet());

app.use(
  cors({
    origin: config.frontend_url,
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));

app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/auth', AuthRoutes);
app.use('/api/v1/candidates', CandidateRoutes);
app.use('/api/v1/recruiters', RecruiterRoutes);
app.use('/api/v1/admin', AdminRoutes);
app.use('/api/v1/assessments', AssessmentRoutes);
app.use('/api/v1/invitations', InvitationRoutes);
app.use('/api/v1/attempts', AttemptRoutes);
app.use('/api/v1/answers', AnswerRoutes);
app.use('/api/v1/evaluations', EvaluationRoutes);

app.get('/', async (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Welcome to Developer Assessment & Conding Platform Backend',
  });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
