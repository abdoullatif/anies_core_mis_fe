const fs = require('fs');
const shell = require('shelljs');
const scriptPath = shell.cd(__dirname);
const path = require('path');
const { argv } = require('process');
const { has } = require('lodash');


function downloadModulesLocallyBasedOnImisJson(branch, targetDir){
    imisJsonPath = path.normalize(path.join(__dirname, '..'));
    fs.readFile(path.join(imisJsonPath, 'openimis.json'), 'utf8', (error, data) => {
        if(error){
           console.log(error);
           return;
        }
        imisJSON = JSON.parse(data);
        imisJSON['modules'].forEach(module => {
            console.log(module["npm"]);
            moduleName = module["npm"].split('/')[1]
            moduleName = "openimis-"+moduleName.split('@')[0]+"_js"
            moduleRepoUrl = 'https://github.com/openimis/'+moduleName+'.git';
            shell.exec('node installModuleLocally.js '+moduleRepoUrl + ' ' + branch + ' ' + targetDir);
        });
    })
}

const branch = argv[2]; // Par défaut à 'modules_locales' si aucun argument n'est fourni
const targetDir = argv[3] || 'modules_locales'; // Par défaut à 'modules_locales' si aucun argument n'est fourni
downloadModulesLocallyBasedOnImisJson(branch, targetDir);

// node dev_tools/installModuleLocallyAll.js release/25.04 openimis_modules_local