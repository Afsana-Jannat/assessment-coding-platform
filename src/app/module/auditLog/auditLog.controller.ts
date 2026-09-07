import { Request, Response } from 'express';
import httpStatus from 'http-status';

import { AuditLogService } from './auditLog.service';

const getAuditLogs = async (req: Request, res: Response) => {
  const { page, limit, action, entity, userId, from, to } = req.query;

  const filters = {
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
    action: action ? String(action) : undefined,
    entity: entity ? String(entity) : undefined,
    userId: userId ? String(userId) : undefined,
    from: from ? new Date(String(from)) : undefined,
    to: to
      ? (() => {
          const date = new Date(String(to));
          date.setHours(23, 59, 59, 999);
          return date;
        })()
      : undefined,
  };

  const result = await AuditLogService.getAuditLogs(filters);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: 'Audit logs retrieved successfully',
    data: result,
  });
};

export const AuditLogController = {
  getAuditLogs,
};
