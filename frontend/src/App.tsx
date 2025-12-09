import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import UserLayout from './components/UserLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import Questions from './pages/Questions';
import Requirements from './pages/Requirements';
import HomeUser from './pages/User/HomeUser';
import UserCandidates from './pages/User/UserCandidates';
import UserRequirements from './pages/User/UserRequirements';

// Role-based route protection
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If allowedRoles is specified, check if user has permission
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect based on user role
    if (user.role === 'user') {
      return <Navigate to="/user/home" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Component to redirect authenticated users based on role
const RoleBasedRedirect: React.FC = () => {
  const { user } = useAuthStore();
  
  if (user?.role === 'user') {
    return <Navigate to="/user/home" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Root always redirects to login page */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />
        
        <Route
          path="/login"
          element={isAuthenticated ? <RoleBasedRedirect /> : <Login />}
        />
        
        {/* HR System routes - for admin and viewer only */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin', 'viewer']}>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidates"
          element={
            <ProtectedRoute allowedRoles={['admin', 'viewer']}>
              <Layout>
                <Candidates />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/questions"
          element={
            <ProtectedRoute allowedRoles={['admin', 'viewer']}>
              <Layout>
                <Questions />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/requirements"
          element={
            <ProtectedRoute allowedRoles={['admin', 'viewer']}>
              <Layout>
                <Requirements />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        {/* User System routes - for user role only */}
        <Route
          path="/user/home"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <UserLayout>
                <HomeUser />
              </UserLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/candidates"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <UserLayout>
                <UserCandidates />
              </UserLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/requirements"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <UserLayout>
                <UserRequirements />
              </UserLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Catch-all redirect based on authentication and role */}
        <Route 
          path="*" 
          element={isAuthenticated ? <RoleBasedRedirect /> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
