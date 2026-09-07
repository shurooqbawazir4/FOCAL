import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1 = password, 2 = OTP
  const [maskedEmail, setMaskedEmail] = useState('');
  
  const { login, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsLoading(true);
    setMessage('');
    
    try {
      if (step === 1) {
        // Step 1: Username and Password
        if (username === '' || password === '') {
          setMessage('Please enter both username and password');
          setIsLoading(false);
          return;
        }
        
        const result = await login(username, password);
        
        if (result.success && result.data.requiresOTP) {
          // Move to OTP step
          setStep(2);
          setMaskedEmail(result.data.email);
          setMessage('OTP sent to your email address');
        } else if (result.success) {
          // Direct login (no OTP required)
          handleLoginSuccess(result);
        } else {
          setMessage(result.error || 'Login failed');
        }
      } else if (step === 2) {
        // Step 2: OTP Verification
        if (otp === '' || otp.length !== 6) {
          setMessage('Please enter a valid 6-digit OTP');
          setIsLoading(false);
          return;
        }
        
        const result = await verifyOtp(otp);
        
        if (result.success) {
          handleLoginSuccess(result);
        } else {
          setMessage(result.error || 'Invalid OTP');
        }
      }
    } catch (error) {
      setMessage('An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (result) => {
    // Redirect to dashboard for all users
    navigate('/');
  };

  const handleBackToLogin = () => {
    setStep(1);
    setOtp('');
    setMessage('');
  };

  return (
    <div className="container-wrapper">
      <div className="container-box">
        {/* Left Section */}
        <div className="left-box">
          <div className="floating-element bubble-1"></div>
          <div className="floating-element bubble-2"></div>
          <div className="floating-element bubble-3"></div>
          
          <div className="logo">
            <div className="logo-circle">
              <i className="fas fa-eye"></i>
            </div>
            <div className="logo-text">FOCAL</div>
          </div>
          <h2>Attention Monitoring System</h2>
          <p>Track, Analyze & Improve Student Engagement</p>
          <div className="illustrations">
            <img 
              src="/images/cartoon-removebg-preview.png" 
              alt="Analytics Illustration" 
              className="main-illustration"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="right-box">
          <div className="login-card">
            {step === 1 ? (
              <>
                <h2>Login to Your Account</h2>
                
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <input 
                      type="text" 
                      id="username" 
                      className="form-control" 
                      placeholder="Enter Username" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <div className="password-input-container">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        id="password" 
                        className="form-control" 
                        placeholder="Enter Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                      />
                      <button 
                        type="button" 
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                    <div className="forgot-password">
                      <a href="https://myaccount.psu.edu.sa/authorization.do" target="_blank" rel="noopener noreferrer">
                        Forgot password?
                      </a>
                    </div>
                  </div>

                  <button type="submit" className="btn-login" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2>Enter Verification Code</h2>
                <p className="otp-instruction">
                  We've sent a 6-digit code to <strong>{maskedEmail}</strong>
                </p>
                
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <input 
                      type="text" 
                      id="otp" 
                      className="form-control otp-input" 
                      placeholder="Enter 6-digit code" 
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtp(value);
                      }}
                      maxLength="6"
                      required 
                    />
                  </div>

                  <button type="submit" className="btn-login" disabled={isLoading}>
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                  </button>
                  
                  <button 
                    type="button" 
                    className="btn-back" 
                    onClick={handleBackToLogin}
                    disabled={isLoading}
                  >
                    ← Back to Login
                  </button>
                </form>
              </>
            )}
            
            {message && (
              <p className={`message ${step === 2 && message.includes('sent') ? 'success' : 'error'}`}>
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
