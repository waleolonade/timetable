import React from 'react';

const ManageInstitution = () => {
  return (
    <div className="manage-institution">
      <div className="content-header">
        <h1>Institution Setup</h1>
        <p>Configure global institutional details.</p>
      </div>
      <div className="card dashboard-card">
        <form>
          <div className="form-group">
            <label>Institution Name</label>
            <input type="text" defaultValue="Federal Co-operative College" className="form-control" />
          </div>
          <div className="form-group">
            <label>Motto</label>
            <input type="text" placeholder="Enter institution motto..." className="form-control" />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input type="text" placeholder="Enter address..." className="form-control" />
          </div>
          <button type="submit" className="btn btn-primary">Save Settings</button>
        </form>
      </div>
    </div>
  );
};

export default ManageInstitution;
