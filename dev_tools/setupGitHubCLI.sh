#!/bin/bash

# Script pour installer et configurer GitHub CLI
# Nécessaire pour la création automatique de repositories

echo "🔧 Configuration de GitHub CLI pour updateModuleOnline.js"
echo ""

# Vérifier si GitHub CLI est déjà installé
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI est déjà installé"
    gh --version
else
    echo "📦 Installation de GitHub CLI..."
    
    # Détecter le système d'exploitation
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install gh
        else
            echo "❌ Homebrew n'est pas installé. Installez GitHub CLI manuellement:"
            echo "   https://cli.github.com/"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt &> /dev/null; then
            curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
            sudo apt update
            sudo apt install gh
        elif command -v yum &> /dev/null; then
            sudo yum install -y dnf
            sudo dnf install -y gh
        else
            echo "❌ Gestionnaire de paquets non supporté. Installez GitHub CLI manuellement:"
            echo "   https://cli.github.com/"
            exit 1
        fi
    else
        echo "❌ Système d'exploitation non supporté. Installez GitHub CLI manuellement:"
        echo "   https://cli.github.com/"
        exit 1
    fi
fi

echo ""
echo "🔐 Configuration de l'authentification GitHub..."
echo "Vous allez être redirigé vers GitHub pour l'authentification."

# Authentifier avec GitHub
gh auth login

echo ""
echo "✅ Configuration terminée !"
echo ""
echo "Vous pouvez maintenant utiliser updateModuleOnline.js pour:"
echo "  - Créer automatiquement des repositories GitHub"
echo "  - Créer des branches et pousser du code"
echo ""
echo "Exemple d'utilisation:"
echo "  node dev_tools/updateModuleOnline.js abdoullatif release/25.04"
