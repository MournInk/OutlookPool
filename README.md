# OutlookPool

A Node.js application for managing a pool of Outlook accounts with automatic token refresh and email viewing capabilities.

## Features

- 📥 **Import Accounts**: Import Outlook accounts in bulk
- 📤 **Export Accounts**: Export all accounts with updated tokens
- 🔄 **Auto Token Refresh**: Automatically refresh all account tokens every 6 hours
- 🎲 **Random Account Picker**: Randomly select an account and view its emails
- 📧 **Email Viewer**: View emails from both inbox and junk folders
- 🎨 **Beautiful UI**: Modern, responsive interface inspired by ShadCN design

## Installation

1. Clone the repository:
```bash
git clone https://github.com/MournInk/OutlookPool.git
cd OutlookPool
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will start on `http://localhost:3000`

## Account Format

Import accounts using the following format (one per line):
```
email----password----client_id----client_secret----refresh_token
```

Example:
```
MacyJerde1996@outlook.com----abc123----your-client-id----your-client-secret----your-refresh-token
```

**Note**: Both client_id and client_secret are required for secure OAuth2 token refresh.

## API Endpoints

- `GET /api/accounts` - Get all accounts
- `GET /api/accounts/:id` - Get account by ID
- `POST /api/accounts/import` - Import accounts
- `GET /api/accounts/export/all` - Export all accounts
- `DELETE /api/accounts/:id` - Delete an account
- `POST /api/accounts/pick` - Pick a random account and fetch emails
- `GET /api/health` - Health check

## Token Refresh

The system automatically refreshes all account tokens every 6 hours. You can also manually trigger a refresh from the UI.

## Security Notes

- Store the `data/accounts.json` file securely - it contains sensitive credentials
- The export function includes passwords and secrets for account portability - handle exported files with care
- Do not commit sensitive data to version control
- Use environment variables for sensitive configuration in production
- Consider implementing encryption at rest for the accounts.json file in production environments
- **The application is designed for trusted local/internal environments**
  - No authentication is implemented - add authentication middleware if exposing to untrusted networks
  - No rate limiting is implemented - add rate limiting middleware for production deployments
  - Consider using a reverse proxy (nginx, Apache) with authentication for production use

## License

ISC