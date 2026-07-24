import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, FileText, Filter, Plus, Trash2, Zap, Save, Undo2, Redo2, Eye } from 'lucide-react';
import { useContext, useEffect, useRef, useState, useMemo } from 'react';
import { SettingsContext } from '../../context/SettingsContext';
import { DndContext, useDraggable, useDroppable, closestCenter } from '@dnd-kit/core';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]; // 8 AM to 5 PM

// Droppable Cell Component
const DroppableCell = ({ id, children, isOver }) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <td ref={setNodeRef} style={{...styles.td, background: isOver ? '#e3f2fd' : 'transparent'}}>
      {children}
    </td>
  );
};

// Draggable Slot Component
const DraggableSlot = ({ slot, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: slot.id.toString(),
    data: slot
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 999,
    position: 'relative'
  } : {};

  return (
    <div ref={setNodeRef} style={{...styles.slot, ...style}} {...attributes} {...listeners}>
      <div style={styles.slotHeader}>
        <strong>{slot.course_code}</strong>
        <div onPointerDown={(e) => e.stopPropagation()}>
          <button onClick={() => onEdit(slot)} style={{...styles.actionBtn, marginRight: '5px'}} title="Edit">✏️</button>
          <button onClick={() => onDelete(slot.id)} style={styles.actionBtn} title="Delete">🗑️</button>
        </div>
      </div>
      <div style={styles.slotBody}>
        {slot.room_name} ({slot.room_capacity})<br/>
        {slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}
      </div>
    </div>
  );
};

