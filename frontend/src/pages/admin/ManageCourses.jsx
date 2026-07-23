import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [semester, setSemester] = useState('1');
  const [level, setLevel] = useState('100');
  const [creditUnit, setCreditUnit] = useState('2');

  const fetchData = async () => {
    try {
      const [crsRes, deptRes] = await Promise.all([
        axios.get('/api/courses.php'),
        axios.get('/api/departments.php')
      ]);
      if (crsRes.data.success) setCourses(crsRes.data.data);
      if (deptRes.data.success) {
        setDepartments(deptRes.data.data.filter(d => d.is_active));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!courseCode.trim() || !courseName.trim() || !departmentId) return;

    try {
      const payload = {
        course_code: courseCode.toUpperCase(),
        course_name: courseName,
        department_id: departmentId,
        semester: semester,
        level: level,
        credit_unit: creditUnit
      };

      if (editingCourse) {
        await axios.put('/api/courses.php', { id: editingCourse.id, ...payload });
      } else {
        await axios.post('/api/courses.php', payload);
      }
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (crs) => {
    try {
      await axios.put('/api/courses.php', { id: crs.id, is_active: !crs.is_active });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await axios.delete('/api/courses.php', { data: { id } });
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const resetForm = () => {
    setEditingCourse(null);
    setCourseCode('');
    setCourseName('');
    setDepartmentId('');
    setSemester('1');
    setLevel('100');
    setCreditUnit('2');
  };

  const openModal = (crs = null) => {
    if (crs) {
      setEditingCourse(crs);
      setCourseCode(crs.course_code);
      setCourseName(crs.course_name);
      setDepartmentId(crs.department_id);
      setSemester(crs.semester || '1');
      setLevel(crs.level || '100');
      setCreditUnit(crs.credit_unit || '2');
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const filteredCourses = useMemo(() => {
    if (!searchTerm) return courses;
    return courses.filter(c => 
      c.course_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.department_name && c.department_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [courses, searchTerm]);

  const activeCount = courses.filter(c => c.is_active).length;
  const disabledCount = courses.length - activeCount;

  return (
    <div className="manage-courses">
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Course Management</h1>
          <p>Organize academic courses and map them to departments.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <span style={{marginRight: '5px'}}>+</span> Add New Course
        </button>
      </div>

      <div className="summary-cards" style={{ marginBottom: '30px' }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{background: '#e3f2fd', color: '#0d47a1'}}>📚</div>
          <div className="stat-info"><h3>Total Courses</h3><p className="stat-value">{courses.length}</p></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{background: '#e8f5e9', color: '#1b5e20'}}>✅</div>
          <div className="stat-info"><h3>Active Courses</h3><p className="stat-value text-success">{activeCount}</p></div>
        </div>
        <div className="card stat-card alert-card">
          <div className="stat-icon" style={{background: '#f8d7da', color: '#721c24'}}>⚠️</div>
          <div className="stat-info"><h3>Disabled</h3><p className="stat-value text-danger">{disabledCount}</p></div>
        </div>
      </div>

      <div className="card dashboard-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Course Directory</h2>
          <input 
            type="text" 
            placeholder="Search code, name, or department..." 
            className="form-control"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '280px', padding: '8px 15px', borderRadius: '20px', border: '1px solid #ddd' }}
          />
        </div>
        
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading courses...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{borderBottom: '2px solid #eee', background: '#f8f9fa'}}>
                  <th style={{padding: '12px 15px', color: '#555'}}>Code</th>
                  <th style={{padding: '12px 15px', color: '#555'}}>Course Title</th>
                  <th style={{padding: '12px 15px', color: '#555'}}>Department</th>
                  <th style={{padding: '12px 15px', color: '#555', textAlign: 'center'}}>Level</th>
                  <th style={{padding: '12px 15px', color: '#555', textAlign: 'center'}}>Credits</th>
                  <th style={{padding: '12px 15px', color: '#555'}}>Status</th>
                  <th style={{padding: '12px 15px', color: '#555', textAlign: 'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.length > 0 ? filteredCourses.map(c => (
                  <tr key={c.id} style={{borderBottom: '1px solid #eee', transition: 'background 0.2s'}} onMouseOver={e => e.currentTarget.style.background='#fcfcfc'} onMouseOut={e => e.currentTarget.style.background='white'}>
                    <td style={{padding: '15px', fontWeight: 'bold', color: '#0A5C36'}}>{c.course_code}</td>
                    <td style={{padding: '15px', fontWeight: '600', color: '#333'}}>{c.course_name}</td>
                    <td style={{padding: '15px', color: '#555'}}>{c.department_name || <span style={{color: '#aaa', fontStyle: 'italic'}}>Unassigned</span>}</td>
                    <td style={{padding: '15px', textAlign: 'center'}}>{c.level}L</td>
                    <td style={{padding: '15px', textAlign: 'center'}}>{c.credit_unit}</td>
                    <td style={{padding: '15px'}}>
                      <span style={{
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        background: c.is_active ? '#e8f5e9' : '#f8d7da',
                        color: c.is_active ? '#28a745' : '#dc3545'
                      }}>
                        {c.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{padding: '15px', textAlign: 'right'}}>
                      <button className="btn btn-secondary btn-sm" style={{marginRight: 8, padding: '5px 10px'}} onClick={() => openModal(c)} title="Edit">✏️ Edit</button>
                      <button 
                        className={`btn btn-sm ${c.is_active ? 'btn-danger' : 'btn-success'}`} 
                        style={{marginRight: 8, padding: '5px 10px'}}
                        onClick={() => handleToggleStatus(c)}
                        title={c.is_active ? "Disable" : "Enable"}
                      >
                        {c.is_active ? '🚫 Disable' : '✅ Enable'}
                      </button>
                      <button className="btn btn-sm" style={{background: '#dc3545', color: 'white', padding: '5px 10px'}} onClick={() => handleDelete(c.id)} title="Delete">🗑️ Delete</button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" style={{textAlign: 'center', padding: '40px', color: '#888'}}>
                      <div style={{fontSize: '2rem', marginBottom: '10px'}}>🔍</div>
                      No courses found. {searchTerm ? 'Try a different search term.' : 'Click Add New Course to create one.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={modalStyles.overlay}>
          <div className="modal" style={modalStyles.modal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#0A5C36', fontSize: '1.4rem' }}>{editingCourse ? 'Edit Course' : 'Add New Course'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888' }}>✖</button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="form-group" style={{marginBottom: 15, flex: 1}}>
                  <label style={modalStyles.label}>Course Code</label>
                  <input type="text" className="form-control" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} required placeholder="e.g. CSC101" style={modalStyles.input} />
                </div>
                <div className="form-group" style={{marginBottom: 15, flex: 2}}>
                  <label style={modalStyles.label}>Course Title</label>
                  <input type="text" className="form-control" value={courseName} onChange={(e) => setCourseName(e.target.value)} required placeholder="e.g. Intro to Computer Science" style={modalStyles.input} />
                </div>
              </div>

              <div className="form-group" style={{marginBottom: 15}}>
                <label style={modalStyles.label}>Department</label>
                <select className="form-control" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} required style={modalStyles.input}>
                  <option value="" disabled>Select a Department...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginBottom: 25 }}>
                <div className="form-group" style={{flex: 1}}>
                  <label style={modalStyles.label}>Semester</label>
                  <select className="form-control" value={semester} onChange={(e) => setSemester(e.target.value)} style={modalStyles.input}>
                    <option value="1">First Semester</option>
                    <option value="2">Second Semester</option>
                  </select>
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label style={modalStyles.label}>Level</label>
                  <select className="form-control" value={level} onChange={(e) => setLevel(e.target.value)} style={modalStyles.input}>
                    <option value="100">100 Level</option>
                    <option value="200">200 Level</option>
                    <option value="300">300 Level</option>
                    <option value="400">400 Level</option>
                    <option value="500">500 Level</option>
                    <option value="ND1">ND 1</option>
                    <option value="ND2">ND 2</option>
                    <option value="HND1">HND 1</option>
                    <option value="HND2">HND 2</option>
                  </select>
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label style={modalStyles.label}>Credits</label>
                  <input type="number" min="1" max="6" className="form-control" value={creditUnit} onChange={(e) => setCreditUnit(e.target.value)} required style={modalStyles.input} />
                </div>
              </div>

              <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{padding: '10px 20px'}}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{padding: '10px 20px'}}>Save Course</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    width: '600px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
  },
  label: {
    display: 'block', marginBottom: '8px', fontWeight: '600', color: '#444'
  },
  input: {
    width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem'
  }
};

export default ManageCourses;
