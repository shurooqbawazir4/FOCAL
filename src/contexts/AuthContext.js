import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create Auth Context
const AuthContext = createContext();

// Auth Actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  START_MONITORING: 'START_MONITORING',
  STOP_MONITORING: 'STOP_MONITORING',
  UPDATE_ATTENTION_DATA: 'UPDATE_ATTENTION_DATA',
  UPDATE_SESSION_STATS: 'UPDATE_SESSION_STATS',
  UPDATE_COURSE_INFO: 'UPDATE_COURSE_INFO',
  SET_SELECTED_COURSE: 'SET_SELECTED_COURSE',
  SET_SELECTED_SECTION: 'SET_SELECTED_SECTION'
};

// Initial State
const initialState = {
  user: null,
  token: localStorage.getItem('focal_token'),
  isAuthenticated: false,
  loading: true,
  error: null,
  // Monitoring state
  isMonitoring: false,
  currentClassId: null,
  currentCourseInfo: {
    courseCode: '',
    courseName: '',
    sectionId: ''
  },
  // Course selection state (persistent across navigation)
  selectedCourse: '',
  selectedSection: '',
  attentionRate: 0,
  currentSessionData: {
    avgAttention: 0,
    maxAttention: 0,
    minAttention: 100,
    dataPoints: 0,
    durationMinutes: 0
  },
  sessionStartTime: null,
  chartData: {
    labels: [],
    datasets: [{
      label: 'Attention Rate (%)',
      data: [],
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1
    }]
  },
  showChart: false
};

// Auth Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false
      };
    
    case AUTH_ACTIONS.START_MONITORING:
      console.log('🎯 START_MONITORING action:', {
        classId: action.payload.classId,
        courseInfo: action.payload.courseInfo,
        currentCourseInfo: state.currentCourseInfo
      });
      const finalCourseInfo = action.payload.courseInfo || state.currentCourseInfo;
      console.log('🎯 Final course info for monitoring:', finalCourseInfo);
      return {
        ...state,
        isMonitoring: true,
        currentClassId: action.payload.classId,
        attentionRate: action.payload.initialRate,
        // Preserve course information during monitoring
        currentCourseInfo: finalCourseInfo,
        sessionStartTime: new Date(),
        currentSessionData: {
          avgAttention: action.payload.initialRate,
          maxAttention: action.payload.initialRate,
          minAttention: action.payload.initialRate,
          dataPoints: 1,
          durationMinutes: 0
        },
        chartData: {
          labels: [action.payload.initialTime],
          datasets: [{
            label: 'Attention Rate (%)',
            data: [Math.round(action.payload.initialRate)],
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1
          }]
        },
        showChart: true
      };
    
    case AUTH_ACTIONS.STOP_MONITORING:
      return {
        ...state,
        isMonitoring: false,
        currentClassId: null,
        sessionStartTime: null,
        currentSessionData: {
          avgAttention: action.payload.avgAttention,
          maxAttention: action.payload.maxAttention,
          minAttention: action.payload.minAttention,
          dataPoints: action.payload.dataPoints,
          durationMinutes: action.payload.durationMinutes || 0
        }
      };
    
    case AUTH_ACTIONS.UPDATE_ATTENTION_DATA:
      return {
        ...state,
        attentionRate: action.payload.attentionRate,
        chartData: {
          ...state.chartData,
          labels: [...state.chartData.labels, action.payload.time].slice(-10),
          datasets: [{
            ...state.chartData.datasets[0],
            data: [...state.chartData.datasets[0].data, action.payload.attentionRate].slice(-10)
          }]
        }
      };
    
    case AUTH_ACTIONS.UPDATE_SESSION_STATS:
      return {
        ...state,
        currentSessionData: action.payload
      };
    
    case AUTH_ACTIONS.UPDATE_COURSE_INFO:
      console.log('📚 UPDATE_COURSE_INFO action:', action.payload);
      return {
        ...state,
        currentCourseInfo: action.payload
      };
    
    case AUTH_ACTIONS.SET_SELECTED_COURSE:
      return {
        ...state,
        selectedCourse: action.payload,
        selectedSection: '' // Reset section when course changes
      };
    
    case AUTH_ACTIONS.SET_SELECTED_SECTION:
      return {
        ...state,
        selectedSection: action.payload
      };
    
    default:
      return state;
  }
};

