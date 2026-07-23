import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const ManageDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptName, setDeptName] = useState('');
  const [facultyId, setFacultyId] = useState('');

  const fetchData = async () => {
    try {
      const [deptRes, facRes] = await Promise.all([
        axios.get('/api/departments.php'),
        axios.get('/api/faculties.php')
      ]);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
      if (facRes.data.success) {
        // Only allow active faculties in the dropdown
        setFaculties(facRes.data.data.filter(f => f.is_active));
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
    if (!deptName.trim() || !facultyId) return;

    try {
      if (editingDept) {
        await axios.put('/api/departments.php', { id: editingDept.id, name: deptName, faculty_id: facultyId });
      } else {
        await axios.post('/api/departments.php', { name: deptName, faculty_id: facultyId });
      }
      setIsModalOpen(false);
      setDeptName('');
      setFacultyId('');
      setEditingDept(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (dept) => {
    try {
      await axios.put('/api/departments.php', { id: dept.id, is_active: !dept.is_active });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await axios.delete('/api/departments.php', { data: { id } });
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openModal = (dept = null) => {
    if (dept) {
      setEditingDept(dept);
      setDeptName(dept.name);
      setFacultyId(dept.faculty_id);
    } else {
      setEditingDept(null);
      setDeptName('');
      setFacultyId('');
    }
    setIsModalOpen(true);
  };

  const filteredDepts = useMemo(() => {
    if (!searchTerm) return departments;
    return departments.filter(d => 
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (d.faculty_name && d.faculty_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [departments, searchTerm]);

  const activeCount = departments.filter(d => d.is_active).length;
  const disabledCount = departments.length - activeCount;

  return (
    <div className="manage-departments">
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Department Management</h1>
          <p>Organize academic departments and assign them to faculties.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <span style={{marginRight: '5px'}}>+</span> Add New Department
        </button>
      </div>

      {/* Summary Widgets */}
      <div className="summary-cards" style={{ marginBottom: '30px' }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{background: '#fff3e0', color: '#e65100'}}>📁</div>
          <div className="stat-info"><h3>Total Departments</h3><p className="stat-value">{departments.length}</p></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{background: '#e8f5e9', color: '#1b5e20'}}>✅</div>
          <div className="stat-info"><h3>Active Departments</h3><p className="stat-value text-success">{activeCount}</p></div>
        </div>
        <div className="card stat-card alert-card">
          <div className="stat-icon" style={{background: '#f8d7da', color: '#721c24'}}>⚠️</div>
          <div className="stat-info"><h3>Disabled</h3><p className="stat-value text-danger">{disabledCount}</p></div>
        </div>
      </div>

      <div className="card dashboard-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Department Directory</h2>
          <input 
            type="text" 
            placeholder="Search departments or faculties..." 
            className="form-control"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '280px', padding: '8px 15px', borderRadius: '20px', border: '1px solid #ddd' }}
          />
        </div>
        
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading departments...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{borderBottom: '2px solid #eee', background: '#f8f9fa'}}>
                  <th style={{padding: '12px 15px', color: '#555'}}>ID</th>
                  <th style={{padding: '12px 15px', color: '#555'}}>Department Name</th>
                  <th style={{padding: '12px 15px', color: '#555'}}>Parent Faculty</th>
                  <th style={{padding: '12px 15px', color: '#555', textAlign: 'center'}}>Courses</th>
                  <th style={{padding: '12px 15px', color: '#555'}}>Status</th>
                  <th style={{padding: '12px 15px', color: '#555', textAlign: 'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepts.length > 0 ? filteredDepts.map(d => (
                  <tr key={d.id} style={{borderBottom: '1px solid #eee', transition: 'background 0.2s'}} onMouseOver={e => e.currentTarget.style.background='#fcfcfc'} onMouseOut={e => e.currentTarget.style.background='white'}>
                    <td style={{padding: '15px', color: '#777'}}>#{d.id}</td>
                    <td style={{padding: '15px', fontWeight: '600', color: '#333'}}>{d.name}</td>
                    <td style={{padding: '15px', color: '#555'}}>{d.faculty_name || <span style={{color: '#aaa', fontStyle: 'italic'}}>Unassigned</span>}</td>
                    <td style={{padding: '15px', textAlign: 'center'}}>
                      <span style={{ background: '#f0f0f0', padding: '3px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        {d.total_courses || 0}
                      </span>
                    </td>
                    <td style={{padding: '15px'}}>
                      <span style={{
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        background: d.is_active ? '#e8f5e9' : '#f8d7da',
                        color: d.is_active ? '#28a745' : '#dc3545'
                      }}>
                        {d.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{padding: '15px', textAlign: 'right'}}>
                      <button className="btn btn-secondary btn-sm" style={{marginRight: 8, padding: '5px 10px'}} onClick={() => openModal(d)} title="Edit">✏️ Edit</button>
                      <button 
                        className={`btn btn-sm ${d.is_active ? 'btn-danger' : 'btn-success'}`} 
                        style={{marginRight: 8, padding: '5px 10px'}}
                        onClick={() => handleToggleStatus(d)}
                        title={d.is_active ? "Disable" : "Enable"}
                      >
                        {d.is_active ? '🚫 Disable' : '✅ Enable'}
                      </button>
                      <button className="btn btn-sm" style={{background: '#dc3545', color: 'white', padding: '5px 10px'}} onClick={() => handleDelete(d.id)} title="Delete">🗑️ Delete</button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" style={{textAlign: 'center', padding: '40px', color: '#888'}}>
                      <div style={{fontSize: '2rem', marginBottom: '10px'}}>🔍</div>
                      No departments found. {searchTerm ? 'Try a different search term.' : 'Click Add New Department to create one.'}
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
              <h3 style={{ margin: 0, color: '#0A5C36', fontSize: '1.4rem' }}>{editingDept ? 'Edit Department' : 'Add New Department'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888' }}>✖</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group" style={{marginBottom: 15}}>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#444'}}>Department Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={deptName} 
                  onChange={(e) => setDeptName(e.target.value)} 
                  required 
                  placeholder="e.g. Computer Science"
                  style={{width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem'}}
                />
              </div>
              <div className="form-group" style={{marginBottom: 25}}>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#444'}}>Assign to Faculty</label>
                <select 
                  className="form-control" 
                  value={facultyId} 
                  onChange={(e) => setFacultyId(e.target.value)} 
                  required 
                  style={{width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem'}}
                >
                  <option value="" disabled>Select a Faculty...</option>
                  {faculties.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{padding: '10px 20px'}}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{padding: '10px 20px'}}>Save Department</button>
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
    width: '450px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
  }
};

export default ManageDepartments;
