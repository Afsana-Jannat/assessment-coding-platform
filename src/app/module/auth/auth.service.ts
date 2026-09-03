import bcrypt from 'bcryptjs';
import type { TokenPayload } from 'google-auth-library';
import type { JwtPayload, SignOptions } from 'jsonwebtoken';

import {
  AuthProvider,
  Role,
  UserStatus,
} from '../../../generated/prisma/enums';

import config from '../../config';
import { googleClient } from '../../lib/googleAuth';
import { prisma } from '../../lib/prisma';
import { jwtUtils } from '../../utils/jwt';

import type {
  IGoogleLoginPayload,
  ILoginUserPayload,
  IRegisterCandidatePayload,
  IRequestUser,
} from './auth.interface';

const registerCandidate = async (payload: IRegisterCandidatePayload) => {
  const { name, password } = payload;
  const email = payload.email.trim().toLowerCase();

  const isUserExists = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (isUserExists) {
    throw new Error('User with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 8);

  const createdUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,

      role: Role.CANDIDATE,
      status: UserStatus.ACTIVE,

      emailVerified: false,

      candidate: {
        create: {
          name,
          email,
        },
      },
    },

    omit: {
      password: true,
    },

    include: {
      candidate: true,
    },
  });

  const { candidate, ...user } = createdUser;

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions
  );

  return {
    user,
    candidate,
    accessToken,
    refreshToken,
  };
};

const loginUser = async (payload: ILoginUserPayload) => {
  const { password } = payload;
  const email = payload.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new Error('Your account has been blocked. Please contact support.');
  }

  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new Error('Your account has been deleted');
  }

  // Google-only account
  if (user.password === null && user.googleId !== null) {
    throw new Error(
      'This account was registered with Google. Please login with Google.'
    );
  }

  if (!user.password) {
    throw new Error('Invalid email or password');
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) {
    throw new Error('Invalid email or password');
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions
  );

  return {
    accessToken,
    refreshToken,
  };
};

const getMe = async (user: IRequestUser) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      id: user.userId,
    },

    include: {
      candidate: true,
      recruiter: true,
    },

    omit: {
      password: true,
    },
  });

  if (!existingUser) {
    throw new Error('User not found');
  }

  if (existingUser.isDeleted || existingUser.status === UserStatus.DELETED) {
    throw new Error('User has been deleted');
  }

  if (existingUser.status === UserStatus.BLOCKED) {
    throw new Error('User is blocked');
  }

  return existingUser;
};

const refreshToken = async (token: string) => {
  const verifiedToken = jwtUtils.verifyToken(token, config.jwt_refresh_secret);

  if (!verifiedToken.success) {
    throw new Error(verifiedToken.error);
  }

  const { userId } = verifiedToken.data as JwtPayload;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new Error('Your account has been blocked. Please contact support.');
  }

  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new Error('Your account has been deleted');
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const newAccessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions
  );

  const newRefreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions
  );

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

const googleLogin = async (payload: IGoogleLoginPayload) => {
  let googleIdTokenPayload: TokenPayload | null | undefined = null;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: payload.idToken,
      audience: config.google_client_id,
    });

    googleIdTokenPayload = ticket.getPayload();
  } catch (error) {
    console.log('Google ID token verification failed:', error);

    throw new Error('Invalid or expired Google ID token');
  }

  if (!googleIdTokenPayload) {
    throw new Error('Invalid or expired Google ID token');
  }

  if (!googleIdTokenPayload.email) {
    throw new Error('Google email not found');
  }

  if (!googleIdTokenPayload.name) {
    throw new Error('Google user name not found');
  }

  if (!googleIdTokenPayload.sub) {
    throw new Error('Google user ID not found');
  }

  const email = googleIdTokenPayload.email.trim().toLowerCase();

  const googleId = googleIdTokenPayload.sub;

  /*
   * Check if this Google account already exists
   */
  const existingGoogleUser = await prisma.user.findFirst({
    where: {
      email,
      googleId,
      role: Role.CANDIDATE,
    },
  });

  let user = existingGoogleUser;

  /*
   * If Google account does not exist,
   * check whether a credential account exists
   */
  if (!existingGoogleUser) {
    const existingCredentialUser = await prisma.user.findFirst({
      where: {
        email,
        role: Role.CANDIDATE,
        authProvider: AuthProvider.CREDENTIAL,
      },
    });

    /*
     * Existing email/password candidate
     * → connect Google account
     */
    if (existingCredentialUser) {
      if (
        existingCredentialUser.isDeleted ||
        existingCredentialUser.status === UserStatus.DELETED
      ) {
        throw new Error('User is deleted');
      }

      if (existingCredentialUser.status === UserStatus.BLOCKED) {
        throw new Error('User is blocked');
      }

      user = await prisma.user.update({
        where: {
          id: existingCredentialUser.id,
        },

        data: {
          googleId,
          authProvider: AuthProvider.GOOGLE,
          emailVerified: true,
        },
      });
    } else {
      /*
       * Completely new Google candidate
       */
      user = await prisma.user.create({
        data: {
          name: googleIdTokenPayload.name,
          email,

          role: Role.CANDIDATE,
          status: UserStatus.ACTIVE,

          googleId,
          authProvider: AuthProvider.GOOGLE,

          emailVerified: true,

          candidate: {
            create: {
              name: googleIdTokenPayload.name,
              email,
            },
          },
        },
      });
    }
  }

  if (!user) {
    throw new Error('User not found');
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new Error('User is blocked');
  }

  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new Error('User is deleted');
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions
  );

  return {
    accessToken,
    refreshToken,
  };
};

/*
 * Auth Service
 */
export const AuthService = {
  registerCandidate,
  loginUser,
  getMe,
  refreshToken,
  googleLogin,
};
