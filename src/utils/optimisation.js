// src/utils/optimisation.js

/**
 * Algorithme d'optimisation des découpes de plaques de placoplâtre
 * Avec gestion intelligente des chutes réutilisables
 */

// Dimensions minimales pour qu'une chute soit considérée comme réutilisable (en cm)
const TAILLE_MIN_CHUTE = 40; // Une chute doit faire au moins 40cm dans une dimension pour être réutilisable

// Structure pour stocker les chutes disponibles, classées par surface décroissante
let chutesDisponibles = [];

// Détermine si une chute est réutilisable selon ses dimensions
const estReutilisable = (largeur, hauteur) => {
  return (largeur >= TAILLE_MIN_CHUTE && hauteur >= 10) || 
         (hauteur >= TAILLE_MIN_CHUTE && largeur >= 10);
};

// Crée une chute avec une référence à la plaque d'origine
const creerChute = (plaque, largeur, hauteur, x, y) => {
  return {
    largeur,
    hauteur,
    surface: largeur * hauteur,
    plaqueOriginelle: {
      murId: plaque.murId,
      plaqueId: plaque.id,
      plaqueDimensions: `${plaque.largeur}×${plaque.hauteur}cm`
    },
    positionRelative: { x, y },
    utilisee: false,
    id: `chute-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
};

// Identifie les chutes générées lors du découpage d'une plaque
const identifierChutes = (plaque, dimensionsPlaque) => {
  const chutes = [];
  const ajoutees = new Set(); // Pour éviter les doublons
  
  // Si la plaque a été ajustée (plus petite que les dimensions standards)
  if (plaque.ajustementNecessaire) {
    const largeurOriginale = plaque.orientation === 'normal' ? dimensionsPlaque.largeur : dimensionsPlaque.hauteur;
    const hauteurOriginale = plaque.orientation === 'normal' ? dimensionsPlaque.hauteur : dimensionsPlaque.largeur;
    
    // Chute latérale (à droite de la plaque)
    if (plaque.largeur < largeurOriginale) {
      const largeurChute = largeurOriginale - plaque.largeur;
      if (estReutilisable(largeurChute, plaque.hauteur)) {
        const cle = `${largeurChute}-${plaque.hauteur}-droite`;
        if (!ajoutees.has(cle)) {
          chutes.push(creerChute(plaque, largeurChute, plaque.hauteur, plaque.largeur, 0));
          ajoutees.add(cle);
        }
      }
    }
    
    // Chute en bas de la plaque
    if (plaque.hauteur < hauteurOriginale) {
      const hauteurChute = hauteurOriginale - plaque.hauteur;
      if (estReutilisable(plaque.largeur, hauteurChute)) {
        const cle = `${plaque.largeur}-${hauteurChute}-bas`;
        if (!ajoutees.has(cle)) {
          chutes.push(creerChute(plaque, plaque.largeur, hauteurChute, 0, plaque.hauteur));
          ajoutees.add(cle);
        }
      }
      
      // Chute en coin (en bas à droite si les deux dimensions sont ajustées)
      if (plaque.largeur < largeurOriginale) {
        const largeurChute = largeurOriginale - plaque.largeur;
        if (estReutilisable(largeurChute, hauteurChute)) {
          const cle = `${largeurChute}-${hauteurChute}-coin`;
          if (!ajoutees.has(cle)) {
            chutes.push(creerChute(plaque, largeurChute, hauteurChute, plaque.largeur, plaque.hauteur));
            ajoutees.add(cle);
          }
        }
      }
    }
  }
  
  // Pour chaque découpe d'ouverture, vérifier si les chutes autour sont réutilisables
  // Note: cette partie est simplifiée, une version plus complexe pourrait identifier
  // plus précisément les chutes autour des ouvertures irrégulières
  plaque.decoupes.forEach(decoupe => {
    const { xLocal, yLocal, largeur, hauteur } = decoupe;
    
    // Chutes possibles autour de la découpe
    const zones = [
      // Au-dessus de la découpe
      { x: xLocal, y: 0, largeur: largeur, hauteur: yLocal },
      // À gauche de la découpe
      { x: 0, y: yLocal, largeur: xLocal, hauteur: hauteur },
      // À droite de la découpe
      { x: xLocal + largeur, y: yLocal, largeur: plaque.largeur - (xLocal + largeur), hauteur: hauteur },
      // En-dessous de la découpe
      { x: xLocal, y: yLocal + hauteur, largeur: largeur, hauteur: plaque.hauteur - (yLocal + hauteur) }
    ];
    
    // Ajouter les chutes si elles sont assez grandes
    zones.forEach(zone => {
      if (zone.largeur > 0 && zone.hauteur > 0 && estReutilisable(zone.largeur, zone.hauteur)) {
        const cle = `${zone.largeur}-${zone.hauteur}-${zone.x}-${zone.y}`;
        if (!ajoutees.has(cle)) {
          chutes.push(creerChute(plaque, zone.largeur, zone.hauteur, zone.x, zone.y));
          ajoutees.add(cle);
        }
      }
    });
  });
  
  return chutes;
};

// Cherche une chute adaptée pour une plaque donnée
const trouverChuteAdaptee = (largeur, hauteur) => {
  // Trier les chutes par proximité de taille (pour minimiser le gaspillage)
  const chutesTriees = [...chutesDisponibles]
    .filter(chute => !chute.utilisee && chute.largeur >= largeur && chute.hauteur >= hauteur)
    .sort((a, b) => {
      // Calculer le gaspillage pour chaque chute
      const gaspillageA = (a.largeur * a.hauteur) - (largeur * hauteur);
      const gaspillageB = (b.largeur * b.hauteur) - (largeur * hauteur);
      // Privilégier le gaspillage minimal
      return gaspillageA - gaspillageB;
    });
  
  // Retourner la meilleure chute si elle existe
  return chutesTriees.length > 0 ? chutesTriees[0] : null;
};

// Calculer la disposition optimale des plaques pour un mur
export const optimiserPlacement = (mur, dimensionsPlaque, ouvertures, utiliserChutes = true) => {
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
  const chutesUtilisees = [];
  const nouvellePlaquesStandard = []; // Plaques pleines (non issues de chutes)
  
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
          let chuteUtilisee = null;
          
          // Si on utilise les chutes disponibles, chercher une chute adaptée
          if (utiliserChutes) {
            chuteUtilisee = trouverChuteAdaptee(largeurReelle, hauteurReelle);
          }
          
          const plaqueId = `plaque-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const plaque = {
            id: plaqueId,
            x: xPos,
            y: yPos,
            largeur: largeurReelle,
            hauteur: hauteurReelle,
            orientation: orientationFinale,
            ajustementNecessaire: largeurReelle < largeurEffective || hauteurReelle < hauteurEffective,
            decoupes: [],
            // Nouveau: infos sur la chute utilisée
            issueDeChute: chuteUtilisee !== null,
            chuteId: chuteUtilisee ? chuteUtilisee.id : null,
            chuteOriginelle: chuteUtilisee ? chuteUtilisee.plaqueOriginelle : null
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
          
          // Si on a utilisé une chute, la marquer comme utilisée
          if (chuteUtilisee) {
            chuteUtilisee.utilisee = true;
            chutesUtilisees.push(chuteUtilisee);
          } else {
            // Sinon ajouter aux nouvelles plaques standards utilisées
            nouvellePlaquesStandard.push(plaque);
          }
          
          plaques.push(plaque);
        }
      }
    }
  }
  
  // Identifier les nouvelles chutes générées
  const nouvellesChutes = [];
  [...nouvellePlaquesStandard].forEach(plaque => {
    const chutesPlaque = identifierChutes(plaque, dimensionsPlaque);
    nouvellesChutes.push(...chutesPlaque);
  });
  
  // Ajouter les nouvelles chutes au stock disponible
  if (utiliserChutes) {
    chutesDisponibles = [
      ...chutesDisponibles.filter(c => !c.utilisee), // Garder les chutes non utilisées
      ...nouvellesChutes // Ajouter les nouvelles chutes
    ].sort((a, b) => b.surface - a.surface); // Trier par surface décroissante
  }
  
  // Calculer le nombre de plaques standard nécessaires
  const nbPlaquesStandard = nouvellePlaquesStandard.length;
  
  // Calculer les économies réalisées grâce aux chutes
  const economiesChutes = {
    nbPlaquesEconomisees: chutesUtilisees.length,
    surfaceEconomisee: chutesUtilisees.reduce((acc, c) => acc + c.surface, 0),
    chutesPourCeMur: nouvellesChutes.length,
    surfaceChutesGenerees: nouvellesChutes.reduce((acc, c) => acc + c.surface, 0),
  };
  
  return {
    plaques,
    nbPlaques: nbPlaquesStandard, // Nombre de plaques complètes utilisées
    nbChutesUtilisees: chutesUtilisees.length,
    chutesUtilisees,
    nouvellesChutes,
    surfaceUtile,
    orientation: orientationFinale,
    economiesChutes
  };
};

