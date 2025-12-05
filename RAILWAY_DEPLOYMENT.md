# Railway Deployment Guide

This guide will walk you through deploying the NoSQL Security Monitor application to Railway.

## Prerequisites

- GitHub account (for connecting to Railway)
- Railway account (sign up at [railway.app](https://railway.app))
- MongoDB database (Railway MongoDB plugin or external MongoDB Atlas)

## Step 1: Prepare Your Repository

1. **Ensure your code is pushed to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Create a Procfile** (already created - see below)

## Step 2: Set Up Railway Project

1. **Sign in to Railway**
   - Go to [railway.app](https://railway.app)
   - Sign in with your GitHub account

2. **Create a New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect it's a Node.js project

## Step 3: Add MongoDB Database

### Option A: Railway MongoDB Plugin (Recommended)

1. In your Railway project, click "+ New"
2. Select "Database" → "Add MongoDB"
3. Railway will automatically create a MongoDB instance
4. Copy the `MONGO_URI` from the MongoDB service's "Variables" tab

### Option B: MongoDB Atlas (External)

1. Create a MongoDB Atlas account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string
4. Add it as an environment variable in Railway (see Step 4)

## Step 4: Configure Environment Variables

In your Railway service, go to the "Variables" tab and add:

### Required Variables

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
# OR if using Railway MongoDB: Use the MONGO_URI from the MongoDB service

# Server Port (Railway sets this automatically, but include as fallback)
PORT=8080

# Frontend URL (Update after deploying frontend)
FRONTEND_URL=https://your-frontend-domain.railway.app
# OR if using Vercel for frontend:
FRONTEND_URL=https://your-app.vercel.app

# Email Configuration (for alerts)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Gemini AI API (for report generation)
GEMINI_API_KEY=your-gemini-api-key
```

### How to Get Email App Password (Gmail)

1. Go to your Google Account settings
2. Security → 2-Step Verification → App passwords
3. Generate a new app password for "Mail"
4. Use this password for `EMAIL_PASS`

### How to Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy and add to `GEMINI_API_KEY`

## Step 5: Deploy Backend Service

1. **Railway will auto-deploy** when you connect your repo
2. **Check the Deployments tab** to see build logs
3. **Get your backend URL** from the service's "Settings" → "Domains"
   - Railway will provide a URL like: `https://your-app-production.up.railway.app`

## Step 6: Deploy Frontend

You have two options:

### Option A: Deploy Frontend as Separate Railway Service (Recommended)

1. **Create a new service** in the same Railway project
2. **Set Root Directory** to `frontend`
3. **Set Build Command**: `npm install && npm run build`
4. **Set Start Command**: `npx serve -s build -l 3000`
5. **Add environment variable**:
   ```env
   REACT_APP_API_URL=https://your-backend-url.railway.app
   ```
6. **Install serve** (add to frontend/package.json):
   ```json
   "dependencies": {
     "serve": "^14.2.0"
   }
   ```

### Option B: Deploy Frontend to Vercel

1. Push frontend code to GitHub
2. Import to Vercel
3. Add environment variable:
   ```env
   REACT_APP_API_URL=https://your-backend-url.railway.app
   ```
4. Deploy

## Step 7: Update CORS and Socket.io Configuration

After getting your frontend URL, update the backend environment variable:

```env
FRONTEND_URL=https://your-frontend-url.railway.app
```

Railway will automatically redeploy when you update environment variables.

## Step 8: Handle File Storage (Reports)

Railway's file system is ephemeral. For production, consider:

### Option A: Use Railway Volumes (Recommended for Railway)

1. In your Railway service, go to "Volumes"
2. Create a new volume
3. Mount it to `/app/reports`
4. Update your code to use the mounted volume

### Option B: Use Cloud Storage (Recommended for Production)

- AWS S3
- Google Cloud Storage
- Cloudinary

Update `reports/generateReport.js` to upload to cloud storage instead of local filesystem.

## Step 9: Verify Deployment

1. **Check backend health**:
   ```bash
   curl https://your-backend-url.railway.app/api/dashboard/metrics
   ```

2. **Check frontend**:
   - Visit your frontend URL
   - Try logging in and checking the dashboard

3. **Test Socket.io connection**:
   - Open browser console on frontend
   - Should see "Connected to security monitoring system"

## Step 10: Set Up Custom Domains (Optional)

1. In Railway service settings, go to "Domains"
2. Add your custom domain
3. Update DNS records as instructed
4. Update `FRONTEND_URL` environment variable

## Troubleshooting

### Build Fails

- Check build logs in Railway dashboard
- Ensure all dependencies are in `package.json`
- Check Node.js version compatibility

### MongoDB Connection Issues

- Verify `MONGO_URI` is correct
- Check MongoDB network access (allow Railway IPs)
- For Atlas: Add `0.0.0.0/0` to IP whitelist (or Railway's IP range)

### Socket.io Not Connecting

- Verify `FRONTEND_URL` matches your frontend domain exactly
- Check CORS settings in `server.js`
- Ensure WebSocket is enabled in Railway (should be by default)

### Reports Not Saving

- Railway's filesystem is ephemeral - use volumes or cloud storage
- Check write permissions
- Verify reports directory exists

### Email Not Sending

- Verify `EMAIL_USER` and `EMAIL_PASS` are correct
- Use app-specific password, not regular password
- Check Railway logs for email errors

## Environment Variables Summary

```env
# Database
MONGO_URI=mongodb+srv://...

# Server
PORT=8080
FRONTEND_URL=https://your-frontend.railway.app

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=app-password

# AI
GEMINI_API_KEY=your-api-key
```

## Railway Service Structure

```
Railway Project
├── Backend Service (Node.js)
│   ├── Root: / (project root)
│   ├── Build: npm install
│   └── Start: node server.js
│
├── MongoDB Service (if using Railway MongoDB)
│   └── Auto-configured
│
└── Frontend Service (optional)
    ├── Root: /frontend
    ├── Build: npm install && npm run build
    └── Start: npx serve -s build -l 3000
```

## Cost Estimation

- **Railway Hobby Plan**: $5/month (includes $5 credit)
- **MongoDB Atlas**: Free tier available (512MB)
- **Total**: ~$5-10/month for small deployments

## Next Steps

1. Set up monitoring and alerts
2. Configure backups for MongoDB
3. Set up CI/CD for automatic deployments
4. Add custom domains
5. Set up SSL certificates (automatic with Railway)

## Support

- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
