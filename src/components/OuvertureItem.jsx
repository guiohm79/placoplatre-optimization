import React, { useState, useEffect } from 'react';
import { X, Edit, Check } from 'lucide-react';
import { MODELES_OUVERTURES, appliquerModele } from '../utils/modelesOuvertures';

console.log("MODELES_OUVERTURES:", MODELES_OUVERTURES);

function OuvertureItem({ 
  ouverture, 
  isSelected, 
  onSelect, 
  onChange, 
  onDelete,
  erreurs = {}
}) {
  const [editMode, setEditMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [nbElements, setNbElements] = useState(ouverture.nbElements || 1);
  const [disposition, setDisposition] = useState(ouverture.disposition || 'vertical');
  const [diametre, setDiametre] = useState(ouverture.diametre || 10);

  // Initialiser le nom personnalisé si c'est une ouverture "autre" avec un nom personnalisé
  useEffect(() => {
    if (ouverture.typeBase === 'autre' && ouverture.typePersonnalise) {
      setCustomName(ouverture.typePersonnalise);
    }
    
    if (ouverture.nbElements) {
      setNbElements(ouverture.nbElements);
    }
    
    if (ouverture.disposition) {
      setDisposition(ouverture.disposition);
    }
    
    if (ouverture.diametre) {
      setDiametre(ouverture.diametre);
    }
  }, [ouverture]);

  // Gérer le changement de type d'ouverture
  const handleTypeChange = (e) => {
    const newType = e.target.value;
    
    // Utiliser la fonction appliquerModele
    const nouvelleOuverture = appliquerModele(newType, { id: ouverture.id, x: ouverture.x, y: ouverture.y });
    
    // Mettre à jour tous les champs
    onChange(ouverture.id, 'typeBase', nouvelleOuverture.typeBase);
    onChange(ouverture.id, 'type', nouvelleOuverture.type);
    onChange(ouverture.id, 'largeur', nouvelleOuverture.largeur);
    onChange(ouverture.id, 'hauteur', nouvelleOuverture.hauteur);
    
    // Propriétés spécifiques
    if (newType === 'tuyau d\'eau') {
      onChange(ouverture.id, 'forme', 'rond');
      onChange(ouverture.id, 'diametre', nouvelleOuverture.diametre);
      setDiametre(nouvelleOuverture.diametre);
    } 
    else if (newType === 'prise' || newType === 'interrupteur') {
      onChange(ouverture.id, 'nbElements', nouvelleOuverture.nbElements);
      onChange(ouverture.id, 'disposition', nouvelleOuverture.disposition);
      setNbElements(nouvelleOuverture.nbElements);
      setDisposition(nouvelleOuverture.disposition);
    }
  };

  // Gérer la sauvegarde du nom personnalisé
  const handleCustomNameSave = () => {
    setEditMode(false);
    if (customName.trim()) {
      onChange(ouverture.id, 'typePersonnalise', customName);
      onChange(ouverture.id, 'type', customName);
    }
  };

  // Mettre à jour les dimensions en fonction du nombre d'éléments et de la disposition
  const updateDimensionsFromNbElements = (nb, disp) => {
    console.log("updateDimensionsFromNbElements appelé avec:", nb, disp);
    const typeBase = ouverture.typeBase || ouverture.type;
    
    if (typeBase === 'prise' || typeBase === 'interrupteur') {
      const modele = MODELES_OUVERTURES[typeBase];
      console.log("Modèle trouvé:", modele);
      
      // Dimensions de base pour un élément
      const largeurBase = modele.largeur;
      const hauteurBase = modele.hauteur;
      
      let nouvelleLargeur, nouvelleHauteur;
      
      if (disp === 'horizontal') {
        nouvelleLargeur = largeurBase * nb;
        nouvelleHauteur = hauteurBase;
      } else {
        nouvelleLargeur = largeurBase;
        nouvelleHauteur = hauteurBase * nb;
      }
      
      console.log("Nouvelles dimensions:", nouvelleLargeur, "x", nouvelleHauteur);
      
      onChange(ouverture.id, 'nbElements', nb);
      onChange(ouverture.id, 'disposition', disp);
      onChange(ouverture.id, 'largeur', nouvelleLargeur);
      onChange(ouverture.id, 'hauteur', nouvelleHauteur);
      onChange(ouverture.id, 'type', typeBase + (nb > 1 ? ` (x${nb})` : ''));
    }
  };

  // Mettre à jour les dimensions en fonction du diamètre
  const updateDimensionsFromDiametre = (diam) => {
    onChange(ouverture.id, 'diametre', diam);
    onChange(ouverture.id, 'largeur', diam);
    onChange(ouverture.id, 'hauteur', diam);
  };

  return (
    <div 
      className={`ouverture-item ${isSelected ? 'active' : ''}`}
      onClick={() => onSelect(ouverture.id)}
    >
      <div className="ouverture-header">
        <span className="ouverture-type">
          {ouverture.type || 'Ouverture'}
        </span>
        <span className="ouverture-dimensions">
          {ouverture.forme === 'rond' 
            ? `Ø${ouverture.diametre} cm` 
            : `${ouverture.largeur} × ${ouverture.hauteur} cm`}
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
            <div className="form-group full">
              <label>Type</label>
              <select 
                className="form-control"
                value={ouverture.typeBase || ouverture.type}
                onChange={handleTypeChange}
              >
                <option value="porte">Porte</option>
                <option value="fenetre">Fenêtre</option>
                <option value="prise">Prise</option>
                <option value="interrupteur">Interrupteur</option>
                <option value="tuyau d'eau">Tuyau d'eau</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>
          
          {/* Options spécifiques selon le type */}
          {(ouverture.typeBase === 'prise' || ouverture.typeBase === 'interrupteur') && (
            <div className="form-row">
              <div className="form-group half">
                <label>Nombre</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    value={nbElements}
                    min="1"
                    max="10"
                    onChange={(e) => {
                      const nb = parseInt(e.target.value) || 1;
                      setNbElements(nb);
                      onChange(ouverture.id, 'nbElements', nb);
                      updateDimensionsFromNbElements(nb, disposition);
                    }}
                  />
                </div>
              </div>
              
              <div className="form-group half">
                <label>Disposition</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name={`disposition-${ouverture.id}`}
                      checked={disposition === 'horizontal'}
                      onChange={() => {
                        setDisposition('horizontal');
                        onChange(ouverture.id, 'disposition', 'horizontal');
                        updateDimensionsFromNbElements(nbElements, 'horizontal');
                      }}
                    />
                    Horizontal
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name={`disposition-${ouverture.id}`}
                      checked={disposition === 'vertical'}
                      onChange={() => {
                        setDisposition('vertical');
                        onChange(ouverture.id, 'disposition', 'vertical');
                        updateDimensionsFromNbElements(nbElements, 'vertical');
                      }}
                    />
                    Vertical
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {ouverture.typeBase === 'tuyau d\'eau' && (
            <div className="form-row">
              <div className="form-group full">
                <label>Diamètre</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    value={diametre}
                    min="1"
                    max="100"
                    onChange={(e) => {
                      const diam = parseInt(e.target.value) || 10;
                      setDiametre(diam);
                      updateDimensionsFromDiametre(diam);
                    }}
                  />
                  <div className="input-group-append">cm</div>
                </div>
              </div>
            </div>
          )}
          
          {ouverture.typeBase === 'autre' && (
            <div className="form-row">
              <div className="form-group full">
                <label>Nom personnalisé</label>
                <div className="input-group with-btn">
                  {editMode ? (
                    <>
                      <input
                        type="text"
                        className="form-control"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        autoFocus
                      />
                      <button 
                        className="btn-icon input-btn" 
                        onClick={handleCustomNameSave}
                      >
                        <Check size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="form-control-display">
                        {ouverture.typePersonnalise || 'Autre'}
                      </div>
                      <button 
                        className="btn-icon input-btn" 
                        onClick={() => setEditMode(true)}
                      >
                        <Edit size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="form-row">
            <div className="form-group half">
              <label>Position X</label>
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
              <label>Position Y</label>
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