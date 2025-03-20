const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const shell = require('shelljs');

function runCommand(command, cwd) {
    try {
        console.log(`🔹 Exécution : ${command} dans ${cwd}`);
        execSync(command, { cwd, stdio: "inherit" });
        return true;
    } catch (error) {
        console.error(`⚠️ Erreur dans ${cwd} : ${error.message}`);
        return false;
    }
}

function updateModules(baseDirectory) {
    if (!fs.existsSync(baseDirectory) || !fs.statSync(baseDirectory).isDirectory()) {
        console.error(`❌ Erreur : Le dossier '${baseDirectory}' n'existe pas.`);
        process.exit(1);
    }

    console.log(`🔄 Recherche des modules React dans '${baseDirectory}'...\n`);

    let successCount = 0;
    let failureCount = 0;

    fs.readdirSync(baseDirectory).forEach(module => {
        const modulePath = path.join(baseDirectory, module);

        // Vérifier si c'est un dossier avec un dépôt Git
        if (!fs.statSync(modulePath).isDirectory() || !fs.existsSync(path.join(modulePath, ".git"))) {
            return;
        }

        console.log(`🔄 Mise à jour du module : ${module}...\n`);

        // Se positionner dans le module avant d'exécuter les commandes
        //process.chdir(modulePath);

        // Commit les mises à jour local
        if (!runCommand("git commit -m 'savegarde 2 avant rebase'", modulePath)) {
            console.error(`⚠️ Échec du commit pour ${module}, passage au suivant...`);
            failureCount++;
            //return;
        }


        // Fetch les mises à jour
        if (!runCommand("git fetch upstream", modulePath)) {
            console.error(`⚠️ Échec du fetch pour ${module}, passage au suivant...`);
            failureCount++;
            //return;
        }

        // Vérifier si la branche "develop" ou "main" existe
        let branches = execSync("git branch -r", { cwd: modulePath }).toString();
        let rebaseCommand = "";
        if (branches.includes("upstream/develop")) {
            rebaseCommand = "git rebase upstream/develop";
        } else if (branches.includes("upstream/main")) {
            rebaseCommand = "git rebase upstream/main";
        } else {
            console.warn(`⚠️ Aucune branche 'develop' ou 'main' trouvée pour ${module}, passage au suivant.`);
            failureCount++;
            //return;
        }

        // Faire le rebase
        if (!runCommand(rebaseCommand, modulePath)) {
            console.error(`⚠️ Échec du rebase pour ${module}, passage au suivant...`);
            failureCount++;
            //return;
        }

        // Push vers le fork
        //
        if (!runCommand("git push origin", modulePath)) {
            console.error(`⚠️ Échec du push pour ${module}, passage au suivant...`);
            failureCount++;
            //return;
        }

        successCount++;
    });

    console.log(`✅ Mise à jour terminée : ${successCount} réussites, ${failureCount} échecs.`);
}

// Vérifier si l'argument du dossier est fourni
if (process.argv.length < 3) {
    console.log("Usage: node updateModules.js <chemin_du_dossier_des_modules>");
    process.exit(1);
}

// Exécuter la mise à jour
updateModules(process.argv[2]);





// node updateModules.js ../frontend_modules

// node updateModules.js ../openimis_modules_local