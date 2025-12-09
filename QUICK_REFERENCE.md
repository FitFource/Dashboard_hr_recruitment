# Quick Reference Guide - Role-Based Routing

## 🔑 User Roles & Access

| Role | Home Route | Access Level |
|------|-----------|--------------|
| **admin** | `/dashboard` | Full CRUD on all resources |
| **viewer** | `/dashboard` | View all, update candidate status |
| **user** | `/user/home` | Browse-only access to candidates & requirements |

## 🌐 Route URLs

### HR System (Admin/Viewer)
```
/dashboard          - Main dashboard with charts
/candidates         - Candidate management
/questions          - Interview questions
/requirements       - Job requirements
```

### User Portal (User Role)
```
/user/home          - User dashboard
/user/candidates    - Browse candidates
/user/requirements  - Browse requirements
```

## 🔒 Route Protection

```typescript
// Everyone redirected to login if not authenticated
/ → /login (if not authenticated)

// After login, redirect based on role
admin/viewer → /dashboard
user → /user/home

// Cross-access attempts are blocked
admin tries /user/home → redirects to /dashboard
user tries /dashboard → redirects to /user/home
```

## 💾 Storage

```javascript
// LocalStorage keys
localStorage.getItem('token')      // JWT token
localStorage.getItem('user')       // User object with role

// Auth store (Zustand)
useAuthStore()
  .user          // User object
  .token         // JWT token
  .isAuthenticated  // Boolean
  .setAuth()     // Set auth data
  .logout()      // Clear auth data
```

## 🎨 Components

```
Layout           - HR System layout (Admin/Viewer)
UserLayout       - User Portal layout (User role)
ProtectedRoute   - Route protection with role check
```

## 📡 API Endpoints

```javascript
// All require: Authorization: Bearer <token>

GET /api/metrics/overview       // Dashboard stats
GET /api/candidates             // Candidate list (supports filters)
GET /api/requirements           // Requirements list
POST /api/auth/login           // Login endpoint
```

## 🎯 Quick Commands

```bash
# Start development
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2

# Test URLs
http://localhost:3000/           # → /login
http://localhost:3000/login      # Login page
http://localhost:3000/dashboard  # HR dashboard
http://localhost:3000/user/home  # User portal
```

## 🐛 Troubleshooting

```javascript
// Issue: Can't access routes
// Solution: Check localStorage
console.log(localStorage.getItem('token'))
console.log(localStorage.getItem('user'))

// Issue: Wrong redirect
// Solution: Clear storage and re-login
localStorage.clear()

// Issue: TypeScript errors
// Solution: Restart dev server
// Ctrl+C then npm run dev
```

## 📝 File Locations

```
App.tsx                          - Main routing
components/Layout.tsx            - HR layout
components/UserLayout.tsx        - User layout
pages/Login.tsx                  - Login page
pages/User/HomeUser.tsx          - User dashboard
pages/User/UserCandidates.tsx    - Browse candidates
pages/User/UserRequirements.tsx  - Browse requirements
```

## 🔍 Testing Scenarios

```
1. Open root → Should redirect to /login
2. Login as admin → Should see /dashboard
3. Login as user → Should see /user/home
4. Try cross-access → Should redirect to home route
5. Refresh page → Should stay authenticated
6. Direct URL → Should enforce protection
```

## 🎨 Color Palette

```css
Primary Deep:    #213448
Primary/Secondary: #547792
Accent:          #94B4C1
Background:      #ECEFCA
```

## 📊 Data Flow

```
Login → Store Token → Set Auth State → Navigate by Role
  ↓
Protected Route → Check Auth → Check Role → Allow/Redirect
  ↓
API Request → Add Token → Backend Auth → Return Data
```

---

**Remember:** 
- Root always redirects to login when not authenticated
- Role determines which interface user sees
- All routes are protected
- Changes persist across page refreshes
