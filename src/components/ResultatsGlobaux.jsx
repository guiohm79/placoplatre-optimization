import React from 'react';

function ResultatsGlobaux({ resultat, murs }) {
  if (!resultat) return null;
  
  // Fonction pour calculer le nombre réel de plaques par mur
  const calculerPlaquesParMur = (mur) => {
    const surfacePlaqueTotale = resultat.surfaceTotale / resultat.nbPlaques;
    const surfaceMur = mur.largeur * mur.hauteur;
    const surfaceOuvertures = mur.ouvertures.reduce((acc, o) => acc + (o.largeur * o.hauteur), 0);
    const surfaceUtileMur = surfaceMur - surfaceOuvertures;
    return Math.ceil(surfaceUtileMur / surfacePlaqueTotale);
  };
  
  return (
    <div className="card">
      <div className="card-header">
        <h2>Résultats globaux</h2>
      </div>
      
      <div className="stats-container">
        <div className="stat-item">
          <div className="stat-label">Total des plaques nécessaires:</div>
          <div className="stat-value highlight">{resultat.nbPlaques}</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-label">Surface totale des plaques:</div>
          <div className="stat-value">{resultat.surfaceTotale.toLocaleString()} cm²</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-label">Surface utile:</div>
          <div className="stat-value">{resultat.surfaceUtile.toLocaleString()} cm²</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-label">Pourcentage de chutes:</div>
          <div className="stat-value">{resultat.pourcentageChutes.toFixed(2)}%</div>
        </div>
      </div>
      
      <div className="detail-section">
        <h3>Détail par mur</h3>
        
        {murs.map(mur => {
          const nbPlaquesMur = calculerPlaquesParMur(mur);
          const surfaceMur = mur.largeur * mur.hauteur;
          const surfaceOuvertures = mur.ouvertures.reduce((acc, o) => acc + (o.largeur * o.hauteur), 0);
          const surfaceUtileMur = surfaceMur - surfaceOuvertures;
          
          return (
            <div key={mur.id} className="mur-detail">
              <div className="mur-detail-header">
                <h4>{mur.nom}</h4>
                <div className="mur-detail-stats">
                  <span>{nbPlaquesMur} plaques nécessaires</span>
                </div>
              </div>
              
              <div className="mur-detail-infos">
                <div className="mur-detail-info">
                  <span>Dimensions: {mur.largeur} × {mur.hauteur} cm</span>
                </div>
                <div className="mur-detail-info">
                  <span>Surface utile: {surfaceUtileMur.toLocaleString()} cm²</span>
                </div>
                <div className="mur-detail-info">
                  <span>Ouvertures: {mur.ouvertures.length}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ResultatsGlobaux;