import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  devMode: process.env.DEV_MODE !== 'false',
  jwtSecret: process.env.JWT_SECRET || 'phonemail_secure_jwt_secret_key_2026_hackathon',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  
  defaultOtpProvider: process.env.DEFAULT_OTP_PROVIDER || 'mock',
  defaultSmsProvider: process.env.DEFAULT_SMS_PROVIDER || 'mock',
  defaultIvrProvider: process.env.DEFAULT_IVR_PROVIDER || 'mock',

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID || '',
  },

  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
};
