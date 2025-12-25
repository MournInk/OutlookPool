import fs from 'fs';
import path from 'path';
import { OutlookAccount, AccountImportFormat } from '../models/Account';
import { v4 as uuidv4 } from 'uuid';

const DATA_FILE = path.join(__dirname, '../../data/accounts.json');

export class AccountStorage {
  private accounts: OutlookAccount[] = [];

  constructor() {
    this.loadAccounts();
  }

  private loadAccounts(): void {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        this.accounts = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      this.accounts = [];
    }
  }

  private saveAccounts(): void {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.accounts, null, 2));
    } catch (error) {
      console.error('Error saving accounts:', error);
    }
  }

  getAllAccounts(): OutlookAccount[] {
    return this.accounts;
  }

  getAccountById(id: string): OutlookAccount | undefined {
    return this.accounts.find(acc => acc.id === id);
  }

  addAccount(account: AccountImportFormat): OutlookAccount {
    const newAccount: OutlookAccount = {
      id: uuidv4(),
      ...account,
      lastRefreshed: new Date()
    };
    this.accounts.push(newAccount);
    this.saveAccounts();
    return newAccount;
  }

  updateAccount(id: string, updates: Partial<OutlookAccount>): OutlookAccount | null {
    const index = this.accounts.findIndex(acc => acc.id === id);
    if (index === -1) return null;
    
    this.accounts[index] = { ...this.accounts[index], ...updates };
    this.saveAccounts();
    return this.accounts[index];
  }

  deleteAccount(id: string): boolean {
    const index = this.accounts.findIndex(acc => acc.id === id);
    if (index === -1) return false;
    
    this.accounts.splice(index, 1);
    this.saveAccounts();
    return true;
  }

  getRandomAccount(): OutlookAccount | null {
    if (this.accounts.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * this.accounts.length);
    return this.accounts[randomIndex];
  }

  importAccounts(data: string): { success: number; failed: number; errors: string[] } {
    const lines = data.split('\n').filter(line => line.trim());
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const line of lines) {
      try {
        const parts = line.split('----');
        if (parts.length !== 4) {
          failed++;
          errors.push(`Invalid format: ${line}`);
          continue;
        }

        const [email, password, clientId, refreshToken] = parts.map(p => p.trim());
        
        if (!email || !password || !clientId || !refreshToken) {
          failed++;
          errors.push(`Missing fields in: ${line}`);
          continue;
        }

        this.addAccount({ email, password, clientId, refreshToken });
        success++;
      } catch (error) {
        failed++;
        errors.push(`Error processing line: ${line} - ${error}`);
      }
    }

    return { success, failed, errors };
  }

  exportAccounts(): string {
    return this.accounts
      .map(acc => `${acc.email}----${acc.password}----${acc.clientId}----${acc.refreshToken}`)
      .join('\n');
  }
}
