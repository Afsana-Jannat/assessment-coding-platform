import { prisma } from '../../lib/prisma';

interface AuditLogFilters {
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  userId?: string;
  from?: Date;
  to?: Date;
}

const getAuditLogs = async (filters: AuditLogFilters) => {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;

  const skip = (page - 1) * limit;

  const where = {
    ...(filters.action
      ? {
          action: {
            contains: filters.action,
            mode: 'insensitive' as const,
          },
        }
      : {}),

    ...(filters.entity
      ? {
          entity: {
            contains: filters.entity,
            mode: 'insensitive' as const,
          },
        }
      : {}),

    ...(filters.userId
      ? {
          userId: filters.userId,
        }
      : {}),

    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),

    prisma.auditLog.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },

    logs,
  };
};

export const AuditLogService = {
  getAuditLogs,
};
