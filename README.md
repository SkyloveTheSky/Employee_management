# 📋 RH Management Platform

Plateforme de gestion des ressources humaines (RH) permettant aux administrateurs de gérer les employés de manière efficace et sécurisée.

## 🎯 Vue d'ensemble

**RH Management** est une application web moderne construite avec **Laravel** et **React (Inertia.js)** pour la gestion des employés. Seuls les administrateurs peuvent créer, consulter et gérer les employés. Le système d'inscription publique a été désactivé pour garantir la sécurité.

---

## ✨ Fonctionnalités

### 🔐 Authentification & Sécurité
- ✅ **Admin Panel** : Interface d'administration sécurisée avec authentification dédiée
- ✅ **Middleware de Protection** : Seuls les admins authentifiés peuvent accéder aux fonctionnalités
- ✅ **Inscription Désactivée** : Aucun utilisateur ne peut s'auto-enregistrer
- ✅ **Gestion Sécurisée** : Seul l'admin peut créer des employés

### 👥 Gestion des Employés
- ✅ **Créer un Employé** : Ajouter des employés avec tous les détails requis
- ✅ **Lister les Employés** : Consulter tous les employés dans un tableau interactif
- ✅ **Supprimer un Employé** : Supprimer des employés avec confirmation
- ✅ **Détails Complets** : Nom, Prénoms, Numéro téléphone, Email (optionnel), Poste

### 🎨 Interface Utilisateur
- ✅ **Sidebar Navigation** : Menu latéral avec toggle pour ouvrir/fermer
- ✅ **Thème Sombre** : Design moderne avec fond sombre et texte blanc
- ✅ **Responsive Design** : Adapté desktop et mobile
- ✅ **Tableau de Bord** : Affichage des infos admin

---

## 📊 Champs des Employés

Chaque employé contient les informations suivantes dans la table `users` :

| Champ | Type | Obligatoire | Description |
|-------|------|------------|-------------|
| `first_name` | string | ✅ Oui | Prénom de l'employé |
| `last_name` | string | ✅ Oui | Nom de l'employé |
| `phone` | string | ✅ Oui | Numéro de téléphone |
| `email` | string | ❌ Non | Email (optionnel) |
| `position` | string | ✅ Oui | Poste/Position |
| `password` | string (hashed) | ✅ Oui | Mot de passe sécurisé |

---

## 🛣️ Routes Principales

### Routes Admin (Protégées par middleware)
```
GET  /admin/dashboard          - Tableau de bord admin
GET  /admin/employees          - Liste des employés
GET  /admin/employees/create   - Formulaire création employé
POST /admin/employees          - Créer un employé
DELETE /admin/employees/{id}   - Supprimer un employé
POST /admin/logout             - Déconnexion admin
```

### Routes Utilisateurs (Public)
```
GET  /login                    - Formulaire de connexion
POST /login                    - Soumettre la connexion
GET  /                         - Page d'accueil
```

**Note** : La route `/register` a été supprimée et n'est plus accessible.

---

## 🚀 Installation & Setup

### Prérequis
- PHP 8.2+
- Laravel 11
- Node.js 18+
- Composer
- MySQL/SQLite

### Étapes d'installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd management
```

2. **Installer les dépendances**
```bash
composer install
npm install
```

3. **Configurer l'environnement**
```bash
cp .env.example .env
php artisan key:generate
```

4. **Configurer la base de données** dans `.env`
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=management
DB_USERNAME=root
DB_PASSWORD=
```

5. **Exécuter les migrations**
```bash
php artisan migrate
```

6. **Créer un admin** (si nécessaire)
```bash
php artisan tinker
# Puis créer un Admin via le modèle
```

7. **Lancer le serveur de développement**
```bash
php artisan serve
npm run dev
```

L'application est accessible à `http://127.0.0.1:8000`

---

## 📝 Mises à Jour Récentes (25 avril 2026)

### ✅ Nouvelles Fonctionnalités
- ✨ **Sidebar Navigation** : Menu latéral avec theme sombre (fond #1a202c, texte blanc)
- ✨ **Gestion Complète des Employés** : CRUD complet pour la gestion des employés
- ✨ **Formulaire de Création** : Formulaire d'ajout d'employé avec validation
- ✨ **Table Interactive** : Affichage des tous les employés avec actions

### 🔒 Modifications de Sécurité
- 🔐 **Suppression de /register** : Route d'inscription supprimée et inaccessible
- 🔐 **Seul Admin Crée Users** : Uniquement l'admin peut créer des utilisateurs
- 🔐 **Authentification Obligatoire** : Middleware de protection sur toutes routes admin

### 📊 Changements Base de Données
- 📋 Migration créée pour modifier la table `users`
- 📋 Nouvel structure : `first_name`, `last_name`, `phone`, `position`, `email` (optionnel)
- 📋 Ancien champ `name` remplacé par `first_name` et `last_name`

### 🎨 Interface Utilisateur
- 🎨 Dashboard admin avec infos personnelles
- 🎨 Sidebar sombre et moderne avec toggle
- 🎨 Tableau employés avec colonnes complètes
- 🎨 Boutons d'action (Créer, Supprimer) stylisés

---

## 📂 Structure des Fichiers

```
resources/js/
├── Components/
│   └── Admin/
│       └── Sidebar.jsx           # Composant Sidebar
├── Pages/
│   ├── Admin/
│   │   ├── Dashboard.jsx         # Tableau de bord admin
│   │   └── Employees/
│   │       ├── Employees.jsx     # Liste des employés
│   │       └── CreateEmployee.jsx # Formulaire création
│   └── Welcome.jsx               # Page d'accueil
```

---

## 🔧 Configuration Importante

### Modèle User
```php
#[Fillable(['first_name', 'last_name', 'email', 'phone', 'position', 'password'])]
```

### Middleware Admin
Routes protégées par `AdminAuth` middleware pour garantir que seul l'admin accède aux fonctionnalités.

---

## 📞 Support & Maintenance

Pour toute question ou problème :
- Vérifier les logs : `storage/logs/`
- Vider le cache : `php artisan cache:clear`
- Réinitialiser les routes : `php artisan route:clear`

---

## 📄 License

Ce projet est une application Laravel standard. Voir LICENSE pour plus de détails.

## Agentic Development

Laravel's predictable structure and conventions make it ideal for AI coding agents like Claude Code, Cursor, and GitHub Copilot. Install [Laravel Boost](https://laravel.com/docs/ai) to supercharge your AI workflow:

```bash
composer require laravel/boost --dev

php artisan boost:install
```

Boost provides your agent 15+ tools and skills that help agents build Laravel applications while following best practices.

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
