import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';

const ManageGeneralCourses = () => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const fileInputRef = useRef(null);
  
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [semester, setSemester] = useState('1');
  const [level, setLevel] = useState('100');
  const [creditUnit, setCreditUnit] = useState('2');
  const [duration, setDuration] = useState('150');
  const [capacity, setCapacity] = useState('0');
  const [examFormat, setExamFormat] = useState('Written');
  const [programmes, setProgrammes] = useState('');
  const [selectedDepts, setSelectedDepts] = useState([]);

  const fetchData = async () => {
    try {
      const [crsRes, deptRes] = await Promise.all([
        axios.get('/api/general_courses.php'),
        axios.get('/api/departments.php')
      ]);
      if (crsRes.data.success) setCourses(crsRes.data.data);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
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
    if (!courseCode.trim() || !courseName.trim()) return;

    try {
      const payload = {
        course_code: courseCode.toUpperCase(),
        course_name: courseName,
        semester: semester,
        level: level,
        credit_unit: creditUnit,
        duration: duration,
        student_capacity: capacity,
        exam_format: examFormat,
        programmes: programmes,
        department_ids: selectedDepts
      };

      if (editingCourse) {
        await axios.put('/api/general_courses.php', { id: editingCourse.id, ...payload });
      } else {
        await axios.post('/api/general_courses.php', payload);
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
      await axios.put('/api/general_courses.php', { id: crs.id, is_active: !crs.is_active });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this general course?')) {
      try {
        await axios.delete('/api/general_courses.php', { data: { id } });
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const rows = text.split(/\r?\n/);
        const importedCourses = [];
        
        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].split(',');
          if (cols.length >= 2 && cols[0].trim()) {
            importedCourses.push({
              course_code: cols[0].replace(/['"]/g, '').trim(),
              course_name: cols[1].replace(/['"]/g, '').trim(),
              credit_unit: cols[2] ? parseInt(cols[2].trim()) : 2,
              semester: cols[3] ? parseInt(cols[3].trim()) : 1,
              level: cols[4] ? cols[4].trim() : '100',
              duration: cols[5] ? parseInt(cols[5].trim()) : 150,
              student_capacity: cols[6] ? parseInt(cols[6].trim()) : 0,
              exam_format: cols[7] ? cols[7].trim() : 'Written',
              programmes: cols[8] ? cols[8].trim() : ''
            });
          }
        }

        if (importedCourses.length === 0) {
          alert('No valid courses found. Check CSV format.');
          return;
        }

        setLoading(true);
        const res = await axios.post('/api/general_courses.php', { bulk: true, courses: importedCourses });
        if (res.data.success) {
          alert(res.data.message);
          setIsImportModalOpen(false);
          fetchData();
        } else {
          alert(res.data.message);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        alert('Failed to process CSV file.');
        setLoading(false);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleDeptToggle = (deptId) => {
    setSelectedDepts(prev => 
      prev.includes(deptId.toString()) 
        ? prev.filter(id => id !== deptId.toString())
        : [...prev, deptId.toString()]
    );
  };

  const resetForm = () => {
    setEditingCourse(null);
    setCourseCode('');
    setCourseName('');
    setSemester('1');
    setLevel('100');
    setCreditUnit('2');
    setDuration('150');
    setCapacity('0');
    setExamFormat('Written');
    setProgrammes('');
    setSelectedDepts([]);
  };

  const openModal = (crs = null) => {
    if (crs) {
      setEditingCourse(crs);
      setCourseCode(crs.course_code);
      setCourseName(crs.course_name);
      setSemester(crs.semester || '1');
      setLevel(crs.level || '100');
      setCreditUnit(crs.credit_unit || '2');
      setDuration(crs.duration || '150');
      setCapacity(crs.student_capacity || '0');
      setExamFormat(crs.exam_format || 'Written');
      setProgrammes(crs.programmes || '');
      setSelectedDepts(crs.department_ids || []);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const filteredCourses = useMemo(() => {
    if (!searchTerm) return courses;
    return courses.filter(c => 
      c.course_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.course_code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [courses, searchTerm]);

  const activeCount = courses.filter(c => c.is_active).length;
  const disabledCount = courses.length - activeCount;

  return (
    <div className="manage-general-courses">
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>General Course Management</h1>
          <p>Organize institution-wide courses (e.g. GST) that apply to all or specific departments.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setIsImportModalOpen(true)}>
            <span>⬆️</span> Bulk Import
          </button>
          <button className="btn btn-primary" onClick={() => openModal()}>
            <span>+</span> Add General Course
          </button>
        </div>
      </div>

      <div className="summary-cards" style={{ marginBottom: '30px' }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{background: '#f3e5f5', color: '#4a148c'}}>🌐</div>
          <div className="stat-info"><h3>Total Courses</h3><p className="stat-value">{courses.length}</p></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{background: '#e8f5e9', color: '#1b5e20'}}>✅</div>
          <div className="stat-info"><h3>Active</h3><p className="stat-value text-success">{activeCount}</p></div>
        </div>
        <div className="card stat-card alert-card">
          <div className="stat-icon" style={{background: '#f8d7da', color: '#721c24'}}>⚠️</div>
          <div className="stat-info"><h3>Disabled</h3><p className="stat-value text-danger">{disabledCount}</p></div>
        </div>
      </div>

      <div className="card dashboard-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>General Course Directory</h2>
          <input 
            type="text" 
            placeholder="Search code or name..." 
            className="form-control"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '280px', padding: '8px 15px', borderRadius: '20px', border: '1px solid #ddd' }}
          />
        </div>
        
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading general courses...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{borderBottom: '2px solid #eee', background: '#f8f9fa'}}>
                  <th style={{padding: '12px 15px', color: '#555'}}>Code</th>
                  <th style={{padding: '12px 15px', color: '#555'}}>Course Title</th>
                  <th style={{padding: '12px 15px', color: '#555', textAlign: 'center'}}>Level/Sem</th>
                  <th style={{padding: '12px 15px', color: '#555', textAlign: 'center'}}>Depts Enrolled</th>
                  <th style={{padding: '12px 15px', color: '#555', textAlign: 'center'}}>Format</th>
                  <th style={{padding: '12px 15px', color: '#555'}}>Status</th>
                  <th style={{padding: '12px 15px', color: '#555', textAlign: 'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.length > 0 ? filteredCourses.map(c => (
                  <tr key={c.id} style={{borderBottom: '1px solid #eee', transition: 'background 0.2s'}} onMouseOver={e => e.currentTarget.style.background='#fcfcfc'} onMouseOut={e => e.currentTarget.style.background='white'}>
                    <td style={{padding: '15px', fontWeight: 'bold', color: '#4a148c'}}>{c.course_code}</td>
                    <td style={{padding: '15px', fontWeight: '600', color: '#333'}}>
                      {c.course_name}
                      <div style={{fontSize: '0.75rem', color: '#888', marginTop: '4px'}}>
                        Cap: {c.student_capacity > 0 ? c.student_capacity : 'N/A'} | Dur: {c.duration} mins
                      </div>
                    </td>
                    <td style={{padding: '15px', textAlign: 'center'}}>{c.level} (S{c.semester})</td>
                    <td style={{padding: '15px', textAlign: 'center'}}>
                      <span style={{ background: '#e0f2f1', color: '#00695c', padding: '3px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        {c.department_ids ? c.department_ids.length : 0}
                      </span>
                    </td>
                    <td style={{padding: '15px', textAlign: 'center'}}>{c.exam_format}</td>
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
                      No general courses found.
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
          <div className="modal" style={{...modalStyles.modal, width: '700px'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#4a148c', fontSize: '1.4rem' }}>{editingCourse ? 'Edit General Course' : 'Add General Course'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888' }}>✖</button>
            </div>
            
            <form onSubmit={handleSave} style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '10px' }}>
              
              <div style={{ display: 'flex', gap: '15px', marginBottom: 15 }}>
                <div className="form-group" style={{flex: 1}}>
                  <label style={modalStyles.label}>Course Code</label>
                  <input type="text" className="form-control" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} required placeholder="e.g. GST101" style={modalStyles.input} />
                </div>
                <div className="form-group" style={{flex: 2}}>
                  <label style={modalStyles.label}>Course Title</label>
                  <input type="text" className="form-control" value={courseName} onChange={(e) => setCourseName(e.target.value)} required placeholder="e.g. Use of English" style={modalStyles.input} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginBottom: 15 }}>
                <div className="form-group" style={{flex: 1}}>
                  <label style={modalStyles.label}>Semester</label>
                  <select className="form-control" value={semester} onChange={(e) => setSemester(e.target.value)} style={modalStyles.input}>
                    <option value="1">First Semester</option>
                    <option value="2">Second Semester</option>
                  </select>
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label style={modalStyles.label}>Level</label>
                  <input type="text" className="form-control" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="e.g. ND1, 100" style={modalStyles.input} />
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label style={modalStyles.label}>Credits</label>
                  <input type="number" min="1" max="6" className="form-control" value={creditUnit} onChange={(e) => setCreditUnit(e.target.value)} required style={modalStyles.input} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginBottom: 15 }}>
                <div className="form-group" style={{flex: 1}}>
                  <label style={modalStyles.label}>Duration (Mins)</label>
                  <input type="number" min="30" className="form-control" value={duration} onChange={(e) => setDuration(e.target.value)} required style={modalStyles.input} />
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label style={modalStyles.label}>Student Capacity</label>
                  <input type="number" min="0" className="form-control" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="0 for unlimited" style={modalStyles.input} />
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label style={modalStyles.label}>Exam Format</label>
                  <select className="form-control" value={examFormat} onChange={(e) => setExamFormat(e.target.value)} style={modalStyles.input}>
                    <option value="Written">Written</option>
                    <option value="CBT">CBT</option>
                    <option value="Practical">Practical</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group" style={{marginBottom: 15}}>
                <label style={modalStyles.label}>Programmes (Optional)</label>
                <input type="text" className="form-control" value={programmes} onChange={(e) => setProgrammes(e.target.value)} placeholder="e.g. ND, HND, Degree" style={modalStyles.input} />
              </div>

              <div className="form-group" style={{marginBottom: 25}}>
                <label style={modalStyles.label}>Assign to Departments</label>
                <div style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '10px', maxHeight: '150px', overflowY: 'auto', background: '#fdfdfd' }}>
                  {departments.length > 0 ? departments.map(d => (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <input 
                        type="checkbox" 
                        id={`dept-${d.id}`} 
                        checked={selectedDepts.includes(d.id.toString())}
                        onChange={() => handleDeptToggle(d.id)}
                        style={{ marginRight: '10px', width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label htmlFor={`dept-${d.id}`} style={{ cursor: 'pointer', margin: 0, color: '#333' }}>
                        {d.name}
                      </label>
                    </div>
                  )) : (
                    <span style={{ color: '#888' }}>No departments found. Please add departments first.</span>
                  )}
                </div>
              </div>

              <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '15px'}}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{padding: '10px 20px'}}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{padding: '10px 20px', background: '#4a148c', borderColor: '#4a148c'}}>Save Configuration</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <div className="modal-overlay" style={modalStyles.overlay}>
          <div className="modal" style={{...modalStyles.modal, width: '450px'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#4a148c', fontSize: '1.4rem' }}>Bulk Import General Courses</h3>
              <button onClick={() => setIsImportModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888' }}>✖</button>
            </div>
            
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #4a148c' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>💡 CSV Format Guide</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#555', lineHeight: '1.5' }}>
                Create a <strong>.csv</strong> file with a header row. Your columns MUST be in this exact order:
              </p>
              <ol style={{ paddingLeft: '20px', margin: '0 0 10px 0', fontSize: '0.85rem', color: '#666' }}>
                <li>Course Code (e.g. GST101)</li>
                <li>Course Title (e.g. Use of English)</li>
                <li>Credit Unit (e.g. 2)</li>
                <li>Semester (1 or 2)</li>
                <li>Level (e.g. 100)</li>
                <li>Duration in Mins (e.g. 150)</li>
                <li>Capacity (0 for unlimited)</li>
                <li>Format (Written, CBT, Practical)</li>
                <li>Programmes</li>
              </ol>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              <input 
                type="file" 
                accept=".csv" 
                style={{ display: 'none' }} 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
              />
              <button 
                className="btn btn-primary" 
                onClick={() => fileInputRef.current.click()} 
                style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.1rem', background: '#4a148c', borderColor: '#4a148c' }}
              >
                <span style={{marginRight: '8px'}}>📂</span> Select CSV File
              </button>
            </div>
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
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
  },
  label: {
    display: 'block', marginBottom: '8px', fontWeight: '600', color: '#444'
  },
  input: {
    width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem'
  }
};

export default ManageGeneralCourses;
