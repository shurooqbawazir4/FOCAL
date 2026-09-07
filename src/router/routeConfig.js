/**
 * Route Configuration
 * 
 * This file contains all the route definitions for the application.
 * It makes it easy to manage routes and see all available paths in one place.
 * 
 * Each route object contains:
 * - path: The URL path
 * - element: The component to render (includes ProtectedRoute wrapper if needed)
 * - isProtected: Whether the route requires authentication
 * - description: Brief description of what this route does
 * 
 * Note: User type restrictions are handled by the ProtectedRoute component
 * in the element prop, not in the route configuration itself.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import InstructorDashboard from './InstructorDashboard';
import AdminDashboard from './AdminDashboard';
import AdminCourses from './AdminCourses';
import Login from '../components/Login';
import FlashCard from '../components/FlashCard';
import { useAuth } from '../contexts/AuthContext';

/**
 * Login Route Wrapper
 * Handles authentication check for login page
 */
const LoginRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <Login />;
};

/**
 * Route configuration array
 * Add new routes here to make them available in the application
 */
/**
 * DashboardSwitcher
 * Renders Admin or Instructor dashboard based on current user.
 */
export function DashboardSwitcher() {
  const { user } = useAuth();
  if (user?.userType === 'admin') return <AdminDashboard />;
  return <InstructorDashboard />;
}

export const routes = [
  {
    path: '/login',
    element: <LoginRoute />,
    isProtected: false,
    description: 'Login page for user authentication'
  },
  {
    path: '/',
    element: (
      <ProtectedRoute allowedUserTypes={['instructor','admin']}>
        {/* Decide dashboard by user type at runtime */}
        <DashboardSwitcher />
      </ProtectedRoute>
    ),
    isProtected: true,
    description: 'Dashboard page (Instructor/Admin)'
  },
  {
    path: '/courses',
    element: (
      <ProtectedRoute allowedUserTypes={['admin']}>
        <AdminCourses />
      </ProtectedRoute>
    ),
    isProtected: true,
    description: 'Admin courses search page'
  },
  {
    path: '/flashcards',
    element: (
      <ProtectedRoute allowedUserTypes={['instructor']}>
        <FlashCard />
      </ProtectedRoute>
    ),
    isProtected: true,
    description: 'Flashcards page (instructor only)'
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
    isProtected: false,
    description: 'Catch-all route - redirects to home page'
  }
];

export const getRouteByPath = (path) => {
  return routes.find(route => route.path === path) || null;
};

/**
 * Get all protected routes
 * 
 * Helper function to get all routes that require authentication
 * 
 * @returns {Array} - Array of protected route configurations
 */
export const getProtectedRoutes = () => {
  return routes.filter(route => route.isProtected);
};

/**
 * Get routes for specific user type
 * 
 * Helper function to get all routes accessible by a specific user type.
 * Note: This function analyzes the ProtectedRoute components to determine access.
 * 
 * @param {string} userType - The user type to check
 * @returns {Array} - Array of accessible route configurations
 */
export const getRoutesForUserType = (userType) => {
  return routes.filter(route => {
    if (!route.isProtected) return true; // Public routes are accessible to all
    
    // For protected routes, we need to check the ProtectedRoute component
    // This is a simplified check - in practice, you'd need to parse the JSX
    // For now, we'll return all protected routes and let ProtectedRoute handle the logic
    return true;
  });
};
