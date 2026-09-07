import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute Component
 * 
 * This component protects routes that require authentication.
 * It checks if the user is logged in and has the required user type.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The component to render if access is allowed
 * @param {Array} props.allowedUserTypes - Array of user types allowed to access this route
 * @returns {React.ReactNode} - Either the protected component or a redirect
 */
const ProtectedRoute = ({ children, allowedUserTypes = [] }) => {
  const { isAuthenticated, user } = useAuth();

  // If user is not logged in, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If no specific user types are required, allow all authenticated users
  if (allowedUserTypes.length === 0) {
    return children;
  }

  // Check if user type is allowed for this route
  if (!allowedUserTypes.includes(user?.userType)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
