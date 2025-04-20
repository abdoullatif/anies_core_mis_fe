#!/bin/bash

# Usage : ./sync_fe_modules.sh modules.json [branche] [chemin] [username] [token]

JSON_FILE=$1
BRANCH=${2:-release/25.04}
REPO_BASE_PATH=${3:-$(pwd)}
GITHUB_USERNAME=$4
GITHUB_TOKEN=$5

if [ ! -f "$JSON_FILE" ]; then
  echo "Fichier JSON introuvable : $JSON_FILE"
  exit 1
fi

if [[ -z "$GITHUB_USERNAME" || -z "$GITHUB_TOKEN" ]]; then
  echo "Nom d'utilisateur ou token manquant."
  echo "Usage : ./sync_fe_modules.sh modules.json release/25.04 /chemin utilisateur token"
  exit 1
fi

echo "Fichier JSON : $JSON_FILE"
echo "Branche cible : $BRANCH"
echo "Répertoire des modules : $REPO_BASE_PATH"
echo "Utilisateur GitHub : $GITHUB_USERNAME"
echo "----------------------------------------"

jq -c '.modules[]' "$JSON_FILE" | while read -r module; do
  NPM_URL=$(echo "$module" | jq -r '.npm')

  # Récupère le egg name
  EGG_NAME=$(echo "$NPM_URL" | grep -oE 'egg=[^@]+' | cut -d= -f2)

  # Récupère l'URL Git (sans #branch)
  GIT_URL=$(echo "$NPM_URL" | sed -E 's|.*@([^#]+)#.*|\1|')

  echo "Module : $EGG_NAME"
  echo "Upstream URL : $GIT_URL"

  MODULE_PATH="$REPO_BASE_PATH/$EGG_NAME"

  if [ -d "$MODULE_PATH/.git" ]; then
    cd "$MODULE_PATH" || continue

    # Configurer upstream sans authentification
    if git remote | grep -q upstream; then
      git remote set-url upstream "$GIT_URL"
    else
      git remote add upstream "$GIT_URL"
      echo "Remote 'upstream' ajouté."
    fi

    git fetch upstream

    git checkout "$BRANCH" 2>/dev/null || {
      echo "⚠️  Branche $BRANCH introuvable. Passage au suivant."
      cd "$REPO_BASE_PATH"
      continue
    }

    echo "Fusion avec upstream/$BRANCH..."
    git merge upstream/"$BRANCH" --no-edit

    # Construire l'URL avec auth pour le push (vers fork sackofils)
    ORIGIN_URL=$(git remote get-url origin)
    AUTH_PUSH_URL=$(echo "$ORIGIN_URL" \
      | sed -E "s|https://|https://$GITHUB_USERNAME:$GITHUB_TOKEN@|" \
      | sed -E "s|github.com/openimis/|github.com/sackofils/|")

    echo "Push sécurisé vers fork : $AUTH_PUSH_URL"
    git push "$AUTH_PUSH_URL" "$BRANCH"

    cd "$REPO_BASE_PATH" || exit
    echo "Terminé pour $EGG_NAME"
    echo "----------------------------------------"
  else
    echo "'$MODULE_PATH' n'est pas un dépôt Git"
    echo "----------------------------------------"
  fi
done

echo "Synchronisation terminée pour tous les modules."
# ./sync_fe_modules.sh ./modules.json release/25.04 ../src sackofils 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
# ./sync_fe_modules.sh ./modules.json release/25.04 /Users/ssacko/Documents/_workspace/coremis/anies/anies_core_mis_fe/openimis_modules_local sackofils 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
