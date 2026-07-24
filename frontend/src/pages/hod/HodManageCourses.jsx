import React, { useState, useEffect, useMemo, useContext } from 'react';
import axios from 'axios';
import { 
  BookOpen, Plus, Search, Filter, Upload, Download, 
  Trash2, Edit3, Archive, RefreshCw, Users, Clock
} from 'lucide-react';
import { SettingsContext } from '../../context/SettingsContext';

const HodManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  
  // HOD specific info
  const hodUser = JSON.parse(localStorage.getItem('user'));
  const deptId = hodUser?.department_id;

  // Form State
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [creditUnit, setCreditUnit] = useState(2);
  const [level, setLevel] = useState('');
  const [semester, setSemester] = useState(1);
  const [studentPopulation, setStudentPopulation] = useState(0);
  const [examDuration, setExamDuration] = useState(120);
  const [courseType, setCourseType] = useState('Written');
  
  // CSV State
  const [csvFile, setCsvFile] = useState(null);

  const fetchData = async () => {
    try {
      const res = await axios.get(`/api/courses.php?department_id=${deptId}`);
      if (res.data.success) setCourses(res.data.data);
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
    if (!courseCode.trim() || !courseName.trim()) return;

    try {
      const payload = {
        course_code: courseCode,
        course_name: courseName,
        credit_unit: parseInt(creditUnit),
        level,
        semester: parseInt(semester),
        student_population: parseInt(studentPopulation),
        exam_duration: parseInt(examDuration),
        course_type: courseType,
        department_id: deptId
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

  const handleToggleArchive = async (course) => {
    try {
      await axios.put('/api/courses.php', { id: course.id, is_active: !course.is_active });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this course permanently? This cannot be undone.')) {
      try {
        await axios.delete('/api/courses.php', { data: { id } });
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const rows = text.split('\n');
      // basic CSV parsing assuming Code,Name,Unit,Level,Semester,Population,Duration,Type
      const successArr = [];
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue;
        const cols = rows[i].split(',').map(c => c.trim());
        if (cols.length >= 2) {
          try {
            await axios.post('/api/courses.php', {
              course_code: cols[0],
              course_name: cols[1],
              credit_unit: parseInt(cols[2]) || 2,
              level: cols[3] || '100',
              semester: parseInt(cols[4]) || 1,
              student_population: parseInt(cols[5]) || 0,
              exam_duration: parseInt(cols[6]) || 120,
              course_type: cols[7] || 'Written',
              department_id: deptId
            });
            successArr.push(cols[0]);
          } catch(err) {
            console.error('Failed on row', i, err);
          }
        }
      }
      alert(`Successfully imported ${successArr.length} courses!`);
      setIsUploadModalOpen(false);
      fetchData();
    };
    reader.readAsText(csvFile);
  };

  const exportCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,Code,Name,Unit,Level,Semester,Population,Duration,Type\n";
    courses.forEach(c => {
      csvContent += `${c.course_code},"${c.course_name}",${c.credit_unit},${c.level},${c.semester},${c.student_population || 0},${c.exam_duration || 120},${c.course_type || 'Written'}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "department_courses.csv");
    document.body.appendChild(link);
    link.click();
  };

  const resetForm = () => {
    setEditingCourse(null);
    setCourseCode('');
    setCourseName('');
    setCreditUnit(2);
    setLevel('100');
    setSemester(1);
    setStudentPopulation(0);
    setExamDuration(120);
    setCourseType('Written');
  };

  const openModal = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setCourseCode(course.course_code);
      setCourseName(course.course_name);
      setCreditUnit(course.credit_unit);
      setLevel(course.level || '');
      setSemester(course.semester || 1);
      setStudentPopulation(course.student_population || 0);
      setExamDuration(course.exam_duration || 120);
      setCourseType(course.course_type || 'Written');
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchSearch = c.course_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.course_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLevel = filterLevel ? c.level === filterLevel : true;
      const matchSemester = filterSemester ? c.semester.toString() === filterSemester : true;
      return matchSearch && matchLevel && matchSemester;
    });
  }, [courses, searchTerm, filterLevel, filterSemester]);

  return (
    <div className="hod-manage-courses fade-in" style={{padding: '20px', color: '#2c3e50'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
        <div>
          <h1 style={{fontSize: '1.8rem', color: '#1a252f', margin: '0 0 5px 0', fontWeight: 700}}>Department Courses</h1>
          <p style={{color: '#64748b', margin: 0}}>Manage curriculum, student populations, and exam formats for your department.</p>
        </div>
        <div style={{display: 'flex', gap: '10px'}}>
          <button className="btn-premium outline" onClick={exportCsv} style={{background: 'white', border: '1px solid #cbd5e1', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <Download size={18} /> Export CSV
          </button>
          <button className="btn-premium outline" onClick={() => setIsUploadModalOpen(true)} style={{background: 'white', border: '1px solid #cbd5e1', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <Upload size={18} /> Bulk Import
          </button>
          <button className="btn-premium primary" onClick={() => openModal()} style={{background: '#0f172a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold'}}>
            <Plus size={18} /> Add Single Course
          </button>
        </div>
      </div>

      <div className="premium-card" style={{background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', overflow: 'hidden'}}>
        <div className="card-toolbar" style={{padding: '20px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc', display: 'flex', gap: '15px'}}>
          <div className="search-wrapper" style={{position: 'relative', flex: 1, maxWidth: '400px'}}>
            <Search size={18} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8'}} />
            <input 
              type="text" 
              placeholder="Search course code or title..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box'}}
            />
          </div>
          
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} style={{padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1'}}>
            <option value="">All Levels</option>
            <option value="ND 1">ND 1</option>
            <option value="ND 2">ND 2</option>
            <option value="HND 1">HND 1</option>
            <option value="HND 2">HND 2</option>
          </select>

          <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)} style={{padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1'}}>
            <option value="">All Semesters</option>
            <option value="1">1st Semester</option>
            <option value="2">2nd Semester</option>
          </select>
        </div>
        
        {loading ? (
          <div style={{padding: '40px', textAlign: 'center'}}>Loading courses...</div>
        ) : (
          <div className="table-responsive">
            <table className="premium-table" style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr>
                  <th style={thStyle}>Course Code</th>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Level & Sem</th>
                  <th style={thStyle}>Exam Details</th>
                  <th style={thStyle}>Status</th>
                  <th style={{...thStyle, textAlign: 'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.length > 0 ? filteredCourses.map(c => (
                  <tr key={c.id} style={{borderBottom: '1px solid #f1f5f9', background: c.is_active ? 'white' : '#f8fafc', opacity: c.is_active ? 1 : 0.7}}>
                    <td style={tdStyle}>
                      <span style={{fontWeight: 700, color: '#0f172a'}}>{c.course_code}</span>
                      <div style={{fontSize: '0.75rem', color: '#64748b', marginTop: '4px'}}>{c.credit_unit} Units</div>
                    </td>
                    <td style={tdStyle}><span style={{fontWeight: 500, color: '#334155'}}>{c.course_name}</span></td>
                    <td style={tdStyle}>
                      <span style={{background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', marginRight: '5px'}}>{c.level || 'N/A'}</span>
                      <span style={{background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem'}}>Sem {c.semester}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                        <span style={{display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#475569'}}><Users size={14}/> {c.student_population || 0}</span>
                        <span style={{display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#475569'}}><Clock size={14}/> {c.exam_duration || 120}m</span>
                        <span style={{background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem'}}>{c.course_type}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {c.is_active 
                        ? <span style={{color: '#16a34a', background: '#f0fdf4', padding: '4px 8px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600}}>Active</span>
                        : <span style={{color: '#64748b', background: '#e2e8f0', padding: '4px 8px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600}}>Archived</span>
                      }
                    </td>
                    <td style={{...tdStyle, textAlign: 'right'}}>
                      <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                        <button onClick={() => openModal(c)} style={actionBtnStyle} title="Edit"><Edit3 size={16} color="#64748b" /></button>
                        <button onClick={() => handleToggleArchive(c)} style={actionBtnStyle} title={c.is_active ? "Archive" : "Restore"}>
                          {c.is_active ? <Archive size={16} color="#f59e0b" /> : <RefreshCw size={16} color="#10b981" />}
                        </button>
                        <button onClick={() => handleDelete(c.id)} style={actionBtnStyle} title="Delete"><Trash2 size={16} color="#ef4444" /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" style={{textAlign: 'center', padding: '50px', color: '#64748b'}}>
                      <BookOpen size={40} style={{opacity: 0.2, marginBottom: '10px'}} />
                      <p>No courses found for your department.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle} className="slideUp">
            <div style={modalHeaderStyle}>
              <h2 style={{margin: 0, fontSize: '1.25rem'}}>{editingCourse ? 'Edit Course' : 'Add New Course'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8'}}>×</button>
            </div>
            
            <form onSubmit={handleSave} style={{padding: '25px'}}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                <div style={{gridColumn: '1 / -1'}}>
                  <label style={labelStyle}>Course Title *</label>
                  <input type="text" value={courseName} onChange={(e) => setCourseName(e.target.value)} required style={inputStyle} placeholder="E.g. Introduction to Programming" />
                </div>
                
                <div>
                  <label style={labelStyle}>Course Code *</label>
                  <input type="text" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} required style={inputStyle} placeholder="E.g. COM111" />
                </div>
                
                <div>
                  <label style={labelStyle}>Credit Units *</label>
                  <input type="number" value={creditUnit} onChange={(e) => setCreditUnit(e.target.value)} min="1" max="6" required style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Level</label>
                  <select value={level} onChange={(e) => setLevel(e.target.value)} style={inputStyle}>
                    <option value="ND 1">ND 1</option>
                    <option value="ND 2">ND 2</option>
                    <option value="HND 1">HND 1</option>
                    <option value="HND 2">HND 2</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Semester</label>
                  <select value={semester} onChange={(e) => setSemester(e.target.value)} style={inputStyle}>
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                  </select>
                </div>

                {/* New HOD Details */}
                <div style={{gridColumn: '1 / -1', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '10px'}}>
                  <h4 style={{margin: '0 0 15px 0', color: '#334155'}}>Examination Details</h4>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px'}}>
                    <div>
                      <label style={labelStyle}>Est. Population</label>
                      <input type="number" value={studentPopulation} onChange={(e) => setStudentPopulation(e.target.value)} min="0" style={inputStyle} placeholder="E.g. 150" />
                    </div>
                    <div>
                      <label style={labelStyle}>Exam Duration (Mins)</label>
                      <input type="number" value={examDuration} onChange={(e) => setExamDuration(e.target.value)} min="30" step="15" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Exam Format</label>
                      <select value={courseType} onChange={(e) => setCourseType(e.target.value)} style={inputStyle}>
                        <option value="Written">Written</option>
                        <option value="CBT">CBT</option>
                        <option value="Practical">Practical</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>

              <div style={{marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{padding: '10px 20px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600}}>Cancel</button>
                <button type="submit" style={{padding: '10px 20px', background: '#0f172a', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600}}>Save Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK UPLOAD CSV MODAL */}
      {isUploadModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={{...modalStyle, maxWidth: '500px'}} className="slideUp">
            <div style={modalHeaderStyle}>
              <h2 style={{margin: 0, fontSize: '1.25rem'}}>Bulk Import Courses</h2>
              <button onClick={() => setIsUploadModalOpen(false)} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8'}}>×</button>
            </div>
            <form onSubmit={handleCsvUpload} style={{padding: '25px'}}>
              <div style={{background: '#eff6ff', border: '1px solid #bfdbfe', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', color: '#1e40af'}}>
                <strong>💡 CSV Upload Guide:</strong> Ensure your file is a standard `.csv` with columns exactly in this order (No headers needed, or skip first row):<br/>
                <code>Code, Name, Unit, Level, Semester, Population, Duration, Type</code><br/>
                Example: <code>COM111, Intro to IT, 3, ND 1, 1, 150, 120, CBT</code>
              </div>
              <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} style={{width: '100%', padding: '10px', border: '1px dashed #cbd5e1', borderRadius: '8px'}} required />
              <div style={{marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
                <button type="button" onClick={() => setIsUploadModalOpen(false)} style={{padding: '10px 20px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600}}>Cancel</button>
                <button type="submit" style={{padding: '10px 20px', background: '#3b82f6', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600}}>Import CSV</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`
        .slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

// Styles to keep the component fully contained without complex external CSS tracking
const thStyle = { padding: '15px 20px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #f1f5f9' };
const tdStyle = { padding: '15px 20px', verticalAlign: 'middle' };
const actionBtnStyle = { width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'white' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalStyle = { background: 'white', width: '100%', maxWidth: '650px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden' };
const modalHeaderStyle = { padding: '20px 25px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbfc' };
const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' };

export default HodManageCourses;
