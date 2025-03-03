import React from 'react';
import { PlusCircle, X } from 'lucide-react';
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
  // Trouver le mur sélectionné
  const murSelectionnee = murs.find(m => m.id === murSelectionneeId) || murs[0];
  
  return (
    <>
      <div className="card">
        <div className="card-header">
          <h2>Murs</h2>
          <button className="btn btn-sm btn-primary" onClick={onAjouterMur}>
            <PlusCircle size={16} style={{ marginRight: '4px' }} /> 
            Ajouter un mur
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
                  <X size={14} />
                </span>
              )}
            </div>
          ))}
        </div>
        
        <div className="form-group">
          <label htmlFor="mur-nom">Nom du mur</label>
          <input
            id="mur-nom"
            type="text"
            className="form-control"
            value={murSelectionnee.nom}
            onChange={(e) => onModifierMur('nom', e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="mur-largeur">Largeur (cm)</label>
          <div className="input-group">
            <input
              id="mur-largeur"
              type="number"
              className={`form-control ${erreurs[murSelectionneeId]?.largeur ? 'is-invalid' : ''}`}
              value={murSelectionnee.largeur}
              onChange={(e) => onModifierMur('largeur', parseInt(e.target.value) || 0)}
            />
            <div className="input-group-append">cm</div>
          </div>
          {erreurs[murSelectionneeId]?.largeur && (
            <div className="invalid-feedback">{erreurs[murSelectionneeId].largeur}</div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="mur-hauteur">Hauteur (cm)</label>
          <div className="input-group">
            <input
              id="mur-hauteur"
              type="number"
              className={`form-control ${erreurs[murSelectionneeId]?.hauteur ? 'is-invalid' : ''}`}
              value={murSelectionnee.hauteur}
              onChange={(e) => onModifierMur('hauteur', parseInt(e.target.value) || 0)}
            />
            <div className="input-group-append">cm</div>
          </div>
          {erreurs[murSelectionneeId]?.hauteur && (
            <div className="invalid-feedback">{erreurs[murSelectionneeId].hauteur}</div>
          )}
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h2>Ouvertures du mur {murSelectionnee.nom}</h2>
          <button className="btn btn-sm btn-primary" onClick={onAjouterOuverture}>
            <PlusCircle size={16} style={{ marginRight: '4px' }} /> 
            Ajouter une ouverture
          </button>
        </div>
        
        {murSelectionnee.ouvertures.length === 0 ? (
          <div className="empty-state">
            <p>Aucune ouverture définie</p>
          </div>
        ) : (
          <div>
            {murSelectionnee.ouvertures.map(ouverture => (
              <OuvertureItem
                key={ouverture.id}
                ouverture={ouverture}
                isSelected={ouvertureSelectionneeId === ouverture.id}
                onSelect={onSelectOuverture}
                onChange={onModifierOuverture}
                onDelete={onSupprimerOuverture}
                erreurs={erreurs[murSelectionneeId]?.[ouverture.id] || {}}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default MurForm;