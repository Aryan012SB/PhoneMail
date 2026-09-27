import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/env';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import emailRoutes from './routes/emailRoutes';
import ivrRoutes from './routes/ivrRoutes';

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.options('*', cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static upload files
const uploadsPath = path.join(__dirname, '../../uploads');
app.use('/uploads', express.static(uploadsPath));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PhoneMail API Service',
    environment: config.nodeEnv,
    devMode: config.devMode,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/ivr', ivrRoutes);

// Error Handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start Server
app.listen(config.port, () => {
  console.log(`\n========================================`);
  console.log(`🚀 PhoneMail API Server running on port ${config.port}`);
  console.log(`🔧 Mode: ${config.nodeEnv} | DEV_MODE: ${config.devMode}`);
  console.log(`========================================\n`);
});

export default app;
