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
  const plaques = resultat || [];
  const ouvertures = mur.ouvertures || [];

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
    className="plaque"
    style={{
      left: plaque.x * zoom,
      top: plaque.y * zoom,
      width: plaque.largeur * zoom,
      height: plaque.hauteur * zoom,
    }}
    onMouseOver={(e) => handleMouseOver(e, `Plaque #${index+1}: ${plaque.largeur}×${plaque.hauteur}cm (${plaque.orientation})`)}
    onMouseOut={handleMouseOut}
  >
    #{index+1}
    
    {/* Afficher les découpes dans les plaques */}
    {plaque.decoupes && plaque.decoupes.map((decoupe, decoupeIndex) => (
      <div
        key={`decoupe-${index}-${decoupeIndex}`}
        className={`decoupe ${decoupe.type}`}
        style={{
          left: decoupe.x * zoom,
          top: decoupe.y * zoom,
          width: decoupe.largeur * zoom,
          height: decoupe.hauteur * zoom,
        }}
      />
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
              onMouseOver={(e) => handleMouseOver(e, `${ouverture.type}: ${ouverture.largeur}×${ouverture.hauteur}cm`)}
              onMouseOut={handleMouseOut}
            >
              <span>{ouverture.type}</span>
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
          {tooltipContent}
        </div>
      )}
    </div>
  );
}

export default MurVisualisation;