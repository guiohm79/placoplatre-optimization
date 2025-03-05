import React from 'react';
import { Recycle } from 'lucide-react';

function ToggleChutes({ utiliserChutes, onToggle }) {
  return (
    <div className="chutes-toggle-container">
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={utiliserChutes}
          onChange={() => onToggle(!utiliserChutes)}
        />
        <span className="toggle-slider"></span>
      </label>
      <div className="toggle-label">
        <Recycle size={18} />
        <span>Réutiliser les chutes</span>
      </div>
    </div>
  );
}

export default ToggleChutes;