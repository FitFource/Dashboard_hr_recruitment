# Backend Connection & Auto-Refresh Guide

## Overview
This guide explains how the frontend connects to the backend and how data auto-refreshes.

## Backend Connection Configuration

### 1. Environment Variables

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

**Backend** (`backend/.env`):
```env
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

### 2. API Client Configuration

The frontend uses Axios as the HTTP client, configured in `frontend/src/lib/api.ts`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### 3. Authentication
- JWT tokens are automatically attached to all requests via interceptors
- Tokens are stored in `localStorage`
- Automatic redirect to login on 401 errors

## Auto-Refresh Implementation

All main pages now auto-refresh every 30 seconds to keep data up-to-date:

### Pages with Auto-Refresh:
1. **Dashboard** - Refreshes metrics, charts, and top candidates
2. **Candidates** - Refreshes candidate list
3. **Candidate Detail** - Refreshes candidate details, history, and documents
4. **Questions** - Refreshes interview questions
5. **Requirements** - Refreshes job requirements

### How It Works:

Each page implements a pattern like this:

```typescript
useEffect(() => {
  fetchData();
  
  // Auto-refresh every 30 seconds (silent - no loading spinner)
  const interval = setInterval(() => {
    fetchData(true); // silent parameter
  }, 30000);
  
  return () => clearInterval(interval); // Cleanup on unmount
}, [dependencies]);

const fetchData = async (silent = false) => {
  try {
    if (!silent) setLoading(true);
    const response = await api.get('/endpoint');
    setData(response.data);
  } catch (error) {
    if (!silent) {
      toast.error('Failed to fetch data');
    }
  } finally {
    if (!silent) setLoading(false);
  }
};
```

### Key Features:

1. **Silent Refresh**: Background updates don't show loading spinners
2. **Automatic Cleanup**: Intervals are cleared when components unmount
3. **Error Handling**: Silent refreshes don't show error toasts to avoid spam
4. **Real-time Updates**: Data updates every 30 seconds without user action

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Candidates
- `GET /api/candidates` - Get all candidates (with filters)
- `GET /api/candidates/:id` - Get candidate details
- `POST /api/candidates` - Create new candidate
- `PUT /api/candidates/:id` - Update candidate
- `DELETE /api/candidates/:id` - Delete candidate

### Metrics
- `GET /api/metrics/overview` - Get dashboard overview
- `GET /api/metrics/top-candidates` - Get top candidates
- `GET /api/metrics/top-by-role` - Get candidates by role
- `GET /api/metrics/trends?days=7` - Get application trends

### Questions
- `GET /api/questions` - Get all questions
- `POST /api/questions/upload` - Upload questions file
- `DELETE /api/questions/:id` - Delete question

### Requirements
- `GET /api/requirements` - Get all requirements
- `POST /api/requirements/upload` - Upload requirements file
- `DELETE /api/requirements/:id` - Delete requirement

## Starting the Application

### 1. Start Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs on: `http://localhost:5000`

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: `http://localhost:3000`

### 3. Verify Connection
- Open browser to `http://localhost:3000`
- Login with demo credentials:
  - Email: `admin@hrrecruitment.com`
  - Password: `admin123`
- Check browser console for API calls
- Data should refresh automatically every 30 seconds

## Troubleshooting

### Connection Issues

1. **CORS Error**
   - Verify `CORS_ORIGIN` in backend `.env` matches frontend URL
   - Check backend is running

2. **401 Unauthorized**
   - Clear localStorage and re-login
   - Check JWT token expiration

3. **API Not Found (404)**
   - Verify backend is running on port 5000
   - Check `VITE_API_URL` in frontend `.env`

4. **Data Not Refreshing**
   - Check browser console for errors
   - Verify auto-refresh intervals are running
   - Test manual refresh with filters

### Proxy Configuration

The frontend Vite config includes a proxy for development:

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```

This allows requests to `/api/*` to be forwarded to the backend.

## Performance Considerations

- **Refresh Interval**: 30 seconds is a good balance between real-time updates and server load
- **Silent Refresh**: Prevents UI flickering during updates
- **Cleanup**: Intervals are properly cleaned up to prevent memory leaks
- **Conditional Updates**: Only refresh when component is mounted

## Customization

To change the refresh interval, modify the interval duration:

```typescript
// Change from 30 seconds to 60 seconds
const interval = setInterval(() => {
  fetchData(true);
}, 60000); // 60000ms = 60 seconds
```

To disable auto-refresh on a specific page, remove the interval code from the useEffect.

## Security

- All API requests include JWT token in Authorization header
- Tokens are automatically refreshed on login
- Expired tokens trigger automatic logout
- CORS is configured to only allow frontend origin
