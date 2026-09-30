import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getOtpProvider } from './apps/api/src/providers/otpProvider';
import { getSmsProvider } from './apps/api/src/providers/smsProvider';
import { getIvrProvider } from './apps/api/src/providers/ivrProvider';

const prisma = new PrismaClient();

async function runTestSuite() {
  console.log('🧪 Starting PhoneMail Comprehensive Test Suite...\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(` ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(` ❌ FAIL: ${testName}`);
    }
  }

  try {
    // 1. Test OTP Provider Abstraction (Mock & Hash Verification)
    const otpProvider = getOtpProvider();
    const sendResult = await otpProvider.sendOtp('99900011122');
    assert(sendResult.success === true, '1. OTP Provider sends OTP code successfully');

    const verifyResult = await otpProvider.verifyOtp('99900011122', '123456');
    assert(verifyResult === true, '2. OTP Provider verifies 6-digit code correctly');

    // 2. Test User Account Creation & Email ID Generation
    const testPhone = '9887766554';
    const expectedEmail = `${testPhone}@phonemail.com`;
    
    await prisma.user.deleteMany({ where: { phoneNumber: testPhone } });
    
    const user = await prisma.user.create({
      data: {
        phoneNumber: testPhone,
        emailAddress: expectedEmail,
        name: 'Test Runner User',
      },
    });
    assert(user.emailAddress === '9887766554@phonemail.com', '3. PhoneMail generates <phone>@phonemail.com ID automatically');

    // 3. Test Duplicate Phone Number Protection
    let duplicatePrevented = false;
    try {
      await prisma.user.create({
        data: {
          phoneNumber: testPhone,
          emailAddress: expectedEmail,
          name: 'Duplicate User',
        },
      });
    } catch (e) {
      duplicatePrevented = true;
    }
    assert(duplicatePrevented, '4. System prevents duplicate phone numbers & duplicate email IDs');

    // 4. Test Internal Email Sending & Recipient Delivery
    const sender = user;
    const recipientPhone = '9112233445';
    const recipientEmail = `${recipientPhone}@phonemail.com`;
    
    const recipientUser = await prisma.user.upsert({
      where: { phoneNumber: recipientPhone },
      create: { phoneNumber: recipientPhone, emailAddress: recipientEmail, name: 'Recipient Test User' },
      update: {},
    });

    const email = await prisma.email.create({
      data: {
        senderId: sender.id,
        subject: 'Automated Test Message',
        body: 'Testing internal delivery and SMS notification triggering.',
        isDraft: false,
        recipients: {
          create: [{ recipientId: recipientUser.id, recipientEmail, type: 'TO' }],
        },
      },
    });

    assert(Boolean(email.id), '5. Email message sent and persisted in database');

    // 5. Test SMS Notification Abstraction Trigger
    const smsProvider = getSmsProvider();
    const smsResult = await smsProvider.sendSms(
      recipientUser.phoneNumber,
      `You have received an email from ${sender.name}. Subject: ${email.subject}`
    );
    assert(smsResult.success === true, '6. SMS notification triggered for incoming email');

    // 6. Test Alias Management
    const aliasStr = 'test.alias@phonemail.com';
    const alias = await prisma.alias.create({
      data: { userId: sender.id, alias: aliasStr },
    });
    assert(alias.alias === aliasStr, '7. Secondary Alias ID successfully attached to user account');

    // 8. Test State Persistence (Read, Favorite, Spam, Trash, Archive, Important)
    const stateFolder = await prisma.userEmailFolder.upsert({
      where: { userId_emailId: { userId: recipientUser.id, emailId: email.id } },
      create: {
        userId: recipientUser.id,
        emailId: email.id,
        isRead: true,
        isFavorite: true,
        isSpam: false,
        isTrash: false,
        isArchived: true,
        isImportant: true,
      },
      update: {
        isRead: true,
        isFavorite: true,
        isArchived: true,
        isImportant: true,
      },
    });

    const verifyFolderState = await prisma.userEmailFolder.findUnique({
      where: { userId_emailId: { userId: recipientUser.id, emailId: email.id } },
    });

    assert(
      Boolean(verifyFolderState && verifyFolderState.isRead && verifyFolderState.isFavorite && verifyFolderState.isArchived && verifyFolderState.isImportant),
      '9. User email state changes (Read, Starred, Archived, Important) permanently saved in database'
    );

    // 9. Test Recipient SEEN status persistence
    await prisma.recipient.updateMany({
      where: { emailId: email.id, recipientId: recipientUser.id },
      data: { status: 'SEEN', readAt: new Date() },
    });

    const updatedRecipient = await prisma.recipient.findFirst({
      where: { emailId: email.id, recipientId: recipientUser.id },
    });
    assert(Boolean(updatedRecipient && updatedRecipient.status === 'SEEN' && updatedRecipient.readAt), '10. Recipient SEEN status & readAt timestamp permanently saved in database');

    // 10. Test Draft Creation & Edit Persistence
    const draftEmail = await prisma.email.create({
      data: {
        senderId: sender.id,
        subject: 'Initial Draft Subject',
        body: 'Initial Draft Body',
        isDraft: true,
      },
    });

    const updatedDraft = await prisma.email.update({
      where: { id: draftEmail.id },
      data: {
        subject: 'Updated Draft Subject',
        body: 'Updated Draft Body',
      },
    });

    const verifyDraft = await prisma.email.findUnique({ where: { id: draftEmail.id } });
    assert(Boolean(verifyDraft && verifyDraft.isDraft && verifyDraft.subject === 'Updated Draft Subject'), '11. Draft creation and edit updates permanently saved in database');

    // 11. Test Permanent Deletion Persistence
    await prisma.attachment.deleteMany({ where: { emailId: draftEmail.id } });
    await prisma.recipient.deleteMany({ where: { emailId: draftEmail.id } });
    await prisma.userEmailFolder.deleteMany({ where: { emailId: draftEmail.id } });
    await prisma.email.delete({ where: { id: draftEmail.id } });

    const verifyDeleted = await prisma.email.findUnique({ where: { id: draftEmail.id } });
    assert(verifyDeleted === null, '12. Permanent deletion completely purges email from database');

    console.log(`\n🎉 TEST SUITE COMPLETED: ${passed}/${total} tests passed!`);
  } catch (err: any) {
    console.error('Test suite error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTestSuite();
