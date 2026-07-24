import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { SettingsContext } from "../../context/SettingsContext";
import { DoorOpen, Plus, Search, CheckCircle2, XCircle, Edit3, Trash2, Calendar } from 'lucide-react';

const HodManageClassrooms = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  
  const [timetables, setTimetables] = useState([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [viewingScheduleRoom, setViewingScheduleRoom] = useState(null);
  
  const hodUser = JSON.parse(localStorage.getItem('user'));
  const deptId = hodUser?.department_id;

  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [venueType, setVenueType] = useState('Classroom');
  const [building, setBuilding] = useState('');
  
  const [hasAc, setHasAc] = useState(false);
  const [hasProjector, setHasProjector] = useState(false);
  const [isCbt, setIsCbt] = useState(false);

  const fetchData = async () => {
    try {
      const [classRes, ttRes] = await Promise.all([
        axios.get(`/api/classrooms.php?department_id=${deptId}`),
        axios.get(`/api/timetables.php?department_id=${deptId}`)
      ]);
      if (classRes.data.success) setClassrooms(classRes.data.data);
      if (ttRes.data.success) setTimetables(ttRes.data.data);
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
    if (!name.trim() || !capacity) return;

    try {
      const payload = {
        name,
        capacity: parseInt(capacity),
        venue_type: venueType,
        building,
        has_ac: hasAc,
        has_projector: hasProjector,
        is_cbt: isCbt,
        department_id: deptId,
        is_accessible: true // default
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
    if (window.confirm('Delete this classroom permanently?')) {
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
    setCapacity('');
    setVenueType('Classroom');
    setBuilding('');
    setHasAc(false);
    setHasProjector(false);
    setIsCbt(false);
  };

  const openModal = (room = null) => {
    if (room) {
      setEditingRoom(room);
      setName(room.name);
      setCapacity(room.capacity);
      setVenueType(room.venue_type || 'Classroom');
      setBuilding(room.building || '');
      setHasAc(!!room.has_ac);
      setHasProjector(!!room.has_projector);
      setIsCbt(!!room.is_cbt);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const openScheduleModal = (room) => {
    setViewingScheduleRoom(room);
    setIsScheduleModalOpen(true);
  };

  const filteredRooms = useMemo(() => {
    if (!searchTerm) return classrooms;
    return classrooms.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (r.building && r.building.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [classrooms, searchTerm]);

  return (
    <div className="hod-manage-classrooms fade-in" style={{padding: '20px', color: '#2c3e50'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
        <div>
          <h1 style={{fontSize: '1.8rem', color: '#1a252f', margin: '0 0 5px 0', fontWeight: 700}}>Department Classrooms</h1>
          <p style={{color: '#64748b', margin: 0}}>Manage dedicated classrooms restricted to your department.</p>
        </div>
        <button className="btn-premium primary" onClick={() => openModal()} style={{background: '#0f172a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold'}}>
          <Plus size={18} /> Add Classroom
        </button>
      </div>

      <div className="premium-card" style={{background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', overflow: 'hidden'}}>
        <div className="card-toolbar" style={{padding: '20px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc'}}>
          <div className="search-wrapper" style={{position: 'relative', maxWidth: '400px'}}>
            <Search size={18} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8'}} />
            <input 
              type="text" 
              placeholder="Search by name or building..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box'}}
            />
          </div>
        </div>
        
        {loading ? (
          <div style={{padding: '40px', textAlign: 'center'}}>Loading classrooms...</div>
        ) : (
          <div className="table-responsive">
            <table className="premium-table" style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr>
                  <th style={thStyle}>Classroom Name</th>
                  <th style={thStyle}>Building</th>
                  <th style={thStyle}>Capacity</th>
                  <th style={thStyle}>Features</th>
                  <th style={thStyle}>Status</th>
                  <th style={{...thStyle, textAlign: 'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.length > 0 ? filteredRooms.map(r => (
                  <tr key={r.id} style={{borderBottom: '1px solid #f1f5f9'}}>
                    <td style={tdStyle}>
                      <span style={{fontWeight: 700, color: '#0f172a'}}>{r.name}</span>
                      <div style={{fontSize: '0.75rem', color: '#64748b', marginTop: '4px'}}>{r.venue_type}</div>
                    </td>
                    <td style={tdStyle}><span style={{color: '#475569'}}>{r.building || 'N/A'}</span></td>
                    <td style={tdStyle}>
                      <span style={{background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600}}>{r.capacity} Seats</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{display: 'flex', gap: '5px', fontSize: '1.2rem'}}>
                        {r.is_cbt && <span title="CBT Center">💻</span>}
                        {r.has_ac && <span title="Air Conditioned">❄️</span>}
                        {r.has_projector && <span title="Projector">📽️</span>}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <button onClick={() => handleToggleStatus(r)} style={{
                          background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                          color: r.is_active ? '#16a34a' : '#dc2626'
                        }}>
                        {r.is_active ? <><CheckCircle2 size={16}/> Available</> : <><XCircle size={16}/> Unavailable</>}
                      </button>
                    </td>
                    <td style={{...tdStyle, textAlign: 'right'}}>
                      <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                        <button onClick={() => openScheduleModal(r)} style={actionBtnStyle} title="View Schedule"><Calendar size={16} color="#3b82f6" /></button>
                        <button onClick={() => openModal(r)} style={actionBtnStyle} title="Edit"><Edit3 size={16} color="#64748b" /></button>
                        <button onClick={() => handleDelete(r.id)} style={actionBtnStyle} title="Delete"><Trash2 size={16} color="#ef4444" /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" style={{textAlign: 'center', padding: '50px', color: '#64748b'}}>
                      <DoorOpen size={40} style={{opacity: 0.2, marginBottom: '10px'}} />
                      <p>No departmental classrooms assigned yet.</p>
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
              <h2 style={{margin: 0, fontSize: '1.25rem'}}>{editingRoom ? 'Edit Classroom' : 'Add Department Classroom'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8'}}>×</button>
            </div>
            
            <form onSubmit={handleSave} style={{padding: '25px'}}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                <div style={{gridColumn: '1 / -1'}}>
                  <label style={labelStyle}>Classroom Name *</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} placeholder="E.g. Computer Lab 1" />
                </div>
                
                <div>
                  <label style={labelStyle}>Seat Capacity *</label>
                  <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} min="1" required style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Type</label>
                  <select value={venueType} onChange={(e) => setVenueType(e.target.value)} style={inputStyle}>
                    <option value="Classroom">Classroom</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Hall">Hall</option>
                  </select>
                </div>

                <div style={{gridColumn: '1 / -1'}}>
                  <label style={labelStyle}>Building Name</label>
                  <input type="text" value={building} onChange={(e) => setBuilding(e.target.value)} style={inputStyle} placeholder="E.g. Engineering Block" />
                </div>

                <div style={{gridColumn: '1 / -1', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                  <h4 style={{margin: '0 0 10px 0', color: '#334155'}}>Amenities</h4>
                  <div style={{display: 'flex', gap: '20px'}}>
                    <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}><input type="checkbox" checked={hasAc} onChange={e => setHasAc(e.target.checked)} /> ❄️ Air Conditioned</label>
                    <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}><input type="checkbox" checked={hasProjector} onChange={e => setHasProjector(e.target.checked)} /> 📽️ Projector</label>
                    <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}><input type="checkbox" checked={isCbt} onChange={e => setIsCbt(e.target.checked)} /> 💻 CBT Center</label>
                  </div>
                </div>
              </div>

              <div style={{marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{padding: '10px 20px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600}}>Cancel</button>
                <button type="submit" style={{padding: '10px 20px', background: '#0f172a', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600}}>Save Classroom</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {isScheduleModalOpen && viewingScheduleRoom && (
        <div style={modalOverlayStyle}>
          <div style={{...modalStyle, maxWidth: '600px'}} className="slideUp">
            <div style={modalHeaderStyle}>
              <h2 style={{margin: 0, fontSize: '1.25rem'}}>Schedule: {viewingScheduleRoom.name}</h2>
              <button onClick={() => setIsScheduleModalOpen(false)} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8'}}>×</button>
            </div>
            <div style={{padding: '25px', maxHeight: '400px', overflowY: 'auto'}}>
              {timetables.filter(t => t.classroom_id === viewingScheduleRoom.id).length > 0 ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                  {timetables.filter(t => t.classroom_id === viewingScheduleRoom.id).map(slot => (
                    <div key={slot.id} style={{padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div>
                        <strong style={{display: 'block', color: '#0f172a', fontSize: '1rem'}}>{slot.course_code} - {slot.course_name}</strong>
                        <span style={{fontSize: '0.85rem', color: '#64748b'}}>{slot.day_of_week} • Lvl {slot.level}</span>
                      </div>
                      <div style={{textAlign: 'right'}}>
                        <div style={{fontWeight: 'bold', color: '#3b82f6'}}>{slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{textAlign: 'center', color: '#64748b', padding: '30px 0'}}>
                  <Calendar size={40} style={{opacity: 0.2, marginBottom: '10px'}} />
                  <p>No classes scheduled in this room.</p>
                </div>
              )}
            </div>
            <div style={{padding: '15px 25px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: '#fafbfc'}}>
              <button onClick={() => setIsScheduleModalOpen(false)} style={{padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', cursor: 'pointer', fontWeight: 600}}>Close</button>
            </div>
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

export default HodManageClassrooms;
