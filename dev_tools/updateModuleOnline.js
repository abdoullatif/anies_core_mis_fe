/*
  Update all git-based module repositories listed in openimis.json.
  - Reads openimis.json → modules[].npm
  - Parses entries like "@openimis/fe-core@https://github.com/<owner>/<repo>#<branch>"
  \
*/

const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

const ROOT = path.resolve(__dirname, '..');
const MODULES_DIR = path.resolve(ROOT, 'openimis_modules_local');
const CONFIG_PATH = path.resolve(ROOT, 'openimis.json');

// Usage: node dev_tools/updateModuleOnline.js <owner> <branch> [--only <pkgOrRepo>] [--dry-run]
const args = process.argv.slice(2);
const OWNER_FILTER = args[0];
const BRANCH_TARGET = args[1];
const ONLY_IDX = args.indexOf('--only');
const ONLY_FILTER = ONLY_IDX !== -1 ? args[ONLY_IDX + 1] : null;
const DRY_RUN = args.includes('--dry-run');

function log(msg) {
  console.log(`[update] ${msg}`);
}

function parseGitSpec(npmField) {
  // Example: "@openimis/fe-core@https://github.com/abdoullatif/openimis-fe-core_js#release/25.04"
  // Return { pkg: "@openimis/fe-core", url: "https://github.com/...", branch: "release/25.04", repoDir: "openimis-fe-core_js" }
  if (!npmField || typeof npmField !== 'string') return null;
  const atIdx = npmField.indexOf('@https://');
  if (atIdx === -1) return null; // not a git https dependency
  const pkg = npmField.substring(0, atIdx); // @openimis/fe-core
  const rest = npmField.substring(atIdx + 1); // https://...#branch
  const [urlPart, branchPart] = rest.split('#');
  if (!urlPart) return null;
  const url = urlPart;
  const branch = branchPart || 'develop';
  const parts = url.split('/');
  const owner = parts[parts.length - 2];
  const repoName = parts[parts.length - 1].replace(/\.git$/, '');
  const repoDir = repoName; // keep original name like openimis-fe-core_js abdoullatif
  return { pkg, url, branch, repoDir, owner };
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function checkGitHubCLI() {
  const ghCheck = shell.exec('gh --version', { silent: true });
  if (ghCheck.code !== 0) {
    log('Warning: GitHub CLI (gh) is not installed. Repository creation will fail.');
    log('Install GitHub CLI: https://cli.github.com/');
    return false;
  }
  
  const authCheck = shell.exec('gh auth status', { silent: true });
  if (authCheck.code !== 0) {
    log('Warning: GitHub CLI is not authenticated. Run: gh auth login');
    return false;
  }
  
  return true;
}

function updateOneModule(mod) {
  const { pkg, url, branch, repoDir, owner } = mod;
  const targetDir = path.join(MODULES_DIR, repoDir);
  ensureDir(MODULES_DIR);

  // Skip if local repo is missing
  if (!fs.existsSync(targetDir)) {
    log(`Skip (not present locally): ${pkg} → ${targetDir}`);
    return { skipped: true, reason: 'missing_local' };
  }

  shell.cd(targetDir);

  // Get current remote URLs
  const originUrl = shell.exec('git config --get remote.origin.url', { silent: true }).stdout.trim();
  const upstreamUrl = shell.exec('git config --get remote.upstream.url', { silent: true }).stdout.trim();
  
  log(`Current origin URL: ${originUrl}`);
  log(`Current upstream URL: ${upstreamUrl || 'Not set'}`);

  // Set origin to target owner
  if (originUrl && !originUrl.includes(OWNER_FILTER)) {
    // Extract repo name from current URL
    const urlParts = originUrl.split('/');
    const currentRepoName = urlParts[urlParts.length - 1].replace(/\.git$/, '');
    const newOriginUrl = `https://github.com/${OWNER_FILTER}/${currentRepoName}.git`;
    
    log(`Updating remote origin from ${originUrl} to ${newOriginUrl}`);
    
    if (DRY_RUN) {
      log(`[dry-run] git remote set-url origin ${newOriginUrl}`);
    } else {
      const setUrl = shell.exec(`git remote set-url origin ${newOriginUrl}`, { silent: true });
      if (setUrl.code !== 0) {
        log(`Error: Failed to update remote URL for ${pkg}`);
        shell.cd(ROOT);
        return { skipped: true, reason: 'remote_update_failed' };
      }
    }
  }

  // Set upstream to openimis (convert sackofils URLs to openimis)
  const expectedUpstreamUrl = url.replace('sackofils', 'openimis'); // Convert to openimis
  if (!upstreamUrl || upstreamUrl !== expectedUpstreamUrl) {
    log(`Setting upstream to: ${expectedUpstreamUrl}`);
    
    if (DRY_RUN) {
      log(`[dry-run] git remote add upstream ${expectedUpstreamUrl} (or update if exists)`);
    } else {
      // Remove existing upstream if it exists
      shell.exec(`git remote remove upstream`, { silent: true });
      // Add new upstream
      const addUpstream = shell.exec(`git remote add upstream ${expectedUpstreamUrl}`, { silent: true });
      if (addUpstream.code !== 0) {
        log(`Warn: Failed to add upstream for ${pkg}`);
      } else {
        log(`Added upstream remote for ${pkg}`);
      }
    }
  } else {
    log(`Upstream already correctly set for ${pkg}`);
  }

  // Fetch latest changes
  if (DRY_RUN) {
    log(`[dry-run] git fetch --all`);
  } else {
    shell.exec(`git fetch --all`);
  }

  // Checkout target branch
  const targetBranch = BRANCH_TARGET || branch;
  if (DRY_RUN) {
    log(`[dry-run] git checkout ${targetBranch} (or create tracking branch)`);
  } else {
    let co = shell.exec(`git checkout ${targetBranch}`, { silent: true });
    if (co.code !== 0) {
      // try create local branch tracking remote
      co = shell.exec(`git checkout -b ${targetBranch} origin/${targetBranch}`, { silent: true });
      if (co.code !== 0) {
        // create new branch if remote doesn't exist
        co = shell.exec(`git checkout -b ${targetBranch}`, { silent: true });
      }
    }
  }

  // Add all files (including new ones)
  if (DRY_RUN) {
    log(`[dry-run] git add .`);
  } else {
    const add = shell.exec(`git add .`, { silent: true });
    if (add.code !== 0) {
      log(`Warn: git add failed for ${pkg}`);
    }
  }

  // Check if there are changes to commit
  const status = shell.exec('git status --porcelain', { silent: true }).stdout.trim();
  if (!status) {
    log(`No changes to commit for ${pkg}`);
    shell.cd(ROOT);
    return { skipped: true, reason: 'no_changes' };
  }

  // Commit changes
  const commitMessage = `Update ${pkg} - ${new Date().toISOString()}`;
  if (DRY_RUN) {
    log(`[dry-run] git commit -m "${commitMessage}"`);
  } else {
    const commit = shell.exec(`git commit -m "${commitMessage}"`, { silent: true });
    if (commit.code !== 0) {
      log(`Warn: commit failed for ${pkg} (${commit.stderr || commit.stdout})`);
    } else {
      log(`Committed changes for ${pkg}`);
    }
  }

  // Push with force if necessary
  if (DRY_RUN) {
    log(`[dry-run] git push origin ${targetBranch} --force`);
  } else {
    // Try normal push first
    let push = shell.exec(`git push origin ${targetBranch}`, { silent: true });
    if (push.code !== 0) {
      // Check if it's because the branch doesn't exist remotely
      const pushError = (push.stderr || push.stdout).toLowerCase();
      if (pushError.includes('remote branch') && pushError.includes('doesn\'t exist')) {
        log(`Remote branch ${targetBranch} doesn't exist, creating it...`);
        // Create and push the branch
        push = shell.exec(`git push -u origin ${targetBranch}`, { silent: true });
        if (push.code !== 0) {
          log(`Error: Failed to create remote branch for ${pkg}. Message: ${(push.stderr || push.stdout).trim()}`);
          shell.cd(ROOT);
          return { skipped: true, reason: 'branch_creation_failed' };
        } else {
          log(`Created and pushed new branch ${targetBranch} for ${pkg}`);
        }
      } else if (pushError.includes('repository not found') || pushError.includes('does not exist')) {
        log(`Repository doesn't exist on GitHub, creating it...`);
        // Try to create repository using GitHub CLI or API
        const createRepo = shell.exec(`gh repo create ${OWNER_FILTER}/${repoDir} --public --source=. --remote=origin --push`, { silent: true });
        if (createRepo.code !== 0) {
          log(`Error: Failed to create repository for ${pkg}. Make sure GitHub CLI is installed and authenticated.`);
          log(`Manual step: Create repository https://github.com/${OWNER_FILTER}/${repoDir} on GitHub`);
          shell.cd(ROOT);
          return { skipped: true, reason: 'repo_creation_failed' };
        } else {
          log(`Created repository and pushed ${pkg} → origin ${targetBranch}`);
        }
      } else {
        // If normal push fails for other reasons, try force push
        log(`Normal push failed, trying force push for ${pkg}`);
        push = shell.exec(`git push origin ${targetBranch} --force`, { silent: true });
        if (push.code !== 0) {
          log(`Error: push failed for ${pkg}. Message: ${(push.stderr || push.stdout).trim()}`);
          shell.cd(ROOT);
          return { skipped: true, reason: 'push_failed' };
        } else {
          log(`Force pushed ${pkg} → origin ${targetBranch}`);
        }
      }
    } else {
      log(`Pushed ${pkg} → origin ${targetBranch}`);
    }
  }

  shell.cd(ROOT);
  return { skipped: false };
}

function main() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`Missing ${CONFIG_PATH}`);
    process.exit(1);
  }

  // Check GitHub CLI availability
  if (!DRY_RUN) {
    checkGitHubCLI();
  }

  const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  let modules = (cfg.modules || [])
    .map((m) => parseGitSpec(m.npm))
    .filter(Boolean);
    // Remove owner filtering - we want to process all git modules regardless of current owner
  if (ONLY_FILTER) {
    modules = modules.filter((m) => m.pkg === ONLY_FILTER || m.repoDir === ONLY_FILTER);
  }

  if (!modules.length) {
    log('No git-based modules found to update. Nothing to do.');
    return;
  }

  const results = [];
  for (const mod of modules) {
    try {
      const r = updateOneModule(mod);
      results.push({ mod: mod.pkg, status: r?.skipped ? 'skipped' : 'ok', reason: r?.reason });
    } catch (e) {
      console.error(`[error] ${mod.pkg}: ${e.message}`);
      results.push({ mod: mod.pkg, status: 'error', error: e.message });
      // continue
    }
  }

  log('Summary:');
  for (const r of results) {
    log(`${r.mod}: ${r.status}${r.reason ? ' - ' + r.reason : ''}${r.error ? ' - ' + r.error : ''}`);
  }
}

main();


// Le script va maintenant:
// 1. Vérifier l'URL remote origin actuelle
// 2. Changer l'owner dans l'URL si nécessaire (ex: openimis → abdoullatif)
// 3. Ajouter/set le remote upstream vers openimis (convertit sackofils → openimis)
// 4. Ajouter tous les fichiers avec git add .
// 5. Commiter les changements
// 6. Push automatiquement (crée la branche/repo si nécessaire)
// 7. Créer le repository GitHub s'il n'existe pas (nécessite GitHub CLI)

//Prérequis :

// Installer GitHub CLI (optionnel)
//        ./dev_tools/setupGitHubCLI.sh

// Ou installer manuellement
// https://cli.github.com/
//brew install gh
//gh --version
//gh auth login

// Push automatique avec création de branche/repo si nécessaire
//node dev_tools/updateModuleOnline.js abdoullatif release/25.04

// Un module spécifique
//node dev_tools/updateModuleOnline.js abdoullatif release/25.04 --only @openimis/fe-core

// Mode test
//node dev_tools/updateModuleOnline.js abdoullatif release/25.04 --dry-run