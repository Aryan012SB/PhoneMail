import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { getOtpProvider } from '../providers/otpProvider';
import { config } from '../config/env';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';

const router = Router();

// Helper: Normalize phone numbers (strips leading country code if present for matching)
function normalizePhone(phoneNumber: string): string {
  const clean = phoneNumber.replace(/\D/g, '');
  if (clean.length === 12 && clean.startsWith('91')) {
    return clean.slice(2);
  }
  if (clean.length === 11 && clean.startsWith('1')) {
    return clean.slice(1);
  }
  return clean;
}

// Helper: Flexible User Lookup by Phone Number
async function findUserByPhone(phoneNumber: string) {
  const clean = phoneNumber.replace(/\D/g, '');
  const normalized = normalizePhone(phoneNumber);

  return await prisma.user.findFirst({
    where: {
      OR: [
        { phoneNumber: clean },
        { phoneNumber: normalized },
        ...(clean.length >= 10 ? [{ phoneNumber: clean.slice(-10) }] : []),
      ],
    },
  });
}

// 0. Direct Demo Quick Login Endpoint
router.post('/demo-login', async (req: any, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const normalized = normalizePhone(phoneNumber);
    const emailAddress = `${normalized}@phonemail.com`;

    let user = await findUserByPhone(phoneNumber);

    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber: normalized,
          emailAddress,
          name: `PhoneMail User ${normalized.slice(-4)}`,
        },
      });
    }

    const token = jwt.sign(
      { id: user.id, phoneNumber: user.phoneNumber, emailAddress: user.emailAddress },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        emailAddress: user.emailAddress,
        name: user.name,
        profilePicture: user.profilePicture,
        language: user.language,
      },
    });
  } catch (error: any) {
    console.error('Demo login error:', error);
    return res.status(500).json({ error: 'Demo login failed.' });
  }
});

// 1. Request OTP
router.post('/otp/request', rateLimitMiddleware, async (req: any, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 7 || cleanPhone.length > 15) {
      return res.status(400).json({ error: 'Please enter a valid phone number (7-15 digits).' });
    }

    const normalized = normalizePhone(phoneNumber);
    const otpProvider = getOtpProvider();
    
    // Register OTP under normalized phone number
    const result = await otpProvider.sendOtp(normalized);

    return res.json({
      success: true,
      message: result.message,
      phoneNumber: normalized,
      debugOtp: result.debugOtp || '123456',
    });
  } catch (error: any) {
    console.error('OTP request error:', error);
    return res.status(500).json({ error: 'Failed to request OTP.' });
  }
});

// 2. Verify OTP & Authenticate/Register
router.post('/otp/verify', rateLimitMiddleware, async (req: any, res: Response) => {
  try {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP code are required.' });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const normalized = normalizePhone(phoneNumber);
    const otpProvider = getOtpProvider();
    
    let isValid = await otpProvider.verifyOtp(normalized, otp);
    if (!isValid && cleanPhone !== normalized) {
      isValid = await otpProvider.verifyOtp(cleanPhone, otp);
    }

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP code.' });
    }

    const emailAddress = `${normalized}@phonemail.com`;

    // Find or create user
    let user = await findUserByPhone(phoneNumber);

    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber: normalized,
          emailAddress,
          name: `PhoneMail User ${normalized.slice(-4)}`,
        },
      });
    }

    const token = jwt.sign(
      { id: user.id, phoneNumber: user.phoneNumber, emailAddress: user.emailAddress },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        emailAddress: user.emailAddress,
        name: user.name,
        profilePicture: user.profilePicture,
        language: user.language,
      },
    });
  } catch (error: any) {
    console.error('OTP verify error:', error);
    return res.status(500).json({ error: 'OTP verification failed.' });
  }
});

// 3. Web Registration
router.post('/register', rateLimitMiddleware, async (req: any, res: Response) => {
  try {
    const { phoneNumber, name, password } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    const normalized = normalizePhone(phoneNumber);
    if (normalized.length < 7) {
      return res.status(400).json({ error: 'Invalid phone number.' });
    }

    const emailAddress = `${normalized}@phonemail.com`;

    const existingUser = await findUserByPhone(phoneNumber);

    if (existingUser) {
      return res.status(400).json({ error: 'An account with this phone number already exists.' });
    }

    let passwordHash: string | undefined;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.create({
      data: {
        phoneNumber: normalized,
        emailAddress,
        name: name || `PhoneMail User ${normalized.slice(-4)}`,
        passwordHash,
      },
    });

    const token = jwt.sign(
      { id: user.id, phoneNumber: user.phoneNumber, emailAddress: user.emailAddress },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        emailAddress: user.emailAddress,
        name: user.name,
        profilePicture: user.profilePicture,
        language: user.language,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed.' });
  }
});

// 4. Password Login Fallback
router.post('/login', rateLimitMiddleware, async (req: any, res: Response) => {
  try {
    const { phoneNumber, password } = req.body;
    if (!phoneNumber || !password) {
      return res.status(400).json({ error: 'Phone number and password are required.' });
    }

    const user = await findUserByPhone(phoneNumber);

    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: 'Invalid phone number or password. Use OTP login if no password set.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid phone number or password.' });
    }

    const token = jwt.sign(
      { id: user.id, phoneNumber: user.phoneNumber, emailAddress: user.emailAddress },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        emailAddress: user.emailAddress,
        name: user.name,
        profilePicture: user.profilePicture,
        language: user.language,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed.' });
  }
});

// 5. Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { aliases: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({
      id: user.id,
      phoneNumber: user.phoneNumber,
      emailAddress: user.emailAddress,
      name: user.name,
      profilePicture: user.profilePicture,
      language: user.language,
      aliases: user.aliases,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

export default router;

