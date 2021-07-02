const { exec } = require("child_process");

function updateJsonFiles(localePath, languages) {
    for (code of languages) {

        const poPath = `${localePath}/${code}/bero.po`;
        const jsonPath = `${localePath}/${code}/bero.json`;
        const cmd = `yarn run po2json-gettextjs ${poPath} ${jsonPath} -p`;
        console.log(`running ${cmd}...`)
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.log(error, stderr);
            } else {
                console.log(stdout);
            }
        });

    }
}

module.exports = {
    updateJsonFiles: updateJsonFiles
}