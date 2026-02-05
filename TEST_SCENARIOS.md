# Testing Scenarios - MVP Validation

## Critical User Flows to Test

### 1. Authentication Flow ✅

**Scenario 1.1: User Registration**
- [ ] Navigate to `/auth/register`
- [ ] Enter valid email and password (8+ chars)
- [ ] Submit form
- [ ] Verify user is created in Supabase Auth
- [ ] Verify user is redirected to login
- [ ] Login with new credentials

**Scenario 1.2: User Login**
- [ ] Navigate to `/auth/login`
- [ ] Enter valid credentials
- [ ] Verify user is logged in and redirected to `/projects`
- [ ] Verify user info shows in header

**Scenario 1.3: Session Persistence**
- [ ] Login and go to `/projects`
- [ ] Refresh the page
- [ ] Verify user is still logged in
- [ ] Check localStorage for auth data

**Scenario 1.4: Logout**
- [ ] Click logout button in header
- [ ] Verify user is redirected to `/auth/login`
- [ ] Verify localStorage is cleared

### 2. Project Creation Flow ✅

**Scenario 2.1: Create Project with Valid Input**
- [ ] Click "New Project" button
- [ ] Enter project name: "Healthcare Platform"
- [ ] Verify project ID auto-generates: "healthcare-platform"
- [ ] Enter description: "Patient management system"
- [ ] Select "Healthcare" template
- [ ] Click "Create Project"
- [ ] Verify success toast notification
- [ ] Verify redirect to project details page
- [ ] Check database: `SELECT * FROM projects WHERE id = 'healthcare-platform'`
- [ ] Check schema exists: `\dn` in psql, should show `project_healthcare-platform`

**Scenario 2.2: Project ID Validation**
- [ ] Try invalid project ID with uppercase: "HealthcarePlatform"
- [ ] Verify error message: "lowercase letters, numbers, hyphens only"
- [ ] Try special characters: "healthcare-platform!"
- [ ] Verify error message

**Scenario 2.3: Create Project with Blank Template**
- [ ] Create project with "Blank" template
- [ ] Verify schema is created
- [ ] Verify no default tables are created

**Scenario 2.4: Duplicate Project ID**
- [ ] Create project with ID: "test-project"
- [ ] Try to create another with same ID
- [ ] Verify error message

### 3. Project List & Discovery Flow ✅

**Scenario 3.1: List Projects**
- [ ] Navigate to `/projects`
- [ ] Verify all created projects display in grid
- [ ] Verify project cards show: name, ID, status, date, features
- [ ] Verify "Create Project" button is available

**Scenario 3.2: Search Projects**
- [ ] Create 3+ projects with different names
- [ ] Use search box to search by name
- [ ] Verify only matching projects display
- [ ] Search by project ID
- [ ] Verify matching project displays

**Scenario 3.3: Filter by Status**
- [ ] Create a project (status: active)
- [ ] Click "All" filter - should show 1 project
- [ ] Click "Active" filter - should show 1 project
- [ ] Click "Pending" filter - should show 0 projects
- [ ] Verify filtering works correctly

**Scenario 3.4: Empty State**
- [ ] Create new test user
- [ ] Login to new account
- [ ] Navigate to `/projects`
- [ ] Verify "No projects yet" message appears
- [ ] Verify CTA button to create first project

### 4. Project Details Flow ✅

**Scenario 4.1: View Project Details**
- [ ] Create a project
- [ ] Click project card
- [ ] Verify page loads with project name in header
- [ ] Verify "General" tab is active
- [ ] Verify all project info is displayed correctly

**Scenario 4.2: View Project Tabs**
- [ ] Click "API Keys" tab
- [ ] Verify credentials are masked
- [ ] Verify "Reveal" button is available
- [ ] Click "Reveal" - credentials should show (partially masked)
- [ ] Click "Database" tab
- [ ] Verify schema name and limits display
- [ ] Click "Members" tab
- [ ] Verify "Coming soon" message
- [ ] Click "Settings" tab
- [ ] Verify "Coming soon" message

