import httpStatus from 'http-status';
import { prisma } from '../../lib/prisma';

type CreateAssessmentInput = {
  recruiterUserId: string;
  data: {
    title: string;
    description?: string | null;
    instructions?: string | null;
    durationMinutes: number;
    totalMarks: number;
    passingMarks: number;
    startAt?: Date | null;
    endAt?: Date | null;
  };
};

const createAssessment = async ({
  recruiterUserId,
  data,
}: CreateAssessmentInput) => {
  const recruiter = await prisma.recruiter.findUnique({
    where: {
      userId: recruiterUserId,
    },
    select: {
      id: true,
      isDeleted: true,
    },
  });

  if (!recruiter) {
    const error = new Error('Recruiter not found');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  if (recruiter.isDeleted) {
    const error = new Error('Recruiter has been deleted');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  if (data.passingMarks > data.totalMarks) {
    const error = new Error('Passing marks cannot exceed total marks');
    Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
    throw error;
  }

  if (data.startAt && data.endAt && data.endAt <= data.startAt) {
    const error = new Error('End time must be later than start time');
    Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
    throw error;
  }

  const assessment = await prisma.assessment.create({
    data: {
      title: data.title,
      description: data.description,
      instructions: data.instructions,
      durationMinutes: data.durationMinutes,
      totalMarks: data.totalMarks,
      passingMarks: data.passingMarks,
      startAt: data.startAt,
      endAt: data.endAt,
      recruiterId: recruiter.id,
    },
    select: {
      id: true,
      title: true,
      description: true,
      instructions: true,
      durationMinutes: true,
      totalMarks: true,
      passingMarks: true,
      status: true,
      startAt: true,
      endAt: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true,
      recruiterId: true,
    },
  });

  return assessment;
};

type CreateQuestionInput = {
  recruiterUserId: string;
  assessmentId: string;
  data: {
    questionText: string;
    type: 'MCQ' | 'WRITTEN' | 'CODING';
    marks: number;
    order: number;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    explanation?: string | null;
    referenceAnswer?: string | null;
    options?: {
      optionText: string;
      isCorrect: boolean;
    }[];
  };
};

const createQuestion = async ({
  recruiterUserId,
  assessmentId,
  data,
}: CreateQuestionInput) => {
  const recruiter = await prisma.recruiter.findUnique({
    where: {
      userId: recruiterUserId,
    },
    select: {
      id: true,
      isDeleted: true,
    },
  });

  if (!recruiter) {
    const error = new Error('Recruiter not found');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  if (recruiter.isDeleted) {
    const error = new Error('Recruiter has been deleted');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
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
      status: true,
    },
  });

  if (!assessment) {
    const error = new Error(
      'Assessment not found or you do not have permission to manage it'
    );
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  if (assessment.status !== 'DRAFT') {
    const error = new Error(
      'Questions can only be added to a draft assessment'
    );
    Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
    throw error;
  }

  if (data.type === 'MCQ') {
    if (!data.options || data.options.length < 2) {
      const error = new Error('MCQ must have at least 2 options');
      Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
      throw error;
    }

    const correctOptions = data.options.filter((option) => option.isCorrect);

    if (correctOptions.length === 0) {
      const error = new Error('MCQ must have at least one correct option');
      Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
      throw error;
    }
  }

  if (data.type !== 'MCQ' && data.options?.length) {
    const error = new Error('Options are only allowed for MCQ questions');
    Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
    throw error;
  }

  const question = await prisma.$transaction(async (tx) => {
    const createdQuestion = await tx.question.create({
      data: {
        questionText: data.questionText,
        type: data.type,
        marks: data.marks,
        order: data.order,
        difficulty: data.difficulty,
        explanation: data.explanation,
        referenceAnswer: data.referenceAnswer,
        assessmentId: assessment.id,
      },
    });

    if (data.type === 'MCQ' && data.options) {
      await tx.option.createMany({
        data: data.options.map((option) => ({
          optionText: option.optionText,
          isCorrect: option.isCorrect,
          questionId: createdQuestion.id,
        })),
      });
    }

    return tx.question.findUnique({
      where: {
        id: createdQuestion.id,
      },
      include: {
        options: {
          select: {
            id: true,
            optionText: true,
            isCorrect: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  });

  return question;
};

type GetQuestionsInput = {
  recruiterUserId: string;
  assessmentId: string;
  filters: {
    type?: 'MCQ' | 'WRITTEN' | 'CODING';
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    page: number;
    limit: number;
  };
};

const getQuestions = async ({
  recruiterUserId,
  assessmentId,
  filters,
}: GetQuestionsInput) => {
  const recruiter = await prisma.recruiter.findUnique({
    where: {
      userId: recruiterUserId,
    },
    select: {
      id: true,
      isDeleted: true,
    },
  });

  if (!recruiter) {
    const error = new Error('Recruiter not found');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  if (recruiter.isDeleted) {
    const error = new Error('Recruiter has been deleted');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
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
    },
  });

  if (!assessment) {
    const error = new Error(
      'Assessment not found or you do not have permission to view its questions'
    );
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  const { page, limit, type, difficulty } = filters;

  const skip = (page - 1) * limit;

  const where = {
    assessmentId: assessment.id,
    isDeleted: false,
    ...(type ? { type } : {}),
    ...(difficulty ? { difficulty } : {}),
  };

  const [questions, total] = await prisma.$transaction([
    prisma.question.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        {
          order: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
      include: {
        options: {
          select: {
            id: true,
            optionText: true,
            isCorrect: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    }),

    prisma.question.count({
      where,
    }),
  ]);

  return {
    questions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

type GetQuestionByIdInput = {
  recruiterUserId: string;
  assessmentId: string;
  questionId: string;
};

const getQuestionById = async ({
  recruiterUserId,
  assessmentId,
  questionId,
}: GetQuestionByIdInput) => {
  const recruiter = await prisma.recruiter.findUnique({
    where: {
      userId: recruiterUserId,
    },
    select: {
      id: true,
      isDeleted: true,
    },
  });

  if (!recruiter) {
    const error = new Error('Recruiter not found');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  if (recruiter.isDeleted) {
    const error = new Error('Recruiter has been deleted');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
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
    },
  });

  if (!assessment) {
    const error = new Error(
      'Assessment not found or you do not have permission to view this question'
    );
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  const question = await prisma.question.findFirst({
    where: {
      id: questionId,
      assessmentId: assessment.id,
      isDeleted: false,
    },
    include: {
      options: {
        select: {
          id: true,
          optionText: true,
          isCorrect: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!question) {
    const error = new Error('Question not found');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  return question;
};

type UpdateQuestionInput = {
  recruiterUserId: string;
  assessmentId: string;
  questionId: string;
  data: {
    questionText?: string;
    type?: 'MCQ' | 'WRITTEN' | 'CODING';
    marks?: number;
    order?: number;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    explanation?: string | null;
    referenceAnswer?: string | null;
    options?: {
      optionText: string;
      isCorrect: boolean;
    }[];
  };
};

const updateQuestion = async ({
  recruiterUserId,
  assessmentId,
  questionId,
  data,
}: UpdateQuestionInput) => {
  const recruiter = await prisma.recruiter.findUnique({
    where: {
      userId: recruiterUserId,
    },
    select: {
      id: true,
      isDeleted: true,
    },
  });

  if (!recruiter) {
    const error = new Error('Recruiter not found');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  if (recruiter.isDeleted) {
    const error = new Error('Recruiter has been deleted');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
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
      status: true,
    },
  });

  if (!assessment) {
    const error = new Error(
      'Assessment not found or you do not have permission to manage it'
    );
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  if (assessment.status !== 'DRAFT') {
    const error = new Error(
      'Questions can only be updated in a draft assessment'
    );
    Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
    throw error;
  }

  const existingQuestion = await prisma.question.findFirst({
    where: {
      id: questionId,
      assessmentId: assessment.id,
      isDeleted: false,
    },
    select: {
      id: true,
      type: true,
    },
  });

  if (!existingQuestion) {
    const error = new Error('Question not found');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  const finalType = data.type ?? existingQuestion.type;

  if (finalType === 'MCQ') {
    if (data.options !== undefined) {
      if (data.options.length < 2) {
        const error = new Error('MCQ must have at least 2 options');
        Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
        throw error;
      }

      const correctOptions = data.options.filter((option) => option.isCorrect);

      if (correctOptions.length === 0) {
        const error = new Error('MCQ must have at least one correct option');
        Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
        throw error;
      }
    }
  } else if (data.options !== undefined && data.options.length > 0) {
    const error = new Error('Options are only allowed for MCQ questions');
    Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
    throw error;
  }

  const updatedQuestion = await prisma.$transaction(async (tx) => {
    const question = await tx.question.update({
      where: {
        id: existingQuestion.id,
      },
      data: {
        ...(data.questionText !== undefined && {
          questionText: data.questionText,
        }),
        ...(data.type !== undefined && {
          type: data.type,
        }),
        ...(data.marks !== undefined && {
          marks: data.marks,
        }),
        ...(data.order !== undefined && {
          order: data.order,
        }),
        ...(data.difficulty !== undefined && {
          difficulty: data.difficulty,
        }),
        ...(data.explanation !== undefined && {
          explanation: data.explanation,
        }),
        ...(data.referenceAnswer !== undefined && {
          referenceAnswer: data.referenceAnswer,
        }),
      },
    });

    if (data.options !== undefined) {
      await tx.option.deleteMany({
        where: {
          questionId: question.id,
        },
      });

      if (finalType === 'MCQ') {
        await tx.option.createMany({
          data: data.options.map((option) => ({
            optionText: option.optionText,
            isCorrect: option.isCorrect,
            questionId: question.id,
          })),
        });
      }
    }

    return tx.question.findUnique({
      where: {
        id: question.id,
      },
      include: {
        options: {
          select: {
            id: true,
            optionText: true,
            isCorrect: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  });

  return updatedQuestion;
};

type DeleteQuestionInput = {
  recruiterUserId: string;
  assessmentId: string;
  questionId: string;
};

const deleteQuestion = async ({
  recruiterUserId,
  assessmentId,
  questionId,
}: DeleteQuestionInput) => {
  const recruiter = await prisma.recruiter.findUnique({
    where: {
      userId: recruiterUserId,
    },
    select: {
      id: true,
      isDeleted: true,
    },
  });

  if (!recruiter) {
    const error = new Error('Recruiter not found');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  if (recruiter.isDeleted) {
    const error = new Error('Recruiter has been deleted');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
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
      status: true,
    },
  });

  if (!assessment) {
    const error = new Error(
      'Assessment not found or you do not have permission to manage it'
    );
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  if (assessment.status !== 'DRAFT') {
    const error = new Error(
      'Questions can only be deleted from a draft assessment'
    );
    Object.assign(error, { statusCode: httpStatus.BAD_REQUEST });
    throw error;
  }

  const question = await prisma.question.findFirst({
    where: {
      id: questionId,
      assessmentId: assessment.id,
      isDeleted: false,
    },
    select: {
      id: true,
    },
  });

  if (!question) {
    const error = new Error('Question not found');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  const deletedQuestion = await prisma.question.update({
    where: {
      id: question.id,
    },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
    select: {
      id: true,
      questionText: true,
      isDeleted: true,
      deletedAt: true,
      updatedAt: true,
    },
  });

  return deletedQuestion;
};

type GetAssessmentsInput = {
  recruiterUserId: string;
  filters: {
    status?: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'ARCHIVED';
    page: number;
    limit: number;
  };
};

const getAssessments = async ({
  recruiterUserId,
  filters,
}: GetAssessmentsInput) => {
  const recruiter = await prisma.recruiter.findUnique({
    where: {
      userId: recruiterUserId,
    },
    select: {
      id: true,
      isDeleted: true,
    },
  });

  if (!recruiter) {
    const error = new Error('Recruiter not found');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  if (recruiter.isDeleted) {
    const error = new Error('Recruiter has been deleted');
    Object.assign(error, { statusCode: httpStatus.NOT_FOUND });
    throw error;
  }

  const { page, limit, status } = filters;

  const skip = (page - 1) * limit;

  const where = {
    recruiterId: recruiter.id,
    isDeleted: false,
    ...(status ? { status } : {}),
  };

  const [assessments, total] = await prisma.$transaction([
    prisma.assessment.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
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
        updatedAt: true,
        recruiterId: true,
        _count: {
          select: {
            questions: {
              where: {
                isDeleted: false,
              },
            },
          },
        },
      },
    }),

    prisma.assessment.count({
      where,
    }),
  ]);

  return {
    assessments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const AssessmentService = {
  createAssessment,
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getAssessments,
};
