# Optimisation des découpes de placoplatre 🏗️

## Description du projet

Cette application web permet de calculer l'optimisation des découpes de plaques de placoplatre en fonction des dimensions des murs et des ouvertures (portes, fenêtres). Elle aide à minimiser les chutes et à visualiser le placement des plaques sur chaque mur.

## Fonctionnalités

L'application permet de :
- Configurer les dimensions des plaques de placoplatre disponibles
- Ajouter, modifier et supprimer des murs
- Ajouter, modifier et supprimer des ouvertures (portes, fenêtres, etc.)
- Calculer automatiquement l'optimisation des découpes
- Visualiser le placement des plaques sur chaque mur
- Afficher les détails de chaque plaque et les instructions de découpe
- Consulter les statistiques globales (nombre de plaques, pourcentage de chutes, etc.)

## Installation et lancement

```bash
# Installer les dépendances
npm install

# Lancer l'application en mode développement
npm start
```

## Todo List 📋

### Améliorations de l'interface utilisateur
- [X] Ajouter un thème clair/sombre
- [ ] Rendre l'interface responsive pour mobile et tablettes
- [ ] Ajouter une page d'aide/tutoriel
- [ ] Créer un logo pour l'application
- [ ] Améliorer les transitions et animations
- [ ] Ajouter des tooltips explicatifs sur les champs complexes

### Fonctionnalités à implémenter
- [ ] Export en PDF fonctionnel (actuellement simulé)
- [X] Modifier l'origine, la mettre en bas a gauche (actuellement en haut a gauche)
- [ ] Sauvegarde/chargement de projets
- [ ] Calcul du coût total en fonction du prix des plaques
- [ ] Ajouter un historique des modifications (undo/redo)
- [ ] Permettre l'import de plans depuis des fichiers CAD/DXF
- [ ] Ajouter un mode d'édition collaboratif en temps réel

### Amélioration de l'algorithme d'optimisation
- [ ] Optimiser la gestion des chutes réutilisables
- [ ] Ajouter des contraintes de pose (joints décalés, etc.)
- [ ] Permettre la rotation des plaques à 90° pour les découpes complexes
- [ ] Intégrer des règles métier supplémentaires (espacement des joints, etc.)
- [ ] Optimiser pour les grandes surfaces (subdivision du problème)

### Visualisation
- [ ] Améliorer le rendu en 3D des murs
- [ ] Ajouter une vue d'ensemble de tous les murs
- [X] Permettre le déplacement des ouvertures par drag & drop (à finaliser)
- [ ] Ajouter une échelle de visualisation plus précise
- [ ] Permettre de zoomer/dézoomer avec la molette de la souris

### Développement et qualité
- [ ] Ajouter des tests unitaires
- [ ] Refactoriser le code pour améliorer les performances
- [ ] Documenter l'API et les composants
- [ ] Corriger les bugs liés au redimensionnement des murs avec ouvertures
- [ ] Optimiser les requêtes et le rendu pour de grands projets

### Documentation
- [X] Créer un README avec une todo list
- [ ] Ajouter une documentation utilisateur complète
- [ ] Créer un guide de développement pour les contributeurs
- [ ] Documenter l'algorithme d'optimisation
- [ ] Ajouter des exemples d'utilisation

## Structure du projet

```
src/
├── components/       # Composants React
├── styles/           # Fichiers CSS
├── utils/            # Fonctions utilitaires et algorithmes
├── index.js          # Point d'entrée de l'application
└── ...
```

## Bugs connus 🐜

- L'export PDF n'est pas encore implémenté
- Certaines validations d'ouvertures peuvent bloquer l'utilisateur dans des cas spécifiques
- Le déplacement des ouvertures par drag & drop n'est pas finalisé
- Des problèmes de performance peuvent survenir avec de nombreux murs/ouvertures

## Contribution

N'hésite pas à contribuer au projet ! Pour ajouter une fonctionnalité ou corriger un bug :
1. Fork le projet
2. Crée une branche pour ta fonctionnalité
3. Fais tes modifications
4. Soumets une pull request

## Licence

Ce projet est sous licence MIT.
