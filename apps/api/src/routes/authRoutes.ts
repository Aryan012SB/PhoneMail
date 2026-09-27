import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { getOtpProvider } from '../providers/otpProvider';
import { config } from '../config/env';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';

const router = Router();

// 0. Direct Demo Quick Login Endpoint
router.post('/demo-login', async (req: any, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const emailAddress = `${cleanPhone}@phonemail.com`;

    let user = await prisma.user.findUnique({
      where: { phoneNumber: cleanPhone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber: cleanPhone,
          emailAddress,
          name: `PhoneMail User ${cleanPhone.slice(-4)}`,
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

    const otpProvider = getOtpProvider();
    const result = await otpProvider.sendOtp(cleanPhone);

    return res.json({
      success: true,
      message: result.message,
      phoneNumber: cleanPhone,
      debugOtp: result.debugOtp,
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
    const otpProvider = getOtpProvider();
    const isValid = await otpProvider.verifyOtp(cleanPhone, otp);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP code.' });
    }

    const emailAddress = `${cleanPhone}@phonemail.com`;

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phoneNumber: cleanPhone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber: cleanPhone,
          emailAddress,
          name: `PhoneMail User ${cleanPhone.slice(-4)}`,
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

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 7) {
      return res.status(400).json({ error: 'Invalid phone number.' });
    }

    const emailAddress = `${cleanPhone}@phonemail.com`;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ phoneNumber: cleanPhone }, { emailAddress }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'An account with this phone number or email already exists.' });
    }

    let passwordHash: string | undefined;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.create({
      data: {
        phoneNumber: cleanPhone,
        emailAddress,
        name: name || `PhoneMail User ${cleanPhone.slice(-4)}`,
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

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const user = await prisma.user.findUnique({
      where: { phoneNumber: cleanPhone },
    });

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
