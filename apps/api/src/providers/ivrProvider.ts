import { prisma } from '../utils/prisma';
import { getSmsProvider } from './smsProvider';
import { config } from '../config/env';

export interface IvrProvider {
  handleInboundCall(callerPhone: string, digitsPressed?: string): Promise<{ success: boolean; message: string; user?: any }>;
}

export class MockIvrProvider implements IvrProvider {
  async handleInboundCall(callerPhone: string, digitsPressed: string = '1'): Promise<{ success: boolean; message: string; user?: any }> {
    console.log(`\n========================================`);
    console.log(`[MOCK IVR PROVIDER] Inbound call received from: ${callerPhone}`);
    console.log(`[IVR ACTION] User pressed digit: ${digitsPressed}`);

    if (digitsPressed !== '1') {
      return { success: false, message: 'Invalid IVR option pressed' };
    }

    const cleanPhone = callerPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 7) {
      return { success: false, message: 'Invalid phone number received from caller ID' };
    }

    const emailAddress = `${cleanPhone}@phonemail.com`;

    // Check if account exists or create
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
      console.log(`[IVR CREATION] Successfully created account for ${emailAddress}`);
    } else {
      console.log(`[IVR CREATION] Account already exists for ${emailAddress}`);
    }

    // Trigger confirmation SMS
    const sms = getSmsProvider();
    await sms.sendSms(
      cleanPhone,
      `Welcome to PhoneMail! Your account has been activated via Toll-Free Voice. Your email ID is ${emailAddress}.`
    );

    console.log(`========================================\n`);

    return {
      success: true,
      message: `Account activated for ${emailAddress} via IVR`,
      user,
    };
  }
}

export class TwilioIvrProvider implements IvrProvider {
  private mockFallback = new MockIvrProvider();

  async handleInboundCall(callerPhone: string, digitsPressed?: string): Promise<{ success: boolean; message: string; user?: any }> {
    return this.mockFallback.handleInboundCall(callerPhone, digitsPressed);
  }
}

export function getIvrProvider(): IvrProvider {
  if (config.defaultIvrProvider === 'twilio' && config.twilio.accountSid) {
    return new TwilioIvrProvider();
  }
  return new MockIvrProvider();
}
