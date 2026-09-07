import { Request, Response } from 'express';
import httpStatus from 'http-status';

import { ReportsService } from './reports.service';

const getAuthenticatedUserId = (req: Request): string => {
  const userId = req.user?.userId;

  if (!userId) {
    const error = new Error('Authentication required');

    Object.assign(error, {
      statusCode: httpStatus.UNAUTHORIZED,
    });

    throw error;
  }

  return userId;
};

const getDateFilters = (req: Request) => {
  const { from, to } = req.query;

  const filters: {
    from?: Date;
    to?: Date;
  } = {};

  if (from) {
    filters.from = new Date(String(from));
  }

  if (to) {
    filters.to = new Date(String(to));
    filters.to.setHours(23, 59, 59, 999);
  }

  return filters;
};

const getRecruiterOverview = async (req: Request, res: Response) => {
  const userId = getAuthenticatedUserId(req);

  const result = await ReportsService.getRecruiterOverview(
    userId,
    getDateFilters(req)
  );

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: 'Recruiter report overview retrieved successfully',
    data: result,
  });
};

const getAssessmentReport = async (req: Request, res: Response) => {
  const userId = getAuthenticatedUserId(req);
  const assessmentId = String(req.params.assessmentId);

  const result = await ReportsService.getAssessmentReport(userId, assessmentId);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: 'Assessment report retrieved successfully',
    data: result,
  });
};

const getCandidateReport = async (req: Request, res: Response) => {
  const userId = getAuthenticatedUserId(req);
  const candidateId = String(req.params.candidateId);

  const result = await ReportsService.getCandidateReport(userId, candidateId);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: 'Candidate report retrieved successfully',
    data: result,
  });
};

const getRecruiterRevenue = async (req: Request, res: Response) => {
  const userId = getAuthenticatedUserId(req);

  const result = await ReportsService.getRecruiterRevenue(
    userId,
    getDateFilters(req)
  );

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: 'Revenue report retrieved successfully',
    data: result,
  });
};

const getAdminOverview = async (req: Request, res: Response) => {
  const result = await ReportsService.getAdminOverview(getDateFilters(req));

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: 'Admin report overview retrieved successfully',
    data: result,
  });
};

const getAdminRevenue = async (req: Request, res: Response) => {
  const result = await ReportsService.getAdminRevenue(getDateFilters(req));

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: 'Admin revenue report retrieved successfully',
    data: result,
  });
};

const getAdminAssessmentReport = async (req: Request, res: Response) => {
  const result = await ReportsService.getAdminAssessmentReport(
    getDateFilters(req)
  );

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: 'Admin assessment report retrieved successfully',
    data: result,
  });
};

const getAdminCandidateReport = async (req: Request, res: Response) => {
  const result = await ReportsService.getAdminCandidateReport(
    getDateFilters(req)
  );

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: 'Admin candidate report retrieved successfully',
    data: result,
  });
};

export const ReportsController = {
  getRecruiterOverview,
  getAssessmentReport,
  getCandidateReport,
  getRecruiterRevenue,

  getAdminOverview,
  getAdminRevenue,
  getAdminAssessmentReport,
  getAdminCandidateReport,
};
