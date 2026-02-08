# PostgreSQL Migration - Deployment Guide

## Summary

This project has been successfully migrated from MySQL to PostgreSQL to match the Render deployment environment. All database code, schemas, and initialization scripts have been updated.

## Changes Made

### 1. Dependencies
- **Removed:** `mysql2` package
- **Added:** `postgres` (v3.4.5) - PostgreSQL driver for Drizzle ORM

### 2. Database Configuration
- **File:** `drizzle.config.ts`
- **Change:** Dialect changed from `mysql` to `postgresql`

### 3. Database Schema
- **File:** `drizzle/schema.ts`
- **Changes:**
  - Migrated from `drizzle-orm/mysql-core` to `drizzle-orm/pg-core`
  - Table definitions: `mysqlTable` → `pgTable`
  - Enums: `mysqlEnum` → `pgEnum` (defined as separate constants)
  - Auto-increment IDs: `int().autoincrement()` → `serial()`
  - Integer columns: `int()` → `integer()`
  - Removed `.onUpdateNow()` (PostgreSQL doesn't support ON UPDATE CURRENT_TIMESTAMP)

### 4. Database Connection
- **File:** `server/db.ts`
- **Changes:**
  - Import changed from `drizzle-orm/mysql2` to `drizzle-orm/postgres-js`
  - Added `postgres` import
  - `getDb()` now creates postgres client before initializing Drizzle
  - `onDuplicateKeyUpdate()` → `onConflictDoUpdate()` with explicit target

### 5. Initialization Scripts
- **Files:** `server/db-init.ts`, `scripts/init-db.mjs`, `scripts/init-db.sql`
- **Changes:**
  - Replaced `mysql2/promise` with `postgres` driver
  - SQL syntax converted to PostgreSQL:
    - Enum types created with `CREATE TYPE` wrapped in `DO` blocks
    - `AUTO_INCREMENT` → `SERIAL`
    - Removed `ON UPDATE CURRENT_TIMESTAMP`
    - Error handling updated for PostgreSQL error codes (42P07, 42710)

## Deployment Instructions for Render

### Prerequisites
1. Ensure you have a PostgreSQL database provisioned on Render
2. The `DATABASE_URL` environment variable must be set to your PostgreSQL connection string

### First Deployment
1. Deploy the application to Render
2. The database schema will be automatically initialized on first run via `server/db-init.ts`
3. If you prefer manual initialization, you can run: `npm run db:init`

### Verification Steps
After deployment, verify the migration was successful:

1. **Check Logs:** Look for `[DB Init] ✅ Database initialization complete!` in the application logs
2. **Test Connection:** The application will log `[Database] Connected to database` if successful
3. **Verify Tables:** Connect to your PostgreSQL database and verify these tables exist:
   - `users`
   - `jobs`
   - `songs`
   - `leads`
   - `emailQueue` (if applicable)

### Expected Behavior

#### On First Run
- All enum types will be created (role, status, email_type, email_status)
- All tables will be created with proper schemas
- You should see success messages in logs

#### On Subsequent Runs
- Existing tables/types will be detected and skipped
- No errors should occur
- Application will connect and function normally

## Troubleshooting

### Connection Errors
If you see `PROTOCOL_CONNECTION_LOST` or similar:
- Verify `DATABASE_URL` is set correctly
- Ensure it's a PostgreSQL connection string (not MySQL)
- Format: `postgresql://user:password@host:port/database`

### Schema Errors
If tables aren't created:
- Check application logs for specific error messages
- Verify the database user has CREATE privileges
- You can manually run the SQL from `scripts/init-db.sql`

### Migration from Existing MySQL Data
If you have existing data in MySQL that needs to be migrated:
1. Export data from MySQL tables
2. Convert MySQL dumps to PostgreSQL format (tools like `pgloader` can help)
3. Import into PostgreSQL database
4. Verify data integrity

## Testing

All tests have been validated:
- ✅ Build completes successfully
- ✅ TypeScript compilation succeeds
- ✅ No new database-related test failures
- ✅ CodeQL security scan passed (0 vulnerabilities)

## Rollback Procedure

If you need to rollback to MySQL:
1. Checkout the commit before this migration: `git checkout 81337ae`
2. Reinstall dependencies: `npm install --legacy-peer-deps`
3. Update `DATABASE_URL` to point to a MySQL database
4. Redeploy

## Support

For issues specific to this migration, check:
- Application logs for database initialization messages
- PostgreSQL logs on Render dashboard
- Verify environment variables are set correctly

## Files Modified

```
.gitignore                  - Added package-lock.json
drizzle.config.ts          - Changed dialect to postgresql
drizzle/schema.ts          - Migrated to PostgreSQL schema
package.json               - Updated dependencies
scripts/init-db.mjs        - Updated to use postgres driver
scripts/init-db.sql        - Converted to PostgreSQL syntax
server/db-init.ts          - Updated to use postgres driver
server/db.ts               - Updated connection and queries
```

## Files Removed

All MySQL-specific migration files were removed:
- `drizzle/0000_real_meltdown.sql` through `drizzle/0004_good_xavin.sql`
- All JSON snapshots in `drizzle/meta/`
- `package-lock.json` (project uses pnpm)

---

Migration completed: 2026-02-08
