const { exec } = require("child_process");

function updatePoFiles(potPath, localePath, languages) {
    for (code of languages) {
        const poPath = `${localePath}/${code}/bero.po`;
        const cmd = `msgmerge --update ${poPath} ${potPath}`;
        console.log(`running ${cmd}...`)
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(error, stderr);
            } else {
                console.log(stdout);
            }
        });
    }
}

module.exports = {
    updatePoFiles: updatePoFiles
}