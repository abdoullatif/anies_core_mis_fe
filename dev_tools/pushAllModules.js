/*
  Script pour pousser tous les modules d'un répertoire vers GitHub
  - Prend le nom du répertoire des modules en paramètre
  - Parcourt tous les sous-répertoires
  - Fait git add, commit et push pour chaque module
*/

const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

const ROOT = path.resolve(__dirname, '..');

// Usage: node dev_tools/pushAllModules.js <modules_directory> <owner> <branch> [--dry-run]
const args = process.argv.slice(2);
const MODULES_DIR_NAME = args[0];
const OWNER = args[1];
const BRANCH = args[2];
const DRY_RUN = args.includes('--dry-run');

if (!MODULES_DIR_NAME || !OWNER || !BRANCH) {
  console.error('Usage: node dev_tools/pushAllModules.js <modules_directory> <owner> <branch> [--dry-run]');
  console.error('Example: node dev_tools/pushAllModules.js openimis_modules_local abdoullatif release/25.04');
  process.exit(1);
}

const MODULES_DIR = path.resolve(ROOT, MODULES_DIR_NAME);

function log(msg) {
  console.log(`[push] ${msg}`);
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

function pushModule(moduleDir, moduleName) {
  log(`📦 Processing ${moduleName}...`);
  
  shell.cd(moduleDir);

  // Get current remote origin URL
  const originUrl = shell.exec('git config --get remote.origin.url', { silent: true }).stdout.trim();
  log(`Current origin URL: ${originUrl}`);

  // Check if we need to update the remote URL to match the target owner
  if (originUrl && !originUrl.includes(OWNER)) {
    // Extract repo name from current URL
    const urlParts = originUrl.split('/');
    const currentRepoName = urlParts[urlParts.length - 1].replace(/\.git$/, '');
    const newOriginUrl = `https://github.com/${OWNER}/${currentRepoName}.git`;
    
    log(`Updating remote origin from ${originUrl} to ${newOriginUrl}`);
    
    if (DRY_RUN) {
      log(`[dry-run] git remote set-url origin ${newOriginUrl}`);
    } else {
      const setUrl = shell.exec(`git remote set-url origin ${newOriginUrl}`, { silent: true });
      if (setUrl.code !== 0) {
        log(`Error: Failed to update remote URL for ${moduleName}`);
        shell.cd(ROOT);
        return { success: false, reason: 'remote_update_failed' };
      }
    }
  }

  // Fetch latest changes
  if (DRY_RUN) {
    log(`[dry-run] git fetch --all`);
  } else {
    shell.exec(`git fetch --all`);
  }

  // Checkout target branch
  if (DRY_RUN) {
    log(`[dry-run] git checkout ${BRANCH} (or create tracking branch)`);
  } else {
    let co = shell.exec(`git checkout ${BRANCH}`, { silent: true });
    if (co.code !== 0) {
      // try create local branch tracking remote
      co = shell.exec(`git checkout -b ${BRANCH} origin/${BRANCH}`, { silent: true });
      if (co.code !== 0) {
        // create new branch if remote doesn't exist
        co = shell.exec(`git checkout -b ${BRANCH}`, { silent: true });
      }
    }
  }

  // Add all files (including new ones)
  if (DRY_RUN) {
    log(`[dry-run] git add .`);
  } else {
    const add = shell.exec(`git add .`, { silent: true });
    if (add.code !== 0) {
      log(`Warn: git add failed for ${moduleName}`);
    }
  }

  // Check if there are changes to commit
  const status = shell.exec('git status --porcelain', { silent: true }).stdout.trim();
  if (!status) {
    log(`No changes to commit for ${moduleName} (will still publish branch if needed)`);
  }

  // Commit changes if any
  if (status) {
    const commitMessage = `Update ${moduleName} - ${new Date().toISOString()}`;
    if (DRY_RUN) {
      log(`[dry-run] git commit -m "${commitMessage}"`);
    } else {
      const commit = shell.exec(`git commit -m "${commitMessage}"`, { silent: true });
      if (commit.code !== 0) {
        log(`Warn: commit failed for ${moduleName} (${commit.stderr || commit.stdout})`);
      } else {
        log(`Committed changes for ${moduleName}`);
      }
    }
  }

  // Ensure upstream is set; if not, use -u on first push
  let hasUpstream = true;
  if (!DRY_RUN) {
    const upstreamCheck = shell.exec('git rev-parse --abbrev-ref --symbolic-full-name @{u}', { silent: true });
    hasUpstream = upstreamCheck.code === 0;
  }

  // Push with force if necessary
  if (DRY_RUN) {
    const pushCmd = hasUpstream ? `git push origin ${BRANCH}` : `git push -u origin ${BRANCH}`;
    log(`[dry-run] ${pushCmd} (will create branch upstream if missing)`);
  } else {
    // Try normal push first
    let push = shell.exec(hasUpstream ? `git push origin ${BRANCH}` : `git push -u origin ${BRANCH}`, { silent: true });
    if (push.code !== 0) {
      // Check if it's because the branch doesn't exist remotely
      const pushError = (push.stderr || push.stdout).toLowerCase();
      if (pushError.includes('remote branch') && pushError.includes('doesn\'t exist')) {
        log(`Remote branch ${BRANCH} doesn't exist, creating it...`);
        // Create and push the branch
        push = shell.exec(`git push -u origin ${BRANCH}`, { silent: true });
        if (push.code !== 0) {
          log(`Error: Failed to create remote branch for ${moduleName}. Message: ${(push.stderr || push.stdout).trim()}`);
          shell.cd(ROOT);
          return { success: false, reason: 'branch_creation_failed' };
        } else {
          log(`Created and pushed new branch ${BRANCH} for ${moduleName}`);
        }
      } else if (pushError.includes('repository not found') || pushError.includes('does not exist')) {
        log(`Repository doesn't exist on GitHub, creating it...`);
        // Try to create repository using GitHub CLI
        const repoName = path.basename(moduleDir);
        const createRepo = shell.exec(`gh repo create ${OWNER}/${repoName} --public --source=. --remote=origin --push`, { silent: true });
        if (createRepo.code !== 0) {
          log(`Error: Failed to create repository for ${moduleName}. Make sure GitHub CLI is installed and authenticated.`);
          log(`Manual step: Create repository https://github.com/${OWNER}/${repoName} on GitHub`);
          shell.cd(ROOT);
          return { success: false, reason: 'repo_creation_failed' };
        } else {
          log(`Created repository and pushed ${moduleName} → origin ${BRANCH}`);
        }
      } else {
        // If normal push fails for other reasons, try force push
        log(`Normal push failed, trying force push for ${moduleName}`);
        push = shell.exec(`git push origin ${BRANCH} --force`, { silent: true });
        if (push.code !== 0) {
          log(`Error: push failed for ${moduleName}. Message: ${(push.stderr || push.stdout).trim()}`);
          shell.cd(ROOT);
          return { success: false, reason: 'push_failed' };
        } else {
          log(`Force pushed ${moduleName} → origin ${BRANCH}`);
        }
      }
    } else {
      log(`✅ Pushed ${moduleName} → origin ${BRANCH}`);
    }
  }

  shell.cd(ROOT);
  return { success: true };
}

function main() {
  // Check if modules directory exists
  if (!fs.existsSync(MODULES_DIR)) {
    console.error(`Modules directory not found: ${MODULES_DIR}`);
    process.exit(1);
  }

  // Check GitHub CLI availability
  if (!DRY_RUN) {
    checkGitHubCLI();
  }

  log(`Scanning modules in: ${MODULES_DIR}`);
  log(`Target owner: ${OWNER}`);
  log(`Target branch: ${BRANCH}`);
  log(`Dry run: ${DRY_RUN}`);
  log('');

  // Get all subdirectories
  const items = fs.readdirSync(MODULES_DIR);
  const moduleDirs = items.filter(item => {
    const itemPath = path.join(MODULES_DIR, item);
    return fs.statSync(itemPath).isDirectory();
  });

  if (!moduleDirs.length) {
    log('No module directories found.');
    return;
  }

  log(`Found ${moduleDirs.length} module directories:`);
  moduleDirs.forEach(dir => log(`  - ${dir}`));
  log('');

  const results = [];
  for (const moduleDir of moduleDirs) {
    const modulePath = path.join(MODULES_DIR, moduleDir);
    
    // Check if it's a git repository
    const gitPath = path.join(modulePath, '.git');
    if (!fs.existsSync(gitPath)) {
      log(`⚠️  Skipping ${moduleDir} (not a git repository)`);
      results.push({ module: moduleDir, status: 'skipped', reason: 'not_git_repo' });
      continue;
    }

    try {
      const result = pushModule(modulePath, moduleDir);
      results.push({ 
        module: moduleDir, 
        status: result.success ? 'success' : 'failed', 
        reason: result.reason 
      });
    } catch (e) {
      console.error(`[error] ${moduleDir}: ${e.message}`);
      results.push({ module: moduleDir, status: 'error', reason: e.message });
    }
  }

  // Summary
  log('');
  log('='.repeat(60));
  log('SUMMARY REPORT');
  log('='.repeat(60));
  
  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed' || r.status === 'error').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;
  
  log(`Total modules: ${results.length}`);
  log(`✅ Success: ${successCount}`);
  log(`❌ Failed: ${failedCount}`);
  log(`⚠️  Skipped: ${skippedCount}`);
  log('');

  // Show failed modules
  const failedModules = results.filter(r => r.status === 'failed' || r.status === 'error');
  if (failedModules.length > 0) {
    log('FAILED MODULES:');
    log('-'.repeat(40));
    failedModules.forEach(mod => {
      log(`• ${mod.module}: ${mod.reason}`);
    });
  }
}

main();

//Utilisation :

// Push tous les modules du répertoire openimis_modules_local
//node dev_tools/pushAllModules.js openimis_modules_local abdoullatif release/25.04

// Mode test (dry-run)
//node dev_tools/pushAllModules.js openimis_modules_local abdoullatif release/25.04 --dry-run

// Autre répertoire de modules
//node dev_tools/pushAllModules.js mon_autre_repertoire abdoullatif main