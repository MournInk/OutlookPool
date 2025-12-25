export interface OutlookAccount {
  id: string;
  email: string;
  password: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  lastRefreshed?: Date;
}

export interface AccountImportFormat {
  email: string;
  password: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export interface AccountPublicInfo {
  id: string;
  email: string;
  clientId: string;
  lastRefreshed?: Date;
}