const ManageTimetables = () => {
  const { settings } = useContext(SettingsContext);
  const gridRef = useRef(null);

  const [timetables, setTimetables] = useState([]);
  const [history, setHistory] = useState([]); // Past states for Undo
  const [future, setFuture] = useState([]); // Future states for Redo
  
  const [courses, setCourses] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, course_id: '', classroom_id: '', day_of_week: 'Monday', start_time: '08:00', end_time: '10:30' });
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedDept) queryParams.append('department_id', selectedDept);
      queryParams.append('semester', settings.current_semester);
      queryParams.append('session', settings.current_session);

      const url = `/api/timetables.php?${queryParams.toString()}`;
      const [ttRes, crsRes, clsRes, deptRes] = await Promise.all([
        axios.get(url),
        axios.get('/api/courses.php'),
        axios.get('/api/classrooms.php'),
        axios.get('/api/departments.php')
      ]);

      if (ttRes.data.success) setTimetables(ttRes.data.data);
      if (crsRes.data.success) setCourses(crsRes.data.data);
      if (clsRes.data.success) setClassrooms(clsRes.data.data);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedDept, settings.current_semester, settings.current_session]);

  const saveStateToHistory = (newState) => {
    setHistory(prev => [...prev, timetables]);
    setFuture([]);
    setTimetables(newState);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setFuture(prev => [timetables, ...prev]);
    setHistory(prev => prev.slice(0, -1));
    setTimetables(previousState);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const nextState = future[0];
    setHistory(prev => [...prev, timetables]);
    setFuture(prev => prev.slice(1));
    setTimetables(nextState);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const [newDay, newHourStr] = over.id.split('-');
    const newHour = parseInt(newHourStr);
    const slotData = active.data.current;

    // Calculate new start/end times based on drop cell
    const duration = new Date(`1970-01-01T${slotData.end_time}`) - new Date(`1970-01-01T${slotData.start_time}`);
    const durationHours = duration / (1000 * 60 * 60);
    
    const newStart = `${newHour.toString().padStart(2, '0')}:00`;
    let newEndHour = newHour + Math.floor(durationHours);
    let newEndMin = (durationHours % 1) * 60;
    const newEnd = `${newEndHour.toString().padStart(2, '0')}:${newEndMin.toString().padStart(2, '0')}`;

    // Optimistically update UI
    const updatedTimetables = timetables.map(t => {
      if (t.id.toString() === active.id) {
        return { ...t, day_of_week: newDay, start_time: newStart, end_time: newEnd };
      }
      return t;
    });
    
    saveStateToHistory(updatedTimetables);

    // Save to DB
    try {
      const payload = {
        id: slotData.id,
        course_id: slotData.course_id,
        classroom_id: slotData.classroom_id,
        day_of_week: newDay,
        start_time: newStart + ':00',
        end_time: newEnd + ':00',
        semester: settings.current_semester,
        session: settings.current_session
      };
      const res = await axios.put('/api/timetables.php', payload);
      if (!res.data.success) {
        alert(res.data.message);
        handleUndo(); // Revert if conflict occurs
      }
    } catch (err) {
      alert('Failed to update slot.');
      handleUndo();
    }
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, semester: settings.current_semester, session: settings.current_session };
      if (payload.start_time.length === 5) payload.start_time += ':00';
      if (payload.end_time.length === 5) payload.end_time += ':00';

      const res = formData.id ? await axios.put('/api/timetables.php', payload) : await axios.post('/api/timetables.php', payload);
      if (res.data.success) {
        setIsModalOpen(false);
        fetchData();
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError('Server Error.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this slot?')) {
      await axios.delete('/api/timetables.php', { data: { id } });
      fetchData();
    }
  };

  const publishTimetable = async () => {
    if(window.confirm('Publish timetable? Students will be able to see it.')) {
      try {
        const res = await axios.post(`/api/timetables.php?action=publish`, {
          semester: settings.current_semester,
          session: settings.current_session
        });
        if (res.data.success) {
          alert('Timetable published successfully!');
        } else {
          alert('Failed to publish: ' + res.data.message);
        }
      } catch (e) {
        alert('Server Error during publish.');
      }
    }
  };

  return (
    <div className="manage-timetables">
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>Timetable Editor (DnD)</h1>
          <p>Drag and drop slots to reschedule. Conflict detection is active.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn" onClick={handleUndo} disabled={history.length===0} style={styles.toolbarBtn}><Undo2 size={16}/> Undo</button>
          <button className="btn" onClick={handleRedo} disabled={future.length===0} style={styles.toolbarBtn}><Redo2 size={16}/> Redo</button>
          <button className="btn btn-secondary" onClick={() => { setFormData({ id: null, course_id: '', classroom_id: '', day_of_week: 'Monday', start_time: '08:00', end_time: '10:00' }); setIsModalOpen(true); }}><Plus size={16}/> Add Slot</button>
          <button className="btn btn-primary" onClick={publishTimetable}><Eye size={16}/> Publish</button>
        </div>
      </div>

      <div className="card dashboard-card">
        {loading ? <div style={{padding: 40, textAlign: 'center'}}>Loading...</div> : (
          <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
            <div style={{overflowX: 'auto'}}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th style={styles.th}>Time</th>
                    {DAYS.map(d => <th key={d} style={styles.th}>{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {HOURS.map(hour => (
                    <tr key={hour}>
                      <td style={styles.timeLabel}>{hour}:00</td>
                      {DAYS.map(day => {
                        const cellId = `${day}-${hour}`;
                        const slotsInCell = timetables.filter(t => t.day_of_week === day && parseInt(t.start_time.split(':')[0]) === hour);
                        
                        return (
                          <DroppableCell key={cellId} id={cellId}>
                            {slotsInCell.map(slot => (
                              <DraggableSlot 
                                key={slot.id} 
                                slot={slot} 
                                onEdit={(s) => { setFormData({...s, start_time: s.start_time.substring(0,5), end_time: s.end_time.substring(0,5)}); setIsModalOpen(true); }}
                                onDelete={handleDelete}
                              />
                            ))}
                          </DroppableCell>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DndContext>
        )}
      </div>

      {isModalOpen && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>{formData.id ? 'Edit Slot' : 'Add Slot'}</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSaveModal}>
              {/* Form inputs similar to previous version */}
              <div style={{display:'flex', flexDirection:'column', gap:'10px', marginBottom:'20px'}}>
                  <select className="form-control" value={formData.course_id} onChange={e=>setFormData({...formData, course_id:e.target.value})} required>
                      <option value="">-- Course --</option>
                      {courses.map(c=><option key={c.id} value={c.id}>{c.course_code}</option>)}
                  </select>
                  <select className="form-control" value={formData.classroom_id} onChange={e=>setFormData({...formData, classroom_id:e.target.value})} required>
                      <option value="">-- Venue --</option>
                      {classrooms.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select className="form-control" value={formData.day_of_week} onChange={e=>setFormData({...formData, day_of_week:e.target.value})}>
                      {DAYS.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                  <div style={{display:'flex', gap:'10px'}}>
                      <input type="time" className="form-control" value={formData.start_time} onChange={e=>setFormData({...formData, start_time:e.target.value})} required />
                      <input type="time" className="form-control" value={formData.end_time} onChange={e=>setFormData({...formData, end_time:e.target.value})} required />
                  </div>
              </div>
              <div style={{display:'flex', justifyContent:'flex-end', gap:'10px'}}>
                <button type="button" className="btn btn-secondary" onClick={()=>setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  th: { padding: '15px', background: '#f8f9fa', borderBottom: '2px solid #ddd', textAlign: 'center' },
  timeLabel: { padding: '15px', borderRight: '1px solid #ddd', borderBottom: '1px solid #eee', fontWeight: 'bold' },
  td: { padding: '5px', borderRight: '1px solid #eee', borderBottom: '1px solid #eee', verticalAlign: 'top', height: '80px', minWidth: '120px' },
  slot: { background: '#4a148c', color: 'white', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'grab', marginBottom: '4px' },
  slotHeader: { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '2px', marginBottom: '2px' },
  actionBtn: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '10px' },
  toolbarBtn: { background: 'white', border: '1px solid #ccc', display: 'flex', alignItems: 'center', gap: '5px' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'white', padding: '30px', borderRadius: '12px', width: '400px' }
};

export default ManageTimetables;
