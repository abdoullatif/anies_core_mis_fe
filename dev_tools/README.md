# Scripts de gestion des modules OpenIMIS

Ce dossier contient des scripts pour gérer les modules OpenIMIS et les synchroniser avec GitHub.

## Scripts disponibles

### 1. `pushAllModules.js` - Push de tous les modules
Parcourt tous les modules d'un répertoire et fait `git add`, `commit` et `push` pour chacun.

**Usage :**
```bash
node dev_tools/pushAllModules.js <modules_directory> <owner> <branch> [--dry-run]
```

**Exemples :**
```bash
# Push tous les modules vers abdoullatif/release/25.04
node dev_tools/pushAllModules.js openimis_modules_local abdoullatif release/25.04

# Mode test (dry-run)
node dev_tools/pushAllModules.js openimis_modules_local abdoullatif release/25.04 --dry-run
```

### 2. `updateModuleOnline.js` - Mise à jour basée sur openimis.json
Met à jour les modules basés sur la configuration dans `openimis.json`.

**Usage :**
```bash
node dev_tools/updateModuleOnline.js <owner> <branch> [--only <module>] [--dry-run]
```

**Exemples :**
```bash
# Tous les modules
node dev_tools/updateModuleOnline.js abdoullatif release/25.04

# Un module spécifique
node dev_tools/updateModuleOnline.js abdoullatif release/25.04 --only @openimis/fe-core

# Mode test
node dev_tools/updateModuleOnline.js abdoullatif release/25.04 --dry-run
```

### 3. `verifRemote.js` - Vérification des remotes
Vérifie l'état des remotes Git de tous les modules.

**Usage :**
```bash
node dev_tools/verifRemote.js
```

### 4. `setupGitHubCLI.sh` - Installation de GitHub CLI
Installe et configure GitHub CLI pour la création automatique de repositories.

**Usage :**
```bash
./dev_tools/setupGitHubCLI.sh
```

## Fonctionnalités

### Push automatique intelligent
- **Détection des erreurs** : Branche inexistante, repository inexistant
- **Création de branche** : `git push -u origin branch` si la branche n'existe pas
- **Création de repository** : Utilise GitHub CLI pour créer le repo automatiquement
- **Push avec force** : Si nécessaire pour forcer les changements

### Configuration des remotes
- **Origin** : `https://github.com/[owner]/[repo-name].git` (votre compte)
- **Upstream** : `https://github.com/openimis/[repo-name]` (compte officiel openIMIS)

### Gestion des erreurs
- Vérification de GitHub CLI
- Messages d'erreur explicites
- Rapport détaillé des opérations
- Mode dry-run pour tester

## Prérequis

### GitHub CLI (pour création automatique de repositories)
```bash
# Installation automatique
./dev_tools/setupGitHubCLI.sh

# Ou installation manuelle
brew install gh  # macOS
gh auth login
```

### Node.js et npm
Les scripts utilisent Node.js et les modules `fs`, `path`, et `shelljs`.

## Exemples d'utilisation

### Scénario 1 : Push de tous les modules
```bash
# Vérifier l'état actuel
node dev_tools/verifRemote.js

# Push tous les modules (mode test)
node dev_tools/pushAllModules.js openimis_modules_local abdoullatif release/25.04 --dry-run

# Push tous les modules (exécution)
node dev_tools/pushAllModules.js openimis_modules_local abdoullatif release/25.04
```

### Scénario 2 : Mise à jour basée sur openimis.json
```bash
# Mise à jour de tous les modules
node dev_tools/updateModuleOnline.js abdoullatif release/25.04

# Mise à jour d'un module spécifique
node dev_tools/updateModuleOnline.js abdoullatif release/25.04 --only @openimis/fe-core
```

### Scénario 3 : Vérification et diagnostic
```bash
# Vérifier l'état des remotes
node dev_tools/verifRemote.js

# Le rapport est sauvegardé dans remote_verification_report.json
```

## Messages du script

- ✅ `Pushed module → origin branch` - Push réussi
- 🔧 `Remote branch doesn't exist, creating it...` - Création de branche
- 🆕 `Repository doesn't exist on GitHub, creating it...` - Création de repository
- ⚠️ `Warning: GitHub CLI is not installed` - GitHub CLI manquant
- ❌ `Error: push failed` - Erreur de push

## Résolution de problèmes

### GitHub CLI non installé
```bash
./dev_tools/setupGitHubCLI.sh
```

### Authentification GitHub
```bash
gh auth login
```

### Repository non trouvé
Le script créera automatiquement le repository s'il n'existe pas (nécessite GitHub CLI).

### Branche non trouvée
Le script créera automatiquement la branche si elle n'existe pas.

### Push échoué
Le script essaiera un push force si le push normal échoue.
