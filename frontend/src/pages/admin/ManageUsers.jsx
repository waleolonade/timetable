import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Search, Plus, Shield, UserX, UserCheck, 
  KeyRound, Edit3, Trash2, ShieldAlert,
  Building, CheckCircle2, XCircle
} from 'lucide-react';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Form state
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('hod');
  const [departmentId, setDepartmentId] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const fetchData = async () => {
    try {
      const [usersRes, deptRes] = await Promise.all([
        axios.get('/api/users.php'),
        axios.get('/api/departments.php')
      ]);
      if (usersRes.data.success) setUsers(usersRes.data.data);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
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
    if (!username.trim() || (!editingUser && !password.trim())) return;
    if (role === 'hod' && !departmentId) {
      alert("HOD must be assigned to a department.");
      return;
    }

    try {
      const payload = {
        username,
        full_name: fullName,
        role,
        department_id: role === 'admin' ? null : departmentId
      };

      if (editingUser) {
        await axios.put('/api/users.php', { id: editingUser.id, ...payload });
      } else {
        await axios.post('/api/users.php', { ...payload, password });
      }
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (user) => {
    if (user.role === 'admin' && users.filter(u => u.role === 'admin' && u.is_active).length <= 1 && user.is_active) {
      alert("Cannot disable the last active administrator.");
      return;
    }
    
    try {
      await axios.put('/api/users.php', { id: user.id, is_active: !user.is_active });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) return;

    try {
      await axios.put('/api/users.php', { 
        id: editingUser.id, 
        action: 'reset_password',
        password: newPassword
      });
      setIsResetModalOpen(false);
      setNewPassword('');
      setEditingUser(null);
      
      // Temporary success toast equivalent
      alert(`Password for ${editingUser.username} successfully reset.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, userRole) => {
    if (userRole === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
      alert("Cannot delete the last administrator.");
      return;
    }
    if (window.confirm('Are you sure you want to completely delete this user? It is highly recommended to LOCK the account instead to preserve history.')) {
      try {
        await axios.delete('/api/users.php', { data: { id } });
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setUsername('');
    setFullName('');
    setPassword('');
    setRole('hod');
    setDepartmentId('');
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUsername(user.username);
      setFullName(user.full_name || '');
      setRole(user.role);
      setDepartmentId(user.department_id || '');
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const openResetModal = (user) => {
    setEditingUser(user);
    setNewPassword('');
    setIsResetModalOpen(true);
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(u => 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.department_name && u.department_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, searchTerm]);

  const activeCount = users.filter(u => u.is_active).length;
  const lockedCount = users.length - activeCount;
  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="manage-users-premium fade-in">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-content">
          <h1>Account Management</h1>
          <p>Securely manage administrators and department heads across the institution.</p>
        </div>
        <button className="btn-premium primary" onClick={() => openModal()}>
          <Plus size={18} />
          <span>New Account</span>
        </button>
      </div>

      {/* Analytics/Summary Cards */}
      <div className="analytics-grid">
        <div className="stat-card modern blue">
          <div className="stat-icon-wrapper"><Shield size={24} /></div>
          <div className="stat-details">
            <p className="stat-label">Total Accounts</p>
            <h3 className="stat-number">{users.length}</h3>
          </div>
        </div>
        
        <div className="stat-card modern green">
          <div className="stat-icon-wrapper"><UserCheck size={24} /></div>
          <div className="stat-details">
            <p className="stat-label">Active Users</p>
            <h3 className="stat-number">{activeCount}</h3>
          </div>
        </div>

        <div className="stat-card modern red">
          <div className="stat-icon-wrapper"><UserX size={24} /></div>
          <div className="stat-details">
            <p className="stat-label">Locked Accounts</p>
            <h3 className="stat-number">{lockedCount}</h3>
          </div>
        </div>

        <div className="stat-card modern purple">
          <div className="stat-icon-wrapper"><ShieldAlert size={24} /></div>
          <div className="stat-details">
            <p className="stat-label">Administrators</p>
            <h3 className="stat-number">{adminCount}</h3>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="premium-card">
        <div className="card-toolbar">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by username, name, or department..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="premium-search-input"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading accounts...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Role & Access</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th className="text-right">Manage</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? filteredUsers.map(u => (
                  <tr key={u.id} className={!u.is_active ? 'row-disabled' : ''}>
                    <td>
                      <div className="user-profile-cell">
                        <div className={`avatar-circle ${u.role}`}>
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-info">
                          <span className="username">{u.username}</span>
                          <span className="fullname">{u.full_name || 'No Name Provided'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${u.role}`}>
                        {u.role === 'admin' ? <Shield size={14} /> : <Building size={14} />}
                        {u.role === 'admin' ? 'Administrator' : 'Dept. HOD'}
                      </span>
                    </td>
                    <td>
                      <div className="dept-cell">
                        {u.role === 'admin' ? (
                          <span className="text-muted">Global Access</span>
                        ) : (
                          <span className="dept-name">{u.department_name || 'Unassigned'}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${u.is_active ? 'active' : 'locked'}`}>
                        {u.is_active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {u.is_active ? 'Active' : 'Locked'}
                      </span>
                    </td>
                    <td className="actions-cell text-right">
                      <div className="action-buttons">
                        <button className="btn-icon outline" onClick={() => openModal(u)} title="Edit Profile">
                          <Edit3 size={16} />
                        </button>
                        <button className="btn-icon warning" onClick={() => openResetModal(u)} title="Reset Password">
                          <KeyRound size={16} />
                        </button>
                        <button 
                          className={`btn-icon ${u.is_active ? 'danger' : 'success'}`}
                          onClick={() => handleToggleStatus(u)}
                          title={u.is_active ? "Lock Account" : "Unlock Account"}
                        >
                          {u.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      <div className="empty-icon"><Search size={48} /></div>
                      <h3>No accounts found</h3>
                      <p>Try adjusting your search term or create a new account.</p>
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
        <div className="premium-modal-overlay fadeIn">
          <div className="premium-modal slideUp">
            <div className="modal-header">
              <h2>{editingUser ? 'Update Account Details' : 'Provision New Account'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <form onSubmit={handleSave} className="modal-body">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Username <span className="req">*</span></label>
                  <input 
                    type="text" 
                    className="premium-input" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required 
                    disabled={!!editingUser} 
                    placeholder="Enter unique username" 
                  />
                  {editingUser && <span className="helper-text">Username serves as the primary identifier and cannot be altered.</span>}
                </div>

                <div className="form-group full-width">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    className="premium-input" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    placeholder="E.g. Dr. Jane Smith" 
                  />
                </div>

                {!editingUser && (
                  <div className="form-group full-width">
                    <label>Initial Password <span className="req">*</span></label>
                    <input 
                      type="password" 
                      className="premium-input" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      placeholder="Assign a secure password" 
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Access Role <span className="req">*</span></label>
                  <select 
                    className="premium-select" 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="hod">Head of Department</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                {role === 'hod' && (
                  <div className="form-group">
                    <label>Assigned Department <span className="req">*</span></label>
                    <select 
                      className="premium-select" 
                      value={departmentId} 
                      onChange={(e) => setDepartmentId(e.target.value)} 
                      required={role === 'hod'}
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-premium text-only" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-premium primary">{editingUser ? 'Save Changes' : 'Create Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {isResetModalOpen && (
        <div className="premium-modal-overlay fadeIn">
          <div className="premium-modal slideUp small">
            <div className="modal-header">
              <h2 className="text-warning">
                <KeyRound size={22} style={{marginRight: '8px', verticalAlign: 'middle'}}/>
                Reset Password
              </h2>
              <button className="close-btn" onClick={() => setIsResetModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleResetPassword} className="modal-body">
              <div className="warning-banner">
                You are about to force a password reset for <strong>{editingUser?.username}</strong>. This will revoke their current access immediately.
              </div>
              <div className="form-group" style={{marginTop: '20px'}}>
                <label>New Secure Password <span className="req">*</span></label>
                <input 
                  type="password" 
                  className="premium-input" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  placeholder="Enter new password" 
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-premium text-only" onClick={() => setIsResetModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-premium warning">Confirm Reset</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <style>{`
        /* Premium CSS for ManageUsers */
        .manage-users-premium {
          padding: 20px;
          color: #2c3e50;
        }
        
        .fade-in {
          animation: fadeIn 0.4s ease-out;
        }

        .page-header {
          display: flex;
          justifyContent: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        
        .header-content h1 {
          font-size: 1.8rem;
          color: #1a252f;
          margin: 0 0 5px 0;
          font-weight: 700;
        }
        
        .header-content p {
          color: #64748b;
          margin: 0;
          font-size: 0.95rem;
        }

        /* Premium Buttons */
        .btn-premium {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }
        
        .btn-premium.primary {
          background: #0f172a;
          color: white;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
        }
        
        .btn-premium.primary:hover {
          background: #1e293b;
          transform: translateY(-1px);
        }

        .btn-premium.warning {
          background: #f59e0b;
          color: white;
        }

        .btn-premium.warning:hover {
          background: #d97706;
        }

        .btn-premium.text-only {
          background: transparent;
          color: #64748b;
        }
        
        .btn-premium.text-only:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        /* Analytics Grid */
        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .stat-card.modern {
          background: white;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.03);
          border: 1px solid #f1f5f9;
          transition: transform 0.2s;
        }
        
        .stat-card.modern:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.05);
        }

        .stat-icon-wrapper {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .blue .stat-icon-wrapper { background: #eff6ff; color: #3b82f6; }
        .green .stat-icon-wrapper { background: #f0fdf4; color: #22c55e; }
        .red .stat-icon-wrapper { background: #fef2f2; color: #ef4444; }
        .purple .stat-icon-wrapper { background: #faf5ff; color: #a855f7; }

        .stat-label {
          margin: 0 0 4px 0;
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 500;
        }
        
        .stat-number {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
        }

        /* Premium Card & Table */
        .premium-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }
        
        .card-toolbar {
          padding: 20px;
          border-bottom: 1px solid #f1f5f9;
          background: #fafbfc;
        }

        .search-wrapper {
          position: relative;
          max-width: 350px;
        }
        
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }
        
        .premium-search-input {
          width: 100%;
          padding: 10px 10px 10px 38px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: white;
          font-size: 0.95rem;
          transition: all 0.2s;
        }
        
        .premium-search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .premium-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .premium-table th {
          background: white;
          padding: 15px 20px;
          text-align: left;
          font-size: 0.8rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #f1f5f9;
        }
        
        .premium-table td {
          padding: 15px 20px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        
        .premium-table tr:hover td {
          background: #f8fafc;
        }
        
        .row-disabled td {
          background: #fcfcfc;
          opacity: 0.8;
        }

        .user-profile-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .avatar-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
          color: white;
        }
        
        .avatar-circle.admin { background: linear-gradient(135deg, #a855f7, #7e22ce); }
        .avatar-circle.hod { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }

        .user-info {
          display: flex;
          flex-direction: column;
        }
        
        .username {
          font-weight: 600;
          color: #0f172a;
          font-size: 0.95rem;
        }
        
        .fullname {
          font-size: 0.8rem;
          color: #64748b;
        }

        .role-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .role-badge.admin { background: #faf5ff; color: #9333ea; border: 1px solid #e9d5ff; }
        .role-badge.hod { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }

        .dept-cell .dept-name {
          font-weight: 500;
          color: #334155;
        }
        
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        
        .status-pill.active { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .status-pill.locked { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

        .action-buttons {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        
        .btn-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        }
        
        .btn-icon.outline { border-color: #e2e8f0; color: #64748b; }
        .btn-icon.outline:hover { background: #f1f5f9; color: #0f172a; border-color: #cbd5e1; }
        
        .btn-icon.warning { background: #fffbeb; color: #d97706; border-color: #fde68a; }
        .btn-icon.warning:hover { background: #fef3c7; }
        
        .btn-icon.danger { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
        .btn-icon.danger:hover { background: #fee2e2; }
        
        .btn-icon.success { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
        .btn-icon.success:hover { background: #dcfce3; }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }
        .empty-icon { color: #cbd5e1; margin-bottom: 15px; }
        .empty-state h3 { margin: 0 0 10px 0; color: #334155; }
        .empty-state p { color: #64748b; margin: 0; }

        /* Modals */
        .premium-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .premium-modal {
          background: white;
          width: 100%;
          max-width: 600px;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }
        
        .premium-modal.small {
          max-width: 450px;
        }

        .modal-header {
          padding: 20px 25px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fafbfc;
        }
        
        .modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
          color: #0f172a;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #94a3b8;
          cursor: pointer;
          transition: color 0.2s;
        }
        .close-btn:hover { color: #0f172a; }

        .modal-body {
          padding: 25px;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .form-group.full-width {
          grid-column: 1 / -1;
        }
        
        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #334155;
        }
        
        .req { color: #ef4444; }

        .premium-input, .premium-select {
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-size: 0.95rem;
          transition: all 0.2s;
          background: #fff;
        }
        
        .premium-input:focus, .premium-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .premium-input:disabled {
          background: #f1f5f9;
          color: #94a3b8;
        }

        .helper-text {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 2px;
        }

        .modal-footer {
          margin-top: 30px;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }

        .warning-banner {
          background: #fffbeb;
          border: 1px solid #fde68a;
          padding: 15px;
          border-radius: 8px;
          color: #92400e;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default ManageUsers;
