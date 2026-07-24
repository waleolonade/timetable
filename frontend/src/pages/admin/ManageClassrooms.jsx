import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const ManageClassrooms = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  
  const [name, setName] = useState('');
  const [hallCode, setHallCode] = useState('');
  const [capacity, setCapacity] = useState('');
  const [venueType, setVenueType] = useState('Classroom');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  
  const [hasAc, setHasAc] = useState(false);
  const [hasProjector, setHasProjector] = useState(false);
  const [isCbt, setIsCbt] = useState(false);
  const [isAccessible, setIsAccessible] = useState(true);

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/classrooms.php');
      if (res.data.success) setClassrooms(res.data.data);
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
    if (!name.trim() || !capacity) return;

    try {
      const payload = {
        name,
        hall_code: hallCode,
        capacity: parseInt(capacity),
        venue_type: venueType,
        building,
        floor,
        has_ac: hasAc,
        has_projector: hasProjector,
        is_cbt: isCbt,
        is_accessible: isAccessible
      };

      if (editingRoom) {
        await axios.put('/api/classrooms.php', { id: editingRoom.id, ...payload });
      } else {
        await axios.post('/api/classrooms.php', payload);
      }
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (room) => {
    try {
      await axios.put('/api/classrooms.php', { id: room.id, is_active: !room.is_active });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this venue?')) {
      try {
        await axios.delete('/api/classrooms.php', { data: { id } });
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const resetForm = () => {
    setEditingRoom(null);
    setName('');
    setHallCode('');
    setCapacity('');
    setVenueType('Classroom');
    setBuilding('');
    setFloor('');
    setHasAc(false);
    setHasProjector(false);
    setIsCbt(false);
    setIsAccessible(true);
  };

  const openModal = (room = null) => {
    if (room) {
      setEditingRoom(room);
      setName(room.name);
      setHallCode(room.hall_code || '');
      setCapacity(room.capacity);
      setVenueType(room.venue_type || 'Classroom');
      setBuilding(room.building || '');
      setFloor(room.floor || '');
      setHasAc(!!room.has_ac);
      setHasProjector(!!room.has_projector);
      setIsCbt(!!room.is_cbt);
      setIsAccessible(room.is_accessible === undefined ? true : !!room.is_accessible);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const filteredRooms = useMemo(() => {
    if (!searchTerm) return classrooms;
    return classrooms.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (r.hall_code && r.hall_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.venue_type && r.venue_type.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [classrooms, searchTerm]);

  const activeCount = classrooms.filter(r => r.is_active).length;
  const cbtCount = classrooms.filter(r => r.is_cbt && r.is_active).length;
  const totalCapacity = classrooms.filter(r => r.is_active).reduce((sum, r) => sum + r.capacity, 0);

  return (
    <div className="manage-classrooms">
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Locations & Venues</h1>
          <p>Manage examination venues, lecture theaters, and track capacity/features.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <span style={{marginRight: '5px'}}>+</span> Add New Venue
        </button>
      </div>

      <div className="summary-cards" style={{ marginBottom: '30px' }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{background: '#e0f7fa', color: '#006064'}}>🏢</div>
          <div className="stat-info"><h3>Total Venues</h3><p className="stat-value">{classrooms.length}</p></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{background: '#e8f5e9', color: '#1b5e20'}}>👥</div>
          <div className="stat-info"><h3>Total Capacity</h3><p className="stat-value text-success">{totalCapacity.toLocaleString()}</p></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{background: '#f3e5f5', color: '#4a148c'}}>💻</div>
          <div className="stat-info"><h3>CBT Centers</h3><p className="stat-value text-primary">{cbtCount}</p></div>
        </div>
      </div>

      <div className="card dashboard-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Venue Directory</h2>
          <input 
            type="text" 
            placeholder="Search name, code, or type..." 
            className="form-control"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '280px', padding: '8px 15px', borderRadius: '20px', border: '1px solid #ddd' }}
          />
        </div>
        
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading venues...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{borderBottom: '2px solid #eee', background: '#f8f9fa'}}>
                  <th style={{padding: '12px 15px', color: '#555'}}>Code</th>
                  <th style={{padding: '12px 15px', color: '#555'}}>Venue Name</th>
                  <th style={{padding: '12px 15px', color: '#555'}}>Location</th>
                  <th style={{padding: '12px 15px', color: '#555', textAlign: 'center'}}>Capacity</th>
                  <th style={{padding: '12px 15px', color: '#555', textAlign: 'center'}}>Features</th>
                  <th style={{padding: '12px 15px', color: '#555'}}>Status</th>
                  <th style={{padding: '12px 15px', color: '#555', textAlign: 'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.length > 0 ? filteredRooms.map(r => (
                  <tr key={r.id} style={{borderBottom: '1px solid #eee', transition: 'background 0.2s'}} onMouseOver={e => e.currentTarget.style.background='#fcfcfc'} onMouseOut={e => e.currentTarget.style.background='white'}>
                    <td style={{padding: '15px', color: '#555', fontWeight: 'bold'}}>{r.hall_code || '-'}</td>
                    <td style={{padding: '15px', fontWeight: 'bold', color: '#006064'}}>
                      {r.name}
                      <div style={{fontSize: '0.75rem', color: '#888', marginTop: '4px'}}>{r.venue_type}</div>
                    </td>
                    <td style={{padding: '15px', color: '#555'}}>
                      {r.building ? `${r.building} ` : ''}
                      {r.floor ? `(${r.floor})` : ''}
                      {!r.building && !r.floor && '-'}
                    </td>
                    <td style={{padding: '15px', textAlign: 'center'}}>
                      <span style={{ background: '#f0f0f0', padding: '3px 8px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                        {r.capacity}
                      </span>
                    </td>
                    <td style={{padding: '15px', textAlign: 'center', fontSize: '1.2rem', display: 'flex', gap: '5px', justifyContent: 'center'}}>
                      {r.is_cbt ? <span title="CBT Center">💻</span> : null}
                      {r.has_ac ? <span title="Air Conditioned">❄️</span> : null}
                      {r.has_projector ? <span title="Has Projector">📽️</span> : null}
                      {r.is_accessible ? <span title="Wheelchair Accessible">♿</span> : null}
                    </td>
                    <td style={{padding: '15px'}}>
                      <span style={{
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        background: r.is_active ? '#e8f5e9' : '#f8d7da',
                        color: r.is_active ? '#28a745' : '#dc3545'
                      }}>
                        {r.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{padding: '15px', textAlign: 'right'}}>
                      <button className="btn btn-secondary btn-sm" style={{marginRight: 8, padding: '5px 10px'}} onClick={() => openModal(r)} title="Edit">✏️ Edit</button>
                      <button className="btn btn-sm" style={{background: '#dc3545', color: 'white', padding: '5px 10px'}} onClick={() => handleDelete(r.id)} title="Delete">🗑️ Delete</button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" style={{textAlign: 'center', padding: '40px', color: '#888'}}>
                      <div style={{fontSize: '2rem', marginBottom: '10px'}}>🔍</div>
                      No venues found. {searchTerm ? 'Try a different search term.' : 'Click Add New Venue to create one.'}
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
          <div className="modal" style={{...modalStyles.modal, width: '650px'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#006064', fontSize: '1.4rem' }}>{editingRoom ? 'Edit Venue' : 'Add New Venue'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888' }}>✖</button>
            </div>
            
            <form onSubmit={handleSave} style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '10px' }}>
              
              <div style={{ display: 'flex', gap: '15px', marginBottom: 15 }}>
                <div className="form-group" style={{flex: 1}}>
                  <label style={modalStyles.label}>Hall Code</label>
                  <input type="text" className="form-control" value={hallCode} onChange={(e) => setHallCode(e.target.value)} placeholder="e.g. LT1" style={modalStyles.input} />
                </div>
                <div className="form-group" style={{flex: 2}}>
                  <label style={modalStyles.label}>Venue Name *</label>
                  <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Lecture Theater 1" style={modalStyles.input} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginBottom: 15 }}>
                <div className="form-group" style={{flex: 2}}>
                  <label style={modalStyles.label}>Venue Type</label>
                  <select className="form-control" value={venueType} onChange={(e) => setVenueType(e.target.value)} style={modalStyles.input}>
                    <option value="Classroom">Classroom</option>
                    <option value="Lecture Theater">Lecture Theater</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Hall">Hall</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Exam Venue">Exam Venue</option>
                  </select>
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label style={modalStyles.label}>Student Capacity *</label>
                  <input type="number" min="1" className="form-control" value={capacity} onChange={(e) => setCapacity(e.target.value)} required placeholder="e.g. 250" style={modalStyles.input} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginBottom: 20 }}>
                <div className="form-group" style={{flex: 1}}>
                  <label style={modalStyles.label}>Building Name</label>
                  <input type="text" className="form-control" value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="e.g. Science Block" style={modalStyles.input} />
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label style={modalStyles.label}>Floor</label>
                  <input type="text" className="form-control" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="e.g. Ground Floor" style={modalStyles.input} />
                </div>
              </div>

              <label style={modalStyles.label}>Venue Features</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#fdfdfd', border: '1px solid #eee', padding: '15px', borderRadius: '8px', marginBottom: '25px' }}>
                <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#444'}}>
                  <input type="checkbox" checked={hasAc} onChange={(e) => setHasAc(e.target.checked)} style={{marginRight: '8px', width: '16px', height: '16px'}} />
                  ❄️ Air Conditioned
                </label>
                <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#444'}}>
                  <input type="checkbox" checked={hasProjector} onChange={(e) => setHasProjector(e.target.checked)} style={{marginRight: '8px', width: '16px', height: '16px'}} />
                  📽️ Has Projector
                </label>
                <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#444'}}>
                  <input type="checkbox" checked={isCbt} onChange={(e) => setIsCbt(e.target.checked)} style={{marginRight: '8px', width: '16px', height: '16px'}} />
                  💻 CBT Center
                </label>
                <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#444'}}>
                  <input type="checkbox" checked={isAccessible} onChange={(e) => setIsAccessible(e.target.checked)} style={{marginRight: '8px', width: '16px', height: '16px'}} />
                  ♿ Wheelchair Accessible
                </label>
              </div>

              <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '15px'}}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{padding: '10px 20px'}}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{padding: '10px 20px', background: '#006064', borderColor: '#006064'}}>Save Venue</button>
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
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
  },
  label: {
    display: 'block', marginBottom: '8px', fontWeight: '600', color: '#444'
  },
  input: {
    width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem'
  }
};

export default ManageClassrooms;
