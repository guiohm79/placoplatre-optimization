import React from 'react';

function PlaqueDimensionsForm({ dimensions, onChange }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Dimensions des plaques</h2>
      </div>
      
      <div className="form-group">
        <label htmlFor="plaque-largeur">Largeur (cm)</label>
        <div className="input-group">
          <input
            id="plaque-largeur"
            type="number"
            className="form-control"
            value={dimensions.largeur}
            onChange={(e) => onChange({
              ...dimensions,
              largeur: parseInt(e.target.value) || 0
            })}
          />
          <div className="input-group-append">cm</div>
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="plaque-hauteur">Hauteur (cm)</label>
        <div className="input-group">
          <input
            id="plaque-hauteur"
            type="number"
            className="form-control"
            value={dimensions.hauteur}
            onChange={(e) => onChange({
              ...dimensions,
              hauteur: parseInt(e.target.value) || 0
            })}
          />
          <div className="input-group-append">cm</div>
        </div>
      </div>
    </div>
  );
}

export default PlaqueDimensionsForm;