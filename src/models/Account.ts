export interface OutlookAccount {
  id: string;
  email: string;
  password: string;
  clientId: string;
  refreshToken: string;
  lastRefreshed?: Date;
}

export interface AccountImportFormat {
  email: string;
  password: string;
  clientId: string;
  refreshToken: string;
}
