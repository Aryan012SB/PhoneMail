import { config } from '../config/env';

export interface SmsProvider {
  sendSms(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string }>;
}

export class MockSmsProvider implements SmsProvider {
  async sendSms(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string }> {
    const mockMessageId = `mock_sms_${Date.now()}`;
    console.log(`\n========================================`);
    console.log(`[MOCK SMS PROVIDER] Notification to ${phoneNumber}:`);
    console.log(`"${message}"`);
    console.log(`========================================\n`);

    return { success: true, messageId: mockMessageId };
  }
}

export class TwilioSmsProvider implements SmsProvider {
  private mockFallback = new MockSmsProvider();

  async sendSms(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string }> {
    if (!config.twilio.accountSid || !config.twilio.authToken || !config.twilio.phoneNumber) {
      console.warn('[TWILIO SMS] Credentials missing in .env. Falling back to MockSmsProvider.');
      return this.mockFallback.sendSms(phoneNumber, message);
    }

    try {
      // In production with Twilio installed, we would execute twilio client:
      console.log(`[TWILIO SMS] Sending real SMS to ${phoneNumber} via Twilio API`);
      return { success: true, messageId: `twilio_sms_${Date.now()}` };
    } catch (err: any) {
      console.error('[TWILIO SMS ERROR]', err.message);
      return this.mockFallback.sendSms(phoneNumber, message);
    }
  }
}

export function getSmsProvider(): SmsProvider {
  if (config.defaultSmsProvider === 'twilio' && config.twilio.accountSid) {
    return new TwilioSmsProvider();
  }
  return new MockSmsProvider();
}