// Fonction pour optimiser tous les murs à la fois
export const optimiserTousMurs = (murs, dimensionsPlaque, utiliserChutes = true) => {
  // Réinitialiser les chutes disponibles pour un nouveau calcul global
  if (!utiliserChutes) {
    chutesDisponibles = [];
  }
  
  let toutesLesPlaques = [];
  let surfaceUtileTotale = 0;
  let nbPlaquesTotal = 0;
  let nbChutesUtiliseesTotal = 0;
  let surfaceChutesTotal = 0;
  let surfaceChutesGenerees = 0;
  const resultatsParMur = [];
  
  // Pour chaque mur, utiliser l'algorithme d'optimisation
  murs.forEach((mur, index) => {
    const resultatOptimisation = optimiserPlacement(
      { largeur: mur.largeur, hauteur: mur.hauteur },
      dimensionsPlaque,
      mur.ouvertures,
      utiliserChutes
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
      nbChutesUtilisees: resultatOptimisation.nbChutesUtilisees,
      surfaceUtile: surfaceUtileMur,
      dimensions: `${mur.largeur} × ${mur.hauteur} cm`,
      nbOuvertures: mur.ouvertures.length,
      economiesChutes: resultatOptimisation.economiesChutes
    });
    
    // Ajouter les plaques au total
    toutesLesPlaques = [...toutesLesPlaques, ...plaquesAvecId];
    
    // Ajouter la surface utile au total
    surfaceUtileTotale += surfaceUtileMur;
    
    // Ajouter le nombre de plaques au total
    nbPlaquesTotal += resultatOptimisation.nbPlaques;
    nbChutesUtiliseesTotal += resultatOptimisation.nbChutesUtilisees;
    
    // Comptabiliser les chutes générées et utilisées
    surfaceChutesTotal += resultatOptimisation.economiesChutes.surfaceEconomisee;
    surfaceChutesGenerees += resultatOptimisation.economiesChutes.surfaceChutesGenerees;
  });
  
  // Calculer la surface totale des plaques standard
  const surfacePlaque = dimensionsPlaque.largeur * dimensionsPlaque.hauteur;
  const surfaceTotalePlaques = nbPlaquesTotal * surfacePlaque;
  
  // Calculer le pourcentage de chutes
  const pourcentageChutes = Math.max(0, ((surfaceTotalePlaques - surfaceUtileTotale) / surfaceTotalePlaques) * 100);
  
  // Nouvelles statistiques sur les chutes
  const economieGlobale = {
    nbPlaquesStandard: nbPlaquesTotal,
    nbChutesUtilisees: nbChutesUtiliseesTotal,
    pourcentageEconomie: nbChutesUtiliseesTotal > 0 
      ? (nbChutesUtiliseesTotal / (nbPlaquesTotal + nbChutesUtiliseesTotal)) * 100 
      : 0,
    surfaceChutesUtilisees: surfaceChutesTotal,
    surfaceChutesDisponibles: chutesDisponibles.filter(c => !c.utilisee).reduce((acc, c) => acc + c.surface, 0),
    nbChutesDisponibles: chutesDisponibles.filter(c => !c.utilisee).length,
    surfaceChutesGenerees: surfaceChutesGenerees
  };
  
  return {
    plaques: toutesLesPlaques,
    nbPlaques: nbPlaquesTotal,
    surfaceTotale: surfaceTotalePlaques,
    surfaceUtile: surfaceUtileTotale,
    pourcentageChutes: pourcentageChutes,
    murDetails: resultatsParMur,
    economieChutes: economieGlobale,
    chutesDisponibles: chutesDisponibles.filter(c => !c.utilisee) // Ne retourner que les chutes non utilisées
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