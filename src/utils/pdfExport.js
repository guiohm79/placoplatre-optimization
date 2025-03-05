// src/utils/pdfExport.js
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Exporte les résultats d'optimisation au format PDF
 * @param {Object} resultat - Résultat de l'optimisation
 * @param {Array} murs - Liste des murs du projet
 * @param {Object} dimensionsPlaque - Dimensions des plaques standard
 */
export const exporterResultatsEnPDF = async (resultat, murs, dimensionsPlaque) => {
  // Créer un nouveau document PDF au format A4
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  
  // Fonction pour ajouter une nouvelle page
  const ajouterPage = () => {
    pdf.addPage();
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text('Optimisation des découpes de placoplatre - Page ' + pdf.getNumberOfPages(), pageWidth / 2, pageHeight - 5, { align: 'center' });
    y = margin;
  };
  
  // Position verticale courante
  let y = margin;
  
  // Ajout du titre et infos du projet
  pdf.setFontSize(22);
  pdf.setTextColor(58, 134, 255); // Couleur primaire
  pdf.text('Optimisation des découpes de placoplatre', pageWidth / 2, y, { align: 'center' });
  y += 12;
  
  pdf.setFontSize(12);
  pdf.setTextColor(80, 80, 80);
  const dateStr = new Date().toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  pdf.text(`Projet généré le ${dateStr}`, pageWidth / 2, y, { align: 'center' });
  y += 15;
  
  // Informations sur les plaques
  pdf.setFontSize(14);
  pdf.setTextColor(58, 134, 255);
  pdf.text('Informations générales', margin, y);
  y += 8;
  
  pdf.setFontSize(11);
  pdf.setTextColor(80, 80, 80);
  pdf.text(`Dimensions des plaques standard : ${dimensionsPlaque.largeur} × ${dimensionsPlaque.hauteur} cm`, margin, y);
  y += 6;
  
  pdf.text(`Nombre total de murs : ${murs.length}`, margin, y);
  y += 6;
  
  pdf.text(`Nombre total de plaques nécessaires : ${resultat.nbPlaques}`, margin, y);
  y += 6;
  
  pdf.text(`Surface totale des plaques : ${(resultat.surfaceTotale / 10000).toFixed(2)} m²`, margin, y);
  y += 6;
  
  pdf.text(`Surface utile : ${(resultat.surfaceUtile / 10000).toFixed(2)} m²`, margin, y);
  y += 6;
  
  pdf.text(`Pourcentage de chutes : ${resultat.pourcentageChutes.toFixed(2)}%`, margin, y);
  y += 15;
  
  // Détails des murs
  pdf.setFontSize(14);
  pdf.setTextColor(58, 134, 255);
  pdf.text('Détails par mur', margin, y);
  y += 10;
  
  // Parcourir chaque mur
  for (let i = 0; i < murs.length; i++) {
    const mur = murs[i];
    
    // Vérifier s'il y a assez d'espace sur la page
    if (y > pageHeight - 50) {
      ajouterPage();
    }
    
    // Cadre pour le mur
    pdf.setDrawColor(200, 200, 200);
    pdf.setFillColor(248, 248, 248);
    pdf.roundedRect(margin, y - 5, pageWidth - 2 * margin, 35, 2, 2, 'F');
    
    pdf.setFontSize(13);
    pdf.setTextColor(58, 134, 255);
    pdf.text(`Mur ${i+1} : ${mur.nom}`, margin + 5, y + 5);
    
    pdf.setFontSize(10);
    pdf.setTextColor(80, 80, 80);
    pdf.text(`Dimensions : ${mur.largeur} × ${mur.hauteur} cm`, margin + 5, y + 12);
    
    // Calculer la surface du mur et des ouvertures
    const surfaceMur = mur.largeur * mur.hauteur;
    const surfaceOuvertures = mur.ouvertures.reduce((acc, o) => acc + (o.largeur * o.hauteur), 0);
    const surfaceUtileMur = surfaceMur - surfaceOuvertures;
    
    pdf.text(`Surface utile : ${(surfaceUtileMur / 10000).toFixed(2)} m²`, margin + 5, y + 18);
    
    // Nombre de plaques pour ce mur
    const plaquesParMur = resultat.plaques.filter(p => p.murId === mur.id);
    pdf.text(`Nombre de plaques : ${plaquesParMur.length}`, margin + 5, y + 24);
    
    // Informations sur les ouvertures
    if (mur.ouvertures.length > 0) {
      pdf.text(`Ouvertures : ${mur.ouvertures.length}`, pageWidth - margin - 60, y + 12);
      
      for (let j = 0; j < Math.min(mur.ouvertures.length, 3); j++) {
        const ouv = mur.ouvertures[j];
        pdf.text(`- ${ouv.type} : ${ouv.largeur}×${ouv.hauteur}cm (${ouv.x}, ${ouv.y})`, pageWidth - margin - 60, y + 18 + j * 6);
      }
      
      if (mur.ouvertures.length > 3) {
        pdf.text(`- ... et ${mur.ouvertures.length - 3} autres ouvertures`, pageWidth - margin - 60, y + 18 + 3 * 6);
      }
    } else {
      pdf.text(`Ouvertures : aucune`, pageWidth - margin - 60, y + 12);
    }
    
    y += 40;
    
    // Vérifier s'il y a assez d'espace pour les détails des plaques
    if (y > pageHeight - 80) {
      ajouterPage();
    }
    
    // Détails des plaques pour ce mur
    pdf.setFontSize(11);
    pdf.setTextColor(58, 134, 255);
    pdf.text(`Détails des plaques pour ${mur.nom}`, margin, y);
    y += 8;
    
    pdf.setFontSize(9);
    pdf.setTextColor(80, 80, 80);
    
    // En-têtes du tableau
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, y - 4, pageWidth - 2 * margin, 8, 'F');
    pdf.text('N°', margin + 5, y);
    pdf.text('Position', margin + 20, y);
    pdf.text('Dimensions', margin + 65, y);
    pdf.text('Orientation', margin + 120, y);
    pdf.text('Ajustement', margin + 160, y);
    pdf.text('Découpes', pageWidth - margin - 30, y);
    y += 4;
    
    // Lignes du tableau
    for (let j = 0; j < plaquesParMur.length; j++) {
      const plaque = plaquesParMur[j];
      
      // Vérifier s'il y a assez d'espace pour cette ligne
      if (y > pageHeight - 20) {
        ajouterPage();
        
        // Répéter les en-têtes
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, y - 4, pageWidth - 2 * margin, 8, 'F');
        pdf.text('N°', margin + 5, y);
        pdf.text('Position', margin + 20, y);
        pdf.text('Dimensions', margin + 65, y);
        pdf.text('Orientation', margin + 120, y);
        pdf.text('Ajustement', margin + 160, y);
        pdf.text('Découpes', pageWidth - margin - 30, y);
        y += 4;
      }
      
      // Alterner les couleurs de fond
      if (j % 2 === 0) {
        pdf.setFillColor(248, 248, 248);
        pdf.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
      }
      
      pdf.text(`${j+1}`, margin + 5, y + 4);
      pdf.text(`(${plaque.x}, ${plaque.y}) cm`, margin + 20, y + 4);
      pdf.text(`${plaque.largeur} × ${plaque.hauteur} cm`, margin + 65, y + 4);
      pdf.text(`${plaque.orientation === 'normal' ? 'Horizontale' : 'Verticale'}`, margin + 120, y + 4);
      pdf.text(`${plaque.ajustementNecessaire ? 'Requis' : 'Aucun'}`, margin + 160, y + 4);
      pdf.text(`${plaque.decoupes.length}`, pageWidth - margin - 30, y + 4);
      
      y += 8;
      
      // Si la plaque a des découpes, les lister
      if (plaque.decoupes.length > 0) {
        for (let k = 0; k < plaque.decoupes.length; k++) {
          const decoupe = plaque.decoupes[k];
          
          // Vérifier s'il y a assez d'espace pour cette ligne
          if (y > pageHeight - 15) {
            ajouterPage();
          }
          
          pdf.setFontSize(8);
          pdf.setTextColor(120, 120, 120);
          const xLocal = decoupe.xLocal || (decoupe.x - plaque.x);
          const yLocal = decoupe.yLocal || (decoupe.y - plaque.y);
          pdf.text(`   → Découpe ${k+1} : ${decoupe.type || 'autre'} - Position: (${xLocal}, ${yLocal}) cm - Dimensions: ${decoupe.largeur} × ${decoupe.hauteur} cm`, margin + 20, y + 3);
          
          pdf.setFontSize(9);
          pdf.setTextColor(80, 80, 80);
          y += 7;
        }
        y += 2;
      }
    }
    
    y += 10;
  }
  
  // Ajouter des instructions ou notes
  if (y > pageHeight - 60) {
    ajouterPage();
  }
  
  pdf.setFontSize(12);
  pdf.setTextColor(58, 134, 255);
  pdf.text('Notes pour l\'installation', margin, y);
  y += 8;
  
  pdf.setFontSize(10);
  pdf.setTextColor(80, 80, 80);
  
  const notes = [
    "• Commencez par vérifier les dimensions des murs et l'emplacement des ouvertures.",
    "• Pour chaque mur, respectez l'ordre de pose des plaques indiqué.",
    "• Marquez les positions des découpes avec précision avant de les réaliser.",
    "• Les plaques nécessitant des ajustements doivent être découpées aux dimensions indiquées.",
    "• Pour les ouvertures complexes, découpez d'abord les grandes sections puis affinez.",
    "• Conservez les chutes importantes, elles pourront être utilisées pour d'autres projets."
  ];
  
  for (let i = 0; i < notes.length; i++) {
    pdf.text(notes[i], margin, y);
    y += 6;
  }
  
  // Capturer la zone de visualisation pour chaque mur
  try {
    if (document.querySelector('.mur-canvas')) {
      // Pour chaque mur, ajouter une vue en image
      for (let i = 0; i < murs.length; i++) {
        // D'abord, assurez-vous que le mur actuel est sélectionné
        // Cette partie est spécifique à votre application
        if (window.onSelectMur) {
          window.onSelectMur(murs[i].id);
          // Laisser le temps au rendu de se mettre à jour
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        ajouterPage();
        
        pdf.setFontSize(14);
        pdf.setTextColor(58, 134, 255);
        pdf.text(`Visualisation du mur : ${murs[i].nom}`, pageWidth / 2, y, { align: 'center' });
        y += 10;
        
        const canvas = document.querySelector('.mur-canvas');
        if (canvas) {
          const canvasImage = await html2canvas(canvas);
          const imgData = canvasImage.toDataURL('image/png');
          
          // Calculer les dimensions pour l'image
          const canvasWidth = canvas.offsetWidth;
          const canvasHeight = canvas.offsetHeight;
          const ratio = canvasWidth / canvasHeight;
          
          const maxWidth = pageWidth - 2 * margin;
          const maxHeight = pageHeight - y - margin;
          
          let imgWidth = maxWidth;
          let imgHeight = imgWidth / ratio;
          
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = imgHeight * ratio;
          }
          
          pdf.addImage(imgData, 'PNG', margin + (maxWidth - imgWidth) / 2, y, imgWidth, imgHeight);
          y += imgHeight + 10;
        }
      }
    }
  } catch (error) {
    console.error("Erreur lors de la capture des visualisations :", error);
    // Continuer sans les images si une erreur se produit
  }
  
  // Pied de page
  pdf.setFontSize(10);
  pdf.setTextColor(150, 150, 150);
  pdf.text('Optimisation des découpes de placoplatre - Page ' + pdf.getNumberOfPages(), pageWidth / 2, pageHeight - 5, { align: 'center' });
  
  // Sauvegarder le PDF
  const nomFichier = `Optimisation_Placoplatre_${new Date().toISOString().slice(0, 10)}.pdf`;
  pdf.save(nomFichier);
  
  return nomFichier;
};