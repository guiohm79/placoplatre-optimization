// src/components/PdfPreviewModal.jsx
import React from 'react';
import { X } from 'lucide-react';

function PdfPreviewModal({ 
  isOpen, 
  onClose, 
  resultat, 
  murs, 
  dimensionsPlaque,
  onExport
}) {
  if (!isOpen) return null;
  
  // Calculer quelques statistiques pour l'aperçu
  const nbTotalOuvertures = murs.reduce((acc, mur) => acc + mur.ouvertures.length, 0);
  
  // Trouver le mur avec le plus de plaques (pour l'affichage de l'exemple)
  let murMaxPlaques = murs[0];
  let maxPlaques = 0;
  
  murs.forEach(mur => {
    const plaquesParMur = resultat.plaques.filter(p => p.murId === mur.id);
    if (plaquesParMur.length > maxPlaques) {
      maxPlaques = plaquesParMur.length;
      murMaxPlaques = mur;
    }
  });
  
  return (
    <div className="modal-overlay">
      <div className="modal-container pdf-preview-modal">
        <div className="modal-header">
          <h2>Prévisualisation du PDF</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-content">
          <div className="pdf-preview">
            <div className="pdf-page">
              <h1>Optimisation des découpes de placoplatre</h1>
              <div className="pdf-date">Projet généré le {new Date().toLocaleDateString('fr-FR')}</div>
              
              <div className="pdf-section">
                <h2>Informations générales</h2>
                <div>Dimensions des plaques standard : {dimensionsPlaque.largeur} × {dimensionsPlaque.hauteur} cm</div>
                <div>Nombre total de murs : {murs.length}</div>
                <div>Nombre total de plaques nécessaires : {resultat.nbPlaques}</div>
                <div>Surface totale des plaques : {(resultat.surfaceTotale / 10000).toFixed(2)} m²</div>
                <div>Surface utile : {(resultat.surfaceUtile / 10000).toFixed(2)} m²</div>
                <div>Pourcentage de chutes : {resultat.pourcentageChutes.toFixed(2)}%</div>
              </div>
              
              <div className="pdf-section">
                <h2>Aperçu du contenu</h2>
                <p>Le PDF complet contiendra :</p>
                <ul>
                  <li>Détails de {murs.length} murs et {nbTotalOuvertures} ouvertures</li>
                  <li>Spécifications pour {resultat.nbPlaques} plaques</li>
                  <li>Visualisations de chaque mur</li>
                  <li>Instructions détaillées pour la pose et les découpes</li>
                </ul>
              </div>
              
              <div className="pdf-section">
                <h2>Exemple de détail (Mur "{murMaxPlaques.nom}")</h2>
                <div>Dimensions : {murMaxPlaques.largeur} × {murMaxPlaques.hauteur} cm</div>
                <div>Nombre d'ouvertures : {murMaxPlaques.ouvertures.length}</div>
                <div>Nombre de plaques : {resultat.plaques.filter(p => p.murId === murMaxPlaques.id).length}</div>
              </div>
              
              <div className="pdf-page-number">Page 1</div>
            </div>
          </div>
          
          <div className="pdf-options">
            <div className="option-group">
              <h3>Options d'export</h3>
              <div className="option-row">
                <input type="checkbox" id="include-visualizations" defaultChecked />
                <label htmlFor="include-visualizations">Inclure les visualisations</label>
              </div>
              
              <div className="option-row">
                <input type="checkbox" id="include-instructions" defaultChecked />
                <label htmlFor="include-instructions">Inclure les instructions d'installation</label>
              </div>
              
              <div className="option-row">
                <input type="checkbox" id="detailed-cuts" defaultChecked />
                <label htmlFor="detailed-cuts">Inclure les détails des découpes</label>
              </div>
            </div>
            
            <div className="format-group">
              <h3>Format</h3>
              <div className="option-row">
                <input type="radio" id="format-a4" name="format" defaultChecked />
                <label htmlFor="format-a4">A4</label>
              </div>
              
              <div className="option-row">
                <input type="radio" id="format-a3" name="format" />
                <label htmlFor="format-a3">A3</label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button className="btn btn-primary" onClick={onExport}>
            Exporter en PDF
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .modal-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          width: 90%;
          max-width: 900px;
          max-height: 90vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        
        .dark-mode .modal-container {
          background-color: #2c3035;
          color: #f8f9fa;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #e9ecef;
        }
        
        .dark-mode .modal-header {
          border-bottom-color: #495057;
        }
        
        .modal-header h2 {
          margin: 0;
          color: #3a86ff;
        }
        
        .modal-content {
          padding: 20px;
          display: flex;
          gap: 20px;
        }
        
        @media (max-width: 768px) {
          .modal-content {
            flex-direction: column;
          }
        }
        
        .pdf-preview {
          flex: 2;
          overflow: hidden;
          border: 1px solid #e9ecef;
          border-radius: 4px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .dark-mode .pdf-preview {
          border-color: #495057;
        }
        
        .pdf-options {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .option-group, .format-group {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 4px;
        }
        
        .dark-mode .option-group, .dark-mode .format-group {
          background-color: #343a40;
        }
        
        .option-group h3, .format-group h3 {
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 16px;
          color: #3a86ff;
        }
        
        .option-row {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .option-row input {
          margin-right: 8px;
        }
        
        .modal-footer {
          padding: 15px 20px;
          border-top: 1px solid #e9ecef;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        
        .dark-mode .modal-footer {
          border-top-color: #495057;
        }
        
        /* Style de la prévisualisation */
        .pdf-page {
          width: 100%;
          height: 500px;
          padding: 40px;
          background-color: white;
          color: black;
          font-family: Arial, sans-serif;
          position: relative;
          overflow-y: auto;
        }
        
        .pdf-page h1 {
          color: #3a86ff;
          font-size: 24px;
          margin-top: 0;
          margin-bottom: 8px;
        }
        
        .pdf-date {
          font-size: 14px;
          color: #6c757d;
          margin-bottom: 24px;
        }
        
        .pdf-section {
          margin-bottom: 20px;
        }
        
        .pdf-section h2 {
          color: #3a86ff;
          font-size: 18px;
          margin-bottom: 10px;
          border-bottom: 1px solid #e9ecef;
          padding-bottom: 5px;
        }
        
        .pdf-section div, .pdf-section p {
          margin-bottom: 5px;
          font-size: 14px;
        }
        
        .pdf-section ul {
          margin-top: 5px;
          padding-left: 20px;
        }
        
        .pdf-section li {
          margin-bottom: 5px;
          font-size: 14px;
        }
        
        .pdf-page-number {
          position: absolute;
          bottom: 20px;
          right: 20px;
          font-size: 12px;
          color: #6c757d;
        }
      `}</style>
    </div>
  );
}

export default PdfPreviewModal;