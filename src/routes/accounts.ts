import express from 'express';
import { AccountStorage } from '../services/AccountStorage';
import { OutlookService } from '../services/OutlookService';

export function createAccountRoutes(accountStorage: AccountStorage, outlookService: OutlookService) {
  const router = express.Router();

  // Get all accounts (public info only)
  router.get('/', (req, res) => {
    const accounts = accountStorage.getAllAccountsPublic();
    res.json(accounts);
  });

  // Get account by ID (public info only)
  router.get('/:id', (req, res) => {
    const account = accountStorage.getAccountById(req.params.id);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    // Return only public information
    const publicAccount = {
      id: account.id,
      email: account.email,
      clientId: account.clientId,
      lastRefreshed: account.lastRefreshed
    };
    res.json(publicAccount);
  });

  // Import accounts
  router.post('/import', (req, res) => {
    const { data } = req.body;
    if (!data || typeof data !== 'string') {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    // Limit data size to 10MB
    if (data.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Data too large (max 10MB)' });
    }

    const result = accountStorage.importAccounts(data);
    res.json(result);
  });

  // Export accounts
  router.get('/export/all', (req, res) => {
    const exportData = accountStorage.exportAccounts();
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename=accounts.txt');
    res.send(exportData);
  });

  // Delete account
  router.delete('/:id', (req, res) => {
    const success = accountStorage.deleteAccount(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json({ success: true });
  });

  // Pick random account and get emails
  router.post('/pick', async (req, res) => {
    try {
      const account = accountStorage.getRandomAccount();
      if (!account) {
        return res.status(404).json({ error: 'No accounts available' });
      }

      // Get access token
      const tokenResponse = await outlookService.refreshAccessToken(
        account.clientId,
        account.clientSecret,
        account.refreshToken
      );

      if (!tokenResponse) {
        return res.status(500).json({ error: 'Failed to refresh token' });
      }

      // Update refresh token if changed
      if (tokenResponse.refresh_token !== account.refreshToken) {
        accountStorage.updateAccount(account.id, {
          refreshToken: tokenResponse.refresh_token,
          lastRefreshed: new Date()
        });
      }

      // Fetch emails
      const emails = await outlookService.getAllEmails(tokenResponse.access_token);

      res.json({
        account: {
          id: account.id,
          email: account.email
        },
        emails
      });
    } catch (error) {
      console.error('Error picking account:', error);
      res.status(500).json({ error: 'Failed to pick account' });
    }
  });

  // Get email body
  router.post('/email/:accountId/body', async (req, res) => {
    try {
      const { messageId } = req.body;
      
      // Validate messageId
      if (!messageId || typeof messageId !== 'string') {
        return res.status(400).json({ error: 'Invalid message ID' });
      }

      // Validate messageId format (should be a GUID-like string)
      const guidRegex = /^[a-zA-Z0-9_-]+$/;
      if (!guidRegex.test(messageId)) {
        return res.status(400).json({ error: 'Invalid message ID format' });
      }

      const account = accountStorage.getAccountById(req.params.accountId);
      
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      const tokenResponse = await outlookService.refreshAccessToken(
        account.clientId,
        account.clientSecret,
        account.refreshToken
      );

      if (!tokenResponse) {
        return res.status(500).json({ error: 'Failed to refresh token' });
      }

      const body = await outlookService.getEmailBody(tokenResponse.access_token, messageId);
      res.json({ body });
    } catch (error) {
      console.error('Error fetching email body:', error);
      res.status(500).json({ error: 'Failed to fetch email body' });
    }
  });

  return router;
}
