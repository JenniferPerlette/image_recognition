Photos App est une application web de gestion de photos type "Google Photos", développée avec Next.js 16 / React 19 et Tailwind CSS.
Fonctionnalités principales
Galerie & recherche: affiche des photos en grille avec barre de recherche (app/page.tsx)
Albums : création, renommage, ajout/retrait de photos (app/albums/)
Reconnaissance de personnes: regroupement et confirmation manuelle de photos par personne (app/personnes/)
Collections: vues thématiques d'images (via l'API Unsplash)
Archive & corbeille : archivage, suppression avec système d'annulation (snapshot + restauration) (app/archive/, app/trash/)
Ajout de photos: upload avec zone de dépôt (app/addPictures/)
Authentification :inscription/connexion, profil utilisateur modifiable
Notifications : cloche de notifications avec statut lu/non lu
Architecture technique
Frontend : composants React modulaires (sidebar, galerie, modales, toasts…) dans components/
Stockage des données : localStorage côté navigateur (lib/mediaStore.ts) — pas de base de données réelle à ce stade
Source d'images : API Unsplash 
Cache optionnel : Redis (ioredis) pour l'endpoint /api/photos, avec repli sur cache mémoire en développement
