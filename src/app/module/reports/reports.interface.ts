export interface DateFilter {
  from?: Date;
  to?: Date;
}

export interface AdminOverviewReport {
  users: {
    total: number;
    admins: number;
    recruiters: number;
    candidates: number;
    active: number;
    blocked: number;
  };

  assessments: {
    total: number;
    published: number;
    draft: number;
    completed: number;
  };

  invitations: {
    total: number;
    accepted: number;
    pending: number;
    declined: number;
    expired: number;
  };

  attempts: {
    total: number;
    submitted: number;
    inProgress: number;
    timeExpired: number;
  };

  performance: {
    averagePercentage: number;
    passRate: number;
    passed: number;
    failed: number;
  };
}

export interface AdminRevenueReport {
  summary: {
    totalPayments: number;
    paidPayments: number;
    pendingPayments: number;
    failedPayments: number;
    cancelledPayments: number;
    refundedPayments: number;
    totalPaymentAmount: number;
    paidRevenue: number;
    currency: string;
  };

  paymentMethods: {
    stripe: number;
    bkash: number;
    sslcommerz: number;
    other: number;
  };
}

export interface AdminAssessmentReport {
  total: number;
  published: number;
  draft: number;
  ongoing: number;
  completed: number;
  archived: number;
}

export interface AdminCandidateReport {
  total: number;
  active: number;
  blocked: number;
  deleted: number;
}
