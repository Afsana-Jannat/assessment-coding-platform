import express from 'express';

import { auth } from '../../middleware/checkAuth';
import { validateRequest } from '../../middleware/validateRequest';

import { AuditLogController } from './auditLog.controller';
import { AuditLogValidation } from './auditLog.validation';

const router = express.Router();

router.get(
  '/',
  auth('ADMIN'),
  validateRequest(AuditLogValidation.auditLogQuerySchema),
  AuditLogController.getAuditLogs
);

export const AuditLogRoutes = router;
