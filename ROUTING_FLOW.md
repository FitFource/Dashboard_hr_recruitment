# Application Routing Flow Diagram

## Visual Flow Chart

```
┌─────────────────────────────────────────────────────────────────┐
│                    http://localhost:3000/                        │
│                    (Root Application)                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │ Authenticated? │
                  └────────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
             NO                        YES
              │                         │
              ▼                         ▼
      ┌──────────────┐          ┌──────────────┐
      │  /login      │          │  Check Role  │
      │  Page        │          └──────┬───────┘
      └──────┬───────┘                 │
             │                         │
             │               ┌─────────┴─────────┐
             │               │                   │
             │          Admin/Viewer           User
             │               │                   │
             │               ▼                   ▼
             │      ┌────────────────┐  ┌────────────────┐
             │      │  /dashboard    │  │ /user/home     │
             │      │  (HR System)   │  │ (User Portal)  │
             │      └────────┬───────┘  └────────┬───────┘
             │               │                   │
             │               │                   │
     ┌───────┴───────┐       │                   │
     │               │       │                   │
     │  User Login   │       │                   │
     │               │       │                   │
     ▼               ▼       ▼                   ▼
┌─────────┐    ┌─────────┐  │              ┌─────────┐
│  Admin  │    │ Viewer  │  │              │  User   │
│  Login  │    │ Login   │  │              │  Login  │
└────┬────┘    └────┬────┘  │              └────┬────┘
     │              │        │                   │
     └──────┬───────┘        │                   │
            │                │                   │
            ▼                ▼                   ▼
```

## HR System Routes (Admin & Viewer)

```
┌─────────────────────────────────────────────────────────────┐
│                      HR System Layout                        │
│  Header: "HR Recruitment Dashboard"                         │
│  Sidebar: Dashboard | Candidates | Questions | Requirements │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┬─────────────────┐
         │                 │                 │                 │
         ▼                 ▼                 ▼                 ▼
   ┌──────────┐      ┌──────────┐    ┌──────────┐      ┌──────────┐
   │/dashboard│      │/candidates│    │/questions│      │/requirements│
   │          │      │           │    │          │      │            │
   │ • Stats  │      │ • List    │    │ • List   │      │ • List     │
   │ • Charts │      │ • Filter  │    │ • Add    │      │ • Add      │
   │ • Trends │      │ • Update  │    │ • Edit   │      │ • Edit     │
   │          │      │ • Email   │    │ • Delete │      │ • Delete   │
   └──────────┘      └──────────┘    └──────────┘      └──────────┘
```

## User Portal Routes (User Role)

```
┌─────────────────────────────────────────────────────────────┐
│                     User Portal Layout                       │
│  Header: "User Portal"                                       │
│  Sidebar: Home | Candidates | Requirements                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │/user/home│ │/user/    │ │/user/    │
        │          │ │candidates│ │requirements│
        │ • Stats  │ │          │ │          │
        │ • Info   │ │ • Browse │ │ • Browse │
        │ • Welcome│ │ • Filter │ │ • Filter │
        │          │ │ • Search │ │ • Search │
        └──────────┘ └──────────┘ └──────────┘
              │            │            │
              └────────────┴────────────┘
                          │
                    (Read-Only)
```

## Route Protection Logic

```
┌──────────────────────────────────────────────────┐
│           Route Protection Middleware            │
└────────────────────┬─────────────────────────────┘
                     │
                     ▼
          ┌──────────────────┐
          │ Check Auth Token │
          └────────┬──────────┘
                   │
          ┌────────┴────────┐
          │                 │
        Valid            Invalid
          │                 │
          ▼                 ▼
   ┌─────────────┐   ┌─────────────┐
   │ Check Role  │   │ → /login    │
   │ Permission  │   └─────────────┘
   └──────┬──────┘
          │
          ├──────────────────────────────┐
          │                              │
          ▼                              ▼
   ┌─────────────┐              ┌─────────────┐
   │ Role Match? │              │ Wrong Role? │
   └──────┬──────┘              └──────┬──────┘
          │                            │
         YES                          YES
          │                            │
          ▼                            ▼
   ┌─────────────┐              ┌─────────────┐
   │ Allow Access│              │ Redirect to │
   └─────────────┘              │ Home Route  │
                                └─────────────┘
```

