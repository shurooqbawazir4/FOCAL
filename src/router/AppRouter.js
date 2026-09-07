import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { routes } from './routeConfig';

/**
 * AppRouter Component
 * 
 * This component handles all the routing logic for the application.
 * It uses the route configuration from routeConfig.js to set up routes.
 * 
 * This makes it easy to:
 * - Add new routes by updating routeConfig.js
 * - See all routes in one place
 * - Maintain consistent routing logic
 * 
 * @returns {React.ReactNode} - The router component with all routes
 */
const AppRouter = () => {
  return (
    <Routes>
      {routes.map((route, index) => (
        <Route
          key={index}
          path={route.path}
          element={route.element}
        />
      ))}
    </Routes>
  );
};

export default AppRouter;
