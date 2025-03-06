import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import OuvertureItem from './OuvertureItem';

function MurForm({ 
  murs,
  murSelectionneeId,
  onSelectMur,
  onModifierMur,
  onAjouterMur,
  onSupprimerMur,
  ouvertureSelectionneeId,
  onSelectOuverture,
  onModifierOuverture,
  onAjouterOuverture,
  onSupprimerOuverture,
  erreurs = {}
}) {
  // Obtenir le mur sélectionné
  const murSelectionnee = murs.find(mur => mur.id === murSelectionneeId) || murs[0];
  
  // Obtenir les erreurs pour le mur sélectionné
  const erreursMur = erreurs[murSelectionneeId] || {};
  
  return (
    <div className="card">
      <div className="card-header">
        <h2>Configuration des murs</h2>
        <button className="btn btn-sm btn-primary" onClick={onAjouterMur} title="Ajouter un mur">
          <Plus size={16} />
        </button>
      </div>
      
      <div className="tabs">
        {murs.map(mur => (
          <div
            key={mur.id}
            className={`tab ${murSelectionneeId === mur.id ? 'active' : ''}`}
            onClick={() => onSelectMur(mur.id)}
          >
            {mur.nom}
            {murs.length > 1 && (
              <span 
                className="tab-close" 
                onClick={(e) => {
                  e.stopPropagation();
                  onSupprimerMur(mur.id);
                }}
              >
                <Trash2 size={14} />
              </span>
            )}
          </div>
        ))}
      </div>
      
      {murSelectionnee && (
        <>
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="mur-nom">Nom du mur</label>
              <input
                id="mur-nom"
                type="text"
                className="form-control"
                value={murSelectionnee.nom}
                onChange={(e) => onModifierMur('nom', e.target.value)}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="mur-largeur">Largeur</label>
              <div className="input-group">
                <input
                  id="mur-largeur"
                  type="number"
                  className={`form-control ${erreursMur.largeur ? 'is-invalid' : ''}`}
                  value={murSelectionnee.largeur}
                  onChange={(e) => onModifierMur('largeur', parseInt(e.target.value) || 0)}
                />
                <div className="input-group-append">cm</div>
              </div>
              {erreursMur.largeur && (
                <div className="invalid-feedback">{erreursMur.largeur}</div>
              )}
            </div>
            
            <div className="form-group half">
              <label htmlFor="mur-hauteur">Hauteur</label>
              <div className="input-group">
                <input
                  id="mur-hauteur"
                  type="number"
                  className={`form-control ${erreursMur.hauteur ? 'is-invalid' : ''}`}
                  value={murSelectionnee.hauteur}
                  onChange={(e) => onModifierMur('hauteur', parseInt(e.target.value) || 0)}
                />
                <div className="input-group-append">cm</div>
              </div>
              {erreursMur.hauteur && (
                <div className="invalid-feedback">{erreursMur.hauteur}</div>
              )}
            </div>
          </div>
          
          <div className="section-header" style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Ouvertures</h3>
              <button 
                className="btn btn-sm btn-secondary" 
                onClick={onAjouterOuverture}  // Changer cette ligne
                title="Ajouter une ouverture"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          
          <div className="ouvertures-list">
            {murSelectionnee.ouvertures.length === 0 ? (
              <div className="empty-state">
                <p>Aucune ouverture pour ce mur</p>
                <button className="btn btn-sm btn-primary" onClick={onAjouterOuverture}>
                  Ajouter une ouverture
                </button>
              </div>
            ) : (
              murSelectionnee.ouvertures.map(ouverture => (
                <OuvertureItem
                  key={ouverture.id}
                  ouverture={ouverture}
                  isSelected={ouvertureSelectionneeId === ouverture.id}
                  onSelect={onSelectOuverture}
                  onChange={onModifierOuverture}
                  onDelete={onSupprimerOuverture}
                  erreurs={erreurs[murSelectionneeId]?.[ouverture.id] || {}}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default MurForm;