// src/utils/modelesOuvertures.js

// Définition des modèles d'ouvertures standards
export const MODELES_OUVERTURES = {
    'porte': { largeur: 90, hauteur: 210 },
    'fenêtre': { largeur: 100, hauteur: 100 },
    'prise': { largeur: 7, hauteur: 7, nbElements: 1, disposition: 'vertical' },
    'interrupteur': { largeur: 7, hauteur: 7, nbElements: 1, disposition: 'vertical' },
    'tuyau d\'eau': { forme: 'rond', diametre: 10, largeur: 10, hauteur: 10 },
    'autre': { largeur: 60, hauteur: 60 }
  };
  
  // Fonction pour appliquer un modèle à une ouverture
  export const appliquerModele = (type, ouverture = {}) => {
    if (!MODELES_OUVERTURES[type]) {
      console.error("Type de modèle inconnu:", type);
      return ouverture; // Retourne l'ouverture inchangée si le type n'existe pas
    }
    
    console.log("Modèle trouvé pour", type, ":", MODELES_OUVERTURES[type]);
    
    // Clone l'ouverture existante pour éviter des modifications non voulues
    const nouvelleOuverture = { ...ouverture };
    
    // Définir le type de base et le type d'affichage
    nouvelleOuverture.typeBase = type;
    nouvelleOuverture.type = type;
    
    // Appliquer les dimensions standard du modèle
    nouvelleOuverture.largeur = MODELES_OUVERTURES[type].largeur;
    nouvelleOuverture.hauteur = MODELES_OUVERTURES[type].hauteur;
    
    // Pour les tuyaux d'eau, définir les propriétés spécifiques
    if (type === 'tuyau d\'eau') {
      nouvelleOuverture.forme = 'rond';
      nouvelleOuverture.diametre = MODELES_OUVERTURES[type].diametre;
    }
    
    // Pour les prises et interrupteurs, définir le nombre et la disposition
    if (type === 'prise' || type === 'interrupteur') {
      nouvelleOuverture.nbElements = MODELES_OUVERTURES[type].nbElements;
      nouvelleOuverture.disposition = MODELES_OUVERTURES[type].disposition;
      
      // Mettre à jour le nom si multiple
      if (nouvelleOuverture.nbElements > 1) {
        nouvelleOuverture.type = `${type} (x${nouvelleOuverture.nbElements})`;
      }
    }
    
    console.log("Nouvelle ouverture après application du modèle:", nouvelleOuverture);
    
    return nouvelleOuverture;
  };