/*
  Vérifier les remotes Git de tous les modules listés dans openimis.json
  - Affiche l'état des remotes origin et upstream pour chaque module
  - Génère un rapport détaillé
*/

const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

const ROOT = path.resolve(__dirname, '..');
const MODULES_DIR = path.resolve(ROOT, 'openimis_modules_local');
const CONFIG_PATH = path.resolve(ROOT, 'openimis.json');

function log(msg) {
  console.log(`[verif] ${msg}`);
}

function parseGitSpec(npmField) {
  // Example: "@openimis/fe-core@https://github.com/sackofils/openimis-fe-core_js#release/25.04"
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
  const repoDir = repoName;
  return { pkg, url, branch, repoDir, owner };
}

function checkModuleRemotes(mod) {
  const { pkg, url, branch, repoDir } = mod;
  const targetDir = path.join(MODULES_DIR, repoDir);

  // Check if module exists locally
  if (!fs.existsSync(targetDir)) {
    return {
      pkg,
      status: 'missing_local',
      origin: null,
      upstream: null,
      expectedUpstream: url.replace('sackofils', 'openimis'),
      issues: ['Module not found locally']
    };
  }

  shell.cd(targetDir);

  // Get current remotes
  const originUrl = shell.exec('git config --get remote.origin.url', { silent: true }).stdout.trim();
  const upstreamUrl = shell.exec('git config --get remote.upstream.url', { silent: true }).stdout.trim();
  
  // Get current branch
  const currentBranch = shell.exec('git branch --show-current', { silent: true }).stdout.trim();
  
  // Get last commit info
  const lastCommit = shell.exec('git log -1 --oneline', { silent: true }).stdout.trim();

  const issues = [];
  
  // Check origin
  if (!originUrl) {
    issues.push('No origin remote set');
  }

  // Check upstream (should point to openimis, not sackofils)
  const expectedUpstreamUrl = url.replace('sackofils', 'openimis');
  if (!upstreamUrl) {
    issues.push('No upstream remote set');
  } else if (upstreamUrl !== expectedUpstreamUrl) {
    issues.push(`Upstream mismatch: expected ${expectedUpstreamUrl}, got ${upstreamUrl}`);
  }

  // Check if working directory is clean
  const status = shell.exec('git status --porcelain', { silent: true }).stdout.trim();
  if (status) {
    issues.push('Working directory has uncommitted changes');
  }

  shell.cd(ROOT);

  return {
    pkg,
    status: issues.length === 0 ? 'ok' : 'issues',
    origin: originUrl || 'Not set',
    upstream: upstreamUrl || 'Not set',
    expectedUpstream: url.replace('sackofils', 'openimis'),
    currentBranch,
    lastCommit,
    issues: issues.length > 0 ? issues : ['All good'],
    hasChanges: !!status
  };
}

function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    total: results.length,
    ok: results.filter(r => r.status === 'ok').length,
    issues: results.filter(r => r.status === 'issues').length,
    missing: results.filter(r => r.status === 'missing_local').length,
    modules: results
  };

  // Save detailed report
  const reportPath = path.join(ROOT, 'remote_verification_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`Detailed report saved to: ${reportPath}`);

  return report;
}

function main() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`Missing ${CONFIG_PATH}`);
    process.exit(1);
  }

  const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const modules = (cfg.modules || [])
    .map((m) => parseGitSpec(m.npm))
    .filter(Boolean);

  if (!modules.length) {
    log('No git-based modules found to verify.');
    return;
  }

  log(`Checking remotes for ${modules.length} modules...`);
  log('');

  const results = [];
  for (const mod of modules) {
    try {
      const result = checkModuleRemotes(mod);
      results.push(result);
      
      // Display result
      log(`📦 ${result.pkg}`);
      log(`   Origin: ${result.origin}`);
      log(`   Upstream: ${result.upstream}`);
      log(`   Expected Upstream: ${result.expectedUpstream}`);
      log(`   Branch: ${result.currentBranch}`);
      log(`   Status: ${result.status}`);
      if (result.issues.length > 0) {
        log(`   Issues: ${result.issues.join(', ')}`);
      }
      log('');
    } catch (e) {
      console.error(`[error] ${mod.pkg}: ${e.message}`);
      results.push({
        pkg: mod.pkg,
        status: 'error',
        origin: null,
        upstream: null,
        expectedUpstream: mod.url,
        issues: [e.message]
      });
    }
  }

  // Generate summary report
  const report = generateReport(results);
  
  log('='.repeat(60));
  log('SUMMARY REPORT');
  log('='.repeat(60));
  log(`Total modules: ${report.total}`);
  log(`✅ OK: ${report.ok}`);
  log(`⚠️  Issues: ${report.issues}`);
  log(`❌ Missing: ${report.missing}`);
  log('');

  // Show modules with issues
  const modulesWithIssues = results.filter(r => r.status !== 'ok');
  if (modulesWithIssues.length > 0) {
    log('MODULES WITH ISSUES:');
    log('-'.repeat(40));
    modulesWithIssues.forEach(mod => {
      log(`• ${mod.pkg}: ${mod.issues.join(', ')}`);
    });
  }

  log('');
  log('Use updateModuleOnline.js to fix remote issues.');
}

main();
