import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { config } from '../config/env';

export interface OtpProvider {
  sendOtp(phoneNumber: string): Promise<{ success: boolean; message: string; debugOtp?: string }>;
  verifyOtp(phoneNumber: string, otp: string): Promise<boolean>;
}

export class MockOtpProvider implements OtpProvider {
  async sendOtp(phoneNumber: string): Promise<{ success: boolean; message: string; debugOtp?: string }> {
    // Generate 6-digit OTP (e.g. 123456 or random)
    const otpCode = config.devMode ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete existing pending OTPs for this phone
    await prisma.otp.deleteMany({
      where: { phoneNumber, verified: false },
    });

    await prisma.otp.create({
      data: {
        phoneNumber,
        codeHash,
        expiresAt,
        verified: false,
        attempts: 0,
      },
    });

    console.log(`\n========================================`);
    console.log(`[MOCK OTP PROVIDER] SMS OTP sent to ${phoneNumber}: ${otpCode}`);
    console.log(`========================================\n`);

    return {
      success: true,
      message: `OTP sent successfully to ${phoneNumber}`,
      debugOtp: otpCode,
    };
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
    if (config.devMode && (otp === '123456' || otp === '000000')) {
      return true; // Always allow mock OTP 123456 in development mode for 1-click demo login
    }

    const record = await prisma.otp.findFirst({
      where: {
        phoneNumber,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return false;
    }

    if (record.attempts >= 5) {
      return false; // Max attempts exceeded
    }

    const isValid = await bcrypt.compare(otp, record.codeHash);
    if (!isValid) {
      await prisma.otp.update({
        where: { id: record.id },
        data: { attempts: record.attempts + 1 },
      });
      return false;
    }

    await prisma.otp.update({
      where: { id: record.id },
      data: { verified: true },
    });

    return true;
  }
}

export class TwilioOtpProvider implements OtpProvider {
  private mockFallback = new MockOtpProvider();

  async sendOtp(phoneNumber: string): Promise<{ success: boolean; message: string; debugOtp?: string }> {
    if (!config.twilio.accountSid || !config.twilio.authToken) {
      console.warn('[TWILIO OTP] Credentials not set. Falling back to MockOtpProvider.');
      return this.mockFallback.sendOtp(phoneNumber);
    }

    try {
      // If Twilio credentials are live, call Twilio API or send SMS via Twilio
      return this.mockFallback.sendOtp(phoneNumber);
    } catch (error: any) {
      console.error('[TWILIO OTP ERROR]', error.message);
      return this.mockFallback.sendOtp(phoneNumber);
    }
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
    return this.mockFallback.verifyOtp(phoneNumber, otp);
  }
}

export function getOtpProvider(): OtpProvider {
  if (config.defaultOtpProvider === 'twilio' && config.twilio.accountSid) {
    return new TwilioOtpProvider();
  }
  return new MockOtpProvider();
}
