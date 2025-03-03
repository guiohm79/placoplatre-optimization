// src/utils/optimisation.js

/**
 * Algorithme d'optimisation des découpes de plaques de placoplâtre
 * Avec correction pour la couverture complète de tous les murs
 */

// Calcule la disposition optimale des plaques pour un mur
export const optimiserPlacement = (mur, dimensionsPlaque, ouvertures) => {
  const { largeur: murLargeur, hauteur: murHauteur } = mur;
  const { largeur: plaqueLargeur, hauteur: plaqueHauteur } = dimensionsPlaque;
  
  // Calculer la surface du mur et des ouvertures
  const surfaceMur = murLargeur * murHauteur;
  const surfaceOuvertures = ouvertures.reduce((acc, o) => acc + (o.largeur * o.hauteur), 0);
  const surfaceUtile = surfaceMur - surfaceOuvertures;
  
  // Déterminer l'orientation optimale des plaques (horizontale ou verticale)
  let orientationFinale, largeurEffective, hauteurEffective;
  
  // Tester les deux orientations possibles
  const orientations = [
    { nom: 'normal', largeur: plaqueLargeur, hauteur: plaqueHauteur },
    { nom: 'rotated', largeur: plaqueHauteur, hauteur: plaqueLargeur }
  ];
  
  let meilleurConfig = null;
  let meilleurScore = Infinity;
  
  orientations.forEach(orientation => {
    const { nom, largeur, hauteur } = orientation;
    
    // Calculer le nombre de plaques nécessaires dans cette orientation
    const plaquesEnLargeur = Math.ceil(murLargeur / largeur);
    const plaquesEnHauteur = Math.ceil(murHauteur / hauteur);
    const nbPlaques = plaquesEnLargeur * plaquesEnHauteur;
    
    // Calculer le gaspillage (différence entre surface utilisée et surface nécessaire)
    const surfaceUtilisee = nbPlaques * largeur * hauteur;
    const gaspillage = surfaceUtilisee - surfaceMur;
    
    // Score basé sur nombre de plaques et gaspillage
    const score = nbPlaques * 10000 + gaspillage;
    
    if (score < meilleurScore) {
      meilleurScore = score;
      meilleurConfig = { 
        orientation: nom, 
        largeurEffective: largeur, 
        hauteurEffective: hauteur,
        plaquesEnLargeur,
        plaquesEnHauteur
      };
    }
  });
  
  // Utiliser la meilleure configuration trouvée
  orientationFinale = meilleurConfig.orientation;
  largeurEffective = meilleurConfig.largeurEffective;
  hauteurEffective = meilleurConfig.hauteurEffective;
  
  // Calculer le nombre de plaques en largeur et en hauteur
  const plaquesEnLargeur = meilleurConfig.plaquesEnLargeur;
  const plaquesEnHauteur = meilleurConfig.plaquesEnHauteur;
  
  // Générer les plaques
  const plaques = [];
  
  for (let y = 0; y < plaquesEnHauteur; y++) {
    for (let x = 0; x < plaquesEnLargeur; x++) {
      const xPos = x * largeurEffective;
      const yPos = y * hauteurEffective;
      
      // Calculer les dimensions réelles de cette plaque (peut être plus petite si c'est une plaque de bord)
      const largeurReelle = Math.min(largeurEffective, murLargeur - xPos);
      const hauteurReelle = Math.min(hauteurEffective, murHauteur - yPos);
      
      // Vérifier si cette plaque est nécessaire (si elle a une surface > 0)
      if (largeurReelle > 0 && hauteurReelle > 0) {
        // Déterminer si cette plaque est entièrement couverte par une ouverture
        const entierementCouverte = ouvertures.some(o => 
          rectangleContient(
            o,
            { x: xPos, y: yPos, largeur: largeurReelle, hauteur: hauteurReelle }
          )
        );
        
        // N'ajouter la plaque que si elle n'est pas entièrement couverte par une ouverture
        if (!entierementCouverte) {
          const plaque = {
            x: xPos,
            y: yPos,
            largeur: largeurReelle,
            hauteur: hauteurReelle,
            orientation: orientationFinale,
            ajustementNecessaire: largeurReelle < largeurEffective || hauteurReelle < hauteurEffective,
            decoupes: []
          };
          
          // Ajouter les découpes pour les ouvertures
          ouvertures.forEach(ouverture => {
            if (rectanglesSeChevaucent(plaque, ouverture)) {
              const decoupe = calculerIntersection(plaque, ouverture);
              
              // Ajouter les coordonnées relatives à la plaque
              decoupe.xLocal = decoupe.x - plaque.x;
              decoupe.yLocal = decoupe.y - plaque.y;
              decoupe.type = ouverture.type;
              
              plaque.decoupes.push(decoupe);
            }
          });
          
          plaques.push(plaque);
        }
      }
    }
  }
  
  // Calculer le nombre de plaques standard nécessaires en se basant sur la surface
  const surfacePlaque = plaqueLargeur * plaqueHauteur;
  const nbPlaquesTheoriqueSurface = Math.ceil(surfaceUtile / surfacePlaque);
  
  // Le nombre de plaques final est le nombre de plaques générées
  // (après avoir éliminé celles entièrement couvertes par des ouvertures)
  const nbPlaques = Math.max(plaques.length, nbPlaquesTheoriqueSurface);
  
  return {
    plaques,
    nbPlaques,
    surfaceUtile,
    orientation: orientationFinale
  };
};

