# Frontend Setup Guide

## Prerequisites

- Node.js v18+
- npm or yarn
- Backend server running on http://localhost:5000

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

**Note**: If your backend is running on a different port or host, update the URL accordingly.

### 3. Start Development Server

```bash
npm run dev
```

The application will open at `http://localhost:3000`

### 4. Login to the Application

Use the default credentials (after seeding the backend database):

```
Email: admin@hrrecruitment.com
Password: admin123
```

## Application Structure

```
frontend/src/
├── components/           # Reusable UI components
│   ├── Layout.tsx       # Main layout with sidebar
│   └── MetricCard.tsx   # Dashboard metric cards
├── pages/               # Page components
│   ├── Dashboard.tsx    # Main dashboard with metrics
│   ├── Candidates.tsx   # Candidate list with filters
│   ├── CandidateDetail.tsx  # Individual candidate view
│   ├── Questions.tsx    # Interview questions management
│   ├── Requirements.tsx # Job requirements management
│   └── Login.tsx        # Login page
├── store/               # State management
│   └── authStore.ts     # Authentication state (Zustand)
├── lib/                 # Utilities
│   └── api.ts          # Axios instance with interceptors
├── types/               # TypeScript type definitions
│   └── index.ts        # All interface definitions
├── App.tsx             # Main app with routing
├── main.tsx            # Entry point
└── index.css           # Tailwind CSS imports
```

## Features Overview

### 1. Dashboard
- Overview metrics (total, accepted, rejected, in-progress)
- Bar chart showing candidates by job role
- Pie chart showing status distribution
- Top 10 most processed candidates today

### 2. Candidates Management
- List all candidates with pagination
- Advanced filters (status, role, search)
- View detailed candidate profile
- Edit candidate status and score
- View action history timeline
- View uploaded documents

### 3. Interview Questions
- View all interview questions
- Filter by job role, difficulty, category
- Upload questions from CSV/Excel/JSON
- Delete questions (admin only)

### 4. Job Requirements
- View all job requirements
- Filter by job role and type
- Upload requirements from CSV/Excel/JSON
- Delete requirements (admin only)

## Customization

### Change Theme Colors

Edit `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Change these values
        500: '#0ea5e9',
        600: '#0284c7',
        // ...
      },
    },
  },
}
```

### Add New Pages

1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add menu item in `src/components/Layout.tsx`

Example:

```typescript
// src/pages/NewPage.tsx
const NewPage: React.FC = () => {
  return <div>New Page Content</div>;
};

// src/App.tsx
<Route
  path="/new-page"
  element={
    <ProtectedRoute>
      <Layout>
        <NewPage />
      </Layout>
    </ProtectedRoute>
  }
/>
```

## Build for Production

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

### Preview Production Build
```bash
npm run preview
```

## Deployment

### Static Hosting (Vercel, Netlify, etc.)

1. Build the application:
```bash
npm run build
```

2. Deploy the `dist/` folder to your hosting service

3. Configure environment variables on the hosting platform:
```
VITE_API_URL=https://your-api-domain.com/api
```

### Important: Routing Configuration

For single-page applications, you need to configure your hosting to redirect all routes to `index.html`.

**Vercel** - Create `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Netlify** - Create `_redirects` in `public/`:
```
/*    /index.html   200
```

## Troubleshooting

### API Connection Issues

If you see network errors:

1. Verify backend is running on the correct port
2. Check `VITE_API_URL` in `.env`
3. Check browser console for CORS errors
4. Verify backend CORS settings allow frontend origin

### Build Errors

```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

### Authentication Issues

If login fails:
1. Check backend is running
2. Verify database is seeded
3. Check browser localStorage for token
4. Clear localStorage and try again:
```javascript
// In browser console
localStorage.clear()
```

### Chart Not Displaying

If charts don't render:
1. Ensure `recharts` is installed
2. Check console for errors
3. Verify data format matches component props

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Performance Optimization

### Code Splitting

React Router automatically splits code by route. Each page is lazy-loaded.

### Image Optimization

For production, consider:
- Using WebP format for images
- Implementing lazy loading
- Using CDN for static assets

### Bundle Analysis

To analyze bundle size:

```bash
npm install -D rollup-plugin-visualizer
```

Add to `vite.config.ts`:
```typescript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [react(), visualizer()],
});
```

## Browser Support

Supports all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Tips

1. **Hot Reload**: Save any file to see changes instantly
2. **DevTools**: Install React Developer Tools extension
3. **API Testing**: Use browser DevTools Network tab
4. **State Management**: Install Zustand DevTools for debugging
5. **Responsive Design**: Use browser's device emulation

## Common Issues

### Module Not Found

```bash
npm install
```

### Port Already in Use

Change port in `vite.config.ts`:
```typescript
server: {
  port: 3001, // Change from 3000
}
```

### TypeScript Errors

```bash
# Check tsconfig.json
# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P > "TypeScript: Restart TS Server"
```
