import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getSmsProvider } from '../providers/smsProvider';

const router = Router();

// Configure File Uploads for Attachments
const uploadDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max attachment limit
});

// Helper: Find or create a conversation thread for a set of user IDs
async function getOrCreateConversation(userIds: string[], subject?: string) {
  const sortedIds = [...new Set(userIds)].sort();
  const isGroup = sortedIds.length > 2;

  // Search existing conversation with exact same members
  const existingConvs = await prisma.conversation.findMany({
    where: {
      isGroup,
      members: {
        every: {
          userId: { in: sortedIds },
        },
      },
    },
    include: {
      members: true,
    },
  });

  for (const conv of existingConvs) {
    const convUserIds = conv.members.map(m => m.userId).sort();
    if (
      convUserIds.length === sortedIds.length &&
      convUserIds.every((id, index) => id === sortedIds[index])
    ) {
      return conv;
    }
  }

  // Create new conversation
  const newConv = await prisma.conversation.create({
    data: {
      subject: subject || 'Conversation',
      isGroup,
      members: {
        create: sortedIds.map(userId => ({ userId })),
      },
    },
    include: {
      members: true,
    },
  });

  return newConv;
}

// 1. Send Email (or Save Draft)
router.post('/send', authMiddleware, upload.array('attachments'), async (req: AuthRequest, res: Response) => {
  try {
    const senderId = req.user!.id;
    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    if (!sender) return res.status(404).json({ error: 'Sender user not found.' });

    const { to, cc, subject, body, isDraft, threadId, parentEmailId, draftId } = req.body;

    if (!isDraft && (!to || !to.trim())) {
      return res.status(400).json({ error: 'At least one recipient (To) is required.' });
    }

    const toAddresses: string[] = to ? to.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean) : [];
    const ccAddresses: string[] = cc ? cc.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean) : [];

    const allRecipientAddresses = Array.from(new Set([...toAddresses, ...ccAddresses]));

    // Resolve recipient user IDs
    const recipientUsers = await prisma.user.findMany({
      where: {
        OR: [
          { emailAddress: { in: allRecipientAddresses } },
          { phoneNumber: { in: allRecipientAddresses.map(a => a.replace('@phonemail.com', '')) } },
        ],
      },
    });

    const recipientMap = new Map<string, string>(); // email -> userId
    recipientUsers.forEach(u => {
      recipientMap.set(u.emailAddress.toLowerCase(), u.id);
      recipientMap.set(u.phoneNumber, u.id);
    });

    // Identify thread
    let conversationId = threadId;
    if (!conversationId && !isDraft) {
      const allUserIdsInThread = [senderId];
      recipientUsers.forEach(u => allUserIdsInThread.push(u.id));
      const conv = await getOrCreateConversation(allUserIdsInThread, subject);
      conversationId = conv.id;
    }

    let email: any;
    if (draftId) {
      const existingDraft = await prisma.email.findFirst({
        where: { id: draftId, senderId },
      });
      if (existingDraft) {
        email = await prisma.email.update({
          where: { id: existingDraft.id },
          data: {
            subject: subject || '(No Subject)',
            body: body || '',
            threadId: conversationId || existingDraft.threadId || null,
            parentEmailId: parentEmailId || existingDraft.parentEmailId || null,
            isDraft: isDraft === 'true' || isDraft === true,
          },
        });
      }
    }

    if (!email) {
      email = await prisma.email.create({
        data: {
          senderId,
          subject: subject || '(No Subject)',
          body: body || '',
          threadId: conversationId || null,
          parentEmailId: parentEmailId || null,
          isDraft: isDraft === 'true' || isDraft === true,
        },
      });
    }

    // Handle Attachments
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length > 0) {
      await prisma.attachment.createMany({
        data: files.map(file => ({
          emailId: email.id,
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          storagePath: file.path,
        })),
      });
    }

    // Handle Recipients & Internal Delivery
    if (!isDraft) {
      // Clear any prior draft recipients if converting draft
      await prisma.recipient.deleteMany({ where: { emailId: email.id } });

      const recipientData = [
        ...toAddresses.map(addr => ({
          emailId: email.id,
          recipientEmail: addr,
          recipientId: recipientMap.get(addr) || null,
          type: 'TO',
          status: 'DELIVERED',
        })),
        ...ccAddresses.map(addr => ({
          emailId: email.id,
          recipientEmail: addr,
          recipientId: recipientMap.get(addr) || null,
          type: 'CC',
          status: 'DELIVERED',
        })),
      ];

      if (recipientData.length > 0) {
        await prisma.recipient.createMany({ data: recipientData });
      }

      // Initialize UserEmailFolder state for Sender (Read by default)
      await prisma.userEmailFolder.upsert({
        where: { userId_emailId: { userId: senderId, emailId: email.id } },
        create: { userId: senderId, emailId: email.id, isRead: true },
        update: {},
      });

      // Initialize UserEmailFolder state for all registered Recipients (Unread by default)
      const smsProvider = getSmsProvider();
      for (const recUser of recipientUsers) {
        if (recUser.id !== senderId) {
          await prisma.userEmailFolder.upsert({
            where: { userId_emailId: { userId: recUser.id, emailId: email.id } },
            create: { userId: recUser.id, emailId: email.id, isRead: false },
            update: {},
          });

          // Trigger SMS Notification
          const smsText = `You have received an email from ${sender.name} (${sender.emailAddress}). Subject: ${email.subject}`;
          await smsProvider.sendSms(recUser.phoneNumber, smsText);
        }
      }
    }

    return res.json({
      success: true,
      emailId: email.id,
      threadId: conversationId || null,
      message: isDraft ? 'Draft saved successfully.' : 'Email sent successfully!',
    });
  } catch (error: any) {
    console.error('Send email error:', error);
    return res.status(500).json({ error: 'Failed to send email.' });
  }
});

