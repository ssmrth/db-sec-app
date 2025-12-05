# Railway Deployment Quick Start

## 🚀 Quick Checklist

### 1. Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] MongoDB database ready (Railway MongoDB or Atlas)
- [ ] Gmail app password generated
- [ ] Gemini API key obtained

### 2. Railway Setup
- [ ] Create Railway account
- [ ] Create new project from GitHub repo
- [ ] Add MongoDB service (if using Railway MongoDB)

### 3. Environment Variables (Backend Service)
```env
MONGO_URI=mongodb+srv://...
PORT=8080
FRONTEND_URL=https://your-frontend.railway.app
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
GEMINI_API_KEY=your-gemini-key
```

### 4. Deploy Backend
- [ ] Railway auto-deploys on push
- [ ] Copy backend URL from Railway dashboard
- [ ] Test: `curl https://your-backend.railway.app/api/dashboard/metrics`

### 5. Deploy Frontend

**Option A: Railway (Separate Service)**
- [ ] Create new service in same project
- [ ] Set root directory: `frontend`
- [ ] Set build command: `npm install && npm run build`
- [ ] Set start command: `npx serve -s build -l 3000`
- [ ] Add env var: `REACT_APP_API_URL=https://your-backend.railway.app`

**Option B: Vercel**
- [ ] Import frontend to Vercel
- [ ] Add env var: `REACT_APP_API_URL=https://your-backend.railway.app`
- [ ] Deploy

### 6. Update Backend CORS
- [ ] Update `FRONTEND_URL` in backend service with frontend URL
- [ ] Railway auto-redeploys

### 7. Verify
- [ ] Frontend loads
- [ ] Can connect to backend API
- [ ] Socket.io connects (check browser console)
- [ ] Can trigger test attack
- [ ] Email alerts work

## 📝 Important Notes

1. **File Storage**: Reports directory is ephemeral. Use Railway Volumes or cloud storage for production.

2. **MongoDB**: 
   - Railway MongoDB: Auto-configured, get URI from service variables
   - Atlas: Add `0.0.0.0/0` to IP whitelist for Railway access

3. **CORS**: Must match exactly - include protocol (https://) and no trailing slash

4. **Socket.io**: Works automatically with Railway, no special config needed

## 🔗 Useful Links

- Railway Dashboard: https://railway.app/dashboard
- Railway Docs: https://docs.railway.app
- MongoDB Atlas: https://cloud.mongodb.com

## ⚠️ Common Issues

**Build fails**: Check Node.js version, ensure all deps in package.json

**MongoDB connection**: Verify URI, check network access

**CORS errors**: Verify FRONTEND_URL matches exactly

**Socket.io not connecting**: Check FRONTEND_URL, verify CORS settings