// Configure Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  withCredentials: true, // Include cookies in requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set up axios interceptors
  useEffect(() => {
    // Request interceptor to add token
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        // Get token from localStorage directly to avoid race conditions
        const token = localStorage.getItem('focal_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔑 Adding token to request:', config.url, 'Token:', token.substring(0, 20) + '...');
        } else {
          console.log('❌ No token available for request:', config.url);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token expiration
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          logout();
          toast.error('Session expired. Please login again.');
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []); // Remove state.token dependency to avoid race conditions

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('focal_token');
      
      if (token) {
        try {
          // Set the token in the state first so it's available for the API call
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: { 
              user: null, // Will be set after verification
              token: token 
            }
          });
          
          const response = await api.post('/auth/verify-token');
          
          if (response.data.status === 'success') {
            dispatch({
              type: AUTH_ACTIONS.SET_USER,
              payload: response.data.data.user
            });
            console.log('✅ Token verification successful, user:', response.data.data.user);
          } else {
            localStorage.removeItem('focal_token');
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          console.error('Error details:', {
            status: error.response?.status,
            message: error.response?.data?.message,
            url: error.config?.url
          });
          localStorage.removeItem('focal_token');
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    checkAuth();
  }, []);

  // Global monitoring interval - runs regardless of current page
  useEffect(() => {
    let interval;
    
    if (state.isMonitoring && state.currentClassId) {
      interval = setInterval(async () => {
        try {
          const response = await api.get(`/instructor/attention/${state.currentClassId}`);
          if (response.data.status === 'success') {
            const currentRate = response.data.data.currentRate;
            
            // Update attention data
            updateAttentionData(currentRate);
            
            // Update session statistics
            const newDataPoints = state.currentSessionData.dataPoints + 1;
            const newAvg = ((state.currentSessionData.avgAttention * state.currentSessionData.dataPoints) + currentRate) / newDataPoints;
            const newMax = Math.max(state.currentSessionData.maxAttention, currentRate);
            const newMin = Math.min(state.currentSessionData.minAttention, currentRate);
            
            updateSessionStats({
              avgAttention: newAvg,
              maxAttention: newMax,
              minAttention: newMin,
              dataPoints: newDataPoints
            });
          }
        } catch (error) {
          console.error('Failed to fetch real-time attention:', error);
        }
      }, 5000); // Fetch every 5 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [state.isMonitoring, state.currentClassId]);

  // Login function
  const login = async (username, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      const response = await api.post('/auth/login', {
        username,
        password
      });

      if (response.data.status === 'success') {
        if (response.data.data.requiresOTP) {
          // OTP required - don't authenticate yet
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          return { 
            success: true, 
            data: response.data.data 
          };
        } else {
          // Direct login (no OTP required)
          const { token, user } = response.data.data;
          
          // Store token in localStorage
          localStorage.setItem('focal_token', token);  
          console.log('✅ Token stored in localStorage:', token.substring(0, 20) + '...');
          
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: { user, token }
          });

          console.log('✅ Login successful, user:', user);
          toast.success(`Welcome back, ${user.firstName}!`);
          return { success: true, user };
        }
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });

      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // OTP Verification function
  const verifyOtp = async (otp) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const response = await api.post('/auth/verify-otp', {
        otp
      });

      if (response.data.status === 'success') {
        const { token, user } = response.data.data;
        
        // Store token in localStorage
        localStorage.setItem('focal_token', token);  
        console.log('✅ OTP verification successful, token stored:', token.substring(0, 20) + '...');
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user, token }
        });

        console.log('✅ OTP verification successful, user:', user);
        toast.success(`Welcome back, ${user.firstName}!`);
        return { success: true, user };
      } else {
        throw new Error(response.data.message || 'OTP verification failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'OTP verification failed';
      
      dispatch({
        type: AUTH_ACTIONS.SET_LOADING,
        payload: false
      });

      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const token = localStorage.getItem('focal_token');
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('focal_token');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      toast.info('Logged out successfully');
    }
  };

  // Register function (if needed)
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const response = await api.post('/auth/register', userData);

      if (response.data.status === 'success') {
        toast.success('Registration successful!');
        return { success: true, user: response.data.data.user };
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Get user profile
  const getUserProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data.data.user;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  };

  // Monitoring functions
  const startMonitoring = (classId, initialRate, courseInfo = null) => {
    const initialTime = new Date().toLocaleTimeString();
    dispatch({
      type: AUTH_ACTIONS.START_MONITORING,
      payload: {
        classId,
        initialRate,
        initialTime,
        courseInfo
      }
    });
  };

  const stopMonitoring = (finalStats) => {
    dispatch({
      type: AUTH_ACTIONS.STOP_MONITORING,
      payload: finalStats
    });
  };

  const updateAttentionData = (attentionRate) => {
    const time = new Date().toLocaleTimeString();
    dispatch({
      type: AUTH_ACTIONS.UPDATE_ATTENTION_DATA,
      payload: {
        attentionRate,
        time
      }
    });
  };

  const updateSessionStats = (sessionData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_SESSION_STATS,
      payload: sessionData
    });
  };

  const updateCourseInfo = (courseInfo) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_COURSE_INFO,
      payload: courseInfo
    });
  };

  const setSelectedCourse = (courseId) => {
    dispatch({
      type: AUTH_ACTIONS.SET_SELECTED_COURSE,
      payload: courseId
    });
  };

  const setSelectedSection = (sectionId) => {
    dispatch({
      type: AUTH_ACTIONS.SET_SELECTED_SECTION,
      payload: sectionId
    });
  };

  const value = {
    ...state,
    login,
    verifyOtp,
    logout,
    register,
    getUserProfile,
    api,
    startMonitoring,
    stopMonitoring,
    updateAttentionData,
    updateSessionStats,
    updateCourseInfo,
    setSelectedCourse,
    setSelectedSection
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
