import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting PhoneMail Database Seeding...');

  // Clean existing data
  await prisma.userEmailFolder.deleteMany({});
  await prisma.recipient.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.email.deleteMany({});
  await prisma.conversationMember.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.alias.deleteMany({});
  await prisma.otp.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Demo Users
  const alex = await prisma.user.create({
    data: {
      phoneNumber: '9876543210',
      emailAddress: '9876543210@phonemail.com',
      name: 'Alex Rivera',
      passwordHash,
      language: 'en',
      aliases: {
        create: [{ alias: 'alex.rivera@phonemail.com' }],
      },
    },
  });

  const sarah = await prisma.user.create({
    data: {
      phoneNumber: '9123456789',
      emailAddress: '9123456789@phonemail.com',
      name: 'Sarah Connor',
      passwordHash,
      language: 'en',
      aliases: {
        create: [{ alias: 'sarah.c@phonemail.com' }],
      },
    },
  });

  const david = await prisma.user.create({
    data: {
      phoneNumber: '9998887776',
      emailAddress: '9998887776@phonemail.com',
      name: 'David Miller',
      passwordHash,
      language: 'en',
    },
  });

  console.log('✅ Created Demo Users:');
  console.log(` - Alex Rivera (${alex.emailAddress})`);
  console.log(` - Sarah Connor (${sarah.emailAddress})`);
  console.log(` - David Miller (${david.emailAddress})`);

  // 2. Create 1-on-1 Conversation (Alex & Sarah)
  const conv1 = await prisma.conversation.create({
    data: {
      subject: 'Buildathon Project Submission',
      isGroup: false,
      members: {
        create: [{ userId: alex.id }, { userId: sarah.id }],
      },
    },
  });

  const email1 = await prisma.email.create({
    data: {
      senderId: sarah.id,
      subject: 'Buildathon Project Submission',
      body: 'Hey Alex! Have you finalized the architecture document for PhoneMail? Let me know if you need help with the responsive UI.',
      threadId: conv1.id,
      isDraft: false,
      recipients: {
        create: [{ recipientId: alex.id, recipientEmail: alex.emailAddress, type: 'TO' }],
      },
      attachments: {
        create: [
          {
            filename: 'architecture_diagram.pdf',
            mimeType: 'application/pdf',
            size: 1048576,
            storagePath: '/uploads/architecture_diagram.pdf',
          },
        ],
      },
    },
  });

  const email2 = await prisma.email.create({
    data: {
      senderId: alex.id,
      subject: 'Re: Buildathon Project Submission',
      body: 'Yes Sarah! The backend API and WhatsApp/Gmail UI modules are completely ready. Docker compose up -d is fully verified!',
      threadId: conv1.id,
      parentEmailId: email1.id,
      isDraft: false,
      recipients: {
        create: [{ recipientId: sarah.id, recipientEmail: sarah.emailAddress, type: 'TO' }],
      },
    },
  });

  // Folder states for Conv 1
  await prisma.userEmailFolder.createMany({
    data: [
      { userId: alex.id, emailId: email1.id, isRead: true, isFavorite: true },
      { userId: alex.id, emailId: email2.id, isRead: true },
      { userId: sarah.id, emailId: email1.id, isRead: true },
      { userId: sarah.id, emailId: email2.id, isRead: false },
    ],
  });

  // 3. Create Group Conversation (Alex, Sarah, David)
  const conv2 = await prisma.conversation.create({
    data: {
      subject: 'Hackathon Team Sync',
      isGroup: true,
      members: {
        create: [{ userId: alex.id }, { userId: sarah.id }, { userId: david.id }],
      },
    },
  });

  const email3 = await prisma.email.create({
    data: {
      senderId: david.id,
      subject: 'Hackathon Team Sync',
      body: 'Team, welcoming everyone to PhoneMail! Remember that user phone numbers function directly as their primary email ID.',
      threadId: conv2.id,
      isDraft: false,
      recipients: {
        create: [
          { recipientId: alex.id, recipientEmail: alex.emailAddress, type: 'TO' },
          { recipientId: sarah.id, recipientEmail: sarah.emailAddress, type: 'TO' },
        ],
      },
    },
  });

  await prisma.userEmailFolder.createMany({
    data: [
      { userId: alex.id, emailId: email3.id, isRead: false, isFavorite: true },
      { userId: sarah.id, emailId: email3.id, isRead: true },
      { userId: david.id, emailId: email3.id, isRead: true },
    ],
  });

  // 4. Create Draft for Alex
  await prisma.email.create({
    data: {
      senderId: alex.id,
      subject: 'Draft: Marketing Strategy 2026',
      body: 'Key selling points of PhoneMail:\n1. Zero friction account creation\n2. Toll-Free IVR access\n3. SMS fallback notifications',
      isDraft: true,
    },
  });

  // 5. Create Spam Email for Alex
  const spamEmail = await prisma.email.create({
    data: {
      senderId: david.id,
      subject: 'CLAIM YOUR PRIZE NOW!',
      body: 'You won $10,000 in crypto! Click here to claim your reward immediately.',
      isDraft: false,
      recipients: {
        create: [{ recipientId: alex.id, recipientEmail: alex.emailAddress, type: 'TO' }],
      },
    },
  });

  await prisma.userEmailFolder.create({
    data: { userId: alex.id, emailId: spamEmail.id, isSpam: true, isRead: false },
  });

  console.log('🎉 Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
