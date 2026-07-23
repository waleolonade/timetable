import React from 'react';

const FilterBar = ({ filters, setFilters }) => {
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      department: '',
      date: '',
      examType: ''
    });
  };

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <input
          type="text"
          name="department"
          placeholder="Filter by Department..."
          value={filters.department}
          onChange={handleFilterChange}
          className="filter-input"
        />
      </div>

      <div className="filter-group">
        <input
          type="date"
          name="date"
          value={filters.date}
          onChange={handleFilterChange}
          className="filter-input"
        />
      </div>

      <div className="filter-group">
        <select
          name="examType"
          value={filters.examType}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">All Exam Types</option>
          <option value="Midterm">Midterm</option>
          <option value="Final">Final</option>
          <option value="Quiz">Quiz</option>
          <option value="Practical">Practical</option>
        </select>
      </div>

      <button onClick={clearFilters} className="btn btn-clear">
        Clear Filters
      </button>
    </div>
  );
};

export default FilterBar;
