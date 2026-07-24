import React, { useContext } from 'react';
import { SettingsContext } from '../../context/SettingsContext';

const Footer = () => {
  const { settings } = useContext(SettingsContext);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="admin-footer">
      <div className="footer-content">
        <p>
          &copy; {currentYear} <strong>{settings.institution_name || 'Federal Co-operative College'}</strong>. All rights reserved.
        </p>
        <div className="footer-links">
          <a href="#">Support</a>
          <a href="#">Documentation</a>
          <a href="#">Version 1.0</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
