import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const ManageFaculties = () => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [facultyName, setFacultyName] = useState('');

  const fetchFaculties = async () => {
    try {
      const res = await axios.get('/api/faculties.php');
      if (res.data.success) {
        setFaculties(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculties();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!facultyName.trim()) return;

    try {
      if (editingFaculty) {
        await axios.put('/api/faculties.php', { id: editingFaculty.id, name: facultyName });
      } else {
        await axios.post('/api/faculties.php', { name: facultyName });
      }
      setIsModalOpen(false);
      setFacultyName('');
      setEditingFaculty(null);
      fetchFaculties();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (faculty) => {
    try {
      await axios.put('/api/faculties.php', { id: faculty.id, is_active: !faculty.is_active });
      fetchFaculties();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this faculty?')) {
      try {
        await axios.delete('/api/faculties.php', { data: { id } });
        fetchFaculties();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openModal = (faculty = null) => {
    if (faculty) {
      setEditingFaculty(faculty);
      setFacultyName(faculty.name);
    } else {
      setEditingFaculty(null);
      setFacultyName('');
    }
    setIsModalOpen(true);
  };

  const filteredFaculties = useMemo(() => {
    if (!searchTerm) return faculties;
    return faculties.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [faculties, searchTerm]);

  const activeCount = faculties.filter(f => f.is_active).length;
  const disabledCount = faculties.length - activeCount;

  return (
    <div className="manage-faculties">
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Faculty Management</h1>
          <p>Add, edit, and manage institutional faculties.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <span style={{marginRight: '5px'}}>+</span> Add New Faculty
        </button>
      </div>

      {/* Summary Widgets */}
      <div className="summary-cards" style={{ marginBottom: '30px' }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{background: '#e3f2fd', color: '#0d47a1'}}>🏛️</div>
          <div className="stat-info"><h3>Total Faculties</h3><p className="stat-value">{faculties.length}</p></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{background: '#e8f5e9', color: '#1b5e20'}}>✅</div>
          <div className="stat-info"><h3>Active Faculties</h3><p className="stat-value text-success">{activeCount}</p></div>
        </div>
        <div className="card stat-card alert-card">
          <div className="stat-icon" style={{background: '#f8d7da', color: '#721c24'}}>⚠️</div>
          <div className="stat-info"><h3>Disabled</h3><p className="stat-value text-danger">{disabledCount}</p></div>
        </div>
      </div>

      <div className="card dashboard-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Faculty Directory</h2>
          <input 
            type="text" 
            placeholder="Search faculties..." 
            className="form-control"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '250px', padding: '8px 15px', borderRadius: '20px', border: '1px solid #ddd' }}
          />
        </div>
        
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading faculties...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{borderBottom: '2px solid #eee', background: '#f8f9fa'}}>
                  <th style={{padding: '12px 15px', color: '#555'}}>ID</th>
                  <th style={{padding: '12px 15px', color: '#555'}}>Faculty Name</th>
                  <th style={{padding: '12px 15px', color: '#555', textAlign: 'center'}}>Departments</th>
                  <th style={{padding: '12px 15px', color: '#555'}}>Status</th>
                  <th style={{padding: '12px 15px', color: '#555', textAlign: 'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFaculties.length > 0 ? filteredFaculties.map(f => (
                  <tr key={f.id} style={{borderBottom: '1px solid #eee', transition: 'background 0.2s'}} onMouseOver={e => e.currentTarget.style.background='#fcfcfc'} onMouseOut={e => e.currentTarget.style.background='white'}>
                    <td style={{padding: '15px', color: '#777'}}>#{f.id}</td>
                    <td style={{padding: '15px', fontWeight: '600', color: '#333'}}>{f.name}</td>
                    <td style={{padding: '15px', textAlign: 'center'}}>
                      <span style={{ background: '#f0f0f0', padding: '3px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        {f.total_departments || 0}
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
                        background: f.is_active ? '#e8f5e9' : '#f8d7da',
                        color: f.is_active ? '#28a745' : '#dc3545'
                      }}>
                        {f.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{padding: '15px', textAlign: 'right'}}>
                      <button className="btn btn-secondary btn-sm" style={{marginRight: 8, padding: '5px 10px'}} onClick={() => openModal(f)} title="Edit">✏️ Edit</button>
                      <button 
                        className={`btn btn-sm ${f.is_active ? 'btn-danger' : 'btn-success'}`} 
                        style={{marginRight: 8, padding: '5px 10px'}}
                        onClick={() => handleToggleStatus(f)}
                        title={f.is_active ? "Disable" : "Enable"}
                      >
                        {f.is_active ? '🚫 Disable' : '✅ Enable'}
                      </button>
                      <button className="btn btn-sm" style={{background: '#dc3545', color: 'white', padding: '5px 10px'}} onClick={() => handleDelete(f.id)} title="Delete">🗑️ Delete</button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" style={{textAlign: 'center', padding: '40px', color: '#888'}}>
                      <div style={{fontSize: '2rem', marginBottom: '10px'}}>🔍</div>
                      No faculties found. {searchTerm ? 'Try a different search term.' : 'Click Add New Faculty to create one.'}
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
              <h3 style={{ margin: 0, color: '#0A5C36', fontSize: '1.4rem' }}>{editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888' }}>✖</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group" style={{marginBottom: 25}}>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#444'}}>Faculty Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={facultyName} 
                  onChange={(e) => setFacultyName(e.target.value)} 
                  required 
                  placeholder="e.g. Faculty of Science"
                  style={{width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem'}}
                />
              </div>
              <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{padding: '10px 20px'}}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{padding: '10px 20px'}}>Save Faculty</button>
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
    width: '400px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
  }
};

export default ManageFaculties;
