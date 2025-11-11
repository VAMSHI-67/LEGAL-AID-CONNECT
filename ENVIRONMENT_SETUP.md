# Environment Setup Guide

This guide will help you create the necessary environment files to complete your port configuration setup.

## Step 1: Create Backend Environment File

Create a file named `.env` in the `backend/` directory with the following content:

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

## Step 2: Create Frontend Environment File

Create a file named `.env.local` in the root directory (same level as `package.json`) with the following content:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Frontend URL (for internal use)
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

## Step 3: Verify File Locations

Your project structure should look like this:
```
majorproject/
├── .env.local                    ← Frontend environment (root)
├── backend/
│   ├── .env                     ← Backend environment
│   └── server.js
├── package.json
└── ...
```

## Step 4: Test the Setup

1. **Start Backend First:**
   ```bash
   cd backend
   npm run server:dev
   ```
   You should see: `🚀 Server running on port 5000`

2. **Start Frontend Second:**
   ```bash
   # In a new terminal, from root directory
   npm run dev
   ```
   You should see: `ready - started server on 0.0.0.0:3000`

3. **Verify Communication:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
   - Check browser network tab to confirm API calls go to port 5000

## Troubleshooting

- **Backend won't start on port 5000**: Check if another service is using port 5000
- **Frontend can't connect to backend**: Verify `.env.local` has correct `NEXT_PUBLIC_API_URL`
- **CORS errors**: Ensure backend `.env` has `CORS_ORIGIN=http://localhost:3000`

## Security Notes

- Never commit `.env` files to git (they're already in `.gitignore`)
- `NEXT_PUBLIC_` variables are exposed to the browser
- Backend environment variables remain secure
