const { supabase } = require('../config/database');

/**
 * Instructor Dashboard Controller
 * Handles all instructor dashboard-related API endpoints
 */

/**
 * Get instructor statistics
 */
const getInstructorStats = async (req, res) => {
  try {
    const instructorId = req.user.id;

    // Get active sessions count (sessions with attention data in the last 6 hours)
    // First get class IDs for this instructor
    const { data: instructorClasses, error: classesError } = await supabase
      .from('classes_section')
      .select('class_id')
      .eq('instructor_id', instructorId);

    if (classesError) throw classesError;

    let activeSessions = [];
    if (instructorClasses && instructorClasses.length > 0) {
      const classIds = instructorClasses.map(cls => cls.class_id);
      const { data: activeSessionsData, error: activeSessionsError } = await supabase
        .from('attention_temp')
        .select('class_id')
        .in('class_id', classIds)
        .gte('recorded_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString());
      
      if (activeSessionsError) throw activeSessionsError;
      activeSessions = activeSessionsData || [];
    }

    // Get average attention across all finalized sessions
    const { data: avgAttention, error: avgAttentionError } = await supabase
      .from('instructor_final')
      .select('avg_attention')
      .eq('instructor_id', instructorId);

    if (avgAttentionError) throw avgAttentionError;

    // Get total sessions count
    const { data: totalSessions, error: totalSessionsError } = await supabase
      .from('instructor_final')
      .select('performance_id')
      .eq('instructor_id', instructorId);

    if (totalSessionsError) throw totalSessionsError;

    // Calculate average attention
    let avgAttentionRate = 0;
    if (avgAttention && avgAttention.length > 0) {
      const totalRate = avgAttention.reduce((sum, record) => sum + parseFloat(record.avg_attention), 0);
      avgAttentionRate = Math.round(totalRate / avgAttention.length);
    }

    res.json({
      status: 'success',
      data: {
        active_sessions: activeSessions ? activeSessions.length : 0,
        avg_attention: avgAttentionRate,
        total_sessions: totalSessions ? totalSessions.length : 0
      }
    });

  } catch (error) {
    console.error('Error fetching instructor stats:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch statistics' });
  }
};

/**
 * Get real-time attention data for a specific class
 */
const getRealTimeAttention = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;

    console.log('📈 Real-time attention request:', { classId, userId });

    // Verify the user has access to this class
    const { data: classData, error: classError } = await supabase
      .from('classes_section')
      .select('instructor_id')
      .eq('class_id', classId)
      .single();

    if (classError || !classData) {
      return res.status(404).json({
        status: 'error',
        message: 'Class not found'
      });
    }

    if (classData.instructor_id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to this class'
      });
    }

    // Get recent attention data
    const { data: attentionData, error: attentionError } = await supabase
      .from('attention_temp')
      .select('attention_rate, recorded_at')
      .eq('class_id', classId)
      .order('recorded_at', { ascending: false })
      .limit(20);

    if (attentionError) throw attentionError;

    res.json({
      status: 'success',
      data: {
        classId,
        attentionData: attentionData || [],
        currentRate: attentionData && attentionData.length > 0 ? attentionData[0].attention_rate : 0
      }
    });

  } catch (error) {
    console.error('❌ Real-time attention error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch real-time attention data',
      error: error.message
    });
  }
};

/**
 * Start monitoring a class (create a new class session)
 */
