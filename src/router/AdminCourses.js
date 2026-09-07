import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const AdminCourses = () => {
  const { user, api } = useAuth();
  const [courses, setCourses] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.userType !== 'admin') { return; }
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/courses').catch(() => ({ data: { data: [] } }));
        setCourses(res.data.data || []);
      } finally { setLoading(false); }
    };
    load();
  }, [user]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return courses.filter(c => (
      (c.course_code || '').toLowerCase().includes(q) ||
      (c.course_name || '').toLowerCase().includes(q)
    )).slice(0,8);
  }, [query, courses]);

  const pick = (c) => { setSelected(c); setQuery(`${c.course_code} - ${c.course_name}`); };

  if (user && user.userType !== 'admin') {
    return (<div className="page-content"><div className="dashboard-container"><h2>Access Denied</h2></div></div>);
  }

  return (
    <div className="page-content">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Courses</h1>
          <p>Search and view course information</p>
        </div>

        <div className="card">
          <h3>Search</h3>
          <input className="form-control" placeholder="Search by code or name" value={query} onChange={(e)=>{ setQuery(e.target.value); setSelected(null); }} />
          {query && suggestions.length > 0 && (
            <div className="autocomplete-list">
              {suggestions.map(c => (
                <div key={c.course_id} className="autocomplete-item" onClick={()=>pick(c)}>
                  {(c.course_code)} - {(c.course_name)}
                </div>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <h3>Course Info</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <div><strong>Code:</strong> {selected.course_code}</div>
              <div><strong>Name:</strong> {selected.course_name}</div>
              <div><strong>Instructor:</strong> {selected.instructor_name || '—'}</div>
              <div><strong>Sections:</strong> {selected.sections_count ?? '—'}</div>
              <div><strong>Average Attention:</strong> {selected.avgAttention != null ? `${Math.round(selected.avgAttention)}%` : '—'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCourses;


