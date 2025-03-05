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
  
  // Calculer l'économie totale
  const economieChutes = resultat.economieChutes || {
    nbChutesUtilisees: 0,
    pourcentageEconomie: 0,
    surfaceChutesUtilisees: 0,
    nbChutesDisponibles: 0,
    surfaceChutesDisponibles: 0
  };
  
  const economieEnEuros = (economieChutes.nbChutesUtilisees * 15).toFixed(2); // Estimation: 15€ par plaque
  
  return (
    <div className="card">
      <div className="card-header">
        <h2>Résultats globaux</h2>
      </div>
      
      <div className="stats-container">
        <div className="stat-item">
          <div className="stat-label">Total des plaques entières:</div>
          <div className="stat-value highlight">{resultat.nbPlaques}</div>
        </div>
        
        {economieChutes.nbChutesUtilisees > 0 && (
          <div className="stat-item">
            <div className="stat-label">Chutes réutilisées:</div>
            <div className="stat-value highlight-success">{economieChutes.nbChutesUtilisees}</div>
          </div>
        )}
        
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
        
        {economieChutes.nbChutesUtilisees > 0 && (
          <div className="stat-item">
            <div className="stat-label">Économie réalisée:</div>
            <div className="stat-value highlight-success">~{economieEnEuros} €</div>
          </div>
        )}
      </div>
      
      {economieChutes.nbChutesDisponibles > 0 && (
        <div className="chutes-disponibles">
          <h3>Chutes disponibles</h3>
          <p>
            Il vous reste <strong>{economieChutes.nbChutesDisponibles}</strong> chutes réutilisables 
            (environ <strong>{Math.floor(economieChutes.surfaceChutesDisponibles / 10000)} m²</strong>).
            Conservez-les pour vos prochains projets !
          </p>
        </div>
      )}
      
      <div className="detail-section">
        <h3>Détail par mur</h3>
        
        {murs.map(mur => {
          const murDetail = resultat.murDetails?.find(m => m.murId === mur.id) || {};
          const nbPlaquesMur = murDetail.nbPlaques || calculerPlaquesParMur(mur);
          const nbChutesUtilisees = murDetail.nbChutesUtilisees || 0;
          const surfaceMur = mur.largeur * mur.hauteur;
          const surfaceOuvertures = mur.ouvertures.reduce((acc, o) => acc + (o.largeur * o.hauteur), 0);
          const surfaceUtileMur = surfaceMur - surfaceOuvertures;
          
          return (
            <div key={mur.id} className="mur-detail">
              <div className="mur-detail-header">
                <h4>{mur.nom}</h4>
                <div className="mur-detail-stats">
                  <span>{nbPlaquesMur} plaques entières</span>
                  {nbChutesUtilisees > 0 && (
                    <span className="tag tag-success">+ {nbChutesUtilisees} chutes</span>
                  )}
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
                
                {murDetail.economiesChutes && murDetail.economiesChutes.chutesPourCeMur > 0 && (
                  <div className="mur-detail-info tag tag-info">
                    <span>Ce mur génère {murDetail.economiesChutes.chutesPourCeMur} chutes réutilisables</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ResultatsGlobaux;