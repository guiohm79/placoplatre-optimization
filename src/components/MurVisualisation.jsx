import React, { useRef, useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, X } from 'lucide-react';
import '../styles/visualisation.css';

function MurVisualisation({ 
  mur, 
  dimensionsPlaque, 
  echelle = 0.5,
  onOuvertureSelect,
  ouvertureSelectionneeId,
  resultat,
  onModifierOuverture // On utilisera cette prop pour mettre à jour les coordonnées
}) {
  const visualisationRef = useRef(null);
  const [zoom, setZoom] = useState(echelle);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // État pour la plaque sélectionnée et la vue détaillée
  const [selectedPlaque, setSelectedPlaque] = useState(null);
  const [showDetailView, setShowDetailView] = useState(false);

  // Fonctions de conversion pour l'axe Y (origine en bas à gauche)
  const convertirYVersBasGauche = (y, hauteurElement) => {
    return mur.hauteur - y - hauteurElement;
  };

  // Fonction inverse pour reconvertir (du haut vers le bas)
  const convertirDepuisBasGauche = (yAffichage, hauteurElement) => {
    return mur.hauteur - yAffichage - hauteurElement;
  };

  // Utiliser directement les plaques calculées par l'algorithme d'optimisation
  // au lieu de recalculer la disposition
  const getPlaques = () => {
    if (!resultat || !mur) return [];
    
    // Filtrer pour n'obtenir que les plaques du mur actuel
    const plaques = resultat.filter(plaque => plaque.murId === mur.id);
    
    // Ajouter un identifiant unique pour chaque plaque si nécessaire
    return plaques.map((plaque, index) => ({
      ...plaque,
      id: plaque.id || `plaque-${index + 1}`,
      index: index + 1
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

  // Gestionnaire de déplacement d'ouverture - démarrage du drag
  const handleOuvertureMouseDown = (e, ouvertureId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (visualisationRef.current) {
      const rect = visualisationRef.current.getBoundingClientRect();
      const ouverture = mur.ouvertures.find(o => o.id === ouvertureId);
      
      // On commence à draguer (l'ouverture !)
      setIsDragging(true);
      onOuvertureSelect(ouvertureId);
      
      // On enregistre la position de départ du drag
      // MODIFIÉ: Utiliser le Y converti pour l'affichage
      const yAffiche = convertirYVersBasGauche(ouverture.y, ouverture.hauteur);
      
      setDragStartPos({
        x: e.clientX - rect.left - ouverture.x * zoom,
        y: e.clientY - rect.top - yAffiche * zoom
      });
    }
  };
  
  // Gestionnaire de déplacement pendant le drag (modifié pour l'axe Y inversé)
  const handleMouseMove = (e) => {
    if (!isDragging || !ouvertureSelectionneeId) return;
    
    e.preventDefault();
    
    // Récupérer la position du curseur par rapport au conteneur
    const rect = visualisationRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculer la nouvelle position X (inchangée)
    const newX = Math.max(0, Math.round((mouseX - dragStartPos.x) / zoom));
    
    // Étape 1: Calculer la position apparente Y (en coordonnées d'affichage)
    const yAffichage = Math.round((mouseY - dragStartPos.y) / zoom);
    
    // Étape 2: Reconvertir en coordonnées logiques (origine en bas)
    const ouverture = mur.ouvertures.find(o => o.id === ouvertureSelectionneeId);
    const newY = convertirDepuisBasGauche(yAffichage, ouverture.hauteur);
    
    // S'assurer que l'ouverture reste dans les limites du mur
    const maxX = mur.largeur - ouverture.largeur;
    const maxY = mur.hauteur - ouverture.hauteur;
    
    const clampedX = Math.min(maxX, Math.max(0, newX));
    const clampedY = Math.min(maxY, Math.max(0, newY));
    
    // Mettre à jour les coordonnées de l'ouverture si elles ont changé
    if (ouverture.x !== clampedX) {
      onModifierOuverture(ouvertureSelectionneeId, 'x', clampedX);
    }
    
    if (ouverture.y !== clampedY) {
      onModifierOuverture(ouvertureSelectionneeId, 'y', clampedY);
    }
  };
  
  // Gestionnaire de fin de drag
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };
  
  // Sortie du curseur de la zone de visualisation
  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
    }
    setShowTooltip(false);
  };
  
  // Ajouter et retirer les écouteurs d'événements pour le drag
  useEffect(() => {
    // Si une ouverture est en train d'être déplacée, ajouter les écouteurs
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    // Nettoyer les écouteurs quand le composant se démonte ou quand isDragging change
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, ouvertureSelectionneeId, zoom, mur, onModifierOuverture]);
  
  // Gestionnaire de clic sur une plaque pour afficher la vue détaillée
  const handlePlaqueClick = (plaque) => {
    setSelectedPlaque(plaque);
    setShowDetailView(true);
  };
  
  // Fermer la vue détaillée
  const closeDetailView = () => {
    setShowDetailView(false);
    setSelectedPlaque(null);
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
            cursor: isDragging ? 'grabbing' : 'default'
          }}
          onMouseLeave={handleMouseLeave}
        >
          {/* Plaques - MODIFIÉ pour origine en bas à gauche */}
          {plaques.map((plaque, index) => (
            <div
              key={`plaque-${index}`}
              className={`plaque ${plaque.ajustementNecessaire ? 'ajustement' : ''}`}
              style={{
                left: plaque.x * zoom,
                // Conversion pour afficher avec origine en bas à gauche
                top: convertirYVersBasGauche(plaque.y, plaque.hauteur) * zoom,
                width: plaque.largeur * zoom,
                height: plaque.hauteur * zoom,
                cursor: 'pointer'
              }}
              onClick={() => handlePlaqueClick(plaque)}
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
                
                tooltipText += '\nCliquez pour voir les détails de découpe';
                
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
                    // Conversion pour les découpes (relatives à la plaque)
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

          {/* Ouvertures - MODIFIÉ pour origine en bas à gauche */}
          {ouvertures.map((ouverture) => (
            <div
              key={`ouverture-${ouverture.id}`}
              className={`ouverture ${ouverture.type} ${ouvertureSelectionneeId === ouverture.id ? 'selected' : ''}`}
              style={{
                left: ouverture.x * zoom,
                // Conversion pour afficher avec origine en bas à gauche
                top: convertirYVersBasGauche(ouverture.y, ouverture.hauteur) * zoom,
                width: ouverture.largeur * zoom,
                height: ouverture.hauteur * zoom,
                cursor: isDragging && ouvertureSelectionneeId === ouverture.id ? 'grabbing' : 'grab',
                opacity: isDragging && ouvertureSelectionneeId === ouverture.id ? 0.7 : 1,
                zIndex: ouvertureSelectionneeId === ouverture.id ? 25 : 20,
              }}
              onMouseDown={(e) => handleOuvertureMouseDown(e, ouverture.id)}
              onMouseOver={(e) => handleMouseOver(e, `${ouverture.type}: ${ouverture.largeur}×${ouverture.hauteur}cm (position: ${ouverture.x}, ${ouverture.y} depuis le bas)`)}
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
      
      {/* Vue détaillée d'une plaque */}
      {showDetailView && selectedPlaque && (
        <div className="detail-view-overlay">
          <div className="detail-view-container">
            <div className="detail-view-header">
              <h3>Plaque #{selectedPlaque.index} - Détails de découpe</h3>
              <button className="btn-icon" onClick={closeDetailView}>
                <X size={24} />
              </button>
            </div>
            
            <div className="detail-view-content">
              <div className="detail-view-info">
                <div className="detail-info-section">
                  <h4>Informations générales</h4>
                  <p><strong>Dimensions d'origine:</strong> {selectedPlaque.orientation === 'normal' ? dimensionsPlaque.largeur : dimensionsPlaque.hauteur} × {selectedPlaque.orientation === 'normal' ? dimensionsPlaque.hauteur : dimensionsPlaque.largeur} cm</p>
                  <p><strong>Dimensions finales:</strong> {selectedPlaque.largeur} × {selectedPlaque.hauteur} cm</p>
                  <p><strong>Position sur le mur:</strong> ({selectedPlaque.x}, {selectedPlaque.y} depuis le bas) cm</p>
                  <p><strong>Type d'ajustement:</strong> {selectedPlaque.ajustementNecessaire ? "Découpe requise" : "Aucun ajustement nécessaire"}</p>
                  <p><strong>Orientation:</strong> {selectedPlaque.orientation === 'normal' ? "Horizontale" : "Verticale"}</p>
                </div>
                
                {selectedPlaque.decoupes && selectedPlaque.decoupes.length > 0 && (
                  <div className="detail-info-section">
                    <h4>Découpes nécessaires</h4>
                    <ul>
                      {selectedPlaque.decoupes.map((decoupe, index) => (
                        <li key={index}>
                          <strong>{decoupe.type || 'Découpe'} #{index + 1}</strong>
                          <p>Position: ({decoupe.xLocal || (decoupe.x - selectedPlaque.x)}, {decoupe.yLocal || (decoupe.y - selectedPlaque.y)}) cm</p>
                          <p>Dimensions: {decoupe.largeur} × {decoupe.hauteur} cm</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="detail-view-canvas-container">
                <div className="detail-view-canvas">
                  {/* Dessin de la plaque originale */}
                  <div className="detail-plaque-originale">
                    <div className="detail-plaque-label">Plaque d'origine</div>
                    <svg 
                      viewBox={`0 0 ${selectedPlaque.orientation === 'normal' ? dimensionsPlaque.largeur : dimensionsPlaque.hauteur} ${selectedPlaque.orientation === 'normal' ? dimensionsPlaque.hauteur : dimensionsPlaque.largeur}`}
                      preserveAspectRatio="xMidYMid meet"
                      style={{ width: '100%', height: '100%', maxHeight: '300px' }}
                    >
                      {/* Plaque originale */}
                      <rect 
                        x="0" 
                        y="0" 
                        width={selectedPlaque.orientation === 'normal' ? dimensionsPlaque.largeur : dimensionsPlaque.hauteur} 
                        height={selectedPlaque.orientation === 'normal' ? dimensionsPlaque.hauteur : dimensionsPlaque.largeur} 
                        stroke="#3a86ff" 
                        strokeWidth="2" 
                        fill="#e9f0ff" 
                      />
                      
                      {/* Zone à conserver (plaque finale) */}
                      <rect 
                        x="0" 
                        y="0" 
                        width={selectedPlaque.largeur} 
                        height={selectedPlaque.hauteur} 
                        stroke="#06d6a0" 
                        strokeWidth="2" 
                        fill="#defff7" 
                        strokeDasharray="5,5"
                      />
                      
                      {/* Lignes de découpe pour l'ajustement de taille */}
                      {selectedPlaque.ajustementNecessaire && (
                        <>
                          {selectedPlaque.largeur < (selectedPlaque.orientation === 'normal' ? dimensionsPlaque.largeur : dimensionsPlaque.hauteur) && (
                            <line 
                              x1={selectedPlaque.largeur} 
                              y1="0" 
                              x2={selectedPlaque.largeur} 
                              y2={selectedPlaque.hauteur} 
                              stroke="#ef476f" 
                              strokeWidth="2" 
                              strokeDasharray="10,5"
                            />
                          )}
                          {selectedPlaque.hauteur < (selectedPlaque.orientation === 'normal' ? dimensionsPlaque.hauteur : dimensionsPlaque.largeur) && (
                            <line 
                              x1="0" 
                              y1={selectedPlaque.hauteur} 
                              x2={selectedPlaque.largeur} 
                              y2={selectedPlaque.hauteur} 
                              stroke="#ef476f" 
                              strokeWidth="2" 
                              strokeDasharray="10,5"
                            />
                          )}
                        </>
                      )}
                      
                      {/* Étiquettes des dimensions */}
                      <text x={selectedPlaque.largeur / 2} y="-5" textAnchor="middle" fontSize="12" fill="#3a86ff">
                        {selectedPlaque.largeur} cm
                      </text>
                      <text x="-5" y={selectedPlaque.hauteur / 2} textAnchor="middle" fontSize="12" fill="#3a86ff" transform={`rotate(-90, -5, ${selectedPlaque.hauteur / 2})`}>
                        {selectedPlaque.hauteur} cm
                      </text>
                      
                      {/* Étiquettes pour les dimensions complètes */}
                      {selectedPlaque.ajustementNecessaire && (
                        <>
                          <text 
                            x={(selectedPlaque.orientation === 'normal' ? dimensionsPlaque.largeur : dimensionsPlaque.hauteur) / 2} 
                            y={(selectedPlaque.orientation === 'normal' ? dimensionsPlaque.hauteur : dimensionsPlaque.largeur) + 15} 
                            textAnchor="middle" 
                            fontSize="12" 
                            fill="#666"
                          >
                            {selectedPlaque.orientation === 'normal' ? dimensionsPlaque.largeur : dimensionsPlaque.hauteur} cm (plaque complète)
                          </text>
                          
                          <text 
                            x={(selectedPlaque.orientation === 'normal' ? dimensionsPlaque.largeur : dimensionsPlaque.hauteur) + 15} 
                            y={(selectedPlaque.orientation === 'normal' ? dimensionsPlaque.hauteur : dimensionsPlaque.largeur) / 2} 
                            textAnchor="middle" 
                            fontSize="12" 
                            fill="#666"
                            transform={`rotate(90, ${(selectedPlaque.orientation === 'normal' ? dimensionsPlaque.largeur : dimensionsPlaque.hauteur) + 15}, ${(selectedPlaque.orientation === 'normal' ? dimensionsPlaque.hauteur : dimensionsPlaque.largeur) / 2})`}
                          >
                            {selectedPlaque.orientation === 'normal' ? dimensionsPlaque.hauteur : dimensionsPlaque.largeur} cm (plaque complète)
                          </text>
                        </>
                      )}
                    </svg>
                  </div>
                  
                  {/* Dessin de la plaque finale avec découpes - Pas besoin de modifier ici */}
                  <div className="detail-plaque-finale">
                    <div className="detail-plaque-label">Plaque avec découpes pour ouvertures</div>
                    <svg 
                      viewBox={`0 0 ${selectedPlaque.largeur} ${selectedPlaque.hauteur}`}
                      preserveAspectRatio="xMidYMid meet"
                      style={{ width: '100%', height: '100%', maxHeight: '300px' }}
                    >
                      {/* Plaque finale */}
                      <rect 
                        x="0" 
                        y="0" 
                        width={selectedPlaque.largeur} 
                        height={selectedPlaque.hauteur} 
                        stroke="#3a86ff" 
                        strokeWidth="2" 
                        fill="#e9f0ff" 
                      />
                      
                      {/* Dessiner les découpes */}
                      {selectedPlaque.decoupes && selectedPlaque.decoupes.map((decoupe, index) => {
                        const xLocal = decoupe.xLocal || (decoupe.x - selectedPlaque.x);
                        const yLocal = decoupe.yLocal || (decoupe.y - selectedPlaque.y);
                        
                        return (
                          <g key={index}>
                            <rect
                              x={xLocal}
                              y={yLocal}
                              width={decoupe.largeur}
                              height={decoupe.hauteur}
                              stroke="#ef476f"
                              strokeWidth="2"
                              fill="rgba(239, 71, 111, 0.2)"
                              strokeDasharray="5,3"
                            />
                            
                            {/* Lignes de découpe */}
                            <line 
                              x1={xLocal} 
                              y1="0" 
                              x2={xLocal} 
                              y2={selectedPlaque.hauteur}
                              stroke="#ef476f" 
                              strokeWidth="1" 
                              strokeDasharray="5,5"
                            />
                            <line 
                              x1={xLocal + decoupe.largeur} 
                              y1="0" 
                              x2={xLocal + decoupe.largeur} 
                              y2={selectedPlaque.hauteur}
                              stroke="#ef476f" 
                              strokeWidth="1" 
                              strokeDasharray="5,5"
                            />
                            <line 
                              x1="0" 
                              y1={yLocal} 
                              x2={selectedPlaque.largeur} 
                              y2={yLocal}
                              stroke="#ef476f" 
                              strokeWidth="1" 
                              strokeDasharray="5,5"
                            />
                            <line 
                              x1="0" 
                              y1={yLocal + decoupe.hauteur} 
                              x2={selectedPlaque.largeur} 
                              y2={yLocal + decoupe.hauteur}
                              stroke="#ef476f" 
                              strokeWidth="1" 
                              strokeDasharray="5,5"
                            />
                            
                            {/* Étiquettes des dimensions */}
                            <text x={xLocal + decoupe.largeur / 2} y={yLocal - 5} textAnchor="middle" fontSize="12" fill="#ef476f">
                              {decoupe.largeur} cm
                            </text>
                            <text x={xLocal - 5} y={yLocal + decoupe.hauteur / 2} textAnchor="middle" fontSize="12" fill="#ef476f" transform={`rotate(-90, ${xLocal - 5}, ${yLocal + decoupe.hauteur / 2})`}>
                              {decoupe.hauteur} cm
                            </text>
                            
                            {/* Étiquettes des positions */}
                            <text x={xLocal} y="-10" textAnchor="start" fontSize="10" fill="#666">
                              {xLocal} cm
                            </text>
                            <text x="-10" y={yLocal} textAnchor="end" fontSize="10" fill="#666">
                              {yLocal} cm
                            </text>
                            
                            {/* Type de découpe */}
                            <text x={xLocal + decoupe.largeur / 2} y={yLocal + decoupe.hauteur / 2} textAnchor="middle" dominantBaseline="middle" fontSize="14" fill="#ef476f" fontWeight="bold">
                              {decoupe.type || 'DÉCOUPE'}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Étiquettes générales */}
                      <text x={selectedPlaque.largeur / 2} y="-20" textAnchor="middle" fontSize="14" fill="#3a86ff" fontWeight="bold">
                        Largeur: {selectedPlaque.largeur} cm
                      </text>
                      <text x="-20" y={selectedPlaque.hauteur / 2} textAnchor="middle" fontSize="14" fill="#3a86ff" fontWeight="bold" transform={`rotate(-90, -20, ${selectedPlaque.hauteur / 2})`}>
                        Hauteur: {selectedPlaque.hauteur} cm
                      </text>
                    </svg>
                  </div>
                </div>
                
                <div className="detail-view-instructions">
                  <h4>Instructions de découpe</h4>
                  {selectedPlaque.ajustementNecessaire && (
                    <div className="instruction-step">
                      <span className="step-number">1</span>
                      <p>Découpez d'abord la plaque aux dimensions {selectedPlaque.largeur} × {selectedPlaque.hauteur} cm</p>
                    </div>
                  )}
                  
                  {selectedPlaque.decoupes && selectedPlaque.decoupes.length > 0 ? (
                    <>
                      <div className="instruction-step">
                        <span className="step-number">{selectedPlaque.ajustementNecessaire ? '2' : '1'}</span>
                        <p>Marquez les positions des découpes selon les mesures indiquées</p>
                      </div>
                      <div className="instruction-step">
                        <span className="step-number">{selectedPlaque.ajustementNecessaire ? '3' : '2'}</span>
                        <p>Réalisez les découpes pour les ouvertures en suivant les lignes pointillées</p>
                      </div>
                    </>
                  ) : (
                    <div className="instruction-step">
                      <span className="step-number">{selectedPlaque.ajustementNecessaire ? '2' : '1'}</span>
                      <p>Aucune découpe supplémentaire n'est nécessaire pour les ouvertures</p>
                    </div>
                  )}
                  
                  <div className="instruction-step">
                    <span className="step-number">{selectedPlaque.ajustementNecessaire || selectedPlaque.decoupes?.length > 0 ? '4' : '2'}</span>
                    <p>Installez la plaque à la position ({selectedPlaque.x}, {selectedPlaque.y} depuis le bas) cm sur le mur</p>
                  </div>
                </div>
              </div>
              
              <div className="detail-view-actions">
                <button className="btn btn-secondary" onClick={closeDetailView}>Fermer</button>
                <button className="btn btn-primary" onClick={() => window.print()}>Imprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MurVisualisation;