import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    institution_name: 'Loading...',
    primary_color: '#0A5C36',
    current_session: '',
    current_semester: '',
    system_mode: 'Active',
    institution_logo: '',
    session_badge_color: '#e8f5e9'
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings.php');
      if (res.data.success && res.data.data) {
        setSettings(res.data.data);
        applyTheme(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (data) => {
    const hexColor = data.primary_color;
    if (hexColor) {
      document.documentElement.style.setProperty('--primary-color', hexColor);
      
      try {
        let color = hexColor.replace('#', '');
        if (color.length === 3) color = color[0]+color[0]+color[1]+color[1]+color[2]+color[2];
        
        let r = parseInt(color.substring(0, 2), 16);
        let g = parseInt(color.substring(2, 4), 16);
        let b = parseInt(color.substring(4, 6), 16);
        
        r = Math.floor(r * 0.8);
        g = Math.floor(g * 0.8);
        b = Math.floor(b * 0.8);
        
        const darkerHex = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
        document.documentElement.style.setProperty('--primary-hover', darkerHex);
      } catch (e) {
        document.documentElement.style.setProperty('--primary-hover', hexColor);
      }
    }
    
    if (data.session_badge_color) {
      document.documentElement.style.setProperty('--session-badge-color', data.session_badge_color);
    } else {
      document.documentElement.style.setProperty('--session-badge-color', '#e8f5e9'); // default
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, fetchSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};
