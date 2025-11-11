# Port Configuration Setup Guide

This guide explains the permanent port configuration setup for your Next.js frontend and Node.js/Express backend to avoid port conflicts.

## What Was Changed

### 1. Backend Configuration ✅ COMPLETED
- **Port**: Backend now runs on port 5000 (fixed)
- **CORS**: Updated to allow frontend at port 3000
- **Environment**: Backend loads `.env` from its own directory
- **Server.js**: Updated to use `process.env.PORT` and proper CORS configuration

### 2. Frontend Configuration ✅ COMPLETED
- **Port**: Frontend now runs on port 3000 (fixed)
- **API Calls**: All API calls now use `NEXT_PUBLIC_API_URL` environment variable
- **No More Hardcoded URLs**: Replaced all hardcoded `localhost:3000` references
- **Utility Functions**: Created `utils/api.ts` for centralized API configuration
- **Context Updates**: Updated AuthContext and NotificationContext to use new API utilities

### 3. Package.json Scripts ✅ COMPLETED
- Updated `dev` and `start` scripts to use port 3000
- Backend scripts remain unchanged (use port 5000 from .env)

### 4. Service Scripts ✅ COMPLETED
- Updated `start-services.ps1` and `start-services.bat` to show correct ports
- Both scripts now correctly display Backend: 5000, Frontend: 3000

## Files You Need to Create

### Backend `.env` (create in `backend/` directory)
```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/legalaid_connect

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Server Configuration
PORT=5000
NODE_ENV=development

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

### Frontend `.env.local` (create in root directory)
```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Frontend URL (for internal use)
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

## How to Run

### Option 1: Run Separately
```bash
# Terminal 1 - Backend
cd backend
npm run server:dev

# Terminal 2 - Frontend  
npm run dev
```

### Option 2: Run Both Together
```bash
npm run dev:full
```

## What This Fixes

1. **No More Port Conflicts**: Backend (5000) and Frontend (3000) have fixed, separate ports
2. **Consistent API Calls**: All frontend API calls use the environment variable
3. **Easy Environment Switching**: Change backend URL in one place for different environments
4. **Proper CORS**: Backend allows requests from frontend at port 3000
5. **Clean Architecture**: Separation of concerns between frontend and backend

## Future Projects

Use this same pattern:
1. Backend: Create `.env` with `PORT=5000` and `CORS_ORIGIN=http://localhost:3000`
2. Frontend: Create `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:5000`
3. Use utility functions for API calls instead of hardcoded URLs
4. Keep ports consistent across development environments

## Troubleshooting

- **Backend won't start**: Check if port 5000 is available, or change `PORT` in backend `.env`
- **Frontend can't connect**: Verify backend is running on port 5000 and CORS is configured
- **Environment variables not loading**: Ensure `.env` files are in correct locations and not gitignored

## Security Notes

- `.env` files contain sensitive information and should never be committed to git
- `NEXT_PUBLIC_` variables are exposed to the browser, so only use for non-sensitive config
- Backend environment variables remain secure and are not exposed to the client
