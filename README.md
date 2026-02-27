# Health AI App Backend

This is the backend server for the Health AI App, built with Node.js and Express.

## Features

- Secure API endpoints
- Environment variable management
- Rate limiting
- CORS support
- Security headers with Helmet

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and fill in your environment variables
4. Start the server:
   ```bash
   npm start
   ```
   For development with auto-reload:
   ```bash
   npm run dev
   ```

## Environment Variables

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `JWT_SECRET`: Secret for JWT token signing
- `JWT_EXPIRE`: JWT token expiration time

## API Endpoints

- `GET /api/health`: Health check endpoint
- `GET /api/config`: Returns configuration data for the frontend app

## Security

- Rate limiting is enabled on all `/api/` routes
- Security headers are added with Helmet
- Environment variables are used to keep sensitive data secure
