import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import '../styles/InstructorDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Instructor Dashboard Component
 * 
 * This is the instructor dashboard page that shows comprehensive monitoring
 * and analytics for attention tracking in classes.
 * 
 * @returns {React.ReactNode} - The instructor dashboard component
 */
const InstructorDashboard = () => {
  const { 
    user, 
    api, 
    isMonitoring, 
    attentionRate, 
    currentSessionData, 
    chartData, 
    showChart,
    currentClassId,
    currentCourseInfo,
    selectedCourse,
    selectedSection,
    sessionStartTime,
    startMonitoring: contextStartMonitoring,
    stopMonitoring: contextStopMonitoring,
    updateCourseInfo,
    setSelectedCourse,
    setSelectedSection
  } = useAuth();
  
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString());
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    active_sessions: 0,
    avg_attention: 0,
    total_sessions: 0,
    topCourses: [],
    currentClasses: []
  });
  const [availableCourses, setAvailableCourses] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if user is an instructor
  useEffect(() => {
    if (user && user.userType !== 'instructor') {
      toast.error('Access denied. Dashboard is only available for instructors.');
      return;
    }
    
    if (user?.userType === 'instructor') {
      fetchDashboardData();
      fetchAvailableCourses();
    }
  }, [user]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
      setCurrentDate(new Date().toLocaleDateString());
      
      // Calculate elapsed time if monitoring is active
      if (isMonitoring && sessionStartTime) {
        const elapsed = Math.floor((new Date() - new Date(sessionStartTime)) / 1000);
        setElapsedTime(elapsed);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isMonitoring, sessionStartTime]);

  // Fetch sections when course selection changes
  useEffect(() => {
    if (selectedCourse) {
      fetchCourseSections(selectedCourse);
    } else {
      setAvailableSections([]);
      setSelectedSection(''); // This will reset the global state
    }
  }, [selectedCourse]);

  // Real-time monitoring is now handled globally in AuthContext

  // API Functions
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/instructor/stats');
      if (response.data.status === 'success') {
        setDashboardData({
          ...response.data.data,
          topCourses: response.data.data.topCourses || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      const response = await api.get('/instructor/courses');
      console.log('📚 Available courses response:', response.data);
      if (response.data.status === 'success') {
        setAvailableCourses(response.data.data);
        console.log('📚 Set available courses:', response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load available courses');
    }
  };

  const fetchCourseSections = async (courseId) => {
    if (!courseId) {
      setAvailableSections([]);
      return;
    }

    try {
      const response = await api.get(`/instructor/courses/${courseId}/sections`);
      console.log('📋 Course sections response:', response.data);
      if (response.data.status === 'success') {
        setAvailableSections(response.data.data);
        console.log('📋 Set available sections:', response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch course sections:', error);
      toast.error('Failed to load course sections');
      setAvailableSections([]);
    }
  };

  const handleCourseChange = (courseId) => {
    console.log('🎯 Course changed to:', courseId);
    console.log('🎯 Available courses:', availableCourses);
    setSelectedCourse(courseId);
    
    // Update course info immediately when course is selected
    if (courseId) {
      // Try different ways to find the course data with better matching
      let selectedCourseData = availableCourses?.find(course => course.course_id == courseId); // Use == for loose comparison
      
      // If not found, try with string comparison
      if (!selectedCourseData) {
        selectedCourseData = availableCourses?.find(course => String(course.course_id) === String(courseId));
      }
      
      // If still not found, try with number comparison
      if (!selectedCourseData) {
        selectedCourseData = availableCourses?.find(course => Number(course.course_id) === Number(courseId));
      }
      
      console.log('🎯 Selected course data:', selectedCourseData);
      
      if (selectedCourseData) {
        const courseInfo = {
          courseCode: selectedCourseData.course_code || 'Unknown Course',
          courseName: selectedCourseData.course_name || 'Unknown Course Name',
          sectionId: '' // Reset section when course changes
        };
        console.log('🎯 Updating course info:', courseInfo);
        updateCourseInfo(courseInfo);
      } else {
        console.log('❌ No course data found for courseId:', courseId);
      }
    } else {
      // Clear course info when no course is selected
      updateCourseInfo({
        courseCode: '',
        courseName: '',
        sectionId: ''
      });
    }
  };

  // fetchAttentionHistory is no longer needed - chart data is managed globally

  // Real-time attention fetching is now handled globally in AuthContext

  const startMonitoring = async () => {
    if (!selectedCourse) {
      toast.error('Please select a course');
      return;
    }

    if (!selectedSection) {
      toast.error('Please select a section');
      return;
    }

    // Check if already monitoring
    if (isMonitoring) {
      toast.info('Monitoring is already started!');
      return;
    }

    console.log('🎯 Starting monitoring for section:', selectedSection);
    try {
      const response = await api.post('/instructor/start-monitoring', {
        class_id: selectedSection
      });

      console.log('🎯 Start monitoring response:', response.data);
      if (response.data.status === 'success') {
        const initialRate = response.data.data.initial_attention_rate;
        
        // Find the selected course info with better matching logic
        console.log('🔍 Looking for course with ID:', selectedCourse, 'Type:', typeof selectedCourse);
        console.log('🔍 Available courses:', availableCourses);
        
        let selectedCourseData = availableCourses?.find(course => {
          console.log('🔍 Comparing:', course.course_id, '(', typeof course.course_id, ') with', selectedCourse, '(', typeof selectedCourse, ')');
          return course.course_id == selectedCourse; // Use == for loose comparison
        });
        
        if (!selectedCourseData) {
          // Try with string conversion
          selectedCourseData = availableCourses?.find(course => String(course.course_id) === String(selectedCourse));
        }
        
        if (!selectedCourseData) {
          // Try with number conversion
          selectedCourseData = availableCourses?.find(course => Number(course.course_id) === Number(selectedCourse));
        }
        
        console.log('🔍 Found course data:', selectedCourseData);
        
        const selectedSectionData = availableSections?.find(section => section.class_id == selectedSection);
        console.log('🔍 Found section data:', selectedSectionData);
        
        // Update course info in global context
        const courseInfo = {
          courseCode: selectedCourseData?.course_code || 'Unknown Course',
          courseName: selectedCourseData?.course_name || 'Unknown Course Name',
          sectionId: selectedSectionData?.class_id || selectedSection
        };
        console.log('🎯 Setting course info for monitoring:', courseInfo);
        updateCourseInfo(courseInfo);
        
        // Use context to start monitoring globally with course info
        console.log('🎯 Calling contextStartMonitoring with:', {
          classId: response.data.data.class_id,
          initialRate,
          courseInfo
        });
        contextStartMonitoring(response.data.data.class_id, initialRate, courseInfo);
        
        toast.success('Monitoring started successfully!');
      }
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      toast.error('Failed to start monitoring');
    }
  };

  const stopMonitoring = async () => {
    if (!isMonitoring) {
      toast.info('No active monitoring session to stop!');
      return;
    }

    console.log('🛑 Stopping monitoring for class:', currentClassId);
    try {
      const response = await api.post(`/instructor/stop-monitoring/${currentClassId}`);
      console.log('🛑 Stop monitoring response:', response.data);
      
      if (response.data.status === 'success') {
        // Use context to stop monitoring globally
        contextStopMonitoring({
          avgAttention: response.data.data.avgAttention,
          maxAttention: response.data.data.highestAttention,
          minAttention: response.data.data.lowestAttention,
          dataPoints: response.data.data.dataPoints,
          durationMinutes: response.data.data.durationMinutes
        });
        
        toast.success(`Monitoring stopped! Final Average: ${response.data.data.avgAttention}% | Duration: ${response.data.data.durationMinutes}min`);
        
        // Refresh dashboard data
        fetchDashboardData();
      } else {
        console.error('❌ Stop monitoring failed:', response.data);
        toast.error('Failed to stop monitoring');
      }
    } catch (error) {
      console.error('❌ Failed to stop monitoring:', error);
      toast.error('Failed to stop monitoring');
    }
  };

  // Show access denied message for non-instructors
  if (user && user.userType !== 'instructor') {
    return (
      <div className="page-content">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1>Access Denied</h1>
            <p>This dashboard is only available for instructors.</p>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard content (instructor-only)
  return (
    <div className="page-content">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h1>Welcome to FOCAL!</h1>
          <p>Hello, <strong>{user?.firstName || user?.username}</strong>!</p>
          <p>Instructor Dashboard</p>
        </div>

        
        {/* Dashboard Content */}
        <div className="dashboard-content">
            <div className="dashboard-cards">
              <div className="card">
                <h3>CURRENT ATTENTION</h3>
                <div className="stat">{isMonitoring ? attentionRate : (currentSessionData.avgAttention || 0)}%</div>
                <p className="card-text">{isMonitoring ? 'Live rate' : 'Session average'}</p>
              </div>
              
              <div className="card">
                <h3>SESSION STATS</h3>
                <div className="stat">
                  {currentSessionData.dataPoints > 0 ? (
                    <div style={{fontSize: '0.8em'}}>
                      <div>Avg: {Math.round(currentSessionData.avgAttention)}%</div>
                      <div>Max: {Math.round(currentSessionData.maxAttention)}%</div>
                      <div>Min: {Math.round(currentSessionData.minAttention)}%</div>
                      {isMonitoring && elapsedTime > 2700 && (
                        <div style={{color: '#FF9800', fontWeight: 'bold'}}>
                          ⚠️ Auto-stop in {Math.max(0, 50 - Math.floor(elapsedTime / 60))}min
                        </div>
                      )}
                    </div>
                  ) : (
                    'No data'
                  )}
                </div>
                <p className="card-text">{currentSessionData.dataPoints} points</p>
              </div>
              
              <div className="card">
                <h3>TOTAL SESSIONS</h3>
                <div className="stat">{loading ? '...' : (dashboardData.total_sessions || 0)}</div>
                <p className="card-text">This semester</p>
              </div>
            </div>
            
            <div className="control-panel">
                  <div className="card">
                    <h3>CLASS MONITORING CONTROL</h3>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="courseSelect">Select Course</label>
                        <select 
                          id="courseSelect" 
                          className="form-control"
                          value={selectedCourse}
                          onChange={(e) => handleCourseChange(e.target.value)}
                        >
                          <option value="">-- Select Course --</option>
                          {(availableCourses || []).map(course => (
                            <option key={course.course_id} value={course.course_id}>
                              {course.course_code} - {course.course_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="sectionSelect">Select Section</label>
                        <select 
                          id="sectionSelect" 
                          className="form-control"
                          value={selectedSection}
                          onChange={(e) => {
                            setSelectedSection(e.target.value);
                            
                            // Update section info immediately when section is selected
                            if (e.target.value) {
                              // Try different ways to find the course data (same as in handleCourseChange)
                              let selectedCourseData = availableCourses?.find(course => course.course_id == selectedCourse);
                              
                              if (!selectedCourseData) {
                                selectedCourseData = availableCourses?.find(course => String(course.course_id) === String(selectedCourse));
                              }
                              
                              if (!selectedCourseData) {
                                selectedCourseData = availableCourses?.find(course => Number(course.course_id) === Number(selectedCourse));
                              }
                              
                              const selectedSectionData = availableSections?.find(section => section.class_id == e.target.value);
                              
                              if (selectedCourseData) {
                                const courseInfo = {
                                  courseCode: selectedCourseData.course_code || 'Unknown Course',
                                  courseName: selectedCourseData.course_name || 'Unknown Course Name',
                                  sectionId: selectedSectionData?.class_id || e.target.value
                                };
                                updateCourseInfo(courseInfo);
                              }
                            } else {
                              // Clear section when no section is selected
                              let selectedCourseData = availableCourses?.find(course => course.course_id == selectedCourse);
                              
                              if (!selectedCourseData) {
                                selectedCourseData = availableCourses?.find(course => String(course.course_id) === String(selectedCourse));
                              }
                              
                              if (!selectedCourseData) {
                                selectedCourseData = availableCourses?.find(course => Number(course.course_id) === Number(selectedCourse));
                              }
                              
                              if (selectedCourseData) {
                                updateCourseInfo({
                                  courseCode: selectedCourseData.course_code || 'Unknown Course',
                                  courseName: selectedCourseData.course_name || 'Unknown Course Name',
                                  sectionId: ''
                                });
                              }
                            }
                          }}
                          disabled={!selectedCourse}
                        >
                          <option value="">-- Select Section --</option>
                          {availableSections?.map(section => (
                            <option key={section.class_id} value={section.class_id}>
                              Section {section.class_id}
                            </option>
                          )) || []}
                        </select>
                      </div>
                    </div>
                    
                    <div className="action-buttons">
                      <button 
                        className="btn btn-success" 
                        onClick={startMonitoring}
                        disabled={isMonitoring}
                      >
                        <i className="fas fa-play"></i> {isMonitoring ? 'Already Started' : 'Start Monitoring'}
                      </button>
                      <button 
                        className="btn btn-danger" 
                        onClick={stopMonitoring}
                        disabled={!isMonitoring}
                      >
                        <i className="fas fa-stop"></i> {!isMonitoring ? 'No Active Session' : 'Stop Monitoring'}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="attention-dashboard">
                  <div className="card">
                    <h3>REAL-TIME ATTENTION DASHBOARD</h3>
                    <p>Class: <span>{(currentCourseInfo.courseCode && currentCourseInfo.sectionId) ? `${currentCourseInfo.courseCode} - Section ${currentCourseInfo.sectionId}` : (currentCourseInfo.courseCode ? currentCourseInfo.courseCode : 'Not selected')}</span> | Date: <span>{currentDate}</span> | Time: <span>{currentTime}</span> {isMonitoring && <span>| Duration: <span style={{color: '#4CAF50', fontWeight: 'bold'}}>{Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}</span></span>}</p>
                    
                    <div className="attention-value">
                      <span>{attentionRate}</span>%
                    </div>
                    
                    <div className="progress-bar">
                      <div 
                        className="progress" 
                        style={{width: `${attentionRate}%`}}
                      ></div>
                    </div>
                    
                    <div className="chart-container" style={{height: '500px'}}>
                      {showChart ? (
                        <Line 
                          data={chartData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              title: {
                                display: true,
                                text: (currentCourseInfo.courseCode && currentCourseInfo.sectionId) 
                                  ? (isMonitoring 
                                    ? `Real-time Attention Monitoring - ${currentCourseInfo.courseCode} Section ${currentCourseInfo.sectionId}`
                                    : `Session Attention Data - ${currentCourseInfo.courseCode} Section ${currentCourseInfo.sectionId}`)
                                  : (currentCourseInfo.courseCode 
                                    ? (isMonitoring 
                                      ? `Real-time Attention Monitoring - ${currentCourseInfo.courseCode}`
                                      : `Session Attention Data - ${currentCourseInfo.courseCode}`)
                                    : (isMonitoring 
                                      ? 'Real-time Attention Monitoring'
                                      : 'Session Attention Data'))
                              },
                              legend: {
                                display: true,
                                position: 'top'
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                max: 100,
                                title: {
                                  display: true,
                                  text: 'Attention Rate (%)'
                                }
                              },
                              x: {
                                title: {
                                  display: true,
                                  text: 'Time'
                                }
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="chart-placeholder">
                          <i className="fas fa-chart-line"></i>
                          <p>Start monitoring to see real-time attention chart</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
          </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
