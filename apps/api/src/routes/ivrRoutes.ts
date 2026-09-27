import { Router, Response } from 'express';
import { getIvrProvider } from '../providers/ivrProvider';

const router = Router();

// Toll-Free IVR Webhook / Call Trigger
router.post('/webhook', async (req: any, res: Response) => {
  try {
    const callerPhone = req.body.From || req.body.callerPhone || req.body.phoneNumber || '9876543210';
    const digits = req.body.Digits || req.body.digits || '1';

    const ivrProvider = getIvrProvider();
    const result = await ivrProvider.handleInboundCall(callerPhone, digits);

    // Return TwiML XML response for Twilio compatibility or JSON for mock
    if (req.headers['user-agent'] && req.headers['user-agent'].includes('Twilio')) {
      res.type('text/xml');
      return res.send(`
        <Response>
          <Say>Thank you for calling PhoneMail. ${result.message}</Say>
        </Response>
      `);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('IVR Webhook error:', error);
    return res.status(500).json({ error: 'Failed to process IVR call.' });
  }
});

export default router;