const startMonitoring = async (req, res) => {
  try {
    const { class_id } = req.body;
    const instructorId = req.user.id;

    console.log('🎯 Start monitoring request:', { class_id, instructorId });

    // Verify the instructor owns this class
    const { data: classData, error: classError } = await supabase
      .from('classes_section')
      .select(`
        class_id,
        course_id,
        start_time,
        end_time,
        location,
        courses(course_code, course_name)
      `)
      .eq('class_id', class_id)
      .eq('instructor_id', instructorId)
      .single();

    if (classError) throw classError;
    if (!classData) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to this class'
      });
    }

    // Clear any existing attention data for this class
    await supabase
      .from('attention_temp')
      .delete()
      .eq('class_id', class_id);

    // Add initial attention data point
    const initialRate = 70 + Math.random() * 30; // Random between 70-100
    const roundedInitialRate = Math.round(initialRate * 10) / 10;
    
    await supabase
      .from('attention_temp')
      .insert({
        class_id: parseInt(class_id),
        attention_rate: roundedInitialRate,
        recorded_at: new Date().toISOString()
      });

    // Store active monitoring sessions (in production, use Redis or database)
    if (!global.activeMonitoringSessions) {
      global.activeMonitoringSessions = new Map();
    }

    // Store session start time for duration tracking
    if (!global.sessionStartTimes) {
      global.sessionStartTimes = new Map();
    }
    global.sessionStartTimes.set(parseInt(class_id), new Date());

    // Record start time for duration calculation
    const startTime = new Date();
    console.log(`⏰ Started monitoring at: ${startTime.toISOString()}`);

    // Start simulating attention data every 5 seconds
    const simulateAttentionData = async () => {
      const attentionRate = 60 + Math.random() * 40; // Random between 60-100
      
      try {
        const { error } = await supabase
          .from('attention_temp')
          .insert({
            class_id: parseInt(class_id),
            attention_rate: Math.round(attentionRate * 10) / 10,
            recorded_at: new Date().toISOString()
          });
        
        if (error) {
          console.error('Error inserting attention data:', error);
        } else {
          console.log(`📊 Added attention data: ${Math.round(attentionRate * 10) / 10}% for class ${class_id}`);
        }
      } catch (error) {
        console.error('Error in simulateAttentionData:', error);
      }
    };

    // Simulate data every 5 seconds
    const interval = setInterval(simulateAttentionData, 5000);
    
    // Store the interval ID and start time so we can stop it later
    global.activeMonitoringSessions.set(parseInt(class_id), {
      interval: interval,
      startTime: startTime
    });
    
    // Auto-stop after 50 minutes (in case stop monitoring is not called)
    setTimeout(async () => {
      if (global.activeMonitoringSessions.has(parseInt(class_id))) {
        console.log(`⏰ Auto-stopping monitoring for class ${class_id} after 50 minutes`);
        
        // Calculate duration
        const endTime = new Date();
        const durationMinutes = Math.max(1, Math.round((endTime - startTime) / (1000 * 60)));
        
        // Stop the interval
        const sessionData = global.activeMonitoringSessions.get(parseInt(class_id));
        clearInterval(sessionData.interval);
        global.activeMonitoringSessions.delete(parseInt(class_id));
        
        // Calculate final performance metrics from attention_temp
        const { data: attentionData, error: attentionError } = await supabase
          .from('attention_temp')
          .select('attention_rate')
          .eq('class_id', class_id);

        if (attentionError) {
          console.error('Error fetching attention data for auto-stop:', attentionError);
          return;
        }

        let avgAttention = 0;
        let highestAttention = 0;
        let lowestAttention = 100;
        let dataPoints = 0;

        if (attentionData && attentionData.length > 0) {
          const rates = attentionData.map(record => parseFloat(record.attention_rate));
          avgAttention = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
          highestAttention = Math.max(...rates);
          lowestAttention = Math.min(...rates);
          dataPoints = rates.length;
        }

        // Save final performance data to instructor_final with duration
        const { error: performanceError } = await supabase
          .from('instructor_final')
          .insert({
            instructor_id: instructorId,
            course_id: classData.course_id,
            class_id: parseInt(class_id),
            avg_attention: avgAttention,
            highest_attention: highestAttention,
            lowest_attention: lowestAttention,
            class_duration_minutes: durationMinutes
          });

        if (performanceError) {
          console.error('Error saving final data for auto-stop:', performanceError);
        } else {
          console.log(`📊 Auto-stopped and saved final data for class ${class_id}: avg=${Math.round(avgAttention)}%, duration=${durationMinutes}min, points=${dataPoints}`);
        }

        // Clear the temporary attention data
        await supabase
          .from('attention_temp')
          .delete()
          .eq('class_id', class_id);
      }
    }, 3000000); // 50 minutes (50 * 60 * 1000)

    res.json({
      status: 'success',
      data: {
        class_id: classData.class_id,
        initial_attention_rate: roundedInitialRate,
        class_info: {
          course_code: classData.courses.course_code,
          course_name: classData.courses.course_name,
          start_time: classData.start_time,
          end_time: classData.end_time,
          location: classData.location
        },
        message: 'Monitoring session started'
      }
    });

  } catch (error) {
    console.error('Error starting monitoring session:', error);
    res.status(500).json({ status: 'error', message: 'Failed to start monitoring session' });
  }
};

/**
 * Stop monitoring a class
 */
