import React from 'react';

function ResultatsGlobaux({ resultat, murs }) {
  if (!resultat) return null;
  
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
          const plaquesParMur = resultat.plaques.filter(p => p.murId === mur.id);
          return (
            <div key={mur.id} className="mur-detail">
              <div className="mur-detail-header">
                <h4>{mur.nom}</h4>
                <div className="mur-detail-stats">
                  <span>{plaquesParMur.length} plaques</span>
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