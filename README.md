# HR Recruitment Dashboard

A full-stack web application built with **TypeScript**, **React.js**, and **Node.js** to help HR teams track and analyze recruitment progress.

## 🚀 Features

### Dashboard Overview
- **Metrics Cards**: Total candidates, accepted, rejected, and in-progress candidates
- **Charts**: Bar chart for candidates by job role, pie chart for status distribution
- **Top Candidates**: Display top 10 most processed candidates today
- **Analytics**: Application trends and insights

### Candidate Management
- **View All Candidates**: Comprehensive list with advanced filters (status, role, search)
- **Candidate Details Page**:
  - Profile information
  - Current status and score
  - Action history timeline
  - Uploaded documents
  - Edit and update functionality

### Admin Features
- **Upload Questions**: Import interview questions from CSV, Excel, or JSON files
- **Upload Requirements**: Import job requirements from CSV, Excel, or JSON files
- **Role-Based Access Control**:
  - **Admin**: Full access (create, edit, delete, upload)
  - **Recruiter**: Can manage candidates and questions
  - **Viewer**: Read-only access

### Authentication & Security
- JWT-based authentication
- Role-based access control
- Secure password hashing with bcrypt
- Protected API routes

## 🛠️ Tech Stack

### Backend
- **Node.js** with **TypeScript**
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Multer** - File uploads
- **Swagger** - API documentation

### Frontend
- **React 18** with **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Recharts** - Data visualization
- **React Router** - Navigation
- **Axios** - HTTP client

## 📁 Project Structure

```
FitFource_V2/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth & validation
│   │   ├── database/          # DB connection & schema
│   │   ├── types/             # TypeScript interfaces
│   │   ├── config/            # Swagger config
│   │   └── server.ts          # Entry point
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── components/        # Reusable components
    │   ├── pages/             # Page components
    │   ├── store/             # Zustand state management
    │   ├── lib/               # API utilities
    │   ├── types/             # TypeScript types
    │   └── App.tsx            # Main app component
    ├── package.json
    └── vite.config.ts
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**:
```bash
cd backend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Create PostgreSQL database**:
```sql
CREATE DATABASE hr_recruitment_db;
```

4. **Set up environment variables**:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=hr_recruitment_db
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000
```

5. **Run database migrations**:
```bash
# Execute the schema.sql file
psql -U postgres -d hr_recruitment_db -f src/database/schema.sql
```

6. **Seed the database** (optional):
```bash
npm run dev
# In another terminal:
npx ts-node src/database/seed.ts
```

7. **Start the backend server**:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**:
```bash
cd frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

4. **Start the frontend development server**:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## 📊 Database Schema

### Main Tables:
- **users** - HR staff with role-based access
- **candidates** - Candidate information and status
- **candidate_history** - Timeline of actions performed on candidates
- **candidate_documents** - Uploaded files for candidates
- **interview_questions** - Questions for different job roles
- **job_requirements** - Requirements for different positions

See `backend/src/database/schema.sql` for complete schema.

## 🔑 API Documentation

Once the backend is running, access the Swagger documentation at:
```
http://localhost:5000/api-docs
```

### Key API Endpoints:

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

#### Candidates
- `GET /api/candidates` - Get all candidates (with filters)
- `GET /api/candidates/:id` - Get candidate details
- `POST /api/candidates` - Create candidate
- `PUT /api/candidates/:id` - Update candidate
- `DELETE /api/candidates/:id` - Delete candidate

#### Metrics
- `GET /api/metrics/overview` - Get overview metrics
- `GET /api/metrics/top-candidates` - Top 10 processed candidates today
- `GET /api/metrics/top-by-role` - Candidates grouped by role
- `GET /api/metrics/trends` - Application trends over time

#### Questions
- `GET /api/questions` - Get all questions
- `POST /api/questions` - Create question
- `POST /api/questions/upload` - Upload questions file
- `DELETE /api/questions/:id` - Delete question

#### Requirements
- `GET /api/requirements` - Get all requirements
- `POST /api/requirements` - Create requirement
- `POST /api/requirements/upload` - Upload requirements file
- `DELETE /api/requirements/:id` - Delete requirement

## 👤 Default Login Credentials

After seeding the database:
```
Email: admin@hrrecruitment.com
Password: admin123
```

## 📤 File Upload Format

### Interview Questions (CSV/Excel/JSON)

**CSV Example**:
```csv
job_role,question,category,difficulty,expected_answer
Software Engineer,What is closure in JavaScript?,Technical,medium,A closure is...
Product Manager,How do you prioritize features?,Strategy,medium,I use...
```

**JSON Example**:
```json
[
  {
    "job_role": "Software Engineer",
    "question": "What is closure in JavaScript?",
    "category": "Technical",
    "difficulty": "medium",
    "expected_answer": "A closure is..."
  }
]
```

### Job Requirements (CSV/Excel/JSON)

**CSV Example**:
```csv
job_role,requirement_type,description,is_mandatory,minimum_years_experience,required_skills
Software Engineer,Technical Skills,Proficient in JavaScript,true,3,"JavaScript,React,Node.js"
```

## 🔒 Role-Based Access

| Feature | Admin | Recruiter | Viewer |
|---------|-------|-----------|--------|
| View Dashboard | ✅ | ✅ | ✅ |
| View Candidates | ✅ | ✅ | ✅ |
| Create/Edit Candidates | ✅ | ✅ | ❌ |
| Delete Candidates | ✅ | ❌ | ❌ |
| Upload Files | ✅ | ❌ | ❌ |
| Manage Questions | ✅ | ✅ | ✅ (read) |
| Manage Requirements | ✅ | ✅ | ✅ (read) |

## 🎨 UI Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Clean interface with Tailwind CSS
- **Interactive Charts**: Real-time data visualization
- **Toast Notifications**: User feedback for actions
- **Loading States**: Smooth loading indicators
- **Error Handling**: Comprehensive error messages

## 🧪 Testing

### Test the API with curl:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hrrecruitment.com","password":"admin123"}'

# Get metrics (replace TOKEN with your JWT)
curl http://localhost:5000/api/metrics/overview \
  -H "Authorization: Bearer TOKEN"
```

## 📦 Build for Production

### Backend:
```bash
cd backend
npm run build
npm start
```

### Frontend:
```bash
cd frontend
npm run build
# Serve the dist folder with your preferred static server
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues or questions, please open an issue in the repository.

---

Built with ❤️ using TypeScript, React, and Node.js