const stopMonitoring = async (req, res) => {
  try {
    const { classId } = req.params;
    const instructorId = req.user.id;

    console.log('🛑 Stop monitoring request:', { classId, instructorId });

    // Verify the user owns this class and get course_id
    const { data: classData, error: classError } = await supabase
      .from('classes_section')
      .select('instructor_id, course_id')
      .eq('class_id', classId)
      .single();

    if (classError || !classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    if (classData.instructor_id !== instructorId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this class'
      });
    }

    // Stop the monitoring interval and calculate duration
    let durationMinutes = 0;
    if (global.activeMonitoringSessions && global.activeMonitoringSessions.has(parseInt(classId))) {
      const sessionData = global.activeMonitoringSessions.get(parseInt(classId));
      clearInterval(sessionData.interval);
      
      // Calculate duration
      const endTime = new Date();
      durationMinutes = Math.max(1, Math.round((endTime - sessionData.startTime) / (1000 * 60)));
      console.log(`⏰ Class duration: ${durationMinutes} minutes`);
      
      global.activeMonitoringSessions.delete(parseInt(classId));
      console.log(`🛑 Stopped monitoring interval for class ${classId}`);
    }

    // Calculate final performance metrics from attention_temp
    const { data: attentionData, error: attentionError } = await supabase
      .from('attention_temp')
      .select('attention_rate')
      .eq('class_id', classId);

    if (attentionError) throw attentionError;

    let avgAttention = 0;
    let highestAttention = 0;
    let lowestAttention = 100;
    let dataPoints = 0;

    if (attentionData && attentionData.length > 0) {
      const rates = attentionData.map(record => parseFloat(record.attention_rate));
      avgAttention = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
      highestAttention = Math.max(...rates);
      lowestAttention = Math.min(...rates);
      dataPoints = rates.length;
    }

    // Save final performance data to instructor_final with duration
    const { error: performanceError } = await supabase
      .from('instructor_final')
      .insert({
        instructor_id: instructorId,
        course_id: classData.course_id,
        class_id: parseInt(classId),
        avg_attention: avgAttention,
        highest_attention: highestAttention,
        lowest_attention: lowestAttention,
        class_duration_minutes: durationMinutes
      });

    if (performanceError) throw performanceError;

    // Clear the temporary attention data
    await supabase
      .from('attention_temp')
      .delete()
      .eq('class_id', classId);

    console.log(`📊 Saved final data for class ${classId}: avg=${Math.round(avgAttention)}%, duration=${durationMinutes}min, points=${dataPoints}`);

    res.json({
      status: 'success',
      message: 'Monitoring stopped successfully',
      data: {
        classId,
        avgAttention: Math.round(avgAttention),
        highestAttention: Math.round(highestAttention),
        lowestAttention: Math.round(lowestAttention),
        dataPoints: dataPoints,
        durationMinutes: durationMinutes
      }
    });

  } catch (error) {
    console.error('❌ Stop monitoring error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to stop monitoring',
      error: error.message
    });
  }
};

/**
 * Get available courses for the instructor
 */
const getAvailableCourses = async (req, res) => {
  try {
    const instructorId = req.user.id;

    console.log('📚 Get available courses request:', { instructorId });

    // Get courses assigned to this instructor
    const { data: courses, error: coursesError } = await supabase
      .from('classes_section')
      .select(`
        course_id,
        courses (
          course_id,
          course_code,
          course_name,
          departments (
            department_code,
            department_name
          )
        )
      `)
      .eq('instructor_id', instructorId);

    if (coursesError) throw coursesError;

    // Get unique courses
    const uniqueCourses = courses.reduce((acc, classItem) => {
      const course = classItem.courses;
      if (!acc.find(c => c.course_id === course.course_id)) {
        acc.push({
          course_id: course.course_id,
          course_code: course.course_code,
          course_name: course.course_name,
          department: course.departments
        });
      }
      return acc;
    }, []);

    res.json({
      success: true,
      data: uniqueCourses
    });

  } catch (error) {
    console.error('❌ Get available courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available courses',
      error: error.message
    });
  }
};

/**
 * Get instructor profile
 */