## Access Matrix

```
┌──────────────────┬──────────┬──────────┬──────────┐
│      Route       │  Admin   │  Viewer  │   User   │
├──────────────────┼──────────┼──────────┼──────────┤
│ /                │ → /dash  │ → /dash  │ → /user  │
│ /login           │ → role   │ → role   │ → role   │
├──────────────────┼──────────┼──────────┼──────────┤
│ /dashboard       │    ✅    │    ✅    │    ❌    │
│ /candidates      │    ✅    │    ✅    │    ❌    │
│ /questions       │    ✅    │    ✅    │    ❌    │
│ /requirements    │    ✅    │    ✅    │    ❌    │
├──────────────────┼──────────┼──────────┼──────────┤
│ /user/home       │    ❌    │    ❌    │    ✅    │
│ /user/candidates │    ❌    │    ❌    │    ✅    │
│ /user/requirements│   ❌    │    ❌    │    ✅    │
├──────────────────┼──────────┼──────────┼──────────┤
│ /* (other)       │ → /dash  │ → /dash  │ → /user  │
└──────────────────┴──────────┴──────────┴──────────┘

Legend:
✅ = Allowed
❌ = Blocked & Redirected
→  = Redirects to
```

## Authentication Flow

```
┌────────┐
│ Client │
└────┬───┘
     │
     │ 1. POST /api/auth/login
     │    { email, password }
     ▼
┌─────────────┐
│  Backend    │
│  Validates  │
└──────┬──────┘
       │
       │ 2. Returns JWT + User Data
       │    { token, user: { id, name, email, role } }
       ▼
┌─────────────┐
│  Frontend   │
│  Stores in  │
│  localStorage
└──────┬──────┘
       │
       │ 3. Sets Auth Store
       │    { user, token, isAuthenticated: true }
       ▼
┌─────────────┐
│  Navigate   │
│  Based on   │
│  Role       │
└──────┬──────┘
       │
       ├──────────────────┬──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
  Admin/Viewer          User            Unknown
       │                  │                  │
       ▼                  ▼                  ▼
  /dashboard         /user/home          /login
```

## API Request Flow

```
┌────────────┐
│   Page     │
│ Component  │
└─────┬──────┘
      │
      │ axios.get('/api/candidates')
      ▼
┌─────────────┐
│ Axios       │
│ Interceptor │ ← Adds: Authorization: Bearer <token>
└─────┬───────┘
      │
      ▼
┌─────────────┐
│  Backend    │
│  Middleware │ → authenticateToken()
└─────┬───────┘   authorizeRoles([...])
      │
      ├────────────────┬────────────────┐
      │                │                │
    Valid           Invalid          Wrong Role
      │                │                │
      ▼                ▼                ▼
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Process  │    │ Return   │    │ Return   │
│ & Return │    │ 401      │    │ 403      │
│ Data     │    └─────┬────┘    └──────────┘
└─────┬────┘          │
      │               │
      ▼               ▼
  Success       Auto Logout
                & Redirect
```

## File Structure

```
frontend/src/
│
├── App.tsx                    ← Main router with role-based logic
├── store/
│   └── authStore.ts          ← Zustand store for auth state
│
├── components/
│   ├── Layout.tsx            ← HR System layout (Admin/Viewer)
│   └── UserLayout.tsx        ← User Portal layout (User role)
│
├── pages/
│   ├── Login.tsx             ← Shared login page
│   │
│   ├── Dashboard.tsx         ← HR: Dashboard
│   ├── Candidates.tsx        ← HR: Candidates management
│   ├── Questions.tsx         ← HR: Questions management
│   ├── Requirements.tsx      ← HR: Requirements management
│   │
│   └── User/
│       ├── HomeUser.tsx      ← User: Home dashboard
│       ├── UserCandidates.tsx ← User: Browse candidates
│       └── UserRequirements.tsx ← User: Browse requirements
│
└── lib/
    └── api.ts                ← Axios instance with interceptors
```

## Summary

The application now has:

1. **Automatic redirect** from root to login
2. **Role-based navigation** after login
3. **Separate interfaces** for HR and User roles
4. **Complete route protection** at all levels
5. **Persistent authentication** via localStorage
6. **Automatic token management** via interceptors
7. **Clean separation** of concerns between roles
