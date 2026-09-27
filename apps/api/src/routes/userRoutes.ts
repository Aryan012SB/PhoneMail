import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Profile Update
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, language, profilePicture, newPassword } = req.body;
    const userId = req.user!.id;

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (language !== undefined) dataToUpdate.language = language;
    if (profilePicture !== undefined) dataToUpdate.profilePicture = profilePicture;
    if (newPassword) {
      dataToUpdate.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        phoneNumber: true,
        emailAddress: true,
        name: true,
        profilePicture: true,
        language: true,
      },
    });

    return res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Alias List
router.get('/aliases', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const aliases = await prisma.alias.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(aliases);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch aliases.' });
  }
});

// Create Alias
router.post('/aliases', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { alias } = req.body;
    if (!alias || typeof alias !== 'string') {
      return res.status(400).json({ error: 'Alias string is required.' });
    }

    const cleanAlias = alias.trim().toLowerCase();
    const fullAlias = cleanAlias.includes('@') ? cleanAlias : `${cleanAlias}@phonemail.com`;

    const existing = await prisma.alias.findUnique({
      where: { alias: fullAlias },
    });

    if (existing) {
      return res.status(400).json({ error: 'This alias is already taken.' });
    }

    const newAlias = await prisma.alias.create({
      data: {
        userId: req.user!.id,
        alias: fullAlias,
      },
    });

    return res.json({ success: true, alias: newAlias });
  } catch (error: any) {
    console.error('Alias create error:', error);
    return res.status(500).json({ error: 'Failed to create alias.' });
  }
});

// Delete Alias
router.delete('/aliases/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.alias.deleteMany({
      where: { id, userId: req.user!.id },
    });
    return res.json({ success: true, message: 'Alias removed.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete alias.' });
  }
});

// Search Users by Phone / Email for Compose
router.get('/search', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const query = (req.query.q as string || '').trim().toLowerCase();
    if (!query) {
      return res.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: req.user!.id } },
          {
            OR: [
              { phoneNumber: { contains: query } },
              { emailAddress: { contains: query } },
              { name: { contains: query } },
            ],
          },
        ],
      },
      select: {
        id: true,
        phoneNumber: true,
        emailAddress: true,
        name: true,
        profilePicture: true,
      },
      take: 10,
    });

    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to search users.' });
  }
});

export default router;
