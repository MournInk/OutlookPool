import axios from 'axios';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  receivedDateTime: string;
  bodyPreview: string;
  isRead: boolean;
  hasAttachments: boolean;
}

export class OutlookService {
  
  async refreshAccessToken(clientId: string, refreshToken: string): Promise<TokenResponse | null> {
    try {
      // Microsoft OAuth2 token endpoint
      const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
      
      const params = new URLSearchParams();
      params.append('client_id', clientId);
      params.append('refresh_token', refreshToken);
      params.append('grant_type', 'refresh_token');
      params.append('scope', 'https://graph.microsoft.com/Mail.Read offline_access');

      const response = await axios.post(tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  async getEmails(accessToken: string, folderName?: string): Promise<EmailMessage[]> {
    try {
      const client = Client.init({
        authProvider: (done) => {
          done(null, accessToken);
        }
      });

      let endpoint = '/me/messages?$top=50&$orderby=receivedDateTime DESC';
      if (folderName) {
        endpoint = `/me/mailFolders/${folderName}/messages?$top=50&$orderby=receivedDateTime DESC`;
      }

      const response = await client.api(endpoint).get();

      return response.value.map((msg: any) => ({
        id: msg.id,
        subject: msg.subject || '(No Subject)',
        from: msg.from?.emailAddress?.address || 'Unknown',
        receivedDateTime: msg.receivedDateTime,
        bodyPreview: msg.bodyPreview || '',
        isRead: msg.isRead,
        hasAttachments: msg.hasAttachments
      }));
    } catch (error) {
      console.error('Error fetching emails:', error);
      return [];
    }
  }

  async getAllEmails(accessToken: string): Promise<{ inbox: EmailMessage[]; junk: EmailMessage[] }> {
    try {
      const [inbox, junk] = await Promise.all([
        this.getEmails(accessToken, 'inbox'),
        this.getEmails(accessToken, 'junkemail')
      ]);

      return { inbox, junk };
    } catch (error) {
      console.error('Error fetching all emails:', error);
      return { inbox: [], junk: [] };
    }
  }

  async getEmailBody(accessToken: string, messageId: string): Promise<string> {
    try {
      const client = Client.init({
        authProvider: (done) => {
          done(null, accessToken);
        }
      });

      const response = await client.api(`/me/messages/${messageId}`).get();
      return response.body?.content || '';
    } catch (error) {
      console.error('Error fetching email body:', error);
      return '';
    }
  }
}