// 2. Reply to Email Thread
router.post('/:id/reply', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { body } = req.body;
    const senderId = req.user!.id;

    const parentEmail = await prisma.email.findUnique({
      where: { id },
      include: {
        sender: true,
        recipients: true,
      },
    });

    if (!parentEmail) {
      return res.status(404).json({ error: 'Original email not found.' });
    }

    // Determine threadId
    const threadId = parentEmail.threadId || parentEmail.id;

    // Collect thread participants (locked To addresses)
    const replyToAddresses = new Set<string>();
    replyToAddresses.add(parentEmail.sender.emailAddress.toLowerCase());
    parentEmail.recipients.forEach(r => {
      if (r.recipientEmail.toLowerCase() !== req.user!.emailAddress.toLowerCase()) {
        replyToAddresses.add(r.recipientEmail.toLowerCase());
      }
    });

    const toAddresses = Array.from(replyToAddresses);

    // Create reply email
    const replyEmail = await prisma.email.create({
      data: {
        senderId,
        subject: parentEmail.subject.startsWith('Re:') ? parentEmail.subject : `Re: ${parentEmail.subject}`,
        body: body || '',
        threadId,
        parentEmailId: parentEmail.id,
        isDraft: false,
      },
    });

    // Create recipients
    const recipientUsers = await prisma.user.findMany({
      where: { emailAddress: { in: toAddresses } },
    });

    const recipientMap = new Map<string, string>();
    recipientUsers.forEach(u => recipientMap.set(u.emailAddress.toLowerCase(), u.id));

    await prisma.recipient.createMany({
      data: toAddresses.map(addr => ({
        emailId: replyEmail.id,
        recipientEmail: addr,
        recipientId: recipientMap.get(addr) || null,
        type: 'TO',
        status: 'DELIVERED',
      })),
    });

    // Folder states & SMS notifications
    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    const smsProvider = getSmsProvider();

    await prisma.userEmailFolder.upsert({
      where: { userId_emailId: { userId: senderId, emailId: replyEmail.id } },
      create: { userId: senderId, emailId: replyEmail.id, isRead: true },
      update: {},
    });

    for (const recUser of recipientUsers) {
      if (recUser.id !== senderId) {
        await prisma.userEmailFolder.upsert({
          where: { userId_emailId: { userId: recUser.id, emailId: replyEmail.id } },
          create: { userId: recUser.id, emailId: replyEmail.id, isRead: false },
          update: {},
        });

        const smsText = `You have received a reply from ${sender?.name || senderId}. Subject: ${replyEmail.subject}`;
        await smsProvider.sendSms(recUser.phoneNumber, smsText);
      }
    }

    return res.json({ success: true, email: replyEmail });
  } catch (error: any) {
    console.error('Reply email error:', error);
    return res.status(500).json({ error: 'Failed to reply to email.' });
  }
});

