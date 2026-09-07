const { supabase } = require('../config/database');

/**
 * Admin Controller
 * Aggregated data across the department for admin users.
 */

// GET /admin/stats
const getAdminStats = async (req, res) => {
  try {
    // Instructors count
    const { data: instructors, error: instrErr } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
      .eq('user_type', 'instructor');
    if (instrErr) throw instrErr;

    // Courses count
    const { data: courses, error: coursesErr } = await supabase
      .from('courses')
      .select('course_id', { count: 'exact' });
    if (coursesErr) throw coursesErr;

    // Classes count
    const { data: classes, error: classesErr } = await supabase
      .from('classes_section')
      .select('class_id', { count: 'exact' });
    if (classesErr) throw classesErr;

    // Average attention across department
    const { data: finals, error: finalsErr } = await supabase
      .from('instructor_final')
      .select('avg_attention');
    if (finalsErr) throw finalsErr;

    let avgAttention = 0;
    if (finals && finals.length) {
      const sum = finals.reduce((s, r) => s + Number(r.avg_attention || 0), 0);
      avgAttention = Math.round(sum / finals.length);
    }

    return res.json({
      status: 'success',
      data: {
        instructors: instructors?.length ?? 0,
        courses: courses?.length ?? 0,
        classes: classes?.length ?? 0,
        avgAttention
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to load stats' });
  }
};

// GET /admin/courses
const getCoursesWithPerformance = async (req, res) => {
  try {
    // Basic courses
    const { data: courses, error: cErr } = await supabase
      .from('courses')
      .select('course_id, course_code, course_name');
    if (cErr) throw cErr;

    // Average attention per course from instructor_final
    const { data: perf, error: pErr } = await supabase
      .from('instructor_final')
      .select('course_id, avg_attention');
    if (pErr) throw pErr;

    const courseIdToAgg = new Map();
    (perf || []).forEach(r => {
      const k = r.course_id;
      const arr = courseIdToAgg.get(k) || [];
      arr.push(Number(r.avg_attention || 0));
      courseIdToAgg.set(k, arr);
    });

    const withPerf = (courses || []).map(c => {
      const arr = courseIdToAgg.get(c.course_id) || [];
      const avgAttention = arr.length ? (arr.reduce((s,v)=>s+v,0)/arr.length) : null;
      return { ...c, avgAttention };
    });

    return res.json({ status: 'success', data: withPerf });
  } catch (error) {
    console.error('Admin courses error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to load courses' });
  }
};

// GET /admin/courses/:courseId/sections
const getCourseSections = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { data, error } = await supabase
      .from('classes_section')
      .select('class_id')
      .eq('course_id', courseId);
    if (error) throw error;
    return res.json({ status: 'success', data });
  } catch (error) {
    console.error('Admin sections error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to load sections' });
  }
};

// POST /admin/attention/aggregate/:courseId
// Body: [{ sectionIds: string[], from: dateISO, to: dateISO }]
const getAttentionAggregate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const body = Array.isArray(req.body) ? req.body[0] : (req.body || {});
    const { sectionIds = [], from, to } = body;

    if (!from || !to) {
      return res.status(400).json({ status: 'error', message: 'from/to required' });
    }

    const labels = ['Day 1','Day 2','Day 3','Day 4','Day 5','Day 6','Day 7'];
    const sectionList = sectionIds.length ? sectionIds : [];

    // For simplicity, compute averages per section over time buckets using instructor_final
    // If you have a daily table, replace this block with proper date grouping.
    const datasets = [];
    for (const sid of sectionList) {
      const { data, error } = await supabase
        .from('instructor_final')
        .select('avg_attention')
        .eq('course_id', courseId)
        .eq('class_id', sid)
        .gte('created_at', from)
        .lte('created_at', to);
      if (error) throw error;
      const values = (data || []).map(r => Number(r.avg_attention || 0));
      const avg = values.length ? Math.round(values.reduce((s,v)=>s+v,0)/values.length) : 0;
      datasets.push({ label: `Section ${sid}`, labels, data: labels.map(()=>avg) });
    }

    return res.json({ status: 'success', data: datasets });
  } catch (error) {
    console.error('Admin aggregate error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to load attention aggregate' });
  }
};

module.exports = {
  getAdminStats,
  getCoursesWithPerformance,
  getCourseSections,
  getAttentionAggregate
};


