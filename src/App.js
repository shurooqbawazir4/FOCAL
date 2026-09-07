import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppRouter } from './router';
import Navbar from './components/Navbar';
import './styles/App.css';

/**
 * Main App Content Component
 * 
 * This component handles the main layout and navigation.
 * It shows the navbar when user is authenticated and renders the router.
 */
const AppContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="App">
      {/* Show navbar only when authenticated */}
      {isAuthenticated && <Navbar />}
      
      {/* Router handles all the route logic */}
      <AppRouter />
      
      {/* Toast notifications for user feedback */}
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;