// 3. Get Conversations List (Mobile & Desktop Thread View)
router.get('/conversations', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const folder = (req.query.folder as string || 'inbox').toLowerCase();
    const filter = (req.query.filter as string || 'all').toLowerCase();
    const search = (req.query.q as string || '').trim().toLowerCase();

    // Fetch conversations user is part of
    const userConvs = await prisma.conversation.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, phoneNumber: true, emailAddress: true, profilePicture: true },
            },
          },
        },
        emails: {
          where: { isDraft: false },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, name: true, phoneNumber: true, emailAddress: true, profilePicture: true } },
            userStates: { where: { userId } },
            attachments: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const formattedConvs = userConvs
      .filter(conv => conv.emails.length > 0)
      .map(conv => {
        const latestEmail = conv.emails[0];
        const userState = latestEmail.userStates[0] || { isRead: false, isSpam: false, isTrash: false, isFavorite: false, isArchived: false, isImportant: false };
        const otherMembers = conv.members.filter(m => m.userId !== userId).map(m => m.user);

        return {
          id: conv.id,
          subject: conv.subject || latestEmail.subject,
          isGroup: conv.isGroup,
          members: conv.members.map(m => m.user),
          otherMembers,
          latestEmail: {
            id: latestEmail.id,
            sender: latestEmail.sender,
            body: latestEmail.body,
            createdAt: latestEmail.createdAt,
            hasAttachments: latestEmail.attachments.length > 0,
          },
          isRead: userState.isRead,
          isFavorite: userState.isFavorite,
          isSpam: userState.isSpam,
          isTrash: userState.isTrash,
          isArchived: userState.isArchived || false,
          isImportant: userState.isImportant || false,
        };
      })
      .filter(item => {
        // Folder check
        if (folder === 'spam' && !item.isSpam) return false;
        if (folder === 'trash' && !item.isTrash) return false;
        if (folder === 'favorites' && !item.isFavorite) return false;
        if (folder === 'archive' && (!item.isArchived || item.isTrash)) return false;
        if (folder === 'important' && (!item.isImportant || item.isTrash)) return false;
        if (folder === 'inbox' && (item.isSpam || item.isTrash || item.isArchived)) return false;

        // Filter chips check
        if (filter === 'unread' && item.isRead) return false;
        if (filter === 'attachments' && !item.latestEmail.hasAttachments) return false;
        if (filter === 'favorites' && !item.isFavorite) return false;

        // Search query check
        if (search) {
          const matchSubject = item.subject.toLowerCase().includes(search);
          const matchBody = item.latestEmail.body.toLowerCase().includes(search);
          const matchSender = item.latestEmail.sender.name.toLowerCase().includes(search) || item.latestEmail.sender.emailAddress.toLowerCase().includes(search);
          if (!matchSubject && !matchBody && !matchSender) return false;
        }

        return true;
      });

    return res.json(formattedConvs);
  } catch (error: any) {
    console.error('Fetch conversations error:', error);
    return res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
});

