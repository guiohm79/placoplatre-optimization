import React, { useRef, useState, useEffect } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import '../styles/visualisation.css';

function MurVisualisation({ 
  mur, 
  dimensionsPlaque, 
  echelle = 0.5,
  onOuvertureSelect,
  ouvertureSelectionneeId,
  resultat
}) {
  const visualisationRef = useRef(null);
  const [zoom, setZoom] = useState(echelle);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Gestionnaire de zoom
  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 0.1, 1.5));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 0.1, 0.3));
  };

  // Gestionnaire pour afficher les info-bulles
  const handleMouseOver = (e, content) => {
    setTooltipContent(content);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
    setShowTooltip(true);
  };

  const handleMouseOut = () => {
    setShowTooltip(false);
  };

  // Gestionnaire de déplacement d'ouverture
  const handleOuvertureMouseDown = (e, ouvertureId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (visualisationRef.current) {
      const rect = visualisationRef.current.getBoundingClientRect();
      const ouverture = mur.ouvertures.find(o => o.id === ouvertureId);
      
      setIsDragging(true);
      onOuvertureSelect(ouvertureId);
      
      setDragStartPos({
        x: e.clientX - rect.left - ouverture.x * zoom,
        y: e.clientY - rect.top - ouverture.y * zoom
      });
    }
  };

  // Génération des éléments de visualisation
  const plaques = genererPlaquesOptimales(mur, dimensionsPlaque, resultat);
  const ouvertures = mur.ouvertures || [];

  // Calcul de la surface utile et du nombre de plaques nécessaires pour affichage
  const surfaceMur = mur.largeur * mur.hauteur;
  const surfaceOuvertures = mur.ouvertures.reduce((acc, o) => acc + (o.largeur * o.hauteur), 0);
  const surfaceUtile = surfaceMur - surfaceOuvertures;
  const surfacePlaque = dimensionsPlaque.largeur * dimensionsPlaque.hauteur;
  const nbPlaquesNecessaires = Math.ceil(surfaceUtile / surfacePlaque);

  return (
    <div className="visualisation-container">
      <div className="visualisation-header">
        <h3>{mur.nom} ({mur.largeur} × {mur.hauteur} cm)</h3>
        <div className="visualisation-controls">
          <button 
            className="btn btn-sm btn-secondary"
            onClick={handleZoomIn}
            title="Zoom avant"
          >
            <ZoomIn size={16} />
          </button>
          <button 
            className="btn btn-sm btn-secondary"
            onClick={handleZoomOut}
            title="Zoom arrière"
            style={{ marginLeft: '0.5rem' }}
          >
            <ZoomOut size={16} />
          </button>
        </div>
      </div>
      
      <div className="mur-info">
        <p>Surface utile: {surfaceUtile.toLocaleString()} cm² | Plaques nécessaires: {nbPlaquesNecessaires} | Dimensions plaque: {dimensionsPlaque.largeur}×{dimensionsPlaque.hauteur} cm</p>
      </div>
      
      <div className="mur-canvas-container" style={{ overflow: 'auto', padding: '1rem' }}>
        <div
          ref={visualisationRef}
          className="mur-canvas"
          style={{
            width: mur.largeur * zoom,
            height: mur.hauteur * zoom,
            transform: `translate(${pan.x}px, ${pan.y}px)`,
          }}
        >
          {/* Plaques */}
          {plaques.map((plaque, index) => (
            <div
              key={`plaque-${index}`}
              className={`plaque ${plaque.ajustementNecessaire ? 'ajustement' : ''}`}
              style={{
                left: plaque.x * zoom,
                top: plaque.y * zoom,
                width: plaque.largeur * zoom,
                height: plaque.hauteur * zoom,
              }}
              onMouseOver={(e) => {
                let tooltipText = `Plaque #${index+1}: ${plaque.largeur}×${plaque.hauteur}cm`;
                
                if (plaque.ajustementNecessaire) {
                  tooltipText += `\nAjustement nécessaire: cette plaque doit être découpée`;
                  tooltipText += `\nPlaque originale: ${dimensionsPlaque.largeur}×${dimensionsPlaque.hauteur} cm`;
                }
                
                if (plaque.decoupes && plaque.decoupes.length > 0) {
                  tooltipText += '\nDécoupes nécessaires:';
                  plaque.decoupes.forEach(d => {
                    tooltipText += `\n- ${d.type}: position (${d.xLocal},${d.yLocal}) cm, taille ${d.largeur}×${d.hauteur} cm`;
                  });
                } else {
                  tooltipText += '\nAucune découpe pour ouverture n\'est nécessaire';
                }
                
                handleMouseOver(e, tooltipText);
              }}
              onMouseOut={handleMouseOut}
            >
              <div className="plaque-numero">#{index+1}</div>
              
              {/* Ajout des dimensions sur les bords de la plaque */}
              <div className="plaque-dimension plaque-largeur">
                {plaque.largeur} cm
              </div>
              <div className="plaque-dimension plaque-hauteur">
                {plaque.hauteur} cm
              </div>
              
              {/* Afficher les découpes dans les plaques */}
              {plaque.decoupes && plaque.decoupes.map((decoupe, decoupeIndex) => (
                <div
                  key={`decoupe-${index}-${decoupeIndex}`}
                  className={`decoupe ${decoupe.type}`}
                  style={{
                    left: (decoupe.x - plaque.x) * zoom,
                    top: (decoupe.y - plaque.y) * zoom,
                    width: decoupe.largeur * zoom,
                    height: decoupe.hauteur * zoom,
                  }}
                >
                  {/* Dimensions de la découpe */}
                  <div className="decoupe-cotes">
                    <div className="decoupe-x">{decoupe.xLocal} cm</div>
                    <div className="decoupe-y">{decoupe.yLocal} cm</div>
                    <div className="decoupe-dimension">{decoupe.largeur}×{decoupe.hauteur} cm</div>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Ouvertures */}
          {ouvertures.map((ouverture) => (
            <div
              key={`ouverture-${ouverture.id}`}
              className={`ouverture ${ouverture.type} ${ouvertureSelectionneeId === ouverture.id ? 'selected' : ''}`}
              style={{
                left: ouverture.x * zoom,
                top: ouverture.y * zoom,
                width: ouverture.largeur * zoom,
                height: ouverture.hauteur * zoom,
              }}
              onMouseDown={(e) => handleOuvertureMouseDown(e, ouverture.id)}
              onMouseOver={(e) => handleMouseOver(e, `${ouverture.type}: ${ouverture.largeur}×${ouverture.hauteur}cm (position: ${ouverture.x}, ${ouverture.y})`)}
              onMouseOut={handleMouseOut}
            >
              <span>{ouverture.type}</span>
              <div className="ouverture-dimension">
                {ouverture.largeur} × {ouverture.hauteur} cm
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Tooltip */}
      {showTooltip && (
        <div 
          className="tooltip"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y + 10,
          }}
        >
          {tooltipContent.split('\n').map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// Fonction pour générer les plaques optimisées pour la visualisation
function genererPlaquesOptimales(mur, dimensionsPlaque, resultat) {
  if (!mur) return [];
  
  const { largeur: murLargeur, hauteur: murHauteur } = mur;
  const { largeur: plaqueLargeur, hauteur: plaqueHauteur } = dimensionsPlaque;
  
  // Si nous n'avons pas de résultat d'optimisation, générer une disposition par défaut
  if (!resultat || resultat.length === 0) {
    // Déterminer l'orientation optimale des plaques
    let orientation = 'horizontal';
    let largeurEffective = plaqueLargeur;
    let hauteurEffective = plaqueHauteur;
    
    // Si tourner la plaque permet d'utiliser moins de plaques, le faire
    if (Math.ceil(murLargeur / plaqueHauteur) * Math.ceil(murHauteur / plaqueLargeur) < 
        Math.ceil(murLargeur / plaqueLargeur) * Math.ceil(murHauteur / plaqueHauteur)) {
      orientation = 'vertical';
      largeurEffective = plaqueHauteur;
      hauteurEffective = plaqueLargeur;
    }
    
    // Nombre de plaques en largeur et hauteur
    const plaquesEnLargeur = Math.ceil(murLargeur / largeurEffective);
    const plaquesEnHauteur = Math.ceil(murHauteur / hauteurEffective);
    
    const plaques = [];
    
    // Générer la grille de plaques
    for (let y = 0; y < plaquesEnHauteur; y++) {
      for (let x = 0; x < plaquesEnLargeur; x++) {
        // Dimensions réelles de cette plaque (peut être tronquée au bord)
        const largeurReelle = Math.min(largeurEffective, murLargeur - x * largeurEffective);
        const hauteurReelle = Math.min(hauteurEffective, murHauteur - y * hauteurEffective);
        
        // Ne pas ajouter de plaque si les dimensions sont nulles
        if (largeurReelle <= 0 || hauteurReelle <= 0) continue;
        
        // Déterminer si cette plaque nécessite un ajustement
        const ajustementNecessaire = largeurReelle < largeurEffective || hauteurReelle < hauteurEffective;
        
        // Créer la plaque
        const plaque = {
          x: x * largeurEffective,
          y: y * hauteurEffective,
          largeur: largeurReelle,
          hauteur: hauteurReelle,
          orientation,
          ajustementNecessaire,
          decoupes: []
        };
        
        // Ajouter les découpes pour les ouvertures
        mur.ouvertures.forEach(ouverture => {
          if (rectanglesSeChevaucent(plaque, ouverture)) {
            const decoupe = calculerIntersection(plaque, ouverture);
            
            // Ajouter les coordonnées locales
            decoupe.xLocal = Math.round(decoupe.x - plaque.x);
            decoupe.yLocal = Math.round(decoupe.y - plaque.y);
            decoupe.type = ouverture.type;
            
            plaque.decoupes.push(decoupe);
          }
        });
        
        plaques.push(plaque);
      }
    }
    
    return plaques;
  }
  
  // Si nous avons un résultat, l'utiliser mais ajouter les découpes
  return resultat.filter(p => p.murId === mur.id).map(plaque => {
    // Créer une copie de la plaque avec des découpes vides
    const plaqueAvecDecoupes = {
      ...plaque,
      decoupes: []
    };
    
    // Ajouter les découpes pour les ouvertures
    mur.ouvertures.forEach(ouverture => {
      if (rectanglesSeChevaucent(plaque, ouverture)) {
        const decoupe = calculerIntersection(plaque, ouverture);
        
        // Ajouter les coordonnées locales
        decoupe.xLocal = Math.round(decoupe.x - plaque.x);
        decoupe.yLocal = Math.round(decoupe.y - plaque.y);
        decoupe.type = ouverture.type;
        
        plaqueAvecDecoupes.decoupes.push(decoupe);
      }
    });
    
    // Déterminer si un ajustement est nécessaire
    const dimensionOriginale = plaque.orientation === 'horizontal' || !plaque.orientation 
      ? { largeur: dimensionsPlaque.largeur, hauteur: dimensionsPlaque.hauteur }
      : { largeur: dimensionsPlaque.hauteur, hauteur: dimensionsPlaque.largeur };
    
    plaqueAvecDecoupes.ajustementNecessaire = 
      plaque.largeur < dimensionOriginale.largeur || 
      plaque.hauteur < dimensionOriginale.hauteur;
    
    return plaqueAvecDecoupes;
  });
}

// Vérifie si deux rectangles se chevauchent
function rectanglesSeChevaucent(rect1, rect2) {
  return !(
    rect1.x + rect1.largeur <= rect2.x ||
    rect2.x + rect2.largeur <= rect1.x ||
    rect1.y + rect1.hauteur <= rect2.y ||
    rect2.y + rect2.hauteur <= rect1.y
  );
}

// Calcule l'intersection entre deux rectangles
function calculerIntersection(rect1, rect2) {
  const x = Math.max(rect1.x, rect2.x);
  const y = Math.max(rect1.y, rect2.y);
  const largeur = Math.min(rect1.x + rect1.largeur, rect2.x + rect2.largeur) - x;
  const hauteur = Math.min(rect1.y + rect1.hauteur, rect2.y + rect2.hauteur) - y;
  
  return {
    x,
    y,
    largeur,
    hauteur
  };
}

export default MurVisualisation;