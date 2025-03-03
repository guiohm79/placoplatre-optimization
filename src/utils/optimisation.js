// src/utils/optimisation.js

// Fonction d'optimisation avancée basée sur l'algorithme de bin packing 2D
export const optimiserPlacement = (mur, dimensionsPlaque, ouvertures) => {
    const { largeur: murLargeur, hauteur: murHauteur } = mur;
    const { largeur: plaqueLargeur, hauteur: plaqueHauteur } = dimensionsPlaque;
    
    // Créer une matrice représentant le mur (1 = à couvrir, 0 = ouverture ou déjà couvert)
    const murGrid = Array(murHauteur).fill().map(() => Array(murLargeur).fill(1));
    
    // Marquer les ouvertures
    ouvertures.forEach(ouverture => {
      for (let y = ouverture.y; y < ouverture.y + ouverture.hauteur; y++) {
        if (y >= murHauteur) continue;
        for (let x = ouverture.x; x < ouverture.x + ouverture.largeur; x++) {
          if (x >= murLargeur) continue;
          murGrid[y][x] = 0;
        }
      }
    });
    
    // Essayer les deux orientations de plaques possibles
    const configurations = [
      { largeur: plaqueLargeur, hauteur: plaqueHauteur },
      { largeur: plaqueHauteur, hauteur: plaqueLargeur }
    ];
    
    let meilleureConfig = null;
    let meilleureEfficacite = 0;
    let meilleuresPlaques = [];
    
    // Tester chaque configuration
    configurations.forEach(config => {
      const { largeur, hauteur } = config;
      const plaques = [];
      const murGridCopy = murGrid.map(row => [...row]);
      
      // Stratégie: chercher les plus grandes zones à couvrir en priorité
      for (let startY = 0; startY <= murHauteur - 1; startY++) {
        for (let startX = 0; startX <= murLargeur - 1; startX++) {
          // Si cette cellule est déjà couverte ou est une ouverture, passer
          if (murGridCopy[startY][startX] === 0) continue;
          
          // Trouver la taille maximale pour une plaque à cette position
          let maxLargeur = Math.min(largeur, murLargeur - startX);
          let maxHauteur = Math.min(hauteur, murHauteur - startY);
          
          // Vérifier si on peut placer une plaque ici
          let aCouvrir = false;
          let largeurOptimale = 0;
          let hauteurOptimale = 0;
          
          // Chercher la taille optimale pour cette plaque
          for (let h = 1; h <= maxHauteur; h++) {
            for (let w = 1; w <= maxLargeur; w++) {
              let valide = true;
              let auMoinsUneACouvrir = false;
              
              // Vérifier si cette dimension de plaque est valide
              for (let y = startY; y < startY + h; y++) {
                for (let x = startX; x < startX + w; x++) {
                  if (murGridCopy[y][x] === 0) {
                    // Si c'est une ouverture, on ne peut pas couvrir
                    valide = false;
                    break;
                  }
                  auMoinsUneACouvrir = true;
                }
                if (!valide) break;
              }
              
              if (valide && auMoinsUneACouvrir) {
                // Si cette taille est valide et plus grande que ce qu'on a trouvé jusqu'ici
                if (w * h > largeurOptimale * hauteurOptimale) {
                  largeurOptimale = w;
                  hauteurOptimale = h;
                  aCouvrir = true;
                }
              }
            }
          }
          
          if (aCouvrir) {
            // Créer une nouvelle plaque
            const nouvellePlaque = {
              x: startX,
              y: startY,
              largeur: largeurOptimale,
              hauteur: hauteurOptimale,
              orientation: largeur === config.largeur ? 'normal' : 'rotated',
              decoupes: []
            };
            
            // Marquer la zone comme couverte
            for (let y = startY; y < startY + hauteurOptimale; y++) {
              for (let x = startX; x < startX + largeurOptimale; x++) {
                murGridCopy[y][x] = 0;
              }
            }
            
            plaques.push(nouvellePlaque);
          }
        }
      }
      
      // Calculer l'efficacité de cette configuration
      const surfaceCouverte = plaques.reduce((acc, p) => acc + (p.largeur * p.hauteur), 0);
      const surfaceTotale = plaques.length * largeur * hauteur;
      const efficacite = surfaceCouverte / surfaceTotale;
      
      if (efficacite > meilleureEfficacite) {
        meilleureEfficacite = efficacite;
        meilleureConfig = config;
        meilleuresPlaques = plaques;
      }
    });
    
    // Identifier les découpes nécessaires pour chaque plaque
    meilleuresPlaques.forEach(plaque => {
      ouvertures.forEach(ouverture => {
        // Vérifier si l'ouverture chevauche la plaque
        if (ouverture.x < plaque.x + plaque.largeur && 
            ouverture.x + ouverture.largeur > plaque.x &&
            ouverture.y < plaque.y + plaque.hauteur && 
            ouverture.y + ouverture.hauteur > plaque.y) {
          
          // Calculer l'intersection
          const decoupeX = Math.max(0, ouverture.x - plaque.x);
          const decoupeY = Math.max(0, ouverture.y - plaque.y);
          const decoupeLargeur = Math.min(ouverture.x + ouverture.largeur, plaque.x + plaque.largeur) - Math.max(ouverture.x, plaque.x);
          const decoupeHauteur = Math.min(ouverture.y + ouverture.hauteur, plaque.y + plaque.hauteur) - Math.max(ouverture.y, plaque.y);
          
          plaque.decoupes.push({
            x: decoupeX,
            y: decoupeY,
            largeur: decoupeLargeur,
            hauteur: decoupeHauteur,
            type: ouverture.type
          });
        }
      });
    });
    
    return {
      plaques: meilleuresPlaques,
      config: meilleureConfig,
      efficacite: meilleureEfficacite
    };
  };
  
  // Fonction pour vérifier si deux ouvertures se chevauchent
  export const ouverturesSeChevaucent = (ouverture1, ouverture2) => {
    return !(
      ouverture1.x + ouverture1.largeur <= ouverture2.x ||
      ouverture2.x + ouverture2.largeur <= ouverture1.x ||
      ouverture1.y + ouverture1.hauteur <= ouverture2.y ||
      ouverture2.y + ouverture2.hauteur <= ouverture1.y
    );
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
  
  // Fonction pour optimiser tous les murs à la fois
  export const optimiserTousMurs = (murs, dimensionsPlaque) => {
    let toutesLesPlaques = [];
    let surfaceTotaleUtilisee = 0;
    let surfaceTotaleBrute = 0;
    
    // Pour chaque mur, utiliser l'algorithme amélioré
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
      const surfaceUtilisee = mur.largeur * mur.hauteur - 
        mur.ouvertures.reduce((acc, o) => acc + (o.largeur * o.hauteur), 0);
      
      // Ajouter les plaques de ce mur au total
      toutesLesPlaques = [...toutesLesPlaques, ...plaquesAvecId];
      
      // Ajouter les surfaces
      surfaceTotaleUtilisee += surfaceUtilisee;
      surfaceTotaleBrute += mur.largeur * mur.hauteur;
    });
    
    // Calculer le pourcentage de chutes global
    const surfaceTotalePlaques = toutesLesPlaques.reduce((acc, plaque) => {
      // Tenir compte des orientations potentiellement différentes
      if (plaque.orientation === 'rotated') {
        return acc + (dimensionsPlaque.hauteur * dimensionsPlaque.largeur);
      } else {
        return acc + (dimensionsPlaque.largeur * dimensionsPlaque.hauteur);
      }
    }, 0);
    
    const pourcentageChutes = ((surfaceTotalePlaques - surfaceTotaleUtilisee) / surfaceTotalePlaques) * 100;
    
    return {
      plaques: toutesLesPlaques,
      nbPlaques: toutesLesPlaques.length,
      surfaceTotale: surfaceTotalePlaques,
      surfaceUtile: surfaceTotaleUtilisee,
      pourcentageChutes: pourcentageChutes
    };
  };