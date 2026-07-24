import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, FileText, Filter, Plus, Trash2, Zap } from 'lucide-react';
import { useContext, useEffect, useRef, useState } from 'react';
import { SettingsContext } from '../../context/SettingsContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const HOURS = [8, 10, 12, 14, 16]; // 8 AM to 5 PM

const ManageTimetables = () => {
  const { settings } = useContext(SettingsContext);
  const gridRef = useRef(null);

  const [timetables, setTimetables] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const [selectedDept, setSelectedDept] = useState('');
  const [filterParams, setFilterParams] = useState({
    level: '',
    semester: '',
    venue_id: '',
    session: '',
    status: '',
    course_id: ''
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    course_id: '',
    classroom_id: '',
    day_of_week: 'Monday',
    start_time: '08:00',
    end_time: '10:30'
  });
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      if (selectedDept) queryParams.append('department_id', selectedDept);
      if (filterParams.level) queryParams.append('level', filterParams.level);
      if (filterParams.semester) queryParams.append('semester', filterParams.semester);
      if (filterParams.venue_id) queryParams.append('venue_id', filterParams.venue_id);
      if (filterParams.session) queryParams.append('session', filterParams.session);
      if (filterParams.status) queryParams.append('status', filterParams.status);
      if (filterParams.course_id) queryParams.append('course_id', filterParams.course_id);

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

  useEffect(() => {
    fetchData();
  }, [selectedDept, filterParams]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...formData,
        semester: settings.current_semester,
        session: settings.current_session
      };
      
      // Ensure times are formatted correctly for DB
      if (payload.start_time.length === 5) payload.start_time += ':00';
      if (payload.end_time.length === 5) payload.end_time += ':00';

      let res;
      if (formData.id) {
        res = await axios.put('/api/timetables.php', payload);
      } else {
        res = await axios.post('/api/timetables.php', payload);
      }

      if (res.data.success) {
        setIsModalOpen(false);
        fetchData();
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError('Failed to save timetable slot.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this slot?')) {
      try {
        await axios.delete('/api/timetables.php', { data: { id } });
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleEdit = (slot) => {
    setFormData({
      id: slot.id,
      course_id: slot.course_id,
      classroom_id: slot.classroom_id,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time.substring(0, 5), // '08:00:00' -> '08:00'
      end_time: slot.end_time.substring(0, 5)
    });
    setError('');
    setIsModalOpen(true);
  };

  const openNewSlotModal = () => {
    setFormData({
      id: null,
      course_id: '',
      classroom_id: '',
      day_of_week: 'Monday',
      start_time: '08:00',
      end_time: '10:30'
    });
    setError('');
    setIsModalOpen(true);
  };

  // Helper to format time (e.g., "08:00:00" -> "8 AM")
  const formatTime = (timeStr) => {
    const [h, m] = timeStr.split(':');
    let val = parseInt(h);
    let ampm = val >= 12 ? 'PM' : 'AM';
    val = val % 12 || 12;
    return `${val}:${m} ${ampm}`;
  };

  const handleAutoGenerate = async () => {
    if (window.confirm('WARNING: Auto-Generating will clear all current schedule slots and automatically rebuild the timetable. Do you wish to proceed?')) {
      setLoading(true);
      try {
        const payload = {
          semester: settings.current_semester,
          session: settings.current_session
        };
        const res = await axios.post('/api/timetables.php?action=auto_generate', payload);
        if (res.data.success) {
          alert(res.data.message);
          fetchData();
        } else {
          alert(res.data.message);
          setLoading(false);
        }
      } catch (err) {
        alert('Auto-generation failed.');
        setLoading(false);
      }
    }
  };

  const exportPDF = async () => {
    if (!gridRef.current) return;
    try {
      const canvas = await html2canvas(gridRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.text(`${settings.institution_name || 'Institution'} - Timetable`, 10, 10);
      pdf.addImage(imgData, 'PNG', 0, 20, pdfWidth, pdfHeight);
      pdf.save(`Timetable_${settings.current_session.replace('/', '-')}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Failed to generate PDF');
    }
  };

  const exportCSV = () => {
    if (timetables.length === 0) {
      alert("No data to export");
      return;
    }
    const headers = ['Day', 'Start Time', 'End Time', 'Course Code', 'Course Name', 'Room', 'Room Capacity'];
    const rows = timetables.map(t => [
      t.day_of_week, t.start_time, t.end_time, t.course_code, `"${t.course_name}"`, `"${t.room_name}"`, t.room_capacity
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Timetable_Data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter courses by selected department in the modal
  const modalCourses = selectedDept 
    ? courses.filter(c => c.department_id == selectedDept)
    : courses;

  return (
    <div className="manage-timetables">
      <div className="content-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', gap: '20px' }}>
        <div>
          <h1>Timetable Generator</h1>
          <p>Schedule classes, auto-generate complex timetables, and export data.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select 
            className="form-control" 
            value={selectedDept} 
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.department_name}</option>
            ))}
          </select>
          
          <button className="btn" onClick={() => setIsFilterModalOpen(true)} style={{ background: 'white', border: '1px solid #ced4da', display: 'flex', alignItems: 'center' }}>
            <Filter size={18} style={{marginRight: '5px'}}/> Filters
          </button>
          
          <button className="btn" onClick={handleAutoGenerate} style={{ background: '#6f42c1', color: 'white', display: 'flex', alignItems: 'center' }}>
            <Zap size={18} style={{marginRight: '5px'}}/> Auto Generate
          </button>
          
          <button className="btn btn-primary" onClick={openNewSlotModal} style={{ display: 'flex', alignItems: 'center' }}>
            <Plus size={18} style={{marginRight: '5px'}}/> Manual Add
          </button>
          
          <div style={{ display: 'flex', gap: '5px' }}>
            <button className="btn btn-secondary" onClick={exportPDF} title="Download PDF" style={{ display: 'flex', alignItems: 'center', padding: '8px 12px' }}>
              <Download size={18} style={{marginRight: '5px'}}/> PDF
            </button>
            <button className="btn btn-secondary" onClick={exportCSV} title="Download CSV/Excel" style={{ display: 'flex', alignItems: 'center', padding: '8px 12px' }}>
              <FileText size={18} style={{marginRight: '5px'}}/> CSV
            </button>
          </div>
        </div>
      </div>

      <div className="card dashboard-card">
        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center' }}>Loading timetable grid...</div>
        ) : (
          <div className="timetable-container" style={{ overflowX: 'auto' }} ref={gridRef}>
            <table className="timetable-grid" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
              <thead>
                <tr>
                  <th style={styles.th}>Time</th>
                  {DAYS.map(day => (
                    <th key={day} style={styles.th}>{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map(hour => (
                  <tr key={hour}>
                    <td style={styles.timeLabel}>
                      {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
                    </td>
                    {DAYS.map(day => {
                      // Find slots that fall into this hour
                      const slots = timetables.filter(t => {
                        const startH = parseInt(t.start_time.split(':')[0]);
                        return t.day_of_week === day && startH === hour;
                      });

                      return (
                        <td key={`${day}-${hour}`} style={styles.td}>
                          {slots.map(slot => (
                            <div key={slot.id} className="timetable-slot" style={styles.slot}>
                              <div style={styles.slotHeader}>
                                <strong>{slot.course_code}</strong>
                                <div>
                                  <button onClick={() => handleEdit(slot)} style={{...styles.deleteBtn, marginRight: '5px', fontSize: '12px'}} title="Edit Time/Details">
                                    ✏️
                                  </button>
                                  <button onClick={() => handleDelete(slot.id)} style={styles.deleteBtn} title="Delete">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                              <div style={styles.slotBody}>
                                {slot.room_name} ({slot.room_capacity})<br/>
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </div>
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={styles.overlay}>
          <div className="modal slideDown" style={styles.modal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #dee2e6', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#343a40' }}>
                {formData.id ? 'Edit Slot' : 'Add Timetable Slot'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={styles.closeBtn}>✖</button>
            </div>
            
            {error && <div className="alert alert-danger">{error}</div>}
            
            <form onSubmit={handleSave}>
              <div style={{marginBottom: '15px'}}>
                <label style={styles.label}>Course</label>
                <select 
                  className="form-control" 
                  value={formData.course_id} 
                  onChange={(e) => setFormData({...formData, course_id: e.target.value})}
                  required
                >
                  <option value="">-- Select Course --</option>
                  {modalCourses.map(c => (
                    <option key={c.id} value={c.id}>{c.course_code} - {c.course_name}</option>
                  ))}
                </select>
              </div>

              <div style={{marginBottom: '15px'}}>
                <label style={styles.label}>Classroom/Venue</label>
                <select 
                  className="form-control" 
                  value={formData.classroom_id} 
                  onChange={(e) => setFormData({...formData, classroom_id: e.target.value})}
                  required
                >
                  <option value="">-- Select Venue --</option>
                  {classrooms.filter(c => c.is_active === 1 || c.is_active === true).map(c => (
                    <option key={c.id} value={c.id}>{c.name} (Cap: {c.capacity})</option>
                  ))}
                </select>
              </div>

              <div style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
                <div style={{flex: 1}}>
                  <label style={styles.label}>Day</label>
                  <select 
                    className="form-control" 
                    value={formData.day_of_week} 
                    onChange={(e) => setFormData({...formData, day_of_week: e.target.value})}
                  >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div style={{display: 'flex', gap: '15px', marginBottom: '25px'}}>
                <div style={{flex: 1}}>
                  <label style={styles.label}>Start Time</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={formData.start_time} 
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    required
                  />
                </div>
                <div style={{flex: 1}}>
                  <label style={styles.label}>End Time</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={formData.end_time} 
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isFilterModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal} className="slideDown">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #dee2e6', paddingBottom: '10px'}}>
              <h3 style={{margin: 0, color: '#343a40'}}>Advanced Filters</h3>
              <button onClick={() => setIsFilterModalOpen(false)} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6c757d'}}>&times;</button>
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px'}}>
              <div>
                <label style={styles.label}>Level</label>
                <select className="form-control" value={filterParams.level} onChange={e => setFilterParams({...filterParams, level: e.target.value})}>
                  <option value="">All Levels</option>
                  <option value="100">100 Level</option>
                  <option value="200">200 Level</option>
                  <option value="300">300 Level</option>
                  <option value="400">400 Level</option>
                  <option value="500">500 Level</option>
                </select>
              </div>
              
              <div>
                <label style={styles.label}>Semester</label>
                <select className="form-control" value={filterParams.semester} onChange={e => setFilterParams({...filterParams, semester: e.target.value})}>
                  <option value="">All Semesters</option>
                  <option value="First Semester">First Semester</option>
                  <option value="Second Semester">Second Semester</option>
                </select>
              </div>

              <div>
                <label style={styles.label}>Session</label>
                <select className="form-control" value={filterParams.session} onChange={e => setFilterParams({...filterParams, session: e.target.value})}>
                  <option value="">All Sessions</option>
                  <option value="2026/2027">2026/2027</option>
                  <option value="2025/2026">2025/2026</option>
                </select>
              </div>

              <div>
                <label style={styles.label}>Venue</label>
                <select className="form-control" value={filterParams.venue_id} onChange={e => setFilterParams({...filterParams, venue_id: e.target.value})}>
                  <option value="">All Venues</option>
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{gridColumn: '1 / -1'}}>
                <label style={styles.label}>Course</label>
                <select className="form-control" value={filterParams.course_id} onChange={e => setFilterParams({...filterParams, course_id: e.target.value})}>
                  <option value="">All Courses</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.course_code} - {c.course_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setFilterParams({level: '', semester: '', venue_id: '', session: '', status: '', course_id: ''})}
              >
                Clear Filters
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setIsFilterModalOpen(false)}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  th: {
    padding: '15px', background: '#f8f9fa', borderBottom: '2px solid #ddd', color: '#555', textAlign: 'center', width: '18%'
  },
  timeLabel: {
    padding: '15px', borderRight: '1px solid #ddd', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#777', textAlign: 'center', width: '10%'
  },
  td: {
    padding: '10px', borderRight: '1px solid #eee', borderBottom: '1px solid #eee', verticalAlign: 'top', height: '100px'
  },
  slot: {
    background: 'var(--primary-color)', color: 'white', padding: '8px', borderRadius: '8px', marginBottom: '8px', fontSize: '0.85rem', position: 'relative', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  slotHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '3px'
  },
  slotBody: {
    opacity: 0.9, lineHeight: '1.4'
  },
  deleteBtn: {
    background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.7, padding: 0
  },
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  modal: {
    background: 'white', padding: '30px', borderRadius: '12px', width: '500px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
  },
  closeBtn: {
    background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888'
  }
};

export default ManageTimetables;
