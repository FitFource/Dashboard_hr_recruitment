# Backend Setup Guide

## Prerequisites

- Node.js v18+
- PostgreSQL v14+
- npm or yarn

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. PostgreSQL Database Setup

#### Option A: Using psql command line

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE hr_recruitment_db;

# Exit psql
\q
```

#### Option B: Using pgAdmin
1. Open pgAdmin
2. Right-click on "Databases"
3. Select "Create" > "Database"
4. Name it `hr_recruitment_db`
5. Click "Save"

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file with your settings:

```env
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hr_recruitment_db
DB_USER=postgres
DB_PASSWORD=your_postgresql_password

# JWT Configuration (change in production)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 4. Run Database Migrations

Execute the schema SQL file:

```bash
# Using psql
psql -U postgres -d hr_recruitment_db -f src/database/schema.sql

# Or copy and paste the contents of schema.sql into pgAdmin Query Tool
```

This will create all necessary tables and indexes.

### 5. Seed Database (Optional but Recommended)

Start the development server first:

```bash
npm run dev
```

In another terminal, run the seed script:

```bash
npx ts-node src/database/seed.ts
```

This creates:
- Admin user (email: admin@hrrecruitment.com, password: admin123)
- Sample candidates
- Sample interview questions
- Sample job requirements

### 6. Verify Installation

Check that the server is running:

```bash
curl http://localhost:5000/health
```

You should see:
```json
{
  "status": "OK",
  "message": "HR Recruitment Dashboard API is running",
  "timestamp": "2024-..."
}
```

### 7. Access API Documentation

Open your browser and navigate to:
```
http://localhost:5000/api-docs
```

You should see the Swagger UI with all API endpoints documented.

### 8. Test API Endpoints

#### Login Test:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hrrecruitment.com",
    "password": "admin123"
  }'
```

You should receive a response with a JWT token.

#### Get Metrics Test:

```bash
# Replace YOUR_TOKEN with the token from login response
curl http://localhost:5000/api/metrics/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Database Connection Issues

If you see "connection refused" errors:

1. Verify PostgreSQL is running:
```bash
# Windows
sc query postgresql

# macOS/Linux
sudo systemctl status postgresql
```

2. Check your `.env` database credentials
3. Ensure the database exists:
```bash
psql -U postgres -l | grep hr_recruitment_db
```

### Port Already in Use

If port 5000 is already in use:

1. Change the `PORT` in `.env` to another port (e.g., 5001)
2. Update the frontend API URL accordingly

### Missing Dependencies

If you encounter module errors:

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Compilation Errors

```bash
# Clean build
npm run build
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Set up proper CORS origins
4. Use environment variables for sensitive data
5. Build the application:
```bash
npm run build
```

6. Run in production:
```bash
npm start
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production server
- `npm run migrate` - Run database migrations (if implemented)

## Database Schema Overview

Tables created:
- `users` - HR staff accounts
- `candidates` - Candidate information
- `candidate_history` - Action timeline
- `candidate_documents` - File attachments
- `interview_questions` - Question bank
- `job_requirements` - Job specifications

See `src/database/schema.sql` for complete schema.
