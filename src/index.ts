import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { AccountStorage } from './services/AccountStorage';
import { OutlookService } from './services/OutlookService';
import { TokenRefreshService } from './services/TokenRefreshService';
import { createAccountRoutes } from './routes/accounts';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.text({ limit: '10mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Initialize services
const accountStorage = new AccountStorage();
const outlookService = new OutlookService();
const tokenRefreshService = new TokenRefreshService(accountStorage);

// Start token refresh service
tokenRefreshService.start();

// API Routes
app.use('/api/accounts', createAccountRoutes(accountStorage, outlookService));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', accounts: accountStorage.getAllAccounts().length });
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  tokenRefreshService.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  tokenRefreshService.stop();
  process.exit(0);
});
