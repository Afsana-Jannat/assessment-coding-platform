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
import { AuthRoutes } from './app/module/auth/auth.route';
import { CandidateRoutes } from './app/module/candidate/candidate.route';
import { RecruiterRoutes } from './app/module/recruiter/recruiter.route';

const app: Application = express();

app.use(helmet());

app.use(
  cors({
    origin: config.frontend_url,
    credentials: true,
  })
);

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/auth', AuthRoutes);
app.use('/api/v1/candidates', CandidateRoutes);
app.use('/api/v1/recruiters', RecruiterRoutes);

// Basic route
app.get('/', async (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Welcome to Developer Assessment & Conding Platform Backend',
  });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
