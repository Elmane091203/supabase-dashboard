# Deployment & Verification Guide

Complete guide to deploy and verify the Supabase Multi-Project Dashboard on your self-hosted Supabase instance.

## Prerequisites Checklist

- [ ] Self-hosted Supabase instance running and accessible
- [ ] Supabase URL and credentials (anon key, service key) ready
- [ ] Node.js 18+ installed
- [ ] pnpm installed (`npm install -g pnpm`)
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Git installed

## Phase 0: Supabase Preparation

### 0.1 Get Your Credentials

1. Go to your Supabase Dashboard (http://your-supabase-instance/admin)
2. Select your project
3. Navigate to **Settings > API**
4. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service role secret** → `SUPABASE_SERVICE_KEY`

### 0.2 Verify Database Access

```bash
# Test connection to your Supabase instance
psql -h your-supabase-host \
     -U postgres \
     -d postgres \
     -c "SELECT version();"
```

If you get an error, verify:
- Supabase instance is running
- Network connectivity to the host
- PostgreSQL port (5432) is accessible

## Phase 1: Setup Application

### 1.1 Install Dependencies

```bash
cd "C:\Users\djaan\Documents\Mes documents\Perso\supabase\supabase-dashboard"

# Install dependencies
pnpm install

# Verify installation
pnpm list | head -20
```

Expected output shows packages:
- @supabase/supabase-js
- @tanstack/react-query
- next
- react
- zustand

### 1.2 Configure Environment Variables

```bash
# Create .env.local in project root
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-instance.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here
EOF
```

**Do NOT commit .env.local to git** - it contains sensitive credentials.

### 1.3 Verify Configuration

```bash
# Check that environment variables are loaded
pnpm exec node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

## Phase 2: Deploy Database Schema

### 2.1 Via Supabase Dashboard (Recommended for First-Time)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query and run each migration **in order**:

#### Migration 1: Initial Schema

Copy entire contents of `supabase/migrations/001_initial_schema.sql` and execute in SQL Editor.

**Expected output**: No errors, query completes successfully.

**Verify**:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Should see tables:
- audit_logs
- project_credentials
- project_members
- project_stats
- project_templates
- projects

#### Migration 2: PostgreSQL Functions

Copy entire contents of `supabase/migrations/002_functions.sql` and execute.

**Verify**:
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

Should see functions:
- add_project_member
- delete_project
- get_project_stats
- provision_new_project
- regenerate_credentials
- update_member_role

#### Migration 3: RLS Policies

Copy entire contents of `supabase/migrations/003_rls_policies.sql` and execute.

**Verify**:
```sql
SELECT schemaname, tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

-- Check RLS is enabled on tables
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT LIKE 'pg_%';
```

All tables should have `rowsecurity = true`.

### 2.2 Verify Initial Data

```sql
-- Check 4 default templates inserted
SELECT id, name, category FROM public.project_templates;
```

Expected output:
```
 id  |   name    | category
-----+-----------+-----------
   1 | Healthcare| healthcare
   2 | Education | education
   3 | E-commerce| ecommerce
   4 | Blank     | blank
(4 rows)
```

## Phase 3: Deploy Edge Functions

### 3.1 Authenticate with Supabase CLI

```bash
# Login to Supabase
supabase login

# This opens a browser - create/use your Supabase account
# Copy the access token when prompted
```

### 3.2 Link Your Project

```bash
# Link to your self-hosted instance
supabase projects list

# If your project doesn't appear, manually link:
supabase link --project-ref your-project-ref
```

### 3.3 Deploy Edge Functions

Deploy each function in order:

```bash
# Deploy provision-project function
supabase functions deploy provision-project

# Deploy delete-project function
supabase functions deploy delete-project

# Deploy get-project-stats function
supabase functions deploy get-project-stats
```

Each should output: ✓ Function deployed

### 3.4 Verify Edge Functions Deployed

In Supabase Dashboard:
1. Navigate to **Edge Functions**
2. Should see 3 functions:
   - `provision-project`
   - `delete-project`
   - `get-project-stats`

All should show **Status: Active**

## Phase 4: Test Database Functions (Optional but Recommended)

Before running the app, test the core PostgreSQL functions:

### 4.1 Create Test User

```bash
# In your Supabase Dashboard > Authentication > Users
# Click "Create user"
# Enter: test@example.com / TestPassword123
# Confirm email
```

Note the user UUID (copy from user detail page).

### 4.2 Test provision_new_project()

```sql
-- Replace USER_UUID with actual UUID from step 4.1
SELECT provision_new_project(
  'test-project-1',           -- project_id
  'Test Project',             -- name
  1,                          -- template_id (Healthcare)
  'USER_UUID'::uuid           -- owner_id
);
```

Expected output: success message with project details.

**Verify schema created**:
```sql
SELECT schema_name FROM information_schema.schemata
WHERE schema_name = 'project_test-project-1';
```

Should return one row: `project_test-project-1`

### 4.3 Test Query with New Schema

```sql
-- List tables in the new project schema
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'project_test-project-1'
ORDER BY table_name;
```

Should see tables from Healthcare template:
- patients
- appointments
- prescriptions

### 4.4 Cleanup Test Data (Optional)

```sql
-- Delete test project (soft delete)
SELECT delete_project('test-project-1');

-- Verify status = 'deleted'
SELECT id, status FROM public.projects WHERE id = 'test-project-1';
```

## Phase 5: Run Development Server

### 5.1 Start Application

```bash
# From project root
pnpm dev
```

Expected output:
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 1.2s
```

### 5.2 Open in Browser

Navigate to: **http://localhost:3000**

Should see:
- Login page with "New here? Register" link
- Supabase logo/branding
- Clean dark theme UI

## Phase 6: Complete End-to-End Test Flow

### 6.1 Register New User

1. Click **"New here? Register"**
2. Enter:
   - Email: `demo@example.com`
   - Password: `DemoPassword123` (min 8 chars)
   - Confirm: `DemoPassword123`
3. Click **Create Account**

Expected: Redirect to login page with success message

### 6.2 Login

1. Enter credentials:
   - Email: `demo@example.com`
   - Password: `DemoPassword123`
2. Click **Login**

Expected:
- Redirect to `/projects`
- Dashboard layout visible with sidebar
- Header shows user email

### 6.3 Create First Project

1. Click **"New Project"** (or empty state CTA)
2. Fill form:
   - **Name**: `My First Project`
   - **ID**: `my-first-project` (auto-filled)
   - **Description**: `Testing the dashboard`
   - **Template**: Select `Healthcare`
3. Click **Create Project**

Expected:
- Loading spinner appears
- Success toast: "Project created successfully"
- Redirect to `/projects/my-first-project`

### 6.4 Verify Project Details

On project details page, verify:
- **General tab**: Project name, status, creation date, features list
- **API Keys tab**:
  - API URL displayed
  - Anon Key masked: `••••••••••••`
  - Service Key masked
  - **Reveal** button shows full key
  - **Copy** button works (toast confirmation)
- **Database tab**: Shows schema name, table count, row count
- **Members tab**: Shows you as Owner with email

### 6.5 Add Team Member

1. Go to **Members** tab
2. Click **Add Member**
3. Enter:
   - Email: `admin@example.com`
   - Role: `Admin`
4. Click **Add**

Expected:
- Toast: "Member added successfully"
- New member appears in list with Admin role

### 6.6 View Templates

1. Click **Templates** in sidebar
2. Should see 4 templates:
   - Healthcare (System)
   - Education (System)
   - E-commerce (System)
   - Blank (System)
3. Click a template → modal with details appears

### 6.7 Search & Filter Projects

1. Go back to **Projects**
2. Create 2-3 more test projects with different names
3. Test search: Type project name → results filter
4. Test status filter: Click status buttons → grid filters

### 6.8 Verify Database State

In Supabase Dashboard, run:

```sql
-- Verify project created
SELECT id, name, status, owner_id FROM public.projects
WHERE id = 'my-first-project';

-- Verify credentials generated
SELECT project_id, credential_type, is_active FROM public.project_credentials
WHERE project_id = 'my-first-project';

-- Verify member added
SELECT project_id, user_id, role FROM public.project_members
WHERE project_id = 'my-first-project';

-- Verify schema and tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'project_my-first-project'
ORDER BY table_name;

-- Should see: appointments, patients, prescriptions
```

### 6.9 Test Logout

1. Click user avatar in header
2. Click **Logout**

Expected:
- Redirect to `/auth/login`
- localStorage cleared (check DevTools > Storage > Local Storage)
- Session destroyed

### 6.10 Verify Session Persistence

1. Login again with `demo@example.com`
2. Navigate to `/projects`
3. Press **F5** to refresh page
4. Should stay logged in (no redirect to login)

## Phase 7: Error Handling Tests

### 7.1 Test Form Validation

1. Go to **Create Project**
2. Leave **Name** empty → Error message appears
3. Enter invalid project ID (e.g., `MyProject-123`) → Error message
4. Try password < 8 chars on register → Error message

### 7.2 Test Network Error Handling

1. Open **DevTools** (F12) → **Network**
2. Click **Offline** checkbox
3. Try to create project → Error toast appears
4. Go back **Online**
5. Retry → Success

### 7.3 Test Delete Project

1. Create a test project
2. Go to **Settings** tab
3. Click **Delete Project**
4. Confirm deletion by typing project name
5. Click **Delete**

Expected:
- Project removed from list
- Redirect to `/projects`
- Schema deleted from PostgreSQL:
  ```sql
  SELECT schema_name FROM information_schema.schemata
  WHERE schema_name = 'project_test-project';
  -- Should return 0 rows
  ```

## Phase 8: Performance & Browser Testing

### 8.1 Lighthouse Audit

1. Open DevTools → **Lighthouse** tab
2. Run audit for:
   - Performance
   - Accessibility
   - Best Practices

Expected:
- Performance score > 70
- No major accessibility issues

### 8.2 Test on Different Browsers

Test on:
- [ ] Chrome/Edge (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (if available)

All should work identically.

### 8.3 Responsive Design

1. Open DevTools → **Device Toolbar** (Ctrl+Shift+M)
2. Test viewport sizes:
   - **Mobile** (375×667): Sidebar should collapse, grid shows 1 column
   - **Tablet** (768×1024): Sidebar visible, grid shows 2 columns
   - **Desktop** (1920×1080): Full layout, grid shows 3+ columns

## Troubleshooting

### Issue: "Failed to connect to Supabase"

**Solution**:
```bash
# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Check Supabase instance is running
curl -I https://your-supabase-instance.com

# Restart dev server
pnpm dev
```

### Issue: "Invalid credentials" on login

**Solution**:
1. Verify user exists in Supabase Dashboard > Authentication > Users
2. Verify email is confirmed
3. Check password is correct
4. Try creating new test user

### Issue: Project creation fails with "Edge Function error"

**Solution**:
1. Verify Edge Functions deployed:
   ```bash
   supabase functions list
   ```
2. Check function logs in Supabase Dashboard > Edge Functions > provision-project > Logs
3. Verify `SUPABASE_SERVICE_KEY` has sufficient permissions
4. Check project ID format is valid: `^[a-z0-9-]+$`

### Issue: "Schema already exists" error

**Solution**:
```sql
-- Check if schema exists
SELECT schema_name FROM information_schema.schemata
WHERE schema_name = 'project_your-project-id';

-- If it exists but shouldn't, force delete it
DROP SCHEMA IF EXISTS project_your_project_id CASCADE;
```

### Issue: RLS policy blocking access

**Solution**:
1. Verify you're logged in as the project owner
2. Check RLS policy is not too restrictive:
   ```sql
   SELECT * FROM pg_policies
   WHERE tablename = 'projects';
   ```
3. If needed, temporarily disable RLS for debugging:
   ```sql
   ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
   ```

### Issue: React Query not updating after mutations

**Solution**:
1. Check React Query DevTools in browser console
2. Verify `invalidateQueries()` is called after mutations
3. Clear browser cache: Ctrl+Shift+Delete
4. Check network tab in DevTools for failed requests

## Production Deployment Checklist

Before going to production:

- [ ] All environment variables configured
- [ ] Database backups enabled in Supabase
- [ ] Edge Functions have proper error handling
- [ ] Rate limiting configured on API
- [ ] HTTPS enabled
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)
- [ ] Monitoring set up (Sentry, Datadog, etc.)
- [ ] Database connection pooling configured
- [ ] Secrets rotated and stored securely
- [ ] Load testing completed
- [ ] Disaster recovery plan documented

## Post-Deployment Next Steps

1. **Monitor**: Watch logs for errors in Supabase Dashboard
2. **Gather Feedback**: Test with real users, collect feedback
3. **Iterate**: Fix bugs, improve UX based on feedback
4. **Tier 2 Features**: Implement post-MVP features (dashboards, custom templates, etc.)
5. **Scale**: Optimize performance, add caching layers

## Support & Documentation

- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
- React Query Docs: https://tanstack.com/query/latest

## Summary

You've successfully deployed and verified:
- ✅ Next.js application running locally
- ✅ Database schema deployed with RLS policies
- ✅ Edge Functions deployed
- ✅ User registration and authentication
- ✅ Project creation with automatic schema provisioning
- ✅ Credentials management
- ✅ Team member management
- ✅ Templates system
- ✅ Error handling and edge cases

The Supabase Multi-Project Dashboard MVP is ready for production deployment! 🚀
