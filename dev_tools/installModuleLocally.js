const fs = require('node:fs');
const shell = require('shelljs');
//const scriptPath = shell.cd(__dirname);
const path = require('path');
//const { argv } = require('process');
//const { has } = require('lodash');

const myArgs = process.argv.slice(2);
const moduleRepoUrl = myArgs[0];
const branch = myArgs[1];
const targetDir = myArgs[2];

const moduleName = moduleRepoUrl.split('/').pop().split('.')[0];
const splitedModuleName = moduleName.split('openimis-')[1].split('_js')[0];
const separatedName = splitedModuleName.split('-')[1];



// Helper functions (to be implemented)
function getLocalVersion() {
    // Read version from package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version;
}

function getRemoteVersion(repoUrl, branch) {
    // Fetch remote package.json and extract version
    const remotePackageJson = shell.exec(`git show ${branch}:package.json`, {silent: true}).stdout;
    return JSON.parse(remotePackageJson).version;
}

function compareVersions(v1, v2) {
    // Compare version strings
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        if (parts1[i] > parts2[i]) return 1;
        if (parts1[i] < parts2[i]) return -1;
    }
    return 0;
}


//Main function
function downloadModule(moduleRepoUrl, branch, targetDir) {
    const targetPath = path.resolve(__dirname, '..', targetDir); // Résolution du chemin absolu du répertoire cible

    try{
        if (!fs.existsSync(targetPath)) {
            fs.mkdirSync(targetPath, { recursive: true });
        }
    }catch(error){
        console.log("error : "+error);
    }

    //go to target directory
    shell.cd(targetPath);

    if (fs.existsSync(moduleName)) {
        // Module exists locally, check versions
        shell.cd(moduleName);
        const localVersion = getLocalVersion();
        const remoteVersion = getRemoteVersion(moduleRepoUrl, branch);

        if (compareVersions(remoteVersion, localVersion) > 0) {
            console.log(`Updating module from ${localVersion} to ${remoteVersion}`);
            shell.exec('git fetch');
            shell.exec(`git checkout ${branch}`);
            shell.exec('git pull');
        } else {
            console.log('Local version is up to date. No action needed.');
            //prepare module for local development
            var packageVersion = prepareModuleForLocalDevelopment(moduleName);
            // update module in assembly
            updateModuleInAssembly(packageVersion);
            return;
        }
    } else {
        console.log('Cloning module from ' + moduleRepoUrl);
        shell.exec('git clone ' + moduleRepoUrl);
        shell.cd(moduleName);
        shell.exec('git checkout ' + branch);
        
        shell.exec('git checkout '+ branch, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            packageVersion = prepareModuleForLocalDevelopment(moduleName);
            updateModuleInAssembly(packageVersion);
        });
    }
    

}

function prepareModuleForLocalDevelopment(moduleName) {
    // Obtenir le chemin absolu du répertoire courant
    const currentPath = shell.pwd().toString();
    // Construire le chemin du module attendu
    const expectedPath = path.join(__dirname, '..', targetDir, moduleName);
    // Vérifier si le chemin actuel correspond au chemin du module
    if (currentPath === expectedPath) {
        console.log(`Vous êtes dans le répertoire du module '${moduleName}'.`);
        shell.exec('yarn unlink');
        shell.exec('yarn install');
        shell.exec('yarn build');
        shell.exec('yarn link');
        var module_path = shell.pwd();
        var pjson = require(path.join(module_path.stdout, 'package.json'));
        return pjson.version
    } else {
        console.log(`Vous n'êtes pas dans le répertoire du module '${moduleName}'.`);
        console.log(`Chemin actuel : ${currentPath}`);
        console.log(`Chemin attendu pour '${moduleName}' : ${expectedPath}`);
    }
    
}

function updateModuleInAssembly(packageVersion){
    var imisJsonPath = path.normalize(path.join(__dirname, '..'));
    fs.readFile(path.join(imisJsonPath, 'openimis.json'), 'utf8', (error, data) => {
        if(error){
           console.log(error);
           return;
        }
        var imisJSON = JSON.parse(data);
        imisJSON["modules"].push({
            "name": titleCase(camalize(separatedName))+"Module", 
            "npm": '@openimis/'+splitedModuleName+'@'+packageVersion
        });
        
        console.log("removing from openimis.json eventual duplicates entries");
        imisJSON["modules"] = imisJSON["modules"].filter((obj, pos, arr) => {
            return arr
              .map(mapObj => mapObj.name)
              .indexOf(obj.name) == pos; // == pos
          });
        fs.writeFileSync(path.join(imisJsonPath, 'openimis.json'), JSON.stringify(imisJSON,null,2),{encoding:'utf8',flag:'w'});
        console.log("openimis.json is updated");

        reinstallAssemblyModule();
    })
}

function updatePackageInAssembly() {
    const imisPackagePath = path.join(__dirname, '..');
    fs.readFile(path.join(imisPackagePath, 'package.json'), 'utf8', (error, data) => {
        if (error) {
            console.log(error);
            return;
        }
        const imisPackageJSON = JSON.parse(data);

        const modulePath = "file:" + targetDir + "/" + moduleName;

        imisPackageJSON["dependencies"]["@openimis/" + splitedModuleName] = modulePath;

        fs.writeFileSync(path.join(imisPackagePath, 'package.json'), JSON.stringify(imisPackageJSON, null, 2), { encoding: 'utf8', flag: 'w' });
        console.log("======== package.json is updated");
        // Do last step to install app assembly again
        const current_path_pk = shell.pwd();
        console.log("========= Dossier courrent actuel  : " + current_path_pk);
        shell.exec('yarn link '+'"@openimis/'+splitedModuleName+'"');
        shell.exec('yarn install');
        console.log("========================Application has been updated!=============================");
    });
}

function reinstallAssemblyModule(){
    console.log("Link local module");
    shell.cd(__dirname);
    shell.cd('..');
    shell.exec("node modules-config.js");

    console.log('uninstall external module @openimis/'+splitedModuleName);
    shell.exec('yarn remove @openimis/'+splitedModuleName, (error, data) => {
        if(error){
            console.log(error);
        }
        updatePackageInAssembly();
    });
}

function camalize(str) {
    return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
}


function titleCase(string){
    return string[0].toUpperCase() + string.slice(1);
}

downloadModule(moduleRepoUrl, branch, targetDir);


//cmd : node dev_tools/installModuleLocally.js
//cmd : node dev_tools/installModuleLocallyAll.js

//node dev_tools/installModuleLocallyAll.js openimis_modules_local
//cd node_modules/@openimis

//ls -l node_modules/@openimis