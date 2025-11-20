# Quick Start Guide

Get the HR Recruitment Dashboard up and running in 5 minutes!

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js v18+ installed (`node --version`)
- ✅ PostgreSQL v14+ installed and running
- ✅ npm or yarn package manager

## Fast Setup (5 minutes)

### Step 1: Install Backend Dependencies (1 min)

```bash
cd backend
npm install
```

### Step 2: Setup Database (1 min)

Create the database:
```bash
# Connect to PostgreSQL
psql -U postgres

# In psql:
CREATE DATABASE hr_recruitment_db;
\q
```

Run migrations:
```bash
psql -U postgres -d hr_recruitment_db -f src/database/schema.sql
```

### Step 3: Configure Backend (30 seconds)

```bash
# Copy environment file
cp .env.example .env

# Edit .env and set your PostgreSQL password
# The defaults should work for most setups
```

Minimum required `.env` content:
```env
DB_PASSWORD=your_postgres_password
JWT_SECRET=your_secret_key_here
```

### Step 4: Seed Database & Start Backend (1 min)

```bash
# Start backend server
npm run dev

# In a new terminal, seed database
npx ts-node src/database/seed.ts
```

Backend is now running on `http://localhost:5000` ✅

### Step 5: Setup & Start Frontend (1.5 min)

```bash
# In a new terminal
cd ../frontend
npm install
cp .env.example .env
npm run dev
```

Frontend is now running on `http://localhost:3000` ✅

## Login

Open `http://localhost:3000` and login with:

```
Email: admin@hrrecruitment.com
Password: admin123
```

## 🎉 You're Done!

You should now see the dashboard with sample data!

## What's Next?

1. **Explore the Dashboard** - View metrics and charts
2. **Browse Candidates** - See the candidates page with filters
3. **Test File Upload** - Upload sample files from `sample-data/` folder
4. **View API Docs** - Visit `http://localhost:5000/api-docs`

## Sample Data Files

Try uploading these files in the app:
- `sample-data/questions-sample.csv`
- `sample-data/requirements-sample.csv`
- `sample-data/questions-sample.json`
- `sample-data/requirements-sample.json`

## Troubleshooting

### "Database connection failed"
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `.env`
- Ensure database exists: `psql -U postgres -l | grep hr_recruitment_db`

### "Port already in use"
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change port in `frontend/vite.config.ts`

### "Module not found"
- Delete `node_modules` and run `npm install` again
- Clear npm cache: `npm cache clean --force`

### "Cannot login"
- Ensure backend is running
- Check you ran the seed script
- Clear browser localStorage

## Default Users

After seeding, you have one admin user:

| Email | Password | Role |
|-------|----------|------|
| admin@hrrecruitment.com | admin123 | admin |

Create more users via the `/api/auth/register` endpoint or directly in the database.

## Testing the API

```bash
# Get a token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hrrecruitment.com","password":"admin123"}'

# Use the token (replace YOUR_TOKEN)
curl http://localhost:5000/api/metrics/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Project Structure

```
FitFource_V2/
├── backend/           # Node.js + Express + PostgreSQL
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── database/
│   │   └── server.ts
│   └── package.json
│
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── App.tsx
│   └── package.json
│
└── sample-data/       # Sample CSV/JSON files
```

## Need More Help?

- **Backend Setup**: See `backend/SETUP_GUIDE.md`
- **Frontend Setup**: See `frontend/SETUP_GUIDE.md`
- **API Reference**: See `API_DOCUMENTATION.md`
- **Full Guide**: See `README.md`

## Key Features to Try

1. ✅ **Dashboard**: View metrics and charts
2. ✅ **Candidates**: Filter, search, and view candidate details
3. ✅ **File Upload**: Upload questions and requirements (Admin only)
4. ✅ **Role-Based Access**: Login as different roles to see permissions
5. ✅ **API Documentation**: Interactive Swagger UI

Enjoy building with the HR Recruitment Dashboard! 🚀