const getInstructorProfile = async (req, res) => {
  try {
    const instructorId = req.user.id;

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        email,
        first_name,
        last_name,
        last_login,
        departments(department_name)
      `)
      .eq('id', instructorId)
      .single();

    if (error) throw error;
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    res.json({
      status: 'success',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        department_name: user.departments?.department_name || null,
        last_login: user.last_login
      }
    });
  } catch (error) {
    console.error('Error fetching instructor profile:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch profile' });
  }
};

/**
 * Get instructor's courses
 */
const getInstructorCourses = async (req, res) => {
  try {
    const instructorId = req.user.id;
    console.log('📚 Getting courses for instructor:', instructorId);

    // First, get the course IDs that this instructor teaches
    const { data: classSections, error: classError } = await supabase
      .from('classes_section')
      .select('course_id')
      .eq('instructor_id', instructorId);

    if (classError) throw classError;
    console.log('📚 Class sections found:', classSections);

    if (!classSections || classSections.length === 0) {
      console.log('📚 No class sections found for instructor');
      return res.json({
        status: 'success',
        data: []
      });
    }

    // Extract unique course IDs
    const courseIds = [...new Set(classSections.map(section => section.course_id))];
    console.log('📚 Unique course IDs:', courseIds);

    // Then get the course details
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        course_id,
        course_code,
        course_name,
        description
      `)
      .in('course_id', courseIds)
      .order('course_code');

    if (coursesError) throw coursesError;
    console.log('📚 Courses found:', courses);

    res.json({
      status: 'success',
      data: courses || []
    });
  } catch (error) {
    console.error('Error fetching instructor courses:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch courses' });
  }
};

/**
 * Get sections for a course
 */
const getCourseSections = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = req.user.id;

    const { data: sections, error } = await supabase
      .from('classes_section')
      .select(`
        class_id,
        course_id,
        start_time,
        end_time,
        location,
        courses(course_code, course_name)
      `)
      .eq('instructor_id', instructorId)
      .eq('course_id', courseId)
      .order('start_time', { ascending: false });

    if (error) throw error;

    res.json({
      status: 'success',
      data: sections || []
    });
  } catch (error) {
    console.error('Error fetching course sections:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch course sections' });
  }
};

/**
 * Get top performing courses
 */
const getTopCourses = async (req, res) => {
  try {
    const instructorId = req.user.id;

    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        course_id,
        course_code,
        course_name,
        description,
        instructor_final!inner(
          avg_attention,
          performance_id
        )
      `)
      .eq('instructor_final.instructor_id', instructorId)
      .order('instructor_final.avg_attention', { ascending: false })
      .limit(6);

    if (error) throw error;

    // Process the data to calculate averages and counts
    const processedCourses = courses.map(course => {
      const performances = course.instructor_final;
      const avgAttention = performances.reduce((sum, perf) => sum + parseFloat(perf.avg_attention), 0) / performances.length;
      
      return {
        course_id: course.course_id,
        course_code: course.course_code,
        course_name: course.course_name,
        description: course.description,
        avg_attention: Math.round(avgAttention || 0),
        session_count: performances.length
      };
    });

    res.json({
      status: 'success',
      data: processedCourses
    });
  } catch (error) {
    console.error('Error fetching top courses:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch top courses' });
  }
};

/**
 * Get session history for instructor
 */
const getSessionHistory = async (req, res) => {
  try {
    const instructorId = req.user.id;

    const { data: sessions, error } = await supabase
      .from('instructor_final')
      .select(`
        performance_id,
        avg_attention,
        highest_attention,
        lowest_attention,
        created_at,
        courses(course_code, course_name),
        classes_section(start_time, end_time)
      `)
      .eq('instructor_id', instructorId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    res.json({
      status: 'success',
      data: sessions || []
    });
  } catch (error) {
    console.error('Error fetching session history:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch session history' });
  }
};

/**
 * Get current user
 */
const getCurrentUser = async (req, res) => {
  try {
    const instructorId = req.user.id;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, user_type, first_name, last_name, last_login')
      .eq('id', instructorId)
      .single();

    if (error) throw error;
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    res.json({ status: 'success', data: { user } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to get user' });
  }
};

/**
 * Debug endpoint to check database data
 */
const debugDatabase = async (req, res) => {
  try {
    const instructorId = req.user.id;
    
    // Check classes_section table
    const { data: classSections, error: classError } = await supabase
      .from('classes_section')
      .select('*')
      .eq('instructor_id', instructorId);
    
    // Check courses table
    const { data: allCourses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(10);
    
    // Check users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', instructorId)
      .single();
    
    res.json({
      status: 'success',
      data: {
        instructor: user,
        classSections: classSections || [],
        allCourses: allCourses || [],
        errors: {
          classError: classError?.message,
          coursesError: coursesError?.message,
          userError: userError?.message
        }
      }
    });
  } catch (error) {
    console.error('Debug database error:', error);
    res.status(500).json({ status: 'error', message: 'Debug failed', error: error.message });
  }
};

module.exports = {
  getInstructorStats,
  getInstructorProfile,
  getInstructorCourses,
  getCourseSections,
  getTopCourses,
  getSessionHistory,
  getCurrentUser,
  getRealTimeAttention,
  startMonitoring,
  stopMonitoring,
  getAvailableCourses,
  debugDatabase
};
