# Seu Verso - Cloud Deployment Guide

## Quick Deploy to Railway (Recommended)

### 1. Prerequisites
- GitHub account (repo already there)
- Railway account (free tier: https://railway.app)
- API Keys ready:
  - `SUNO_API_KEY`
  - `GEMINI_API_KEY`
  - `OPENAI_API_KEY`
  - `RESEND_API_KEY`

### 2. Deploy on Railway (1 click)

#### Option A: Full Stack on Railway
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select: `guilhermessalvador92-code/seu-verso-mvp-v2`
4. Railway auto-detects Node.js backend
5. Add PostgreSQL/MySQL database
6. Set environment variables (see below)
7. Deploy!

#### Option B: Manual Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Set environment variables
railway variables set SUNO_API_KEY=your_key
railway variables set GEMINI_API_KEY=your_key
railway variables set OPENAI_API_KEY=your_key
railway variables set RESEND_API_KEY=your_key
railway variables set DATABASE_URL=your_db_url
railway variables set APP_URL=your_deployed_url

# Deploy
railway up
```

### 3. Environment Variables to Set

```env
# API Keys (get from their respective platforms)
SUNO_API_KEY=<your-suno-key>
GEMINI_API_KEY=<your-gemini-key>
OPENAI_API_KEY=<your-openai-key>
RESEND_API_KEY=<your-resend-key>

# Database
DATABASE_URL=mysql://user:password@host/database

# Application
APP_URL=https://your-domain.railway.app
NODE_ENV=production
PORT=3000

# Optional Analytics
VITE_ANALYTICS_ENDPOINT=<optional>
VITE_ANALYTICS_WEBSITE_ID=<optional>
```

### 4. Database Setup

Railway provides free MySQL (5GB). After deploying:

```bash
# Run migrations
npm run db:push
```

Or manually in Railway PostgreSQL shell:
```sql
-- Run the SQL from drizzle/migrations folder
```

### 5. Domain Setup (Optional)

1. In Railway dashboard → Your Project → Settings
2. Add custom domain
3. Update DNS records to Railway nameservers
4. SSL auto-enabled

### 6. Email Configuration (Resend)

1. Sign up at https://resend.com (free tier: 100 emails/day)
2. Create API key
3. Verify sender domain (optional for testing)
4. Set `RESEND_API_KEY` in Railway variables

### 7. Verify Deployment

```bash
# Test webhook health
curl https://your-app.railway.app/api/webhook/health

# Expected response:
# {
#   "success": true,
#   "status": "ok",
#   "message": "Webhook is running"
# }
```

### 8. Monitor Logs

In Railway dashboard:
- Click your project
- View "Logs" tab in real-time
- Watch for errors and email queue processing

## Alternative Platforms

### Vercel + Railway
- Frontend: Vercel (frontend folder)
- Backend: Railway (Node.js server)
- Database: Railway MySQL

### Render.com (Full Stack)
1. Go to https://render.com
2. Create Web Service from GitHub
3. Select repository
4. Set build command: `pnpm install && pnpm run build`
5. Set start command: `pnpm start`
6. Add environment variables
7. Add PostgreSQL database
8. Deploy

### DigitalOcean (Full Control)
1. Create Ubuntu droplet
2. Install Node.js, MySQL, Nginx
3. Clone repository
4. Setup PM2 for process management
5. Setup Nginx reverse proxy
6. Configure SSL with Let's Encrypt

## Post-Deployment Checklist

- [ ] API Keys all configured
- [ ] Database migrations ran
- [ ] Webhook health check passes
- [ ] Test form submission (goes to test email)
- [ ] Email queue working (check logs)
- [ ] Suno generation working (when credits added)
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Error logs monitored

## Troubleshooting

**Issue**: Database connection error
```
Solution: Verify DATABASE_URL format and Railway MySQL is running
```

**Issue**: "OPENAI_API_KEY not configured"
```
Solution: Set OPENAI_API_KEY in environment variables
```

**Issue**: Emails not sending
```
Solution: Verify RESEND_API_KEY is correct and domain verified
```

**Issue**: Webhook not receiving callbacks
```
Solution: Ensure APP_URL is set correctly and matches your domain
```

## Test the Complete Flow

Once deployed, test with:

```bash
# 1. Open your app URL in browser
# 2. Fill form with your email
# 3. Submit
# 4. Watch terminal logs for:
#    - Job creation
#    - Email queuing
#    - Webhook callback (simulated in test mode)

# Or run tests:
pnpm test
```

## Support

- **Tests**: All 75 tests passing ✅
- **Docs**: See README_PLATFORM.md
- **API**: tRPC at `/api/trpc`
- **Webhook**: POST to `/api/webhook/suno`
- **Health**: GET `/api/webhook/health`

## What's Ready

✅ Form validation
✅ Job creation & tracking  
✅ Email queue with retry logic
✅ Webhook integration
✅ Simulated music generation (ready for real Suno API)
✅ Database schema
✅ Authentication hooks
✅ Error handling
✅ Logging

Just add API keys and deploy! 🚀
