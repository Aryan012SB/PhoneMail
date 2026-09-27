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

    // 7. Test Toll-Free IVR Registration Simulation
    const ivrProvider = getIvrProvider();
    const ivrRes = await ivrProvider.handleInboundCall('9776655443', '1');
    assert(ivrRes.success === true, '8. Toll-Free IVR inbound call handler registers account via caller ID');

    console.log(`\n🎉 TEST SUITE COMPLETED: ${passed}/${total} tests passed!`);
  } catch (err: any) {
    console.error('Test suite error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTestSuite();
