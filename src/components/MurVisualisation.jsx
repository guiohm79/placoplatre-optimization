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

  // Générer la disposition des plaques avec des dimensions réelles
  const genererDispositionPratique = () => {
    if (!resultat || !mur) return [];
    
    // Calculer la surface utile de ce mur (surface totale moins les ouvertures)
    const surfaceMur = mur.largeur * mur.hauteur;
    const surfaceOuvertures = mur.ouvertures.reduce((acc, o) => acc + (o.largeur * o.hauteur), 0);
    const surfaceUtile = surfaceMur - surfaceOuvertures;
    
    // Calculer le nombre réel de plaques nécessaires pour ce mur
    const surfacePlaque = dimensionsPlaque.largeur * dimensionsPlaque.hauteur;
    const nbPlaquesNecessaires = Math.ceil(surfaceUtile / surfacePlaque);
    
    // Créer une disposition pratique qui respecte les dimensions réelles
    const plaques = [];
    
    // Déterminer l'orientation optimale pour les plaques
    const placementHorizontal = mur.largeur > mur.hauteur;
    const plaqueLargeur = placementHorizontal ? dimensionsPlaque.largeur : dimensionsPlaque.hauteur;
    const plaqueHauteur = placementHorizontal ? dimensionsPlaque.hauteur : dimensionsPlaque.largeur;
    
    // Nombre de plaques par rangée et colonne
    const plaquesParRangee = Math.ceil(mur.largeur / plaqueLargeur);
    const plaquesParColonne = Math.ceil(mur.hauteur / plaqueHauteur);
    
    // Générer la grille de plaques
    let plaqueIndex = 0;
    
    for (let r = 0; r < plaquesParColonne && plaqueIndex < nbPlaquesNecessaires; r++) {
      const hauteurPlaqueCourante = Math.min(plaqueHauteur, mur.hauteur - r * plaqueHauteur);
      
      for (let c = 0; c < plaquesParRangee && plaqueIndex < nbPlaquesNecessaires; c++) {
        const largeurPlaqueCourante = Math.min(plaqueLargeur, mur.largeur - c * plaqueLargeur);
        
        // Vérifier si cette zone a besoin d'être couverte (contient au moins une cellule à couvrir)
        const zoneACouvrir = verifierZoneACouvrir(
          c * plaqueLargeur, 
          r * plaqueHauteur, 
          largeurPlaqueCourante, 
          hauteurPlaqueCourante,
          mur.ouvertures
        );
        
        if (zoneACouvrir) {
          plaques.push({
            id: `plaque-${plaqueIndex + 1}`,
            x: c * plaqueLargeur,
            y: r * plaqueHauteur,
            largeur: largeurPlaqueCourante,
            hauteur: hauteurPlaqueCourante,
            orientation: placementHorizontal ? 'normal' : 'rotated',
            decoupes: [],
            ajustementNecessaire: largeurPlaqueCourante < plaqueLargeur || hauteurPlaqueCourante < plaqueHauteur
          });
          
          plaqueIndex++;
        }
      }
    }
    
    // Ajouter les découpes pour chaque plaque
    plaques.forEach(plaque => {
      plaque.decoupes = [];
      
      mur.ouvertures.forEach(ouverture => {
        // Vérifier si l'ouverture chevauche la plaque
        if (chevauchement(plaque, ouverture)) {
          const decoupe = calculerDecoupe(plaque, ouverture);
          plaque.decoupes.push({
            ...decoupe,
            type: ouverture.type,
            xLocal: decoupe.x - plaque.x,
            yLocal: decoupe.y - plaque.y
          });
        }
      });
    });
    
    return plaques;
  };
  
  // Vérifier si une zone a besoin d'être couverte (n'est pas entièrement une ouverture)
  const verifierZoneACouvrir = (x, y, largeur, hauteur, ouvertures) => {
    // Surface totale de la zone
    const surfaceZone = largeur * hauteur;
    
    // Calculer la surface couverte par les ouvertures
    let surfaceOuvertures = 0;
    
    ouvertures.forEach(ouverture => {
      // Calculer l'intersection entre la zone et l'ouverture
      const xIntersect = Math.max(x, ouverture.x);
      const yIntersect = Math.max(y, ouverture.y);
      const largeurIntersect = Math.min(x + largeur, ouverture.x + ouverture.largeur) - xIntersect;
      const hauteurIntersect = Math.min(y + hauteur, ouverture.y + ouverture.hauteur) - yIntersect;
      
      if (largeurIntersect > 0 && hauteurIntersect > 0) {
        surfaceOuvertures += largeurIntersect * hauteurIntersect;
      }
    });
    
    // La zone a besoin d'être couverte si elle n'est pas entièrement une ouverture
    return surfaceOuvertures < surfaceZone;
  };
  
  // Fonction pour vérifier si deux rectangles se chevauchent
  const chevauchement = (rect1, rect2) => {
    return !(
      rect1.x + rect1.largeur <= rect2.x ||
      rect2.x + rect2.largeur <= rect1.x ||
      rect1.y + rect1.hauteur <= rect2.y ||
      rect2.y + rect2.hauteur <= rect1.y
    );
  };
  
  // Fonction pour calculer l'intersection entre une plaque et une ouverture
  const calculerDecoupe = (plaque, ouverture) => {
    const x1 = Math.max(plaque.x, ouverture.x);
    const y1 = Math.max(plaque.y, ouverture.y);
    const x2 = Math.min(plaque.x + plaque.largeur, ouverture.x + ouverture.largeur);
    const y2 = Math.min(plaque.y + plaque.hauteur, ouverture.y + ouverture.hauteur);
    
    return {
      x: x1,
      y: y1,
      largeur: x2 - x1,
      hauteur: y2 - y1
    };
  };

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
  const plaques = resultat ? genererDispositionPratique() : [];
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
      
      {resultat && (
        <div className="mur-info">
          <p>Surface utile: {surfaceUtile.toLocaleString()} cm² | Plaques nécessaires: {nbPlaquesNecessaires} | Dimensions plaque: {dimensionsPlaque.largeur}×{dimensionsPlaque.hauteur} cm</p>
        </div>
      )}
      
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
                  tooltipText += `\nPlaque originale: ${plaque.orientation === 'normal' ? dimensionsPlaque.largeur : dimensionsPlaque.hauteur}×${plaque.orientation === 'normal' ? dimensionsPlaque.hauteur : dimensionsPlaque.largeur} cm`;
                }
                
                if (plaque.decoupes.length > 0) {
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

export default MurVisualisation;