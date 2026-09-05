import type { Request, Response } from 'express';
import httpStatus from 'http-status';

import { catchAsync } from '../../utils/catchAsync';
import { AdminService } from './admin.service';

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new Error('Authentication required');
  }

  const admin = await AdminService.getMyProfile(req.user.userId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Admin profile retrieved successfully',
    data: admin,
  });
});

const createRecruiter = catchAsync(async (req: Request, res: Response) => {
  const recruiter = await AdminService.createRecruiter(req.body);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Recruiter created successfully',
    data: recruiter,
  });
});

const getRecruiters = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getRecruiters(
    req.validated?.query as {
      page: number;
      limit: number;
      search?: string;
      sortBy: 'name' | 'email' | 'companyName' | 'createdAt' | 'updatedAt';
      sortOrder: 'asc' | 'desc';
    }
  );

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Recruiters retrieved successfully',
    data: result,
  });
});

const getCandidates = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getCandidates(
    req.validated?.query as {
      page: number;
      limit: number;
      search?: string;
      status?: 'ACTIVE' | 'BLOCKED' | 'DELETED';
      sortBy: 'name' | 'email' | 'createdAt' | 'updatedAt';
      sortOrder: 'asc' | 'desc';
    }
  );

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Candidates retrieved successfully',
    data: result,
  });
});

const getCandidateById = catchAsync(async (req: Request, res: Response) => {
  const params = req.validated?.params as { id: string };

  const candidate = await AdminService.getCandidateById(params.id);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Candidate retrieved successfully',
    data: candidate,
  });
});

const updateCandidate = catchAsync(async (req: Request, res: Response) => {
  const params = req.validated?.params as { id: string };

  const data = req.validated?.body as {
    name?: string;
    phone?: string | null;
    address?: string | null;
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
    dateOfBirth?: Date | null;
    skills?: string[];
    experience?: string | null;
    education?: string | null;
  };

  const candidate = await AdminService.updateCandidate({
    id: params.id,
    data,
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Candidate updated successfully',
    data: candidate,
  });
});

const updateRecruiterStatus = catchAsync(
  async (req: Request, res: Response) => {
    const params = req.validated?.params as { id: string };
    const body = req.validated?.body as {
      status: 'ACTIVE' | 'BLOCKED';
    };

    const recruiter = await AdminService.updateRecruiterStatus({
      id: params.id,
      status: body.status,
    });

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Recruiter status updated successfully',
      data: recruiter,
    });
  }
);

const updateCandidateStatus = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('Authentication required');
    }

    const params = req.validated?.params as { id: string };

    const body = req.validated?.body as {
      status: 'ACTIVE' | 'BLOCKED';
    };

    const candidate = await AdminService.updateCandidateStatus({
      id: params.id,
      status: body.status,
      adminUserId: req.user.userId,
    });

    res.status(httpStatus.OK).json({
      success: true,
      message: `Candidate ${
        body.status === 'BLOCKED' ? 'blocked' : 'unblocked'
      } successfully`,
      data: candidate,
    });
  }
);

export const AdminController = {
  getMyProfile,
  createRecruiter,
  getRecruiters,
  getCandidates,
  getCandidateById,
  updateCandidate,
  updateCandidateStatus,
  updateRecruiterStatus,
};
