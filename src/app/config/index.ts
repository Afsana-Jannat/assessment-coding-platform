import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const requiredEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export default {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,
  database_url: requiredEnv('DATABASE_URL'),
  backend_url: process.env.BACKEND_URL,
  // frontend_url: process.env.FRONTEND_URL,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,

  jwt_access_secret: requiredEnv('JWT_ACCESS_SECRET'),
  jwt_refresh_secret: requiredEnv('JWT_REFRESH_SECRET'),
  jwt_access_expires_in: requiredEnv('JWT_ACCESS_EXPIRES_IN'),
  jwt_refresh_expires_in: requiredEnv('JWT_REFRESH_EXPIRES_IN'),

  google_client_id: process.env.GOOGLE_CLIENT_ID,

  stripe_secret_key: requiredEnv('STRIPE_SECRET_KEY'),
  stripe_webhook_secret: requiredEnv('STRIPE_WEBHOOK_SECRET'),

  cloudinary_cloud_name: requiredEnv('CLOUDINARY_CLOUD_NAME'),
  cloudinary_api_key: requiredEnv('CLOUDINARY_API_KEY'),
  cloudinary_api_secret: requiredEnv('CLOUDINARY_API_SECRET'),
  bkash_base_url: process.env.BKASH_BASE_URL!,
  bkash_username: process.env.BKASH_USERNAME!,
  bkash_password: process.env.BKASH_PASSWORD!,
  bkash_app_key: process.env.BKASH_APP_KEY!,
  bkash_app_secret: process.env.BKASH_APP_SECRET!,
};