// 4. Get Detailed Thread Messages inside a Conversation
router.get('/conversations/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, phoneNumber: true, emailAddress: true, profilePicture: true } },
          },
        },
        emails: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, name: true, phoneNumber: true, emailAddress: true, profilePicture: true } },
            recipients: true,
            attachments: true,
            userStates: { where: { userId } },
          },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Filter out trashed emails from thread view for this user
    const nonTrashedEmails = conversation.emails.filter(e => {
      const state = e.userStates && e.userStates[0];
      return !state || !state.isTrash;
    });

    // Mark emails in this conversation as READ & SEEN for current user
    const emailIds = nonTrashedEmails.map(e => e.id);
    for (const emailId of emailIds) {
      await prisma.userEmailFolder.upsert({
        where: { userId_emailId: { userId, emailId } },
        create: { userId, emailId, isRead: true },
        update: { isRead: true },
      });
      await prisma.recipient.updateMany({
        where: { emailId, recipientId: userId },
        data: { status: 'SEEN', readAt: new Date() },
      });
    }

    return res.json({
      ...conversation,
      emails: nonTrashedEmails,
    });
  } catch (error: any) {
    console.error('Fetch thread error:', error);
    return res.status(500).json({ error: 'Failed to fetch conversation detail.' });
  }
});

// 5. Get Emails List (Desktop Mail View / Search / Folders)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const folder = (req.query.folder as string || 'inbox').toLowerCase();
    const filter = (req.query.filter as string || 'all').toLowerCase();
    const search = (req.query.q as string || '').trim().toLowerCase();

    // Query builder for emails
    let emails: any[] = [];

    if (folder === 'drafts') {
      emails = await prisma.email.findMany({
        where: {
          senderId: userId,
          isDraft: true,
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          sender: { select: { id: true, name: true, phoneNumber: true, emailAddress: true, profilePicture: true } },
          recipients: true,
          attachments: true,
        },
      });
    } else if (folder === 'sent') {
      emails = await prisma.email.findMany({
        where: {
          senderId: userId,
          isDraft: false,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, name: true, phoneNumber: true, emailAddress: true, profilePicture: true } },
          recipients: true,
          attachments: true,
          userStates: { where: { userId } },
        },
      });
    } else {
      // Inbox, Favorites, Spam, Trash, Archive, Important
      emails = await prisma.email.findMany({
        where: {
          OR: [
            { senderId: userId },
            { recipients: { some: { recipientId: userId } } },
            { recipients: { some: { recipientEmail: req.user!.emailAddress } } },
          ],
          isDraft: false,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, name: true, phoneNumber: true, emailAddress: true, profilePicture: true } },
          recipients: true,
          attachments: true,
          userStates: { where: { userId } },
        },
      });
    }

    const formattedEmails = emails
      .map(email => {
        const state = email.userStates && email.userStates[0] ? email.userStates[0] : { isRead: false, isSpam: false, isTrash: false, isFavorite: false, isArchived: false, isImportant: false };
        return {
          ...email,
          isRead: state.isRead,
          isSpam: state.isSpam,
          isTrash: state.isTrash,
          isFavorite: state.isFavorite,
          isArchived: state.isArchived || false,
          isImportant: state.isImportant || false,
        };
      })
      .filter(email => {
        // Folder filtering
        if (folder === 'inbox' && (email.isSpam || email.isTrash || email.isArchived)) return false;
        if (folder === 'sent' && (email.isSpam || email.isTrash || email.isArchived)) return false;
        if (folder === 'drafts' && (email.isSpam || email.isTrash || email.isArchived)) return false;
        if (folder === 'spam' && !email.isSpam) return false;
        if (folder === 'trash' && !email.isTrash) return false;
        if (folder === 'favorites' && (!email.isFavorite || email.isTrash)) return false;
        if (folder === 'archive' && (!email.isArchived || email.isTrash)) return false;
        if (folder === 'important' && (!email.isImportant || email.isTrash)) return false;

        // Filter chip
        if (filter === 'unread' && email.isRead) return false;
        if (filter === 'attachments' && (!email.attachments || email.attachments.length === 0)) return false;
        if (filter === 'favorites' && !email.isFavorite) return false;

        // Search query
        if (search) {
          const matchSub = email.subject.toLowerCase().includes(search);
          const matchBody = email.body.toLowerCase().includes(search);
          const matchSender = email.sender.name.toLowerCase().includes(search) || email.sender.emailAddress.toLowerCase().includes(search);
          if (!matchSub && !matchBody && !matchSender) return false;
        }

        return true;
      });

    return res.json(formattedEmails);
  } catch (error: any) {
    console.error('Fetch emails error:', error);
    return res.status(500).json({ error: 'Failed to fetch emails.' });
  }
});

