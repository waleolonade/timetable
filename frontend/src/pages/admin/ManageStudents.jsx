import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Trash2, Filter, Upload, Download } from 'lucide-react';

const ManageStudents = () => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDept, setSelectedDept] = useState(user?.role?.toLowerCase() === 'hod' ? user?.department_id : '');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    matric_no: '',
    email: '',
    level: 'ND 1',
    programme: '',
    department_id: user?.role?.toLowerCase() === 'hod' ? user?.department_id : ''
  });
  const [error, setError] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      let url = `/api/students.php?`;
      if (selectedDept) url += `department_id=${selectedDept}&`;
      if (selectedLevel) url += `level=${selectedLevel}`;

      const res = await axios.get(url);
      if (res.data.success) {
        setStudents(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('/api/departments.php');
      if (res.data.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [selectedDept, selectedLevel]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...formData };
      if (!payload.department_id) payload.department_id = selectedDept;

      const res = await axios.post('/api/students.php', payload);
      if (res.data.success) {
        setIsModalOpen(false);
        setFormData({ first_name: '', last_name: '', matric_no: '', email: '', level: 'ND 1', programme: '', department_id: user?.role?.toLowerCase() === 'hod' ? user?.department_id : selectedDept });
        fetchStudents();
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError('Server error.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this student? This will remove all their course registrations.')) {
      try {
        const res = await axios.delete('/api/students.php', { data: { id } });
        if (res.data.success) {
          fetchStudents();
        } else {
          alert(res.data.message);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!selectedDept && user?.role?.toLowerCase() !== 'hod') {
        alert("Please select a department first before importing.");
        return;
    }

    const deptId = user?.role?.toLowerCase() === 'hod' ? user?.department_id : selectedDept;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
        const headers = rows[0].map(h => h.toLowerCase());
        
        const payload = rows.slice(1).filter(row => row.length > 1).map(row => {
          const obj = { department_id: deptId };
          headers.forEach((header, i) => { obj[header] = row[i]; });
          return obj;
        });

        const res = await axios.post('/api/students.php?action=bulk_import', payload);
        alert(res.data.message);
        fetchStudents();
      } catch (err) {
        alert("Error parsing or uploading file.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  const exportCSV = () => {
    if (students.length === 0) {
      alert("No data to export");
      return;
    }
    const headers = ['Matric No', 'First Name', 'Last Name', 'Level', 'Programme', 'Department'];
    const rows = students.map(s => [
      s.matric_no, s.first_name, s.last_name, s.level, s.programme, s.department_name
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Students_List.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = students.filter(s => 
    (s.matric_no && s.matric_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.first_name && s.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.last_name && s.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="manage-students fade-in" style={{padding: '20px', color: '#2c3e50'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
        <div>
          <h1 style={{fontSize: '1.8rem', color: '#1a252f', margin: '0 0 5px 0', fontWeight: 700}}>Student Management</h1>
          <p style={{color: '#64748b', margin: 0}}>Manage students, bulk upload from CSV, and filter by level.</p>
        </div>
        <div style={{display: 'flex', gap: '10px'}}>
          <label className="btn-premium outline" style={{background: 'white', border: '1px solid #cbd5e1', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <Upload size={18} /> Bulk Import
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleBulkUpload} />
          </label>
          <button className="btn-premium outline" onClick={exportCSV} style={{background: 'white', border: '1px solid #cbd5e1', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <Download size={18} /> Export
          </button>
          <button className="btn-premium primary" onClick={() => setIsModalOpen(true)} style={{background: '#0f172a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold'}}>
            <Plus size={18} /> Add Student
          </button>
        </div>
      </div>

      <div className="premium-card" style={{background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', overflow: 'hidden'}}>
        <div className="card-toolbar" style={{padding: '20px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc', display: 'flex', gap: '15px'}}>
          <div className="search-wrapper" style={{position: 'relative', flex: 1, maxWidth: '400px'}}>
            <Search size={18} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8'}} />
            <input 
              type="text" 
              placeholder="Search by name or matric no..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box'}}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '15px' }}>
            {user?.role?.toLowerCase() !== 'hod' && (
              <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} style={{padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1'}}>
                <option value="">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
              </select>
            )}
            
            <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} style={{padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1'}}>
              <option value="">All Levels</option>
              <option value="ND 1">ND 1</option>
              <option value="ND 2">ND 2</option>
              <option value="HND 1">HND 1</option>
              <option value="HND 2">HND 2</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center' }}>Loading...</div>
        ) : (
          <div className="table-responsive">
            <table className="premium-table" style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr>
                  <th style={thStyle}>Matric No</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Level</th>
                  <th style={thStyle}>Programme</th>
                  {user?.role?.toLowerCase() !== 'hod' && <th style={thStyle}>Department</th>}
                  <th style={{...thStyle, textAlign: 'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id} style={{borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s'}}>
                    <td style={tdStyle}>
                      <span style={{fontWeight: 700, color: '#0f172a'}}>{student.matric_no}</span>
                    </td>
                    <td style={tdStyle}><span style={{fontWeight: 500, color: '#334155'}}>{student.first_name} {student.last_name}</span></td>
                    <td style={tdStyle}>
                      <span style={{background: '#e0e7ff', color: '#3730a3', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600}}>
                        {student.level}
                      </span>
                    </td>
                    <td style={tdStyle}>{student.programme}</td>
                    {user?.role?.toLowerCase() !== 'hod' && <td style={tdStyle}>{student.department_name}</td>}
                    <td style={{...tdStyle, textAlign: 'right'}}>
                      <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                        <button onClick={() => handleDelete(student.user_id)} style={actionBtnStyle} title="Delete">
                          <Trash2 size={16} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr><td colSpan={user?.role?.toLowerCase() !== 'hod' ? 6 : 5} style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>No students found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle} className="slideDown">
            <div style={modalHeaderStyle}>
              <h2 style={{margin: 0, fontSize: '1.25rem', color: '#1a252f'}}>Add Student</h2>
              <button onClick={() => setIsModalOpen(false)} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8'}}>&times;</button>
            </div>
            
            <form onSubmit={handleSave} style={{padding: '25px'}}>
              {error && <div className="alert alert-danger" style={{padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem'}}>{error}</div>}
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                <div>
                  <label style={labelStyle}>First Name *</label>
                  <input type="text" style={inputStyle} value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} required placeholder="E.g. John" />
                </div>
                <div>
                  <label style={labelStyle}>Last Name *</label>
                  <input type="text" style={inputStyle} value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} required placeholder="E.g. Doe" />
                </div>
              </div>

              <div style={{marginTop: '20px'}}>
                <label style={labelStyle}>Matric No *</label>
                <input type="text" style={inputStyle} value={formData.matric_no} onChange={e => setFormData({...formData, matric_no: e.target.value})} required placeholder="E.g. CS/2026/001" />
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px'}}>
                <div>
                  <label style={labelStyle}>Level *</label>
                  <select style={inputStyle} value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} required>
                    <option value="ND 1">ND 1</option>
                    <option value="ND 2">ND 2</option>
                    <option value="HND 1">HND 1</option>
                    <option value="HND 2">HND 2</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Programme *</label>
                  <input type="text" style={inputStyle} placeholder="E.g. BSc Computer Science" value={formData.programme} onChange={e => setFormData({...formData, programme: e.target.value})} required />
                </div>
              </div>

              {user?.role?.toLowerCase() !== 'hod' && (
                <div style={{marginTop: '20px'}}>
                  <label style={labelStyle}>Department *</label>
                  <select style={inputStyle} value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})} required>
                    <option value="">-- Select Department --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                  </select>
                </div>
              )}

              <div style={{marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{padding: '10px 20px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600}}>Cancel</button>
                <button type="submit" style={{padding: '10px 20px', background: '#0f172a', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600}}>Add Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalStyle = { background: 'white', width: '100%', maxWidth: '600px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden' };
const modalHeaderStyle = { padding: '20px 25px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbfc' };
const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box', background: '#f8fafc' };

const thStyle = { padding: '15px 20px', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' };
const tdStyle = { padding: '15px 20px', borderBottom: '1px solid #f1f5f9', color: '#334155', fontSize: '0.95rem' };
const actionBtnStyle = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' };

export default ManageStudents;
