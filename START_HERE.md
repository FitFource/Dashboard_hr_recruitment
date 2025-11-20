# 🚀 Quick Start Guide - FitFource HR Recruitment Dashboard

## What's New? ✨

✅ **Auto-Refresh**: Data updates automatically every 30 seconds  
✅ **Backend Connected**: Frontend properly connected to backend API  
✅ **Real-time Updates**: See changes without manual refresh  
✅ **Fixed All Errors**: All TypeScript and linting errors resolved  

---

## 🏃‍♂️ How to Run

### Prerequisites
- Node.js installed
- PostgreSQL database running
- Database: `dbfitfource`
- PostgreSQL user: `postgres` (password: `00000`)

### Step 1: Start Backend

```bash
cd backend
npm install
npm run dev
```

✅ Backend running on: `http://localhost:5000`

### Step 2: Start Frontend

```bash
cd frontend
npm install
npm run dev
```

✅ Frontend running on: `http://localhost:3000`

### Step 3: Login

Navigate to: `http://localhost:3000`

**Demo Credentials:**
- **Email**: `admin@hrrecruitment.com`
- **Password**: `admin123`

---

## 🎯 Key Features

### 1. Dashboard
- Real-time metrics with trend indicators
- Auto-refreshing charts
- Top candidates view
- Application trends (7 days)

### 2. Candidates Management
- Full candidate list with filters
- Auto-refresh every 30 seconds
- Add/Edit/Delete candidates (admin/recruiter)
- Detailed candidate profiles

### 3. Interview Questions
- Manage questions by role
- Upload CSV/Excel/JSON files
- Auto-refresh list

### 4. Job Requirements
- Track requirements per role
- Upload requirements files
- Auto-refresh updates

---

## 🔍 Testing Auto-Refresh

1. Open the app in two browser tabs
2. In Tab 1: Add or edit a candidate
3. In Tab 2: Watch the data auto-update within 30 seconds
4. Open DevTools → Network tab to see API calls

---

## 📊 API Endpoints

All endpoints auto-refresh in the frontend:

- `GET /api/metrics/overview` - Dashboard metrics
- `GET /api/candidates` - Candidate list
- `GET /api/candidates/:id` - Candidate details
- `GET /api/questions` - Interview questions
- `GET /api/requirements` - Job requirements

---

## 🛠️ Configuration

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

### Backend (.env)
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dbfitfource
DB_USER=postgres
DB_PASSWORD=00000
CORS_ORIGIN=http://localhost:3000
```

---

## 🔧 Troubleshooting

### Backend Won't Start
```bash
# Check PostgreSQL is running
# Verify database exists: dbfitfource
# Check port 5000 is available
```

### Frontend Can't Connect
```bash
# Verify backend is running
# Check .env file exists in frontend/
# Clear browser cache and reload
```

### 401 Unauthorized Error
```bash
# Clear browser localStorage
# Re-login with credentials
# Check backend JWT_SECRET in .env
```

---

## 📚 Documentation

- `BACKEND_CONNECTION_GUIDE.md` - Detailed connection setup
- `UPDATES_SUMMARY.md` - Recent changes summary
- `API_DOCUMENTATION.md` - Full API documentation
- `PROJECT_SUMMARY.md` - Project overview

---

## 🎨 Default Users

### Admin User
- Email: `admin@hrrecruitment.com`
- Password: `admin123`
- Permissions: Full access

### Recruiter User
- Email: `recruiter@hrrecruitment.com`
- Password: `recruiter123`
- Permissions: Can manage candidates

### Viewer User
- Email: `viewer@hrrecruitment.com`
- Password: `viewer123`
- Permissions: Read-only access

---

## ✅ Verification Checklist

After starting the app, verify:

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can login successfully
- [ ] Dashboard shows metrics
- [ ] Candidates page loads
- [ ] Auto-refresh working (check DevTools Network tab)
- [ ] No console errors

---

## 🎉 You're All Set!

The application is now fully connected to the backend with automatic data refresh. Enjoy using the HR Recruitment Dashboard!

For more details, see:
- [Backend Connection Guide](BACKEND_CONNECTION_GUIDE.md)
- [Updates Summary](UPDATES_SUMMARY.md)

---

**Need Help?** Check the troubleshooting section above or review the documentation files.
