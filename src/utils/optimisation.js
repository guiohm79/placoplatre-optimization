// src/utils/optimisation.js

/**
 * Algorithme d'optimisation des découpes de plaques de placoplâtre
 * Avec correction pour la couverture complète de tous les murs
 * Système de coordonnées avec origine en bas à gauche
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
  
  // Générer les plaques - ATTENTION: avec origine en bas à gauche
  const plaques = [];
  let chutesReutilisables = [];
  
  for (let y = 0; y < plaquesEnHauteur; y++) {
    for (let x = 0; x < plaquesEnLargeur; x++) {
      const xPos = x * largeurEffective;
      // Pour l'origine en bas à gauche, on commence par y=0 en bas
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
          
          // Calculer les chutes si des ajustements sont nécessaires
          if (plaque.ajustementNecessaire) {
            const chutesPlaque = calculerChutes(plaque, largeurEffective, hauteurEffective);
            chutesReutilisables = [...chutesReutilisables, ...chutesPlaque];
          }
        }
      }
    }
  }
  
  // Filtrer les chutes réutilisables (surface minimale de 2500 cm² ou 0.25m²)
  const SURFACE_MINIMALE_REUTILISABLE = 2500; // en cm²
  chutesReutilisables = chutesReutilisables
    .filter(chute => chute.surface >= SURFACE_MINIMALE_REUTILISABLE)
    .sort((a, b) => b.surface - a.surface); // Trier par surface décroissante
  
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
    orientation: orientationFinale,
    chutesReutilisables
  };
};

// Fonction pour calculer les chutes d'une plaque ajustée
const calculerChutes = (plaque, largeurOrigine, hauteurOrigine) => {
  const chutes = [];
  
  // Si la largeur a été ajustée, il y a une chute sur le côté droit
  if (plaque.largeur < largeurOrigine) {
    const chuteLaterale = {
      x: plaque.x + plaque.largeur,
      y: plaque.y,
      largeur: largeurOrigine - plaque.largeur,
      hauteur: plaque.hauteur,
      surface: (largeurOrigine - plaque.largeur) * plaque.hauteur
    };
    chutes.push(chuteLaterale);
  }
  
  // Si la hauteur a été ajustée, il y a une chute au-dessus
  if (plaque.hauteur < hauteurOrigine) {
    const chuteHauteur = {
      x: plaque.x,
      y: plaque.y + plaque.hauteur,
      largeur: plaque.largeur,
      hauteur: hauteurOrigine - plaque.hauteur,
      surface: plaque.largeur * (hauteurOrigine - plaque.hauteur)
    };
    chutes.push(chuteHauteur);
  }
  
  // Si les deux dimensions ont été ajustées, il y a une chute en coin
  if (plaque.largeur < largeurOrigine && plaque.hauteur < hauteurOrigine) {
    const chuteCoin = {
      x: plaque.x + plaque.largeur,
      y: plaque.y + plaque.hauteur,
      largeur: largeurOrigine - plaque.largeur,
      hauteur: hauteurOrigine - plaque.hauteur,
      surface: (largeurOrigine - plaque.largeur) * (hauteurOrigine - plaque.hauteur)
    };
    chutes.push(chuteCoin);
  }
  
  return chutes;
};

// Fonction pour optimiser tous les murs à la fois
export const optimiserTousMurs = (murs, dimensionsPlaque) => {
  let toutesLesPlaques = [];
  let surfaceUtileTotale = 0;
  let nbPlaquesTotal = 0;
  let toutesLesChutes = [];
  const resultatsParMur = [];
  
  // Pour chaque mur, utiliser l'algorithme d'optimisation
  murs.forEach(mur => {
    // Créer une copie des ouvertures pour ne pas modifier les originales
    const ouverturesCopiees = mur.ouvertures.map(o => ({...o}));
    
    const resultatOptimisation = optimiserPlacement(
      { largeur: mur.largeur, hauteur: mur.hauteur },
      dimensionsPlaque,
      ouverturesCopiees
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
    
    // Récupérer les chutes pour ce mur
    const chutesAvecIdMur = resultatOptimisation.chutesReutilisables.map(chute => ({
      ...chute,
      murId: mur.id,
      murNom: mur.nom
    }));
    
    // Stocker les résultats pour ce mur
    resultatsParMur.push({
      murId: mur.id,
      murNom: mur.nom,
      nbPlaques: resultatOptimisation.nbPlaques,
      surfaceUtile: surfaceUtileMur,
      dimensions: `${mur.largeur} × ${mur.hauteur} cm`,
      nbOuvertures: mur.ouvertures.length,
      nbChutes: chutesAvecIdMur.length
    });
    
    // Ajouter les plaques au total
    toutesLesPlaques = [...toutesLesPlaques, ...plaquesAvecId];
    
    // Ajouter les chutes au total
    toutesLesChutes = [...toutesLesChutes, ...chutesAvecIdMur];
    
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
  
  // Calculer la surface totale des chutes réutilisables
  const surfaceTotaleChutes = toutesLesChutes.reduce((acc, chute) => acc + chute.surface, 0);
  
  return {
    plaques: toutesLesPlaques,
    nbPlaques: nbPlaquesTotal,
    surfaceTotale: surfaceTotalePlaques,
    surfaceUtile: surfaceUtileTotale,
    pourcentageChutes: pourcentageChutes,
    murDetails: resultatsParMur,
    chutesReutilisables: {
      nombre: toutesLesChutes.length,
      surface: surfaceTotaleChutes,
      surfaceEnM2: surfaceTotaleChutes / 10000, // Conversion en m²
      details: toutesLesChutes
    }
  };
};

// Vérifie si deux rectangles se chevauchent
// Fonctionne avec origine en bas à gauche
const rectanglesSeChevaucent = (rect1, rect2) => {
  return !(
    rect1.x + rect1.largeur <= rect2.x ||
    rect2.x + rect2.largeur <= rect1.x ||
    rect1.y + rect1.hauteur <= rect2.y ||
    rect2.y + rect2.hauteur <= rect1.y
  );
};

// Vérifie si un rectangle contient entièrement un autre rectangle
// Fonctionne avec origine en bas à gauche
const rectangleContient = (rectExterieur, rectInterieur) => {
  return (
    rectInterieur.x >= rectExterieur.x &&
    rectInterieur.y >= rectExterieur.y &&
    rectInterieur.x + rectInterieur.largeur <= rectExterieur.x + rectExterieur.largeur &&
    rectInterieur.y + rectInterieur.hauteur <= rectExterieur.y + rectExterieur.hauteur
  );
};

// Calcule l'intersection entre deux rectangles
// Fonctionne avec origine en bas à gauche
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