# Gestion RH

Application de gestion des ressources humaines et de la paie, destinée aux entreprises malgaches. Elle sépare l’espace administrateur et l’espace employé. L’inscription publique est désactivée : seuls les administrateurs créent les comptes.

## Pile technique

- PHP 8.3 et Laravel 13
- Inertia.js et React 18
- Vite et Tailwind CSS
- SQLite ou MySQL
- PDF des bulletins via DomPDF

## Fonctionnalités

### Administration

- Tableau de bord (effectifs, paie, graphiques)
- Agenda et rappels d’événements du jour
- Employés : création, modification, suppression
- Paie : génération, suivi de paiement, bulletin PDF (CNAPS, IRSA, heures supplémentaires, congés)
- Présences : pointage avec zone géographique autour du site
- Congés : congé payé, congé non payé, repos maladie, validation
- Charges patronales
- Heures supplémentaires configurables par poste
- Messagerie interne et notifications
- Gestionnaire de fichiers
- Fiche entreprise : identité, journée de travail, pointage, localisation, cotisations
- Paramètres de compte et d’affichage

### Employés

- Tableau de bord personnel
- Bulletins de paie
- Pointage du jour
- Demande de congé
- Messages et fichiers (envoi vers l’administration, sans création de dossier)

### Langue

L’interface est disponible en français et en anglais. Le français est la langue par défaut. Les documents PDF et les notifications métier restent en français. Les données (noms, montants, notes, fichiers) ne sont pas traduites.

## Prérequis

- PHP 8.3 ou supérieur
- Composer
- Node.js 18 ou supérieur
- SQLite ou MySQL

## Installation

1. Cloner le dépôt et se placer dans le projet.

```
git clone https://github.com/SkyloveTheSky/management_laravel.git
cd management_laravel
```

2. Installer les dépendances PHP et JavaScript.

```
composer install
npm install
```

3. Copier le fichier d’environnement et générer la clé d’application.

```
cp .env.example .env
php artisan key:generate
```

4. Renseigner la base de données dans le fichier `.env` (SQLite par défaut, ou MySQL).

5. Exécuter les migrations, puis le seeder si des données de démonstration sont nécessaires.

```
php artisan migrate
php artisan db:seed
```

6. Démarrer le serveur PHP et le bundler Vite.

```
php artisan serve
npm run dev
```

L’application est alors disponible à l’adresse http://127.0.0.1:8000.

Connexion administrateur : `/admin/login`. Connexion employé : `/login`.

## Planification

La commande `agenda:remind` notifie les administrateurs des événements du jour. Elle est planifiée toutes les heures. En local, lancer le planificateur Laravel (`php artisan schedule:work`) ou exécuter la commande à la main.

## Tests

```
php artisan test
```

Les suites couvrent notamment le pointage, les congés, les rappels d’agenda et le changement de langue.

## Structure utile

```
app/Http/Controllers/Admin    Contrôleurs de l’espace administrateur
app/Http/Controllers/User     Contrôleurs de l’espace employé
app/Services                  Paie, congés, présences, messagerie, agenda
resources/js/Pages            Pages Inertia (React)
resources/js/i18n             Dictionnaires français et anglais
lang                          Messages serveur (validation, flash)
database/migrations           Schéma
tests/Feature                 Tests fonctionnels
```

## Licence

Usage interne. Les composants Laravel utilisés restent sous licence MIT.