// Fonction pour optimiser tous les murs à la fois
export const optimiserTousMurs = (murs, dimensionsPlaque) => {
  let toutesLesPlaques = [];
  let surfaceUtileTotale = 0;
  let nbPlaquesTotal = 0;
  const resultatsParMur = [];
  
  // Pour chaque mur, utiliser l'algorithme d'optimisation
  murs.forEach(mur => {
    const resultatOptimisation = optimiserPlacement(
      { largeur: mur.largeur, hauteur: mur.hauteur },
      dimensionsPlaque,
      mur.ouvertures
    );
    
    // Ajouter l'identifiant du mur à chaque plaque
    const plaquesAvecId = resultatOptimisation.plaques.map(plaque => ({
      ...plaque,
      murId: mur.id,
      murNom: mur.nom,
    }));
    
    // Calculer la surface utilisée pour ce mur
    const surfaceMur = mur.largeur * mur.hauteur;
    const surfaceOuvertures = mur.ouvertures.reduce((acc, o) => acc + (o.largeur * o.hauteur), 0);
    const surfaceUtileMur = surfaceMur - surfaceOuvertures;
    
    // Stocker les résultats pour ce mur
    resultatsParMur.push({
      murId: mur.id,
      murNom: mur.nom,
      nbPlaques: resultatOptimisation.nbPlaques,
      surfaceUtile: surfaceUtileMur,
      dimensions: `${mur.largeur} × ${mur.hauteur} cm`,
      nbOuvertures: mur.ouvertures.length
    });
    
    // Ajouter les plaques au total
    toutesLesPlaques = [...toutesLesPlaques, ...plaquesAvecId];
    
    // Ajouter la surface utile au total
    surfaceUtileTotale += surfaceUtileMur;
    
    // Ajouter le nombre de plaques au total
    nbPlaquesTotal += resultatOptimisation.nbPlaques;
  });
  
  // Calculer la surface totale des plaques standard
  const surfacePlaque = dimensionsPlaque.largeur * dimensionsPlaque.hauteur;
  const surfaceTotalePlaques = nbPlaquesTotal * surfacePlaque;
  
  // Calculer le pourcentage de chutes
  const pourcentageChutes = Math.max(0, ((surfaceTotalePlaques - surfaceUtileTotale) / surfaceTotalePlaques) * 100);
  
  return {
    plaques: toutesLesPlaques,
    nbPlaques: nbPlaquesTotal,
    surfaceTotale: surfaceTotalePlaques,
    surfaceUtile: surfaceUtileTotale,
    pourcentageChutes: pourcentageChutes,
    murDetails: resultatsParMur
  };
};

// Vérifie si deux rectangles se chevauchent
const rectanglesSeChevaucent = (rect1, rect2) => {
  return !(
    rect1.x + rect1.largeur <= rect2.x ||
    rect2.x + rect2.largeur <= rect1.x ||
    rect1.y + rect1.hauteur <= rect2.y ||
    rect2.y + rect2.hauteur <= rect1.y
  );
};

// Vérifie si un rectangle contient entièrement un autre rectangle
const rectangleContient = (rectExterieur, rectInterieur) => {
  return (
    rectInterieur.x >= rectExterieur.x &&
    rectInterieur.y >= rectExterieur.y &&
    rectInterieur.x + rectInterieur.largeur <= rectExterieur.x + rectExterieur.largeur &&
    rectInterieur.y + rectInterieur.hauteur <= rectExterieur.y + rectExterieur.hauteur
  );
};

// Calcule l'intersection entre deux rectangles
const calculerIntersection = (rect1, rect2) => {
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
};

// Fonction pour vérifier si deux ouvertures se chevauchent
export const ouverturesSeChevaucent = (ouverture1, ouverture2) => {
  return rectanglesSeChevaucent(ouverture1, ouverture2);
};

// Fonction pour vérifier si une ouverture dépasse des limites du mur
export const ouvertureDebordeMur = (ouverture, mur) => {
  return (
    ouverture.x < 0 ||
    ouverture.y < 0 ||
    ouverture.x + ouverture.largeur > mur.largeur ||
    ouverture.y + ouverture.hauteur > mur.hauteur
  );
};