// 6. Toggle Email States (Read/Unread, Favorite, Spam, Trash, Archive, Important)
router.patch('/:id/state', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { isRead, isFavorite, isSpam, isTrash, isArchived, isImportant } = req.body;

    const dataToUpdate: any = {};
    if (isRead !== undefined) dataToUpdate.isRead = isRead;
    if (isFavorite !== undefined) dataToUpdate.isFavorite = isFavorite;
    if (isSpam !== undefined) dataToUpdate.isSpam = isSpam;
    if (isTrash !== undefined) dataToUpdate.isTrash = isTrash;
    if (isArchived !== undefined) dataToUpdate.isArchived = isArchived;
    if (isImportant !== undefined) dataToUpdate.isImportant = isImportant;

    const state = await prisma.userEmailFolder.upsert({
      where: { userId_emailId: { userId, emailId: id } },
      create: { userId, emailId: id, ...dataToUpdate },
      update: dataToUpdate,
    });

    if (isRead === true) {
      await prisma.recipient.updateMany({
        where: { emailId: id, recipientId: userId },
        data: { status: 'SEEN', readAt: new Date() },
      });
    }

    return res.json({ success: true, state });
  } catch (error: any) {
    console.error('Update email state error:', error);
    return res.status(500).json({ error: 'Failed to update email state.' });
  }
});

// 7. Delete Email (Move to Trash OR Permanent Delete)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check existing folder state for this user & email
    const existingState = await prisma.userEmailFolder.findUnique({
      where: { userId_emailId: { userId, emailId: id } },
    });

    const isAlreadyInTrash = existingState && existingState.isTrash;
    const isExplicitPermanent = req.query.permanent === 'true';

    if (isAlreadyInTrash || isExplicitPermanent) {
      // 1. Remove user's folder state association
      await prisma.userEmailFolder.deleteMany({
        where: { userId, emailId: id },
      });

      // 2. Check if any other users still have a reference to this email
      const remainingStates = await prisma.userEmailFolder.count({
        where: { emailId: id },
      });

      // 3. If no other users reference this email, purge attachments, recipients, and email record completely
      if (remainingStates === 0) {
        await prisma.attachment.deleteMany({ where: { emailId: id } });
        await prisma.recipient.deleteMany({ where: { emailId: id } });
        await prisma.email.delete({ where: { id } }).catch(() => {});
      }

      return res.json({ success: true, message: 'Email permanently deleted from system.' });
    } else {
      // Move to Trash
      await prisma.userEmailFolder.upsert({
        where: { userId_emailId: { userId, emailId: id } },
        create: { userId, emailId: id, isTrash: true },
        update: { isTrash: true },
      });
      return res.json({ success: true, message: 'Email moved to Trash.' });
    }
  } catch (error) {
    console.error('Delete email error:', error);
    return res.status(500).json({ error: 'Failed to delete email.' });
  }
});

export default router;
