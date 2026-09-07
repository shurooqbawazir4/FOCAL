/**
 * Router Module Index
 * 
 * This file exports the main router component and utilities.
 * It serves as the main entry point for the router module.
 * 
 * This makes it easy to import router components from other parts of the app:
 * import { AppRouter } from '../router';
 */

// Main router component
export { default as AppRouter } from './AppRouter';

// Route configuration and utilities (for advanced usage)
export { 
  routes, 
  getRouteByPath, 
  getProtectedRoutes, 
  getRoutesForUserType 
} from './routeConfig';
