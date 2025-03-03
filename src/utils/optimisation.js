// src/utils/optimisation.js

/**
 * Algorithme d'optimisation des découpes de plaques de placoplâtre
 * Cette implémentation met l'accent sur l'aspect pratique pour l'ouvrier
 */

// Calcule la disposition optimale des plaques pour un mur
export const optimiserPlacement = (mur, dimensionsPlaque, ouvertures) => {
    const { largeur: murLargeur, hauteur: murHauteur } = mur;
    const { largeur: plaqueLargeur, hauteur: plaqueHauteur } = dimensionsPlaque;
    
    // Calculer la surface utile à couvrir (mur moins ouvertures)
    const surfaceMur = murLargeur * murHauteur;
    const surfaceOuvertures = ouvertures.reduce((acc, o) => acc + (o.largeur * o.hauteur), 0);
    const surfaceUtile = surfaceMur - surfaceOuvertures;
    
    // Déterminer si les plaques devraient être placées horizontalement ou verticalement
    // en se basant sur les dimensions du mur et des plaques
    const orientationPlaque = determinerOrientationOptimale(murLargeur, murHauteur, plaqueLargeur, plaqueHauteur);
    
    // Dimensions effectives des plaques selon l'orientation
    const largeurEffective = orientationPlaque === 'horizontal' ? plaqueLargeur : plaqueHauteur;
    const hauteurEffective = orientationPlaque === 'horizontal' ? plaqueHauteur : plaqueLargeur;
    
    // Calculer combien de plaques sont nécessaires en largeur et en hauteur
    const plaquesEnLargeur = Math.ceil(murLargeur / largeurEffective);
    const plaquesEnHauteur = Math.ceil(murHauteur / hauteurEffective);
    
    // Générer la disposition des plaques
    const plaques = genererDispositionPlaques(
      murLargeur, 
      murHauteur, 
      largeurEffective, 
      hauteurEffective,
      plaquesEnLargeur,
      plaquesEnHauteur,
      orientationPlaque
    );
    
    // Ajouter les découpes pour les ouvertures
    ajouterDecoupesPourOuvertures(plaques, ouvertures);
    
    return {
      plaques,
      orientationPlaque,
      nbPlaques: plaques.length,
      surfaceUtile
    };
  };
  
  // Détermine l'orientation optimale des plaques pour minimiser les chutes
  const determinerOrientationOptimale = (murLargeur, murHauteur, plaqueLargeur, plaqueHauteur) => {
    // Calculer le nombre de plaques nécessaires dans chaque orientation
    const nbPlaquesHorizontal = Math.ceil(murLargeur / plaqueLargeur) * Math.ceil(murHauteur / plaqueHauteur);
    const nbPlaquesVertical = Math.ceil(murLargeur / plaqueHauteur) * Math.ceil(murHauteur / plaqueLargeur);
    
    // Choisir l'orientation qui minimise le nombre de plaques
    return nbPlaquesHorizontal <= nbPlaquesVertical ? 'horizontal' : 'vertical';
  };
  
  // Génère la disposition des plaques sur le mur
  const genererDispositionPlaques = (murLargeur, murHauteur, largeurPlaque, hauteurPlaque, plaquesEnLargeur, plaquesEnHauteur, orientation) => {
    const plaques = [];
    
    for (let y = 0; y < plaquesEnHauteur; y++) {
      for (let x = 0; x < plaquesEnLargeur; x++) {
        // Calculer les dimensions réelles de cette plaque (peut être plus petite si c'est une plaque de bord)
        const largeurReelle = Math.min(largeurPlaque, murLargeur - x * largeurPlaque);
        const hauteurReelle = Math.min(hauteurPlaque, murHauteur - y * hauteurPlaque);
        
        // Vérifier si cette plaque est nécessaire (si elle a une surface > 0)
        if (largeurReelle > 0 && hauteurReelle > 0) {
          // Déterminer si cette plaque nécessite un ajustement
          const ajustementNecessaire = largeurReelle < largeurPlaque || hauteurReelle < hauteurPlaque;
          
          plaques.push({
            x: x * largeurPlaque,
            y: y * hauteurPlaque,
            largeur: largeurReelle,
            hauteur: hauteurReelle,
            orientation,
            ajustementNecessaire,
            decoupes: []
          });
        }
      }
    }
    
    return plaques;
  };
  
  // Ajoute les découpes pour les ouvertures à chaque plaque
  const ajouterDecoupesPourOuvertures = (plaques, ouvertures) => {
    plaques.forEach(plaque => {
      ouvertures.forEach(ouverture => {
        // Vérifier si l'ouverture chevauche cette plaque
        if (rectanglesSeChevaucent(plaque, ouverture)) {
          // Calculer l'intersection (zone de découpe)
          const decoupe = calculerIntersection(plaque, ouverture);
          
          // Ajouter les coordonnées relatives à la plaque pour faciliter la découpe
          decoupe.xLocal = decoupe.x - plaque.x;
          decoupe.yLocal = decoupe.y - plaque.y;
          decoupe.type = ouverture.type;
          
          plaque.decoupes.push(decoupe);
        }
      });
    });
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
  
  // Fonction pour optimiser tous les murs à la fois
  export const optimiserTousMurs = (murs, dimensionsPlaque) => {
    let toutesLesPlaques = [];
    let surfaceUtileTotale = 0;
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
      
      // Calculer le nombre de plaques complètes nécessaires pour ce mur
      const surfacePlaque = dimensionsPlaque.largeur * dimensionsPlaque.hauteur;
      const nbPlaquesNecessaires = Math.ceil(surfaceUtileMur / surfacePlaque);
      
      // Stocker les résultats pour ce mur
      resultatsParMur.push({
        murId: mur.id,
        murNom: mur.nom,
        nbPlaques: nbPlaquesNecessaires,
        surfaceUtile: surfaceUtileMur,
        dimensions: `${mur.largeur} × ${mur.hauteur} cm`,
        nbOuvertures: mur.ouvertures.length
      });
      
      // Ajouter les plaques au total
      toutesLesPlaques = [...toutesLesPlaques, ...plaquesAvecId];
      
      // Ajouter la surface utile au total
      surfaceUtileTotale += surfaceUtileMur;
    });
    
    // Calculer le nombre total de plaques nécessaires
    const surfacePlaque = dimensionsPlaque.largeur * dimensionsPlaque.hauteur;
    const nbPlaquesTotales = Math.ceil(surfaceUtileTotale / surfacePlaque);
    
    // Calculer la surface totale des plaques
    const surfaceTotalePlaques = nbPlaquesTotales * surfacePlaque;
    
    // Calculer le pourcentage de chutes
    const pourcentageChutes = Math.max(0, ((surfaceTotalePlaques - surfaceUtileTotale) / surfaceTotalePlaques) * 100);
    
    return {
      plaques: toutesLesPlaques,
      nbPlaques: nbPlaquesTotales,
      surfaceTotale: surfaceTotalePlaques,
      surfaceUtile: surfaceUtileTotale,
      pourcentageChutes: pourcentageChutes,
      murDetails: resultatsParMur
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