### 5. Credentials Management Flow ✅

**Scenario 5.1: View Credentials**
- [ ] Navigate to project details
- [ ] Click "API Keys" tab
- [ ] Verify credentials are initially masked
- [ ] Verify "Reveal" button unhides credentials
- [ ] Verify credentials start with "sk-"

**Scenario 5.2: Copy Credentials**
- [ ] Click "Copy" button next to credential
- [ ] Verify "Copied to clipboard" toast appears
- [ ] Paste in text editor to verify value

**Scenario 5.3: View API URL**
- [ ] Go to "API Keys" tab
- [ ] Verify API URL is displayed
- [ ] Verify URL matches Supabase instance

### 6. Navigation & Layout Flow ✅

**Scenario 6.1: Dashboard Navigation**
- [ ] Verify sidebar shows: Projects, Templates, Settings
- [ ] Click each nav item
- [ ] Verify correct page loads
- [ ] Verify nav item is highlighted

**Scenario 6.2: Project Card Navigation**
- [ ] Verify clicking project card navigates to details
- [ ] Verify back button on details page navigates to list

**Scenario 6.3: Responsive Design**
- [ ] View on desktop (1920x1080)
- [ ] Verify grid shows 3 columns
- [ ] Resize to tablet (768x1024)
- [ ] Verify grid shows 2 columns
- [ ] Resize to mobile (375x667)
- [ ] Verify grid shows 1 column
- [ ] Verify sidebar collapses/hides on mobile

### 7. Error Handling & Feedback ✅

**Scenario 7.1: Form Validation**
- [ ] Try creating project with empty name
- [ ] Verify error message appears
- [ ] Try invalid email
- [ ] Verify error message
- [ ] Try password < 8 chars on registration
- [ ] Verify error message

**Scenario 7.2: Server Errors**
- [ ] Simulate network error (DevTools > Offline)
- [ ] Try creating project
- [ ] Verify error toast appears
- [ ] Go online
- [ ] Retry operation
- [ ] Verify success

**Scenario 7.3: Loading States**
- [ ] Slow down network (DevTools > Slow 3G)
- [ ] Click "Create Project"
- [ ] Verify loading spinner appears
- [ ] Verify button is disabled during submission
- [ ] Wait for completion

### 8. Database Verification ✅

After each test, verify in Supabase:

```sql
-- Check projects created
SELECT id, name, status FROM public.projects ORDER BY created_at DESC LIMIT 5;

-- Check project schemas exist
SELECT schema_name FROM information_schema.schemata
WHERE schema_name LIKE 'project_%';

-- Check credentials generated
SELECT project_id, credential_type, is_active FROM public.project_credentials;

-- Check templates inserted
SELECT name, is_system FROM public.project_templates;

-- Check audit logs
SELECT * FROM public.audit_logs ORDER BY created_at DESC LIMIT 10;
```

## Test Checklist

- [ ] All auth flows work (register, login, logout, session)
- [ ] Can create projects with valid input
- [ ] Project ID validation rejects invalid formats
- [ ] Projects display in list with correct info
- [ ] Search filters work correctly
- [ ] Status filters work correctly
- [ ] Empty state shows for users with no projects
- [ ] Can view project details
- [ ] All tabs load without errors
- [ ] Credentials can be revealed and copied
- [ ] Sidebar navigation works
- [ ] Page responsive on all screen sizes
- [ ] Error messages display clearly
- [ ] Loading states appear during operations
- [ ] Database schema and functions work correctly

## Performance Checks

- [ ] Page load time < 2 seconds
- [ ] Project list loads < 1 second
- [ ] Create project < 3 seconds
- [ ] No console errors
- [ ] No memory leaks (DevTools > Performance)

## Browser Compatibility

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome (latest)
- [ ] Mobile Safari (latest)

## Post-MVP Testing

Once MVP is validated:
- [ ] Deploy to production
- [ ] Run full test suite on production
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Gather user feedback
