import React from 'react';
import { Sun, Moon } from 'lucide-react';

function Header({ darkMode, toggleDarkMode }) {
  return (
    <div className="header">
      <div className="header-content">
        <div className="logo-container">
          <div className="logo">P</div>
          <h1>Optimisation des découpes de placoplatre</h1>
        </div>
        <button className="btn-theme" onClick={toggleDarkMode} title={darkMode ? "Mode clair" : "Mode sombre"}>
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </div>
  );
}

export default Header;