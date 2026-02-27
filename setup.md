# Backend Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on the `.env.example` and fill in your environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your actual credentials:
   ```
   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # Supabase Configuration
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRE=30d
   ```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## Integration with Flutter App

The Flutter app is already configured to fetch configuration from this backend. Make sure:

1. The backend server is running
2. The `backendUrl` in `supabase_config_new.dart` matches your server URL
3. The Flutter app can access the backend (same network or public URL)

## Security Notes

- Never commit the `.env` file to version control
- Use strong, unique secrets for production
- Consider using additional security measures like API rate limiting, input validation, etc.
