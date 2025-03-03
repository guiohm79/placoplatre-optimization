// src/utils/validators.js
import { ouverturesSeChevaucent, ouvertureDebordeMur } from './optimisation';

// Valider les dimensions du mur
export const validerDimensionsMur = (mur, champ, valeur) => {
  let erreur = '';
  
  if (valeur <= 0) {
    erreur = `La ${champ} doit être supérieure à 0`;
  } else if (champ === 'largeur' && valeur > 1000) {
    erreur = 'La largeur ne peut pas dépasser 1000 cm';
  } else if (champ === 'hauteur' && valeur > 500) {
    erreur = 'La hauteur ne peut pas dépasser 500 cm';
  }
  
  // Vérifier si des ouvertures sortent du mur avec les nouvelles dimensions
  if (!erreur) {
    const nouvelleDimension = {...mur, [champ]: valeur};
    const ouverturesDepassent = mur.ouvertures.some(o => 
      ouvertureDebordeMur(o, nouvelleDimension)
    );
    
    if (ouverturesDepassent) {
      erreur = `Impossible de modifier la ${champ}: des ouvertures dépasseraient du mur`;
    }
  }
  
  return erreur;
};

// Valider une ouverture
export const validerOuverture = (mur, ouverture, champ, valeur) => {
  const nouvelleOuverture = {...ouverture, [champ]: valeur};
  let erreur = '';
  
  // Vérifier les dimensions
  if (valeur < 0) {
    erreur = `La ${champ} ne peut pas être négative`;
  } else if ((champ === 'largeur' || champ === 'x') && nouvelleOuverture.x + nouvelleOuverture.largeur > mur.largeur) {
    erreur = `L'ouverture dépasserait la largeur du mur`;
  } else if ((champ === 'hauteur' || champ === 'y') && nouvelleOuverture.y + nouvelleOuverture.hauteur > mur.hauteur) {
    erreur = `L'ouverture dépasserait la hauteur du mur`;
  }
  
  // Vérifier les chevauchements avec d'autres ouvertures
  if (!erreur) {
    const autresOuvertures = mur.ouvertures.filter(o => o.id !== ouverture.id);
    const chevauchement = autresOuvertures.some(o => ouverturesSeChevaucent(nouvelleOuverture, o));
    
    if (chevauchement) {
      erreur = `L'ouverture chevaucherait une autre ouverture`;
    }
  }
  
  return erreur;
};