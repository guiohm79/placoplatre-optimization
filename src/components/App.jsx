import React, { useState, useEffect } from 'react';
import Header from './Header';
import PlaqueDimensionsForm from './PlaqueDimensionsForm';
import MurForm from './MurForm';
import MurVisualisation from './MurVisualisation';
import { optimiserTousMurs } from '../utils/optimisation';
import ResultatsGlobaux from './ResultatsGlobaux';
import { validerDimensionsMur, validerOuverture } from '../utils/validators';
import { Calculator, Download } from 'lucide-react';
import '../styles/main.css';
import '../styles/components.css';

function App() {
  // État pour les dimensions des plaques disponibles
  const [plaqueDimensions, setPlaqueDimensions] = useState({
    largeur: 120, // cm
    hauteur: 250  // cm
  });
  
  // État pour les murs du projet
  const [murs, setMurs] = useState([
    {
      id: 1,
      nom: "Mur 1",
      largeur: 300,
      hauteur: 250,
      ouvertures: [
        { id: 101, x: 50, y: 0, largeur: 90, hauteur: 210, type: 'porte' },
        { id: 102, x: 180, y: 50, largeur: 100, hauteur: 100, type: 'fenêtre' }
      ]
    },
    {
      id: 2,
      nom: "Mur 2",
      largeur: 188,
      hauteur: 238,
      ouvertures: []
    }
  ]);
  
  // Ajoutez un état pour les erreurs
  const [erreurs, setErreurs] = useState({});

  // État pour le mur actuellement sélectionné
  const [murSelectionneeId, setMurSelectionneeId] = useState(1);
  
  // Obtenir le mur sélectionné
  const murSelectionnee = murs.find(m => m.id === murSelectionneeId) || murs[0];
  
  // État pour l'ouverture actuellement sélectionnée
  const [ouvertureSelectionneeId, setOuvertureSelectionneeId] = useState(null);
  
  // État pour le résultat de l'optimisation
  const [resultat, setResultat] = useState(null);
  
  // Exposer la fonction modifierOuverture pour le débogage
  useEffect(() => {
    window.onModifierOuverture = modifierOuverture;
    
    // Nettoyage lors du démontage du composant
    return () => {
      window.onModifierOuverture = undefined;
    };
  }, []);
  
  // Pour ajouter un nouveau mur
  const ajouterMur = () => {
    const nouveauMur = {
      id: Date.now(),
      nom: `Mur ${murs.length + 1}`,
      largeur: 300,
      hauteur: 250,
      ouvertures: []
    };
    setMurs([...murs, nouveauMur]);
    setMurSelectionneeId(nouveauMur.id);
  };
  
  // Pour supprimer un mur
  const supprimerMur = (id) => {
    if (murs.length <= 1) {
      alert("Impossible de supprimer le dernier mur");
      return;
    }
    const nouveauxMurs = murs.filter(m => m.id !== id);
    setMurs(nouveauxMurs);
    if (murSelectionneeId === id) {
      setMurSelectionneeId(nouveauxMurs[0].id);
    }
  };
  
  // Pour modifier un mur
  const modifierMur = (champ, valeur) => {
    if (champ === 'largeur' || champ === 'hauteur') {
      const erreur = validerDimensionsMur(murSelectionnee, champ, valeur);
      
      if (erreur) {
        setErreurs({...erreurs, [murSelectionneeId]: {...(erreurs[murSelectionneeId] || {}), [champ]: erreur}});
        return;
      } else {
        // Effacer l'erreur si elle existe
        if (erreurs[murSelectionneeId] && erreurs[murSelectionneeId][champ]) {
          const nouvellesErreurs = {...erreurs};
          delete nouvellesErreurs[murSelectionneeId][champ];
          if (Object.keys(nouvellesErreurs[murSelectionneeId]).length === 0) {
            delete nouvellesErreurs[murSelectionneeId];
          }
          setErreurs(nouvellesErreurs);
        }
      }
    }
    
    setMurs(murs.map(m => {
      if (m.id === murSelectionneeId) {
        return { ...m, [champ]: valeur };
      }
      return m;
    }));
  };
  
  // Pour ajouter une nouvelle ouverture au mur sélectionné
  const ajouterOuverture = () => {
    const nouvelleOuverture = {
      id: Date.now(),
      x: 10,
      y: 10,
      largeur: 60,
      hauteur: 60,
      type: 'autre'
    };
    
    setMurs(murs.map(m => {
      if (m.id === murSelectionneeId) {
        return {
          ...m,
          ouvertures: [...m.ouvertures, nouvelleOuverture]
        };
      }
      return m;
    }));
    
    setOuvertureSelectionneeId(nouvelleOuverture.id);
  };
  
  // Pour supprimer une ouverture du mur sélectionné
  const supprimerOuverture = (id) => {
    setMurs(murs.map(m => {
      if (m.id === murSelectionneeId) {
        return {
          ...m,
          ouvertures: m.ouvertures.filter(o => o.id !== id)
        };
      }
      return m;
    }));
    
    if (ouvertureSelectionneeId === id) {
      setOuvertureSelectionneeId(null);
    }
  };
  
  // Mettre à jour les dimensions de l'ouverture sélectionnée
  const modifierOuverture = (id, champ, valeur) => {
    const ouverture = murSelectionnee.ouvertures.find(o => o.id === id);
    if (!ouverture) return;
    
    // Valider la modification
    const erreur = validerOuverture(murSelectionnee, ouverture, champ, valeur);
    
    if (erreur) {
      // Stocker l'erreur
      setErreurs({
        ...erreurs, 
        [murSelectionneeId]: {
          ...(erreurs[murSelectionneeId] || {}), 
          [id]: {
            ...(erreurs[murSelectionneeId]?.[id] || {}),
            [champ]: erreur
          }
        }
      });
      return;
    } else {
      // Effacer l'erreur si elle existe
      if (erreurs[murSelectionneeId]?.[id]?.[champ]) {
        const nouvellesErreurs = {...erreurs};
        delete nouvellesErreurs[murSelectionneeId][id][champ];
        
        if (Object.keys(nouvellesErreurs[murSelectionneeId][id]).length === 0) {
          delete nouvellesErreurs[murSelectionneeId][id];
        }
        
        if (Object.keys(nouvellesErreurs[murSelectionneeId]).length === 0) {
          delete nouvellesErreurs[murSelectionneeId];
        }
        
        setErreurs(nouvellesErreurs);
      }
    }
    
    setMurs(murs.map(m => {
      if (m.id === murSelectionneeId) {
        return {
          ...m,
          ouvertures: m.ouvertures.map(o => {
            if (o.id === id) {
              return { ...o, [champ]: valeur };
            }
            return o;
          })
        };
      }
      return m;
    }));
  };
  
  // Fonction pour calculer l'optimisation
  const optimiserDecoupes = () => {
    // Vérifier s'il y a des erreurs
    if (Object.keys(erreurs).length > 0) {
      alert("Veuillez corriger les erreurs avant de calculer l'optimisation");
      return;
    }
    
    // Utiliser l'algorithme réel d'optimisation
    const resultatOptimisation = optimiserTousMurs(murs, plaqueDimensions);
    setResultat(resultatOptimisation);
  };
  
  // Fonction provisoire pour exporter en PDF
  const exporterPDF = () => {
    alert("Fonctionnalité d'export en PDF à implémenter");
  };
  
  return (
    <div className="container">
      <Header />
      
      <div className="main-layout">
        <div className="left-panel">
          <PlaqueDimensionsForm 
            dimensions={plaqueDimensions}
            onChange={setPlaqueDimensions}
          />
          
          <MurForm 
            murs={murs}
            murSelectionneeId={murSelectionneeId}
            onSelectMur={setMurSelectionneeId}
            onModifierMur={modifierMur}
            onAjouterMur={ajouterMur}
            onSupprimerMur={supprimerMur}
            ouvertureSelectionneeId={ouvertureSelectionneeId}
            onSelectOuverture={setOuvertureSelectionneeId}
            onModifierOuverture={modifierOuverture}
            onAjouterOuverture={ajouterOuverture}
            onSupprimerOuverture={supprimerOuverture}
            erreurs={erreurs}
          />
          
          <div className="action-buttons">
            <button className="btn btn-success" onClick={optimiserDecoupes}>
              <Calculator size={18} style={{ marginRight: '8px' }} />
              Calculer l'optimisation
            </button>
            
            <button className="btn btn-secondary" onClick={exporterPDF}>
              <Download size={18} style={{ marginRight: '8px' }} />
              Exporter en PDF
            </button>
          </div>
        </div>
        
        <div className="right-panel">
          <div className="card">
            <div className="card-header">
              <h2>Visualisation</h2>
              <div className="tab-buttons">
                {murs.map(mur => (
                  <button
                    key={mur.id}
                    className={`btn btn-sm ${murSelectionneeId === mur.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setMurSelectionneeId(mur.id)}
                  >
                    {mur.nom}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="help-text">
              <p>Cliquez et déplacez les ouvertures directement sur le plan du mur</p>
            </div>
            
            <MurVisualisation
              mur={murSelectionnee}
              dimensionsPlaque={plaqueDimensions}
              echelle={0.5}
              onOuvertureSelect={setOuvertureSelectionneeId}
              ouvertureSelectionneeId={ouvertureSelectionneeId}
              resultat={resultat?.plaques?.filter(p => p.murId === murSelectionneeId)}
              onModifierOuverture={modifierOuverture}
            />
          </div>
          
          {resultat && <ResultatsGlobaux resultat={resultat} murs={murs} />}
        </div>
      </div>
    </div>
  );
}

export default App;