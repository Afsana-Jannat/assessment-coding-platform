import httpStatus from 'http-status';

import { prisma } from '../../lib/prisma';

type DateFilter = {
  from?: Date;
  to?: Date;
};

const buildDateFilter = (from?: Date, to?: Date) => {
  if (!from && !to) {
    return undefined;
  }

  return {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
  };
};

/**
 * Recruiter Overview
 */
const getRecruiterOverview = async (
  recruiterUserId: string,
  filters: DateFilter
) => {
  const recruiter = await prisma.recruiter.findFirst({
    where: {
      userId: recruiterUserId,
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      companyName: true,
    },
  });

  if (!recruiter) {
    const error = new Error('Recruiter profile not found');

    Object.assign(error, {
      statusCode: httpStatus.NOT_FOUND,
    });

    throw error;
  }

  const createdAtFilter = buildDateFilter(filters.from, filters.to);

  const [
    totalAssessments,
    publishedAssessments,
    totalInvitations,
    acceptedInvitations,
    totalAttempts,
    submittedAttempts,
    timeExpiredAttempts,
    attemptsWithScore,
  ] = await prisma.$transaction([
    prisma.assessment.count({
      where: {
        recruiterId: recruiter.id,
        isDeleted: false,
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.assessment.count({
      where: {
        recruiterId: recruiter.id,
        isDeleted: false,
        status: 'PUBLISHED',
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.invitation.count({
      where: {
        assessment: {
          recruiterId: recruiter.id,
          isDeleted: false,
        },
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.invitation.count({
      where: {
        assessment: {
          recruiterId: recruiter.id,
          isDeleted: false,
        },
        status: 'ACCEPTED',
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.attempt.count({
      where: {
        assessment: {
          recruiterId: recruiter.id,
          isDeleted: false,
        },
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.attempt.count({
      where: {
        assessment: {
          recruiterId: recruiter.id,
          isDeleted: false,
        },
        status: 'SUBMITTED',
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.attempt.count({
      where: {
        assessment: {
          recruiterId: recruiter.id,
          isDeleted: false,
        },
        status: 'TIME_EXPIRED',
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.attempt.findMany({
      where: {
        assessment: {
          recruiterId: recruiter.id,
          isDeleted: false,
        },
        score: {
          not: null,
        },
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
      select: {
        score: true,
        percentage: true,
        assessment: {
          select: {
            totalMarks: true,
            passingMarks: true,
          },
        },
      },
    }),
  ]);

  const percentages = attemptsWithScore
    .map((attempt) => attempt.percentage)
    .filter((percentage): percentage is number => percentage !== null);

  const averagePercentage =
    percentages.length > 0
      ? Number(
          (
            percentages.reduce((sum, percentage) => sum + percentage, 0) /
            percentages.length
          ).toFixed(2)
        )
      : 0;

  const passedAttempts = attemptsWithScore.filter(
    (attempt) =>
      attempt.score !== null && attempt.score >= attempt.assessment.passingMarks
  ).length;

  const passRate =
    attemptsWithScore.length > 0
      ? Number(((passedAttempts / attemptsWithScore.length) * 100).toFixed(2))
      : 0;

  return {
    recruiter,
    assessments: {
      total: totalAssessments,
      published: publishedAssessments,
    },
    invitations: {
      total: totalInvitations,
      accepted: acceptedInvitations,
    },
    attempts: {
      total: totalAttempts,
      submitted: submittedAttempts,
      timeExpired: timeExpiredAttempts,
      passed: passedAttempts,
      failed: attemptsWithScore.length - passedAttempts,
    },
    performance: {
      averagePercentage,
      passRate,
    },
  };
};

/**
 * Recruiter Assessment Report
 */
const getAssessmentReport = async (
  recruiterUserId: string,
  assessmentId: string
) => {
  const recruiter = await prisma.recruiter.findFirst({
    where: {
      userId: recruiterUserId,
      isDeleted: false,
    },
    select: {
      id: true,
    },
  });

  if (!recruiter) {
    const error = new Error('Recruiter profile not found');

    Object.assign(error, {
      statusCode: httpStatus.NOT_FOUND,
    });

    throw error;
  }

  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      recruiterId: recruiter.id,
      isDeleted: false,
    },
    select: {
      id: true,
      title: true,
      description: true,
      durationMinutes: true,
      totalMarks: true,
      passingMarks: true,
      status: true,
      startAt: true,
      endAt: true,
      createdAt: true,
      invitations: {
        select: {
          id: true,
          status: true,
          invitedAt: true,
          expiresAt: true,
          candidate: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      attempts: {
        select: {
          id: true,
          startedAt: true,
          submittedAt: true,
          status: true,
          score: true,
          percentage: true,
          candidate: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      questions: {
        where: {
          isDeleted: false,
        },
        select: {
          id: true,
          questionText: true,
          type: true,
          marks: true,
          order: true,
          difficulty: true,
          answers: {
            select: {
              id: true,
              isCorrect: true,
              marksObtained: true,
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  if (!assessment) {
    const error = new Error('Assessment not found');

    Object.assign(error, {
      statusCode: httpStatus.NOT_FOUND,
    });

    throw error;
  }

  const attemptsWithScores = assessment.attempts.filter(
    (attempt) => attempt.score !== null
  );

  const scores = attemptsWithScores
    .map((attempt) => attempt.score)
    .filter((score): score is number => score !== null);

  const percentages = attemptsWithScores
    .map((attempt) => attempt.percentage)
    .filter((percentage): percentage is number => percentage !== null);

  const averageScore =
    scores.length > 0
      ? Number(
          (
            scores.reduce((sum, score) => sum + score, 0) / scores.length
          ).toFixed(2)
        )
      : 0;

  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

  const passedAttempts = attemptsWithScores.filter(
    (attempt) =>
      attempt.score !== null && attempt.score >= assessment.passingMarks
  ).length;

  const failedAttempts = attemptsWithScores.length - passedAttempts;

  const passRate =
    attemptsWithScores.length > 0
      ? Number(((passedAttempts / attemptsWithScores.length) * 100).toFixed(2))
      : 0;

  const questionStats = assessment.questions.map((question) => {
    const answers = question.answers;

    const answeredCount = answers.length;

    const correctCount = answers.filter(
      (answer) => answer.isCorrect === true
    ).length;

    const accuracy =
      answeredCount > 0
        ? Number(((correctCount / answeredCount) * 100).toFixed(2))
        : 0;

    const marks = answers
      .map((answer) => answer.marksObtained)
      .filter((mark): mark is number => mark !== null);

    const averageMarks =
      marks.length > 0
        ? Number(
            (marks.reduce((sum, mark) => sum + mark, 0) / marks.length).toFixed(
              2
            )
          )
        : 0;

    return {
      questionId: question.id,
      questionText: question.questionText,
      type: question.type,
      difficulty: question.difficulty,
      marks: question.marks,
      totalAnswers: answeredCount,
      correctAnswers: correctCount,
      accuracy,
      averageMarks,
    };
  });

  return {
    assessment: {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      durationMinutes: assessment.durationMinutes,
      totalMarks: assessment.totalMarks,
      passingMarks: assessment.passingMarks,
      status: assessment.status,
      startAt: assessment.startAt,
      endAt: assessment.endAt,
      createdAt: assessment.createdAt,
    },

    invitationStats: {
      total: assessment.invitations.length,
      pending: assessment.invitations.filter(
        (item) => item.status === 'PENDING'
      ).length,
      accepted: assessment.invitations.filter(
        (item) => item.status === 'ACCEPTED'
      ).length,
      declined: assessment.invitations.filter(
        (item) => item.status === 'DECLINED'
      ).length,
      expired: assessment.invitations.filter(
        (item) => item.status === 'EXPIRED'
      ).length,
    },

    attemptStats: {
      total: assessment.attempts.length,
      submitted: assessment.attempts.filter(
        (attempt) => attempt.status === 'SUBMITTED'
      ).length,
      timeExpired: assessment.attempts.filter(
        (attempt) => attempt.status === 'TIME_EXPIRED'
      ).length,
      inProgress: assessment.attempts.filter(
        (attempt) => attempt.status === 'IN_PROGRESS'
      ).length,
    },

    performance: {
      averageScore,
      highestScore,
      lowestScore,
      passed: passedAttempts,
      failed: failedAttempts,
      passRate,
      averagePercentage:
        percentages.length > 0
          ? Number(
              (
                percentages.reduce((sum, percentage) => sum + percentage, 0) /
                percentages.length
              ).toFixed(2)
            )
          : 0,
    },

    candidates: assessment.attempts.map((attempt) => ({
      attemptId: attempt.id,
      candidate: attempt.candidate,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      status: attempt.status,
      score: attempt.score,
      percentage: attempt.percentage,
      passed:
        attempt.score !== null
          ? attempt.score >= assessment.passingMarks
          : null,
    })),

    questionStats,
  };
};

/**
 * Recruiter Candidate Report
 */
const getCandidateReport = async (
  recruiterUserId: string,
  candidateId: string
) => {
  const recruiter = await prisma.recruiter.findFirst({
    where: {
      userId: recruiterUserId,
      isDeleted: false,
    },
    select: {
      id: true,
    },
  });

  if (!recruiter) {
    const error = new Error('Recruiter profile not found');

    Object.assign(error, {
      statusCode: httpStatus.NOT_FOUND,
    });

    throw error;
  }

  const candidate = await prisma.candidate.findFirst({
    where: {
      id: candidateId,
      isDeleted: false,
      OR: [
        {
          invitations: {
            some: {
              assessment: {
                recruiterId: recruiter.id,
                isDeleted: false,
              },
            },
          },
        },
        {
          attempts: {
            some: {
              assessment: {
                recruiterId: recruiter.id,
                isDeleted: false,
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      skills: true,
      experience: true,
      education: true,
      resumeUrl: true,
      invitations: {
        where: {
          assessment: {
            recruiterId: recruiter.id,
            isDeleted: false,
          },
        },
        select: {
          id: true,
          status: true,
          invitedAt: true,
          expiresAt: true,
          assessment: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      attempts: {
        where: {
          assessment: {
            recruiterId: recruiter.id,
            isDeleted: false,
          },
        },
        select: {
          id: true,
          startedAt: true,
          submittedAt: true,
          status: true,
          score: true,
          percentage: true,
          assessment: {
            select: {
              id: true,
              title: true,
              totalMarks: true,
              passingMarks: true,
            },
          },
        },
        orderBy: {
          startedAt: 'desc',
        },
      },
    },
  });

  if (!candidate) {
    const error = new Error(
      'Candidate not found or candidate has no assessment relationship with this recruiter'
    );

    Object.assign(error, {
      statusCode: httpStatus.NOT_FOUND,
    });

    throw error;
  }

  const scoredAttempts = candidate.attempts.filter(
    (attempt) => attempt.score !== null
  );

  const percentages = scoredAttempts
    .map((attempt) => attempt.percentage)
    .filter((percentage): percentage is number => percentage !== null);

  const scores = scoredAttempts
    .map((attempt) => attempt.score)
    .filter((score): score is number => score !== null);

  const passed = scoredAttempts.filter(
    (attempt) =>
      attempt.score !== null && attempt.score >= attempt.assessment.passingMarks
  ).length;

  return {
    candidate: {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      skills: candidate.skills,
      experience: candidate.experience,
      education: candidate.education,
      resumeUrl: candidate.resumeUrl,
    },

    invitations: candidate.invitations,

    attempts: candidate.attempts.map((attempt) => ({
      id: attempt.id,
      assessment: attempt.assessment,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      status: attempt.status,
      score: attempt.score,
      percentage: attempt.percentage,
      passed:
        attempt.score !== null
          ? attempt.score >= attempt.assessment.passingMarks
          : null,
    })),

    performance: {
      totalAttempts: candidate.attempts.length,
      scoredAttempts: scoredAttempts.length,
      averageScore:
        scores.length > 0
          ? Number(
              (
                scores.reduce((sum, score) => sum + score, 0) / scores.length
              ).toFixed(2)
            )
          : 0,
      averagePercentage:
        percentages.length > 0
          ? Number(
              (
                percentages.reduce((sum, percentage) => sum + percentage, 0) /
                percentages.length
              ).toFixed(2)
            )
          : 0,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
      passed,
      failed: scoredAttempts.length - passed,
    },
  };
};

/**
 * Recruiter Revenue Report
 */
const getRecruiterRevenue = async (
  recruiterUserId: string,
  filters: DateFilter
) => {
  const recruiter = await prisma.recruiter.findFirst({
    where: {
      userId: recruiterUserId,
      isDeleted: false,
    },
    select: {
      id: true,
    },
  });

  if (!recruiter) {
    const error = new Error('Recruiter profile not found');

    Object.assign(error, {
      statusCode: httpStatus.NOT_FOUND,
    });

    throw error;
  }

  const createdAtFilter = buildDateFilter(filters.from, filters.to);

  const payments = await prisma.payment.findMany({
    where: {
      recruiterId: recruiter.id,
      ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
    },
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      paymentMethod: true,
      transactionId: true,
      paidAt: true,
      createdAt: true,
      assessment: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const paidPayments = payments.filter((payment) => payment.status === 'PAID');

  const totalRevenue = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  const paidRevenue = paidPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  return {
    summary: {
      totalPayments: payments.length,
      paidPayments: paidPayments.length,
      pendingPayments: payments.filter(
        (payment) => payment.status === 'PENDING'
      ).length,
      failedPayments: payments.filter((payment) => payment.status === 'FAILED')
        .length,
      cancelledPayments: payments.filter(
        (payment) => payment.status === 'CANCELLED'
      ).length,
      refundedPayments: payments.filter(
        (payment) => payment.status === 'REFUNDED'
      ).length,
      totalRevenue,
      paidRevenue,
      currency: payments[0]?.currency ?? 'BDT',
    },

    paymentMethods: {
      stripe: paidPayments
        .filter((payment) => payment.paymentMethod === 'STRIPE')
        .reduce((sum, payment) => sum + payment.amount, 0),

      bkash: paidPayments
        .filter((payment) => payment.paymentMethod === 'BKASH')
        .reduce((sum, payment) => sum + payment.amount, 0),

      sslcommerz: paidPayments
        .filter((payment) => payment.paymentMethod === 'SSLCOMMERZ')
        .reduce((sum, payment) => sum + payment.amount, 0),

      other: paidPayments
        .filter(
          (payment) =>
            payment.paymentMethod === 'OTHER' || payment.paymentMethod === null
        )
        .reduce((sum, payment) => sum + payment.amount, 0),
    },

    payments,
  };
};

const getAdminOverview = async (filters: DateFilter) => {
  const createdAtFilter = buildDateFilter(filters.from, filters.to);

  const [
    totalUsers,
    admins,
    recruiters,
    candidates,
    activeUsers,
    blockedUsers,

    totalAssessments,
    publishedAssessments,
    draftAssessments,
    completedAssessments,

    totalInvitations,
    acceptedInvitations,
    pendingInvitations,
    declinedInvitations,
    expiredInvitations,

    totalAttempts,
    submittedAttempts,
    inProgressAttempts,
    timeExpiredAttempts,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        isDeleted: false,
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.user.count({
      where: {
        role: 'ADMIN',
        isDeleted: false,
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.user.count({
      where: {
        role: 'RECRUITER',
        isDeleted: false,
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.user.count({
      where: {
        role: 'CANDIDATE',
        isDeleted: false,
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.user.count({
      where: {
        status: 'ACTIVE',
        isDeleted: false,
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.user.count({
      where: {
        status: 'BLOCKED',
        isDeleted: false,
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.assessment.count({
      where: {
        isDeleted: false,
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.assessment.count({
      where: {
        status: 'PUBLISHED',
        isDeleted: false,
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.assessment.count({
      where: {
        status: 'DRAFT',
        isDeleted: false,
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.assessment.count({
      where: {
        status: 'COMPLETED',
        isDeleted: false,
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.invitation.count({
      where: {
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.invitation.count({
      where: {
        status: 'ACCEPTED',
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.invitation.count({
      where: {
        status: 'PENDING',
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.invitation.count({
      where: {
        status: 'DECLINED',
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.invitation.count({
      where: {
        status: 'EXPIRED',
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.attempt.count({
      where: {
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.attempt.count({
      where: {
        status: 'SUBMITTED',
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.attempt.count({
      where: {
        status: 'IN_PROGRESS',
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.attempt.count({
      where: {
        status: 'TIME_EXPIRED',
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),
  ]);

  const submittedWithScores = await prisma.attempt.findMany({
    where: {
      status: {
        in: ['SUBMITTED', 'TIME_EXPIRED'],
      },
      percentage: {
        not: null,
      },
      ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
    },
    select: {
      score: true,
      percentage: true,
      assessment: {
        select: {
          passingMarks: true,
        },
      },
    },
  });

  const percentages = submittedWithScores
    .map((attempt) => attempt.percentage)
    .filter((percentage): percentage is number => percentage !== null);

  const passed = submittedWithScores.filter(
    (attempt) =>
      attempt.score !== null && attempt.score >= attempt.assessment.passingMarks
  ).length;

  const failed = submittedWithScores.length - passed;

  const averagePercentage =
    percentages.length > 0
      ? Number(
          (
            percentages.reduce((sum, percentage) => sum + percentage, 0) /
            percentages.length
          ).toFixed(2)
        )
      : 0;

  const passRate =
    submittedWithScores.length > 0
      ? Number(((passed / submittedWithScores.length) * 100).toFixed(2))
      : 0;

  return {
    users: {
      total: totalUsers,
      admins,
      recruiters,
      candidates,
      active: activeUsers,
      blocked: blockedUsers,
    },

    assessments: {
      total: totalAssessments,
      published: publishedAssessments,
      draft: draftAssessments,
      completed: completedAssessments,
    },

    invitations: {
      total: totalInvitations,
      accepted: acceptedInvitations,
      pending: pendingInvitations,
      declined: declinedInvitations,
      expired: expiredInvitations,
    },

    attempts: {
      total: totalAttempts,
      submitted: submittedAttempts,
      inProgress: inProgressAttempts,
      timeExpired: timeExpiredAttempts,
    },

    performance: {
      averagePercentage,
      passRate,
      passed,
      failed,
    },
  };
};

const getAdminRevenue = async (filters: DateFilter) => {
  const createdAtFilter = buildDateFilter(filters.from, filters.to);

  const payments = await prisma.payment.findMany({
    where: {
      ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
    },
    select: {
      amount: true,
      currency: true,
      status: true,
      paymentMethod: true,
    },
  });

  const totalPayments = payments.length;

  const paidPayments = payments.filter(
    (payment) => payment.status === 'PAID'
  ).length;

  const pendingPayments = payments.filter(
    (payment) => payment.status === 'PENDING'
  ).length;

  const failedPayments = payments.filter(
    (payment) => payment.status === 'FAILED'
  ).length;

  const cancelledPayments = payments.filter(
    (payment) => payment.status === 'CANCELLED'
  ).length;

  const refundedPayments = payments.filter(
    (payment) => payment.status === 'REFUNDED'
  ).length;

  const totalPaymentAmount = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  const paidRevenue = payments
    .filter((payment) => payment.status === 'PAID')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const paymentMethods = {
    stripe: payments
      .filter(
        (payment) =>
          payment.status === 'PAID' && payment.paymentMethod === 'STRIPE'
      )
      .reduce((sum, payment) => sum + payment.amount, 0),

    bkash: payments
      .filter(
        (payment) =>
          payment.status === 'PAID' && payment.paymentMethod === 'BKASH'
      )
      .reduce((sum, payment) => sum + payment.amount, 0),

    sslcommerz: payments
      .filter(
        (payment) =>
          payment.status === 'PAID' && payment.paymentMethod === 'SSLCOMMERZ'
      )
      .reduce((sum, payment) => sum + payment.amount, 0),

    other: payments
      .filter(
        (payment) =>
          payment.status === 'PAID' &&
          (payment.paymentMethod === 'OTHER' || payment.paymentMethod === null)
      )
      .reduce((sum, payment) => sum + payment.amount, 0),
  };

  return {
    summary: {
      totalPayments,
      paidPayments,
      pendingPayments,
      failedPayments,
      cancelledPayments,
      refundedPayments,
      totalPaymentAmount,
      paidRevenue,
      currency: payments[0]?.currency ?? 'BDT',
    },
    paymentMethods,
  };
};

const getAdminAssessmentReport = async (filters: DateFilter) => {
  const createdAtFilter = buildDateFilter(filters.from, filters.to);

  const [total, published, draft, ongoing, completed, archived] =
    await Promise.all([
      prisma.assessment.count({
        where: {
          isDeleted: false,
          ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
        },
      }),

      prisma.assessment.count({
        where: {
          status: 'PUBLISHED',
          isDeleted: false,
          ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
        },
      }),

      prisma.assessment.count({
        where: {
          status: 'DRAFT',
          isDeleted: false,
          ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
        },
      }),

      prisma.assessment.count({
        where: {
          status: 'ONGOING',
          isDeleted: false,
          ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
        },
      }),

      prisma.assessment.count({
        where: {
          status: 'COMPLETED',
          isDeleted: false,
          ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
        },
      }),

      prisma.assessment.count({
        where: {
          status: 'ARCHIVED',
          isDeleted: false,
          ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
        },
      }),
    ]);

  return {
    total,
    published,
    draft,
    ongoing,
    completed,
    archived,
  };
};

const getAdminCandidateReport = async (filters: DateFilter) => {
  const createdAtFilter = buildDateFilter(filters.from, filters.to);

  const [total, active, blocked, deleted] = await Promise.all([
    prisma.candidate.count({
      where: {
        isDeleted: false,
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),

    prisma.candidate.count({
      where: {
        isDeleted: false,
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
        user: {
          status: 'ACTIVE',
        },
      },
    }),

    prisma.candidate.count({
      where: {
        isDeleted: false,
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
        user: {
          status: 'BLOCKED',
        },
      },
    }),

    prisma.candidate.count({
      where: {
        isDeleted: true,
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),
  ]);

  return {
    total,
    active,
    blocked,
    deleted,
  };
};

export const ReportsService = {
  getRecruiterOverview,
  getAssessmentReport,
  getCandidateReport,
  getRecruiterRevenue,

  getAdminOverview,
  getAdminRevenue,
  getAdminAssessmentReport,
  getAdminCandidateReport,
};
