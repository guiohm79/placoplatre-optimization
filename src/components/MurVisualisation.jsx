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

  // Utiliser directement les plaques calculées par l'algorithme d'optimisation
  // au lieu de recalculer la disposition
  const getPlaques = () => {
    if (!resultat || !mur) return [];
    
    // Filtrer pour n'obtenir que les plaques du mur actuel
    const plaques = resultat.filter(plaque => plaque.murId === mur.id);
    
    // Ajouter un identifiant unique pour chaque plaque si nécessaire
    return plaques.map((plaque, index) => ({
      ...plaque,
      id: plaque.id || `plaque-${index + 1}`
    }));
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

  // Utiliser directement les plaques calculées par l'algorithme d'optimisation
  const plaques = getPlaques();
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
                
                if (plaque.decoupes && plaque.decoupes.length > 0) {
                  tooltipText += '\nDécoupes nécessaires:';
                  plaque.decoupes.forEach(d => {
                    tooltipText += `\n- ${d.type || 'découpe'}: position (${d.xLocal || 0},${d.yLocal || 0}) cm, taille ${d.largeur}×${d.hauteur} cm`;
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
                  className={`decoupe ${decoupe.type || 'autre'}`}
                  style={{
                    left: (decoupe.xLocal || decoupe.x - plaque.x) * zoom,
                    top: (decoupe.yLocal || decoupe.y - plaque.y) * zoom,
                    width: decoupe.largeur * zoom,
                    height: decoupe.hauteur * zoom,
                  }}
                >
                  {/* Dimensions de la découpe */}
                  <div className="decoupe-cotes">
                    <div className="decoupe-x">{decoupe.xLocal || (decoupe.x - plaque.x)} cm</div>
                    <div className="decoupe-y">{decoupe.yLocal || (decoupe.y - plaque.y)} cm</div>
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