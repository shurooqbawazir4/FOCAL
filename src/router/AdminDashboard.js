import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import '../styles/InstructorDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const { user, api } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ instructors: 0, courses: 0, classes: 0, avgAttention: 0 });
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSectionIds, setSelectedSectionIds] = useState([]); // empty = all
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [generated, setGenerated] = useState(false);
  const [chartSeries, setChartSeries] = useState([]); // [{ label, data, labels }]

  useEffect(() => {
    if (user && user.userType !== 'admin') {
      toast.error('Access denied. Admins only.');
      return;
    }
    const init = async () => {
      try {
        setLoading(true);
        const [s, c] = await Promise.all([
          api.get('/admin/stats').catch(() => ({ data: { data: { instructors: 0, courses: 0, classes: 0, avgAttention: 0 } } })),
          api.get('/admin/courses').catch(() => ({ data: { data: [] } }))
        ]);
        setStats(s.data.data || stats);
        setCourses(c.data.data || []);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  const fetchSections = async (courseId) => {
    if (!courseId) { setSections([]); return; }
    try {
      const res = await api.get(`/admin/courses/${courseId}/sections`).catch(() => ({ data: { data: [] } }));
      setSections(res.data.data || []);
    } catch {
      setSections([]);
    }
  };

  const onCourseChange = (courseId) => {
    setSelectedCourseId(courseId);
    setSelectedSectionIds([]);
    fetchSections(courseId);
  };

  const canGenerate = selectedCourseId && dateFrom && dateTo;

  const generate = async () => {
    if (!canGenerate) { toast.error('Please select course and date range.'); return; }
    try {
      setLoading(true);
      const params = {
        sectionIds: selectedSectionIds.length ? selectedSectionIds : sections.map(s => s.class_id),
        from: dateFrom,
        to: dateTo
      };
      const res = await api.post(`/admin/attention/aggregate/${selectedCourseId}`,[params]).catch(() => ({ data: { data: mockAggregate(params) } }));
      setChartSeries(res.data.data || []);
      setGenerated(true);
    } catch (e) {
      toast.error('Failed to generate chart');
    } finally {
      setLoading(false);
    }
  };

  // Fallback generator if backend not ready
  const mockAggregate = (params) => {
    const labels = ['Day 1','Day 2','Day 3','Day 4','Day 5','Day 6','Day 7'];
    return (params.sectionIds || ['A']).map((sid, idx) => ({
      label: `Section ${sid}`,
      labels,
      data: labels.map((_, i) => 70 + ((i * 5 + idx * 7) % 25))
    }));
  };

  const bestCoursesBarData = useMemo(() => {
    const top = [...courses]
      .filter(c => typeof c.avgAttention === 'number')
      .sort((a,b) => b.avgAttention - a.avgAttention)
      .slice(0,5);
    return {
      labels: top.map(t => `${t.course_code || t.code || 'CRS'} ${t.course_name || t.name || ''}`.trim()),
      datasets: [{
        label: 'Average Attention %',
        data: top.map(t => Math.round(t.avgAttention)),
        backgroundColor: 'rgba(54, 162, 235, 0.6)'
      }]
    };
  }, [courses]);

  const comparisonBarData = useMemo(() => {
    const labels = chartSeries[0]?.labels || [];
    return {
      labels,
      datasets: chartSeries.map((s, i) => ({
        label: s.label,
        data: s.data,
        backgroundColor: `hsla(${(i*90)%360},70%,55%,0.7)`
      }))
    };
  }, [chartSeries]);

  const singleLineData = useMemo(() => {
    const s = chartSeries[0];
    return s ? {
      labels: s.labels,
      datasets: [{
        label: s.label,
        data: s.data,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)'
      }]
    } : { labels: [], datasets: [] };
  }, [chartSeries]);


  if (user && user.userType !== 'admin') {
    return (
      <div className="page-content"><div className="dashboard-container"><h2>Access Denied</h2></div></div>
    );
  }

  return (
    <div className="page-content">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Department overview</p>
        </div>

        <div className="dashboard-cards">
          <div className="card"><h3>INSTRUCTORS</h3><div className="stat">{loading ? '...' : stats.instructors}</div></div>
          <div className="card"><h3>COURSES</h3><div className="stat">{loading ? '...' : stats.courses}</div></div>
          <div className="card"><h3>CLASSES</h3><div className="stat">{loading ? '...' : stats.classes}</div></div>
          <div className="card"><h3>AVG. ATTENTION</h3><div className="stat">{loading ? '...' : Math.round(stats.avgAttention)}%</div></div>
        </div>

        <div className="card" style={{ marginTop: '1rem' }}>
          <h3>Best Performing Courses</h3>
          <div style={{ height: 300 }}>
            <Bar data={bestCoursesBarData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="card" style={{ marginTop: '1rem' }}>
          <h3>Filters</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Select Course</label>
              <select className="form-control" value={selectedCourseId} onChange={(e)=>onCourseChange(e.target.value)}>
                <option value="">-- Select Course --</option>
                {(courses || []).map(c => (
                  <option key={c.course_id || c.id} value={c.course_id || c.id}>{(c.course_code || c.code)} - {(c.course_name || c.name)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Select Sections</label>
              <select className="form-control" multiple value={selectedSectionIds} onChange={(e)=> setSelectedSectionIds(Array.from(e.target.selectedOptions).map(o=>o.value))} disabled={!selectedCourseId}>
                {sections.map(s => (
                  <option key={s.class_id} value={s.class_id}>{`Section ${s.class_id}`}</option>
                ))}
              </select>
              <small>Leave empty to include all sections</small>
            </div>
            <div className="form-group">
              <label>From</label>
              <input type="date" className="form-control" value={dateFrom} onChange={(e)=>setDateFrom(e.target.value)} />
            </div>
            <div className="form-group">
              <label>To</label>
              <input type="date" className="form-control" value={dateTo} onChange={(e)=>setDateTo(e.target.value)} />
            </div>
          </div>
          <div className="action-buttons">
            <button className="btn btn-primary" onClick={generate} disabled={!canGenerate || loading}>Generate</button>
          </div>
        </div>

        {generated && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <h3>Attention Analytics</h3>
            <div style={{ height: 380 }}>
              {chartSeries.length <= 1 ? (
                <Line data={singleLineData} options={{ responsive:true, maintainAspectRatio:false }} />
              ) : (
                <Bar data={comparisonBarData} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'top' } } }} />
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;



