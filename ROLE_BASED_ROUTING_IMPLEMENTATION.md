# Role-Based Routing Implementation Guide

## Overview
This document describes the complete implementation of role-based routing that separates the HR system (Admin/Viewer) from the User portal with completely different interfaces.

## Implementation Summary

### 1. Route Structure

#### Root Behavior
- **Port 3000 (/)**: Automatically redirects to `/login` if not authenticated
- After login: Redirects based on user role

#### Admin & Viewer Routes (HR System)
- `/dashboard` - Main dashboard with metrics and charts
- `/candidates` - Full candidate management with status updates
- `/questions` - Interview questions management
- `/requirements` - Job requirements management

#### User Routes (User Portal)
- `/user/home` - User dashboard with statistics overview
- `/user/candidates` - Candidate browsing with filters and search
- `/user/requirements` - Job requirements viewing

### 2. Files Created/Modified

#### Modified Files
1. **`frontend/src/App.tsx`**
   - Added role-based `ProtectedRoute` component with `allowedRoles` parameter
   - Created `RoleBasedRedirect` component for intelligent routing
   - Separated routes into HR System and User System sections
   - Root path now redirects to login when not authenticated

2. **`frontend/src/pages/Login.tsx`**
   - Updated navigation paths to match new route structure
   - Admin/Viewer → `/dashboard`
   - User → `/user/home`

3. **`frontend/src/components/Layout.tsx`**
   - Updated menu paths to use `/dashboard` instead of `/`

#### New Files Created

**Components:**
1. **`frontend/src/components/UserLayout.tsx`**
   - Dedicated layout for user interface
   - Different navigation menu (Home, Candidates, Requirements)
   - Same color palette but user-focused branding
   - Responsive sidebar and mobile menu

**User Pages:**
1. **`frontend/src/pages/User/HomeUser.tsx`**
   - Dashboard with overview statistics
   - Displays total, accepted, rejected, and in-progress candidates
   - User information card
   - Quick actions section

2. **`frontend/src/pages/User/UserCandidates.tsx`**
   - Full candidate listing with search functionality
   - Filters: Level, Position, Name/Email/Location search
   - Detailed table with all candidate information
   - Status badges and rank display
   - Real-time filter results count

3. **`frontend/src/pages/User/UserRequirements.tsx`**
   - Job requirements listing
   - Search by position or requirements content
   - Level filter
   - Expandable cards to view full requirements
   - Formatted requirements display with bullet points

### 3. Access Control Logic

```typescript
// Authentication Check
if (!isAuthenticated) → redirect to /login

// Role-Based Access
if (allowedRoles && !user.role.includes(allowedRoles)) {
  if (user.role === 'user') → redirect to /user/home
  else → redirect to /dashboard
}
```

### 4. API Endpoints Used

All endpoints already exist in the backend:

**User Portal Endpoints:**
- `GET /api/metrics/overview` - Dashboard statistics
- `GET /api/candidates` - Candidate list with filters
- `GET /api/requirements` - Job requirements list

**Authentication:**
- All endpoints require JWT token via `Authorization: Bearer <token>`
- Token stored in localStorage on login

### 5. Features by Role

#### Admin & Viewer (HR System)
✅ Full dashboard with charts and metrics
✅ Candidate management (view, update status, send emails)
✅ Interview questions management
✅ Job requirements management (CRUD operations for admin)
✅ Advanced filtering and sorting

#### User (User Portal)
✅ Dashboard with key statistics
✅ Browse all candidates (read-only)
✅ Filter candidates by level, position, search
✅ View job requirements (read-only)
✅ Filter requirements by level, position
✅ Clean, modern UI optimized for viewing

### 6. UI/UX Design

**Shared Design Elements:**
- Color Palette: #213448, #547792, #94B4C1, #ECEFCA
- Gradient headers and cards
- Responsive design with mobile menu
- Consistent shadows and borders

**HR System (Admin/Viewer):**
- Header: "HR Recruitment Dashboard"
- Sidebar: Dashboard, Candidates, Questions, Requirements
- Action buttons for creating/editing/deleting

**User Portal:**
- Header: "User Portal"
- Sidebar: Home, Candidates, Requirements
- View-only interface with search and filter capabilities
- Emphasis on browsing and information consumption

