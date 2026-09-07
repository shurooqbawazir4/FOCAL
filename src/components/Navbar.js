import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Check user roles
  const isAdmin = user?.userType === 'admin';
  // Check if user is instructor (show both dashboard and flashcard)
  const isInstructor = user?.userType === 'instructor';

  return (
    <nav className="navbar" style={{ width: '100vw', minWidth: '100vw', maxWidth: 'none', margin: 0, padding: 0 }}>
      <div className="navbar-container" style={{ width: '100vw', minWidth: '100vw', maxWidth: 'none', margin: 0 }}>
        
        {/* LEFT: Logo Section */}
        <div className="navbar-left">
          <div className="navbar-logo" onClick={() => handleNavigation('/')}>
            <div className="logo-icon">
              <i className="fas fa-eye"></i>
            </div>
            <span className="logo-text">FOCAL</span>
          </div>
        </div>

        {/* CENTER: Navigation Links */}
        <div className="navbar-center">
          <div className="navbar-nav">
            <div 
              className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
              onClick={() => handleNavigation('/')}
            >
              <i className="fas fa-home"></i>
              <span>Dashboard</span>
            </div>
            {/* Admin: Dashboard + Courses */}
            {isAdmin && (
              <div 
                className={`nav-item ${location.pathname === '/courses' ? 'active' : ''}`}
                onClick={() => handleNavigation('/courses')}
              >
                <i className="fas fa-book"></i>
                <span>Courses</span>
              </div>
            )}
            {/* Only show FlashCard tab for instructors */}
            {isInstructor && (
              <div 
                className={`nav-item ${location.pathname === '/flashcards' ? 'active' : ''}`}
                onClick={() => handleNavigation('/flashcards')}
              >
                <i className="fas fa-layer-group"></i>
                <span>FlashCard</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: User Section */}
        <div className="navbar-right">
          <div className="user-info">
            <div className="user-avatar">
              <i className="fas fa-user"></i>
            </div>
            <div className="user-details">
              <span className="user-name">{user?.firstName || user?.username || 'Admin'}</span>
              <span className="user-type">{user?.userType || 'Admin'}</span>
            </div>
            <button className="logout-button" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="mobile-menu-toggle" onClick={toggleMenu}>
          <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-user-info">
          <div className="mobile-user-avatar">
            <i className="fas fa-user"></i>
          </div>
          <div className="mobile-user-details">
            <span className="mobile-user-name">{user?.firstName || user?.username || 'Admin'}</span>
            <span className="mobile-user-type">{user?.userType || 'Admin'}</span>
          </div>
        </div>
        
        <div className="mobile-nav-items">
          <div 
            className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => handleNavigation('/')}
          >
            <i className="fas fa-home"></i>
            <span>Dashboard</span>
          </div>
          {/* Admin: Courses tab */}
          {isAdmin && (
            <div 
              className={`mobile-nav-item ${location.pathname === '/courses' ? 'active' : ''}`}
              onClick={() => handleNavigation('/courses')}
            >
              <i className="fas fa-book"></i>
              <span>Courses</span>
            </div>
          )}
          {/* Only show FlashCard tab for instructors in mobile menu */}
          {isInstructor && (
            <div 
              className={`mobile-nav-item ${location.pathname === '/flashcards' ? 'active' : ''}`}
              onClick={() => handleNavigation('/flashcards')}
            >
              <i className="fas fa-layer-group"></i>
              <span>FlashCard</span>
            </div>
          )}
          <div className="mobile-nav-item logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && <div className="mobile-menu-overlay" onClick={toggleMenu}></div>}
    </nav>
  );
};

export default Navbar;