import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Users, Search, Download, Edit3, Trash2, BookOpen, UserPlus } from 'lucide-react';

const HodManageLecturers = () => {
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState(null);
  
  const hodUser = JSON.parse(localStorage.getItem('user'));
  const deptId = hodUser?.department_id;

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Assign Course State
  const [assigningLecturer, setAssigningLecturer] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lecRes, courseRes] = await Promise.all([
        axios.get(`/api/lecturers.php?department_id=${deptId}`),
        axios.get(`/api/courses.php?department_id=${deptId}`)
      ]);
      if (lecRes.data.success) setLecturers(lecRes.data.data);
      if (courseRes.data.success) setCourses(courseRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [deptId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const payload = {
        name,
        email,
        department_id: deptId
      };

      if (editingLecturer) {
        await axios.put('/api/lecturers.php', { id: editingLecturer.id, ...payload });
      } else {
        await axios.post('/api/lecturers.php', payload);
      }
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this lecturer? This will unassign them from any courses.')) {
      try {
        await axios.delete('/api/lecturers.php', { data: { id } });
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAssignCourse = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await axios.put('/api/courses.php', {
          id: selectedCourse,
          lecturer_id: assigningLecturer.id,
          action: 'assign_lecturer'
      });
      setIsAssignModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to assign course');
    }
  };

  const resetForm = () => {
    setEditingLecturer(null);
    setName('');
    setEmail('');
  };

  const openModal = (lecturer = null) => {
    if (lecturer) {
      setEditingLecturer(lecturer);
      setName(lecturer.name);
      setEmail(lecturer.email || '');
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const openAssignModal = (lecturer) => {
    setAssigningLecturer(lecturer);
    setSelectedCourse('');
    setIsAssignModalOpen(true);
  };

  const exportCSV = () => {
    if (lecturers.length === 0) return;
    const headers = ['Name', 'Email', 'Department', 'Courses Assigned', 'Total Invigilations'];
    const rows = lecturers.map(l => [
      `"${l.name}"`, 
      `"${l.email || ''}"`, 
      `"${l.department_name}"`, 
      l.total_courses || 0,
      l.total_invigilations || 0
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Lecturers_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLecturers = useMemo(() => {
    if (!searchTerm) return lecturers;
    return lecturers.filter(l => 
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (l.email && l.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [lecturers, searchTerm]);

  return (
    <div className="fade-in" style={{padding: '20px', color: '#2c3e50'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px'}}>
        <div>
          <h1 style={{fontSize: '1.8rem', color: '#1a252f', margin: '0 0 5px 0', fontWeight: 700}}>Department Lecturers</h1>
          <p style={{color: '#64748b', margin: 0}}>Manage lecturers, view invigilation load, and assign courses.</p>
        </div>
        <div style={{display: 'flex', gap: '10px'}}>
          <button className="btn" onClick={exportCSV} style={{background: 'white', border: '1px solid #cbd5e1', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#475569'}}>
            <Download size={18} /> Export Report
          </button>
          <button className="btn-premium primary" onClick={() => openModal()} style={{background: '#0f172a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold'}}>
            <UserPlus size={18} /> Add Lecturer
          </button>
        </div>
      </div>

      <div className="premium-card" style={{background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', overflow: 'hidden'}}>
        <div className="card-toolbar" style={{padding: '20px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc'}}>
          <div className="search-wrapper" style={{position: 'relative', maxWidth: '400px'}}>
            <Search size={18} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8'}} />
            <input 
              type="text" 
              placeholder="Search lecturers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box'}}
            />
          </div>
        </div>
        
        {loading ? (
          <div style={{padding: '40px', textAlign: 'center'}}>Loading...</div>
        ) : (
          <div className="table-responsive">
            <table className="premium-table" style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Courses Assigned</th>
                  <th style={thStyle}>Invigilation Load</th>
                  <th style={{...thStyle, textAlign: 'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLecturers.length > 0 ? filteredLecturers.map(l => (
                  <tr key={l.id} style={{borderBottom: '1px solid #f1f5f9'}}>
                    <td style={tdStyle}>
                      <span style={{fontWeight: 700, color: '#0f172a'}}>{l.name}</span>
                    </td>
                    <td style={tdStyle}><span style={{color: '#475569'}}>{l.email || 'N/A'}</span></td>
                    <td style={tdStyle}>
                      <span style={{background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600}}>
                        {l.total_courses || 0} Courses
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600}}>
                        {l.total_invigilations || 0} Slots
                      </span>
                    </td>
                    <td style={{...tdStyle, textAlign: 'right'}}>
                      <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                        <button onClick={() => openAssignModal(l)} style={actionBtnStyle} title="Assign Course"><BookOpen size={16} color="#8b5cf6" /></button>
                        <button onClick={() => openModal(l)} style={actionBtnStyle} title="Edit"><Edit3 size={16} color="#64748b" /></button>
                        <button onClick={() => handleDelete(l.id)} style={actionBtnStyle} title="Delete"><Trash2 size={16} color="#ef4444" /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" style={{textAlign: 'center', padding: '50px', color: '#64748b'}}>
                      <Users size={40} style={{opacity: 0.2, marginBottom: '10px'}} />
                      <p>No lecturers found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle} className="slideUp">
            <div style={modalHeaderStyle}>
              <h2 style={{margin: 0, fontSize: '1.25rem'}}>{editingLecturer ? 'Edit Lecturer' : 'Add Lecturer'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8'}}>×</button>
            </div>
            
            <form onSubmit={handleSave} style={{padding: '25px'}}>
              <div style={{display: 'grid', gap: '20px'}}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} placeholder="Dr. John Doe" />
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="john@example.com" />
                </div>
              </div>

              <div style={{marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{padding: '10px 20px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600}}>Cancel</button>
                <button type="submit" style={{padding: '10px 20px', background: '#0f172a', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600}}>Save Lecturer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAssignModalOpen && assigningLecturer && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle} className="slideUp">
            <div style={modalHeaderStyle}>
              <h2 style={{margin: 0, fontSize: '1.25rem'}}>Assign Course to {assigningLecturer.name}</h2>
              <button onClick={() => setIsAssignModalOpen(false)} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8'}}>×</button>
            </div>
            
            <form onSubmit={handleAssignCourse} style={{padding: '25px'}}>
              <div>
                <label style={labelStyle}>Select Course</label>
                <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} required style={inputStyle}>
                  <option value="">-- Choose a course --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.course_code} - {c.course_name}</option>
                  ))}
                </select>
              </div>

              <div style={{marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
                <button type="button" onClick={() => setIsAssignModalOpen(false)} style={{padding: '10px 20px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600}}>Cancel</button>
                <button type="submit" style={{padding: '10px 20px', background: '#8b5cf6', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600}}>Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

const thStyle = { padding: '15px 20px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #f1f5f9' };
const tdStyle = { padding: '15px 20px', verticalAlign: 'middle' };
const actionBtnStyle = { width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'white' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalStyle = { background: 'white', width: '100%', maxWidth: '500px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden' };
const modalHeaderStyle = { padding: '20px 25px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbfc' };
const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' };

export default HodManageLecturers;