### 7. Route Protection Summary

| Route | Admin | Viewer | User |
|-------|-------|--------|------|
| `/` | ✅ (→ /dashboard) | ✅ (→ /dashboard) | ✅ (→ /user/home) |
| `/login` | ✅ (→ role-based) | ✅ (→ role-based) | ✅ (→ role-based) |
| `/dashboard` | ✅ | ✅ | ❌ (→ /user/home) |
| `/candidates` | ✅ | ✅ | ❌ (→ /user/home) |
| `/questions` | ✅ | ✅ | ❌ (→ /user/home) |
| `/requirements` | ✅ | ✅ | ❌ (→ /user/home) |
| `/user/home` | ❌ (→ /dashboard) | ❌ (→ /dashboard) | ✅ |
| `/user/candidates` | ❌ (→ /dashboard) | ❌ (→ /dashboard) | ✅ |
| `/user/requirements` | ❌ (→ /dashboard) | ❌ (→ /dashboard) | ✅ |
| Any other route | → /dashboard | → /dashboard | → /user/home |

### 8. Testing the Implementation

#### Test Case 1: Root Redirect
1. Open browser at `http://localhost:3000/`
2. **Expected:** Redirect to `/login`

#### Test Case 2: Admin Login
1. Login with admin credentials
2. **Expected:** Redirect to `/dashboard`
3. Navigate to `/user/home`
4. **Expected:** Redirect to `/dashboard`

#### Test Case 3: User Login
1. Login with user credentials
2. **Expected:** Redirect to `/user/home`
3. Navigate to `/dashboard`
4. **Expected:** Redirect to `/user/home`

#### Test Case 4: Direct URL Access
1. Login as user
2. Type `/candidates` in address bar
3. **Expected:** Redirect to `/user/home`

#### Test Case 5: User Portal Features
1. Login as user
2. Visit `/user/candidates`
3. **Expected:** See candidate list with filters
4. Test search, level filter, position filter
5. Visit `/user/requirements`
6. **Expected:** See requirements list with expand/collapse

### 9. Key Implementation Details

**Persistent Authentication:**
- User data and token stored in localStorage
- Auth state managed by Zustand store
- Automatic token inclusion in API requests via Axios interceptor
- 401 errors automatically redirect to login

**Navigation Guards:**
- Every route wrapped with `ProtectedRoute` component
- Checks authentication first, then role permissions
- Automatic redirect prevents unauthorized access
- `replace` prop used to prevent back-button issues

**Separation of Concerns:**
- HR System uses `Layout` component
- User Portal uses `UserLayout` component
- No shared UI components between systems (complete separation)
- Different page structures and functionality

### 10. Development Commands

```bash
# Start frontend development server
cd frontend
npm run dev

# Start backend development server
cd backend
npm run dev

# Build frontend for production
cd frontend
npm run build

# Test the application
# 1. Create a test user with role 'user'
# 2. Test login and navigation
# 3. Verify route protection
```

### 11. Backend Role Configuration

To create test users with different roles:

```sql
-- Admin user
INSERT INTO users (email, password, name, role) 
VALUES ('admin@test.com', 'hashed_password', 'Admin User', 'admin');

-- Viewer user
INSERT INTO users (email, password, name, role) 
VALUES ('viewer@test.com', 'hashed_password', 'Viewer User', 'viewer');

-- Regular user
INSERT INTO users (email, password, name, role) 
VALUES ('user@test.com', 'hashed_password', 'Regular User', 'user');
```

### 12. Troubleshooting

**Issue:** TypeScript errors about missing modules
**Solution:** Restart the development server to refresh module resolution

**Issue:** Redirect loop
**Solution:** Clear localStorage and cookies, then login again

**Issue:** Can't access certain routes
**Solution:** Check user role in localStorage, verify JWT token is valid

**Issue:** API calls failing
**Solution:** Ensure backend is running, check CORS configuration

## Conclusion

The implementation provides complete separation between the HR system and User portal with:
- ✅ Automatic root redirect to login
- ✅ Role-based routing after authentication
- ✅ Persistent route protection
- ✅ Separate layouts and navigation
- ✅ Different functionality based on role
- ✅ Clean, modern UI for both systems
- ✅ Complete access control

All requirements have been successfully implemented.
