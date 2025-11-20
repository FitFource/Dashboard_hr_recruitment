# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "role": "recruiter"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "recruiter"
  }
}
```

### POST /auth/login
Login user and receive JWT token.

**Request Body:**
```json
{
  "email": "admin@hrrecruitment.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@hrrecruitment.com",
    "full_name": "Admin User",
    "role": "admin"
  }
}
```

### GET /auth/profile
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "admin@hrrecruitment.com",
    "full_name": "Admin User",
    "role": "admin",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Candidates Endpoints

### GET /candidates
Get all candidates with optional filters.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (optional): Filter by status (in_progress, accepted, rejected)
- `job_role` (optional): Filter by job role
- `search` (optional): Search by name or email
- `limit` (optional, default: 50): Number of results
- `offset` (optional, default: 0): Pagination offset

**Example:** `/candidates?status=accepted&job_role=Software%20Engineer&limit=20`

**Response:**
```json
{
  "candidates": [
    {
      "id": 1,
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "job_role": "Software Engineer",
      "status": "accepted",
      "score": 85,
      "years_of_experience": 5,
      "skills": ["JavaScript", "React", "Node.js"],
      "education": "Bachelor in CS",
      "location": "New York",
      "applied_date": "2024-01-15T00:00:00.000Z"
    }
  ],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

### GET /candidates/:id
Get detailed candidate information including history and documents.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "candidate": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "status": "accepted",
    "score": 85
  },
  "history": [
    {
      "id": 1,
      "candidate_id": 1,
      "action": "Status Updated",
      "description": "Status changed from in_progress to accepted",
      "performed_by_name": "Admin User",
      "created_at": "2024-01-20T10:00:00.000Z"
    }
  ],
  "documents": [
    {
      "id": 1,
      "candidate_id": 1,
      "document_type": "Resume",
      "file_name": "john_doe_resume.pdf",
      "file_url": "/uploads/resume.pdf",
      "uploaded_at": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

### POST /candidates
Create a new candidate.

**Headers:** `Authorization: Bearer <token>`

**Permissions:** Admin, Recruiter

**Request Body:**
```json
{
  "full_name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567891",
  "job_role": "Product Manager",
  "status": "in_progress",
  "score": 75,
  "years_of_experience": 4,
  "skills": ["Product Strategy", "Agile"],
  "education": "MBA",
  "location": "San Francisco"
}
```

**Response:**
```json
{
  "candidate": {
    "id": 2,
    "full_name": "Jane Smith",
    "email": "jane@example.com",
    ...
  }
}
```

### PUT /candidates/:id
Update candidate information.

**Headers:** `Authorization: Bearer <token>`

**Permissions:** Admin, Recruiter

**Request Body:**
```json
{
  "status": "accepted",
  "score": 90
}
```

**Response:**
```json
{
  "candidate": {
    "id": 1,
    "status": "accepted",
    "score": 90,
    ...
  }
}
```

### DELETE /candidates/:id
Delete a candidate.

**Headers:** `Authorization: Bearer <token>`

**Permissions:** Admin only

**Response:**
```json
{
  "message": "Candidate deleted successfully"
}
```

---

## Metrics Endpoints

### GET /metrics/overview
Get overview statistics.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "total_candidates": 150,
  "accepted_candidates": 45,
  "rejected_candidates": 30,
  "in_progress_candidates": 75
}
```

### GET /metrics/top-candidates
Get top 10 most processed candidates today.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "job_role": "Software Engineer",
    "status": "accepted",
    "score": 85,
    "actions_count": 5,
    "last_action_date": "2024-01-20T14:30:00.000Z"
  }
]
```

### GET /metrics/top-by-role
Get top 10 candidates grouped by job role.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "job_role": "Software Engineer",
    "total_candidates": 50,
    "accepted": 20,
    "rejected": 10,
    "in_progress": 20
  },
  {
    "job_role": "Product Manager",
    "total_candidates": 30,
    "accepted": 12,
    "rejected": 8,
    "in_progress": 10
  }
]
```

### GET /metrics/trends
Get application trends over time.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `days` (optional, default: 30): Number of days to include

**Response:**
```json
[
  {
    "date": "2024-01-20",
    "total_applications": 15,
    "accepted": 5,
    "rejected": 3,
    "in_progress": 7
  }
]
```

---

## Questions Endpoints

### GET /questions
Get all interview questions.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `job_role` (optional): Filter by job role
- `difficulty` (optional): Filter by difficulty (easy, medium, hard)
- `category` (optional): Filter by category

**Response:**
```json
{
  "questions": [
    {
      "id": 1,
      "job_role": "Software Engineer",
      "question": "What is closure in JavaScript?",
      "category": "Technical",
      "difficulty": "medium",
      "expected_answer": "A closure is...",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /questions
Create a new question.

**Headers:** `Authorization: Bearer <token>`

**Permissions:** Admin, Recruiter

**Request Body:**
```json
{
  "job_role": "Software Engineer",
  "question": "Explain the event loop",
  "category": "Technical",
  "difficulty": "hard",
  "expected_answer": "The event loop..."
}
```

**Response:**
```json
{
  "question": {
    "id": 2,
    "job_role": "Software Engineer",
    "question": "Explain the event loop",
    ...
  }
}
```

### POST /questions/upload
Upload questions from file (CSV, Excel, or JSON).

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Permissions:** Admin only

**Form Data:**
- `file`: The file to upload

**File Format (CSV):**
```csv
job_role,question,category,difficulty,expected_answer
Software Engineer,What is closure?,Technical,medium,A closure is...
```

**Response:**
```json
{
  "message": "Successfully uploaded 10 questions",
  "questions": [...]
}
```

### DELETE /questions/:id
Delete a question.

**Headers:** `Authorization: Bearer <token>`

**Permissions:** Admin only

**Response:**
```json
{
  "message": "Question deleted successfully"
}
```

---

## Requirements Endpoints

### GET /requirements
Get all job requirements.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `job_role` (optional): Filter by job role
- `requirement_type` (optional): Filter by type
- `is_mandatory` (optional): Filter by mandatory status (true/false)

**Response:**
```json
{
  "requirements": [
    {
      "id": 1,
      "job_role": "Software Engineer",
      "requirement_type": "Technical Skills",
      "description": "Proficient in JavaScript",
      "is_mandatory": true,
      "minimum_years_experience": 3,
      "required_skills": ["JavaScript", "React"],
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /requirements
Create a new requirement.

**Headers:** `Authorization: Bearer <token>`

**Permissions:** Admin, Recruiter

**Request Body:**
```json
{
  "job_role": "Data Scientist",
  "requirement_type": "Technical Skills",
  "description": "Experience with Python and ML",
  "is_mandatory": true,
  "minimum_years_experience": 2,
  "required_skills": ["Python", "Machine Learning"]
}
```

**Response:**
```json
{
  "requirement": {
    "id": 2,
    "job_role": "Data Scientist",
    ...
  }
}
```

### POST /requirements/upload
Upload requirements from file (CSV, Excel, or JSON).

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Permissions:** Admin only

**Form Data:**
- `file`: The file to upload

**File Format (CSV):**
```csv
job_role,requirement_type,description,is_mandatory,minimum_years_experience,required_skills
Software Engineer,Technical,JavaScript expert,true,3,"JavaScript,React,Node.js"
```

**Response:**
```json
{
  "message": "Successfully uploaded 5 requirements",
  "requirements": [...]
}
```

### DELETE /requirements/:id
Delete a requirement.

**Headers:** `Authorization: Bearer <token>`

**Permissions:** Admin only

**Response:**
```json
{
  "message": "Requirement deleted successfully"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied. Insufficient permissions."
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "Email already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

Currently, there is no rate limiting implemented. For production, consider implementing rate limiting using packages like `express-rate-limit`.

## Pagination

For endpoints that return lists (candidates, questions, requirements), use `limit` and `offset` query parameters:

- `limit`: Number of items per page (default: 50)
- `offset`: Number of items to skip (default: 0)

Example: `/candidates?limit=20&offset=40` (page 3 with 20 items per page)

## Interactive Documentation

Access the interactive Swagger documentation at:
```
http://localhost:5000/api-docs
```

This provides a UI to test all endpoints directly from your browser.
