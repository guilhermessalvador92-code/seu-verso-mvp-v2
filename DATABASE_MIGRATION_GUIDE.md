# 🗄️ Database Migration & Deployment Guide

## Problem Solved

The application was failing in production (Railway/Render) with error:
```
Table 'railway.emailQueue' doesn't exist
```

This happened because database migrations weren't running automatically on deployment.

## Solution Implemented

### 1. Automatic Schema Initialization on Server Startup

The Express server now automatically creates all required database tables when it starts:

- **File**: `server/_core/index.ts`
- **Process**: 
  1. Reads `scripts/init-db.sql` on server boot
  2. Executes all CREATE TABLE statements
  3. Gracefully handles existing tables (no errors)
  4. Logs progress to console

### 2. Database Tables Created

The following tables are automatically created:

| Table | Purpose |
|-------|---------|
| `users` | User accounts and authentication |
| `jobs` | Music generation jobs |
| `songs` | Generated music files and metadata |
| `leads` | Contact form submissions |
| `emailQueue` | Email queue with retry logic |

### 3. Deployment Configuration

#### For Railway

**File**: `railway.toml`

```toml
[deploy]
startCommand = "pnpm db:init && pnpm start"
```

The `pnpm db:init` command runs the Node.js script that initializes the database before starting the server.

#### For Render

**File**: `render.yaml`

```yaml
startCommand: pnpm db:init && pnpm start
```

Same approach: initialize database first, then start the server.

### 4. How It Works

#### Development

```bash
# Server starts automatically with schema initialization
pnpm dev
```

#### Production (Railway)

1. Build phase: `pnpm install && pnpm run build`
2. Start phase: `pnpm db:init && pnpm start`
   - Initializes database schema
   - Starts Express server on port 3000

#### Production (Render)

Same as Railway - the `render.yaml` configuration handles it.

## Environment Variables Required

```env
DATABASE_URL=mysql://user:password@host:port/database
APP_URL=https://your-production-url.com
SUNO_API_KEY=your_suno_key
GEMINI_API_KEY=your_gemini_key
RESEND_API_KEY=your_resend_key
JWT_SECRET=your_jwt_secret
NODE_ENV=production
PORT=3000
```

## Troubleshooting

### Tables Still Don't Exist

1. Check that `DATABASE_URL` is set correctly
2. Verify MySQL connection is working
3. Check server logs for SQL errors
4. Manually run: `node scripts/init-db.mjs`

### Connection Timeout

- Ensure database is accessible from the deployment environment
- For Railway: Database must be in the same project or publicly accessible
- For Render: Use Render's PostgreSQL or external MySQL with proper firewall rules

### Permission Denied

- Ensure the database user has CREATE TABLE permissions
- Check that the user can access the specified database

## Manual Database Initialization

If you need to manually initialize the database:

```bash
# Development
pnpm db:init

# Or directly
node scripts/init-db.mjs
```

## Files Modified

| File | Change |
|------|--------|
| `server/_core/index.ts` | Added automatic schema initialization on startup |
| `scripts/init-db.mjs` | Node.js script that executes SQL schema |
| `scripts/init-db.sql` | SQL schema with all table definitions |
| `railway.toml` | Updated start command to include `pnpm db:init` |
| `render.yaml` | Updated start command to include `pnpm db:init` |
| `package.json` | Added `db:init` script |

## Testing

### Local Testing

```bash
# Start development server
pnpm dev

# Check server logs for:
# [Database] Initializing database schema...
# [Database] Schema initialized successfully
```

### Production Testing

After deploying to Railway or Render:

1. Check deployment logs for database initialization messages
2. Verify tables exist by querying the database
3. Create a test job to ensure the system works end-to-end

## Next Steps

1. Deploy to Railway or Render
2. Monitor logs during first startup
3. Create a test job to verify the system works
4. Implement Stripe payment integration
5. Add MP3 download functionality

## Support

For issues with database migrations:

1. Check the deployment logs
2. Verify `DATABASE_URL` is correct
3. Ensure MySQL is accessible
4. Contact support if tables still don't exist
