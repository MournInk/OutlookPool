import * as cron from 'node-cron';
import { AccountStorage } from './AccountStorage';
import { OutlookService } from './OutlookService';

export class TokenRefreshService {
  private accountStorage: AccountStorage;
  private outlookService: OutlookService;
  private task: cron.ScheduledTask | null = null;

  constructor(accountStorage: AccountStorage) {
    this.accountStorage = accountStorage;
    this.outlookService = new OutlookService();
  }

  start(): void {
    // Refresh tokens every 6 hours
    this.task = cron.schedule('0 */6 * * *', async () => {
      console.log('Starting scheduled token refresh...');
      await this.refreshAllTokens();
    });

    console.log('Token refresh service started - will run every 6 hours');
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      console.log('Token refresh service stopped');
    }
  }

  async refreshAllTokens(): Promise<void> {
    const accounts = this.accountStorage.getAllAccounts();
    console.log(`Refreshing tokens for ${accounts.length} accounts...`);

    for (const account of accounts) {
      try {
        const tokenResponse = await this.outlookService.refreshAccessToken(
          account.clientId,
          account.refreshToken
        );

        if (tokenResponse && tokenResponse.refresh_token) {
          this.accountStorage.updateAccount(account.id, {
            refreshToken: tokenResponse.refresh_token,
            lastRefreshed: new Date()
          });
          console.log(`Successfully refreshed token for ${account.email}`);
        } else {
          console.error(`Failed to refresh token for ${account.email}`);
        }
      } catch (error) {
        console.error(`Error refreshing token for ${account.email}:`, error);
      }
    }

    console.log('Token refresh completed');
  }
}
