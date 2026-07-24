import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { SettingsContext } from '../../context/SettingsContext';
import { Zap, Download, FileText, CheckCircle, Edit2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]; // 8 AM to 5 PM

const HodTimetables = () => {
  const { settings } = useContext(SettingsContext);
  const gridRef = useRef(null);
  
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [timetables, setTimetables] = useState([]);
  const [deptInfo, setDeptInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // New States for Edit Modal
  const [classrooms, setClassrooms] = useState([]);
  const [invigilators, setInvigilators] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [editFormData, setEditFormData] = useState({
    classroom_id: '',
    start_time: '',
    end_time: '',
    invigilator_id: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      if (user && user.department_id) {
        const [ttRes, statsRes, classRes, invigRes] = await Promise.all([
          axios.get(`/api/timetables.php?department_id=${user.department_id}`),
          axios.get(`/api/hod_stats.php?department_id=${user.department_id}`),
          axios.get(`/api/classrooms.php?department_id=${user.department_id}`),
          axios.get(`/api/lecturers.php?department_id=${user.department_id}`)
        ]);
        if (ttRes.data.success) {
          setTimetables(ttRes.data.data);
        }
        if (statsRes.data.success) {
          setDeptInfo(statsRes.data.data.department);
        }
        if (classRes.data.success) {
          setClassrooms(classRes.data.data);
        }
        if (invigRes.data.success) {
          setInvigilators(invigRes.data.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.department_id]);

  // Helper to format time (e.g., "08:00:00" -> "8:00 AM")
  const formatTime = (timeStr) => {
    const [h, m] = timeStr.split(':');
    let val = parseInt(h);
    let ampm = val >= 12 ? 'PM' : 'AM';
    val = val % 12 || 12;
    return `${val}:${m} ${ampm}`;
  };

  const handleAutoGenerate = async () => {
    if (window.confirm('WARNING: Auto-Generating will clear your department\'s current schedule slots and automatically rebuild the timetable. Do you wish to proceed?')) {
      setLoading(true);
      try {
        const payload = {
          semester: settings.current_semester,
          session: settings.current_session,
          department_id: user.department_id
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

  const handleSubmitForApproval = async () => {
    if (window.confirm('Are you sure you want to submit the timetable for Admin approval?')) {
      try {
        const res = await axios.post('/api/timetables.php?action=submit', { department_id: user.department_id });
        if (res.data.success) {
          alert('Timetable successfully submitted for approval!');
          fetchData();
        } else {
          alert(res.data.message);
        }
      } catch (err) {
        alert('Failed to submit timetable.');
      }
    }
  };

  const openEditModal = (slot) => {
    setEditingSlot(slot);
    setEditFormData({
      classroom_id: slot.classroom_id,
      start_time: slot.start_time,
      end_time: slot.end_time,
      invigilator_id: slot.invigilator_id || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSlotSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        id: editingSlot.id,
        course_id: editingSlot.course_id,
        day_of_week: editingSlot.day_of_week,
        classroom_id: editFormData.classroom_id,
        start_time: editFormData.start_time,
        end_time: editFormData.end_time,
        invigilator_id: editFormData.invigilator_id
      };
      const res = await axios.put('/api/timetables.php', payload);
      if (res.data.success) {
        setIsEditModalOpen(false);
        fetchData();
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert('Failed to update slot.');
    }
  };

  const exportPDF = async () => {
    if (!gridRef.current) return;
    try {
      const canvas = await html2canvas(gridRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      // Add text in center
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text(settings.institution_name || 'Institution Timetable', pdfWidth / 2, 15, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      pdf.text(`${deptInfo?.name || 'Department'} - Timetable (${settings.current_session || 'Session'})`, pdfWidth / 2, 22, { align: 'center' });

      // Add Department Logo on Left
      if (deptInfo?.logo_url) {
        // Simple heuristic to detect MIME, jsPDF auto-detects if you just pass base64
        pdf.addImage(deptInfo.logo_url, 'PNG', 15, 5, 20, 20);
      }
      
      // Add Institution Logo on Right
      if (settings.institution_logo) {
        pdf.addImage(settings.institution_logo, 'PNG', pdfWidth - 35, 5, 20, 20);
      }

      // Calculate grid height to fit remaining space
      const availableWidth = pdfWidth - 20; // 10mm margin on each side
      const imgProps = pdf.getImageProperties(imgData);
      const pdfGridHeight = (imgProps.height * availableWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 10, 30, availableWidth, pdfGridHeight);
      pdf.save(`Dept_Timetable_${settings.current_session?.replace('/', '-') || 'export'}.pdf`);
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
    link.setAttribute("download", `Dept_Timetable.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="manage-timetables fade-in">
      <div className="content-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', gap: '20px' }}>
        <div>
          <h1 style={{color: '#0f172a', margin: '0 0 5px 0'}}>Department Timetable</h1>
          <p style={{color: '#64748b', margin: 0}}>View, generate, and export the official schedule for your department.</p>
        </div>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          
          <button className="btn-premium" onClick={handleAutoGenerate} style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', color: 'white', display: 'flex', alignItems: 'center', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)', transition: 'transform 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Zap size={18} style={{marginRight: '8px'}}/> Generate Timetable
          </button>

          <button className="btn-premium" onClick={handleSubmitForApproval} style={{ background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)', transition: 'transform 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <CheckCircle size={18} style={{marginRight: '8px'}}/> Submit for Approval
          </button>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn" onClick={exportPDF} title="Download PDF" style={{ display: 'flex', alignItems: 'center', padding: '10px 15px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', cursor: 'pointer' }}>
              <Download size={18} style={{marginRight: '5px'}}/> PDF
            </button>
            <button className="btn" onClick={exportCSV} title="Download CSV/Excel" style={{ display: 'flex', alignItems: 'center', padding: '10px 15px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', cursor: 'pointer' }}>
              <FileText size={18} style={{marginRight: '5px'}}/> CSV
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-card" style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>
            <div style={{width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px'}}></div>
            Generating AI Timetable Layout...
          </div>
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
                            <div key={slot.id} className="timetable-slot" style={styles.slot} onClick={() => openEditModal(slot)}>
                              <div style={styles.slotHeader}>
                                <strong style={{fontSize: '0.9rem'}}>{slot.course_code}</strong>
                                <span style={{fontSize: '0.7rem', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '10px'}}>
                                  Lvl {slot.level}
                                </span>
                              </div>
                              <div style={styles.slotBody}>
                                <div style={{fontWeight: 'bold', marginBottom: '3px'}}>{slot.room_name} (Cap: {slot.room_capacity})</div>
                                <div style={{fontSize: '0.75rem', opacity: 0.9, marginBottom: '3px'}}>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</div>
                                {slot.invigilator_name && (
                                  <div style={{fontSize: '0.7rem', background: 'rgba(0,0,0,0.1)', padding: '2px 5px', borderRadius: '4px', display: 'inline-block'}}>
                                    Invigilator: {slot.invigilator_name}
                                  </div>
                                )}
                              </div>
                              <div className="edit-overlay" style={styles.editOverlay}>
                                <Edit2 size={16} /> Edit Slot
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

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="slideUp">
            <div style={styles.modalHeader}>
              <h3 style={{margin: 0}}>Edit Timetable Slot</h3>
              <button onClick={() => setIsEditModalOpen(false)} style={styles.closeBtn}>×</button>
            </div>
            <form onSubmit={handleEditSlotSubmit} style={{padding: '20px'}}>
              <div style={{marginBottom: '15px'}}>
                <label style={styles.label}>Course</label>
                <input type="text" value={`${editingSlot?.course_code} - ${editingSlot?.course_name}`} disabled style={{...styles.input, background: '#f1f5f9'}} />
              </div>
              
              <div style={{marginBottom: '15px'}}>
                <label style={styles.label}>Venue / Classroom</label>
                <select value={editFormData.classroom_id} onChange={(e) => setEditFormData({...editFormData, classroom_id: e.target.value})} required style={styles.input}>
                  <option value="">Select Venue</option>
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (Cap: {c.capacity})</option>
                  ))}
                </select>
              </div>

              <div style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
                <div style={{flex: 1}}>
                  <label style={styles.label}>Start Time</label>
                  <input type="time" value={editFormData.start_time} onChange={(e) => setEditFormData({...editFormData, start_time: e.target.value})} required style={styles.input} />
                </div>
                <div style={{flex: 1}}>
                  <label style={styles.label}>End Time</label>
                  <input type="time" value={editFormData.end_time} onChange={(e) => setEditFormData({...editFormData, end_time: e.target.value})} required style={styles.input} />
                </div>
              </div>

              <div style={{marginBottom: '20px'}}>
                <label style={styles.label}>Allocate Invigilator</label>
                <select value={editFormData.invigilator_id} onChange={(e) => setEditFormData({...editFormData, invigilator_id: e.target.value})} style={styles.input}>
                  <option value="">-- No Invigilator Assigned --</option>
                  {invigilators.map(i => (
                    <option key={i.id} value={i.id}>{i.name} ({i.department_name})</option>
                  ))}
                </select>
              </div>

              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{padding: '10px 15px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '6px', cursor: 'pointer'}}>Cancel</button>
                <button type="submit" style={{padding: '10px 15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .timetable-slot { cursor: pointer; overflow: hidden; }
        .timetable-slot:hover .edit-overlay { opacity: 1; }
      `}</style>
    </div>
  );
};

const styles = {
  th: {
    padding: '15px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'center', width: '15%', fontWeight: '600'
  },
  timeLabel: {
    padding: '15px', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', color: '#64748b', textAlign: 'center', width: '10%', background: '#f8fafc'
  },
  td: {
    padding: '10px', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', height: '110px'
  },
  slot: {
    background: '#10b981', color: 'white', padding: '10px', borderRadius: '8px', marginBottom: '8px', position: 'relative', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)', borderLeft: '4px solid #047857'
  },
  slotHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '5px', borderBottom: '1px solid rgba(255,255,255,0.2)'
  },
  slotBody: {
    lineHeight: '1.4'
  },
  editOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', opacity: 0, transition: 'opacity 0.2s', gap: '5px'
  },
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
  },
  modalContent: {
    background: 'white', width: '100%', maxWidth: '500px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden'
  },
  modalHeader: {
    padding: '20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  closeBtn: {
    background: 'none', border: 'none', fontSize: '24px', color: '#64748b', cursor: 'pointer', lineHeight: 1
  },
  label: {
    display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '5px'
  },
  input: {
    width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem'
  }
};

export default HodTimetables;
