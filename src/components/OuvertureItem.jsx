import React from 'react';
import { X, Info } from 'lucide-react';

function OuvertureItem({ 
  ouverture, 
  isSelected, 
  onSelect, 
  onChange, 
  onDelete,
  erreurs = {}
}) {
  return (
    <div 
      className={`ouverture-item ${isSelected ? 'active' : ''}`}
      onClick={() => onSelect(ouverture.id)}
    >
      <div className="ouverture-header">
        <span className="ouverture-type">{ouverture.type}</span>
        <span className="ouverture-dimensions">
          {ouverture.largeur} × {ouverture.hauteur} cm
        </span>
        <button 
          className="btn-icon" 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(ouverture.id);
          }}
        >
          <X size={14} />
        </button>
      </div>
      
      {isSelected && (
        <div className="ouverture-details">
          <div className="form-row">
            <div className="form-group half">
              <label>Type</label>
              <select 
                className="form-control"
                value={ouverture.type}
                onChange={(e) => onChange(ouverture.id, 'type', e.target.value)}
              >
                <option value="porte">Porte</option>
                <option value="fenêtre">Fenêtre</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group half">
              <label>Position X (depuis la gauche)</label>
              <div className="input-group">
                <input
                  type="number"
                  className={`form-control ${erreurs.x ? 'is-invalid' : ''}`}
                  value={ouverture.x}
                  onChange={(e) => onChange(ouverture.id, 'x', parseInt(e.target.value) || 0)}
                />
                <div className="input-group-append">cm</div>
              </div>
              {erreurs.x && (
                <div className="invalid-feedback">{erreurs.x}</div>
              )}
            </div>
            
            <div className="form-group half">
              <label>Position Y (depuis le bas)</label>
              <div className="input-group">
                <input
                  type="number"
                  className={`form-control ${erreurs.y ? 'is-invalid' : ''}`}
                  value={ouverture.y}
                  onChange={(e) => onChange(ouverture.id, 'y', parseInt(e.target.value) || 0)}
                />
                <div className="input-group-append">cm</div>
              </div>
              {erreurs.y && (
                <div className="invalid-feedback">{erreurs.y}</div>
              )}
              <div className="form-helper">
                <small className="text-muted">
                  La position Y est mesurée à partir du bas du mur
                </small>
              </div>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group half">
              <label>Largeur</label>
              <div className="input-group">
                <input
                  type="number"
                  className={`form-control ${erreurs.largeur ? 'is-invalid' : ''}`}
                  value={ouverture.largeur}
                  onChange={(e) => onChange(ouverture.id, 'largeur', parseInt(e.target.value) || 0)}
                />
                <div className="input-group-append">cm</div>
              </div>
              {erreurs.largeur && (
                <div className="invalid-feedback">{erreurs.largeur}</div>
              )}
            </div>
            
            <div className="form-group half">
              <label>Hauteur</label>
              <div className="input-group">
                <input
                  type="number"
                  className={`form-control ${erreurs.hauteur ? 'is-invalid' : ''}`}
                  value={ouverture.hauteur}
                  onChange={(e) => onChange(ouverture.id, 'hauteur', parseInt(e.target.value) || 0)}
                />
                <div className="input-group-append">cm</div>
              </div>
              {erreurs.hauteur && (
                <div className="invalid-feedback">{erreurs.hauteur}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OuvertureItem;