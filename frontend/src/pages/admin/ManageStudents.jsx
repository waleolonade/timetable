import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { Search, Plus, Trash2, Filter, Upload, Download } from 'lucide-react';

const ManageStudents = () => {
  const { user } = useContext(AuthContext);
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
    level: '100',
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
        setFormData({ first_name: '', last_name: '', matric_no: '', email: '', level: '100', programme: '', department_id: user?.role?.toLowerCase() === 'hod' ? user?.department_id : selectedDept });
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
    <div className="manage-students">
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>Student Management</h1>
          <p>Manage students, bulk upload from CSV, and filter by level.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Upload size={16} style={{marginRight: '5px'}}/> Bulk Import
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleBulkUpload} />
          </label>
          <button className="btn btn-secondary" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center' }}>
            <Download size={16} style={{marginRight: '5px'}}/> Export
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center' }}>
            <Plus size={16} style={{marginRight: '5px'}}/> Add Student
          </button>
        </div>
      </div>

      <div className="card dashboard-card">
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: '#888' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by name or matric no..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '35px' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '15px' }}>
            {user?.role?.toLowerCase() !== 'hod' && (
              <select className="form-control" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                <option value="">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
              </select>
            )}
            
            <select className="form-control" value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
              <option value="">All Levels</option>
              <option value="100">100 Level</option>
              <option value="200">200 Level</option>
              <option value="300">300 Level</option>
              <option value="400">400 Level</option>
              <option value="500">500 Level</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center' }}>Loading...</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Matric No</th>
                  <th>Name</th>
                  <th>Level</th>
                  <th>Programme</th>
                  {user?.role?.toLowerCase() !== 'hod' && <th>Department</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id}>
                    <td><strong>{student.matric_no}</strong></td>
                    <td>{student.first_name} {student.last_name}</td>
                    <td>{student.level}</td>
                    <td>{student.programme}</td>
                    {user?.role?.toLowerCase() !== 'hod' && <td>{student.department_name}</td>}
                    <td>
                      <button onClick={() => handleDelete(student.user_id)} className="btn btn-sm btn-outline-danger" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr><td colSpan={user?.role?.toLowerCase() !== 'hod' ? 6 : 5} style={{textAlign: 'center', padding: '20px'}}>No students found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={styles.overlay}>
          <div style={styles.modal} className="slideDown">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h3 style={{margin: 0}}>Add Student</h3>
              <button onClick={() => setIsModalOpen(false)} style={styles.closeBtn}>&times;</button>
            </div>
            
            {error && <div className="alert alert-danger">{error}</div>}
            
            <form onSubmit={handleSave}>
              <div style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
                <div style={{flex: 1}}>
                  <label>First Name</label>
                  <input type="text" className="form-control" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} required />
                </div>
                <div style={{flex: 1}}>
                  <label>Last Name</label>
                  <input type="text" className="form-control" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} required />
                </div>
              </div>

              <div style={{marginBottom: '15px'}}>
                <label>Matric No</label>
                <input type="text" className="form-control" value={formData.matric_no} onChange={e => setFormData({...formData, matric_no: e.target.value})} required />
              </div>

              <div style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
                <div style={{flex: 1}}>
                  <label>Level</label>
                  <select className="form-control" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} required>
                    <option value="100">100</option>
                    <option value="200">200</option>
                    <option value="300">300</option>
                    <option value="400">400</option>
                    <option value="500">500</option>
                  </select>
                </div>
                <div style={{flex: 1}}>
                  <label>Programme</label>
                  <input type="text" className="form-control" placeholder="e.g. BSc Computer Science" value={formData.programme} onChange={e => setFormData({...formData, programme: e.target.value})} required />
                </div>
              </div>

              {user?.role?.toLowerCase() !== 'hod' && (
                <div style={{marginBottom: '20px'}}>
                  <label>Department</label>
                  <select className="form-control" value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})} required>
                    <option value="">-- Select --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                  </select>
                </div>
              )}

              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'white', padding: '30px', borderRadius: '12px', width: '450px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888' }
};

export default ManageStudents;
