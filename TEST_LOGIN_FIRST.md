# Test Guide: Login First Behavior

## 🧪 How to Verify the Change

### Test 1: Fresh Application Start
**Purpose:** Verify that opening the app always shows login page first

**Steps:**
```bash
1. Close ALL browser tabs with the application
2. Stop the server (Ctrl+C) if running
3. Start server: cd frontend && npm run dev
4. Open browser
5. Navigate to: http://localhost:3000/
```

**Expected Result:**
```
✅ Browser redirects to: http://localhost:3000/login
✅ You see the login page
✅ NOT automatically logged in
```

---

### Test 2: After Terminal Restart
**Purpose:** Verify behavior after stopping and restarting the development server

**Steps:**
```bash
1. Login to the application (so localStorage has token)
2. Note your current page (e.g., /dashboard)
3. Stop server: Press Ctrl+C in terminal
4. Restart server: npm run dev
5. In browser, navigate to: http://localhost:3000/
```

**Expected Result:**
```
✅ URL changes to: http://localhost:3000/login
✅ Then immediately redirects to your role's home page
   - Admin/Viewer → /dashboard
   - User → /user/home
✅ You DON'T need to login again (token still valid)
```

---

### Test 3: Root Path Direct Access
**Purpose:** Verify root URL always goes to login

**Steps:**
```bash
1. Already logged in and on any page (e.g., /candidates)
2. Clear the address bar
3. Type: localhost:3000
4. Press Enter
```

**Expected Result:**
```
✅ URL becomes: localhost:3000/login
✅ Then auto-redirects to your home page
✅ Very quick redirect (almost instant)
```

---

### Test 4: New Browser Tab
**Purpose:** Verify behavior when opening app in new tab

**Steps:**
```bash
1. Already logged in in one browser tab
2. Open a NEW browser tab
3. Type: http://localhost:3000/
4. Press Enter
```

**Expected Result:**
```
✅ Goes to /login first
✅ Then auto-redirects to home (because you're already authenticated)
✅ Same behavior as existing tab
```

---

### Test 5: After Logout
**Purpose:** Verify login page shows after logout

**Steps:**
```bash
1. Login to the application
2. Click the Logout button
3. In address bar, type: http://localhost:3000/
4. Press Enter
```

**Expected Result:**
```
✅ URL becomes: http://localhost:3000/login
✅ Login form is displayed
✅ Does NOT auto-redirect (no valid token)
✅ You must enter credentials to login
```

---

### Test 6: Browser Refresh
**Purpose:** Verify refresh doesn't break authentication

**Steps:**
```bash
1. Login and navigate to any page
2. Press F5 (or Ctrl+R) to refresh
3. Then type in address bar: http://localhost:3000/
4. Press Enter
```

**Expected Result:**
```
✅ Goes to /login
✅ Then auto-redirects to your home page
✅ Authentication still valid
```

---

### Test 7: Clear localStorage and Restart
**Purpose:** Verify behavior when localStorage is cleared

**Steps:**
```bash
1. Login to application
2. Open browser DevTools (F12)
3. Go to Application/Storage tab
4. Clear localStorage (or delete 'token' and 'user' keys)
5. Navigate to: http://localhost:3000/
```

**Expected Result:**
```
✅ Goes to /login
✅ Login form is shown
✅ Does NOT auto-redirect (no token in localStorage)
✅ Must login again
```

---

### Test 8: Different User Roles
**Purpose:** Verify each role redirects to correct home page

**Steps:**
```bash
# Test Admin
1. Login with admin credentials
2. Type: http://localhost:3000/
3. Should redirect: /login → /dashboard

# Test Viewer  
1. Logout and login with viewer credentials
2. Type: http://localhost:3000/
3. Should redirect: /login → /dashboard

# Test User
1. Logout and login with user credentials
2. Type: http://localhost:3000/
3. Should redirect: /login → /user/home
```

**Expected Result:**
```
✅ All roles pass through /login first
✅ Each redirects to their appropriate home page
✅ Admin → /dashboard
✅ Viewer → /dashboard
✅ User → /user/home
```

---

## 🔍 What to Check in Browser DevTools

### Network Tab (F12)
```
1. Open DevTools → Network tab
2. Navigate to: http://localhost:3000/
3. You should see:
   - Request to: localhost:3000/
   - Redirect (302/301) to: /login
   - If authenticated: Another redirect to home page
```

### Console Tab
```
Should see NO errors related to:
- Routing
- Authentication
- Token validation
```

### Application Tab
```
Check localStorage:
- Key: 'token' → Should have JWT token if logged in
- Key: 'user' → Should have user object if logged in
- If not logged in: Both should be empty/null
```

---

## ✅ Success Criteria

After all tests, you should observe:

1. **Root Access:** `http://localhost:3000/` **ALWAYS** goes to `/login` first
2. **Authenticated Users:** Auto-redirect from `/login` to home page
3. **Unauthenticated Users:** Stay on `/login` and see the form
4. **Server Restart:** Doesn't break authentication (if token still valid)
5. **Browser Refresh:** Maintains authentication state
6. **Role-Based:** Each role goes to correct home page after login check

---

## 🐛 Troubleshooting

### Issue: Infinite redirect loop
```
Problem: Browser keeps redirecting between pages
Solution: 
  1. Clear localStorage
  2. Clear browser cache
  3. Restart development server
  4. Hard refresh (Ctrl+Shift+R)
```

### Issue: Not redirecting to login
```
Problem: Opening root doesn't go to login
Solution:
  1. Check App.tsx has: path="/" element={<Navigate to="/login" replace />}
  2. Restart development server
  3. Clear browser cache
```

### Issue: Can't login after logout
```
Problem: Login form doesn't work after logout
Solution:
  1. Check browser console for errors
  2. Verify backend is running
  3. Check if API endpoint is accessible
  4. Try clearing cookies and localStorage
```

---

## 📊 Quick Verification Checklist

Use this checklist to quickly verify the implementation:

```
□ Test 1: Fresh start → Goes to login ✓
□ Test 2: Server restart → Goes to login first ✓
□ Test 3: Root URL → Redirects to login ✓
□ Test 4: New tab → Goes to login first ✓
□ Test 5: After logout → Shows login form ✓
□ Test 6: Browser refresh → Maintains auth ✓
□ Test 7: Clear storage → Shows login form ✓
□ Test 8: All roles → Correct redirects ✓
```

**All checkboxes should be marked ✓ for successful implementation!**
