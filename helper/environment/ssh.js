const fs = require('fs');

module.exports =  function(basePath) {
    const sshconfig = basePath + "/environment/ssh/config";
    if (fs.existsSync(sshconfig)) {
        return fs.readFileSync(sshconfig, 'utf-8').split('\n').map(line => {
            const capturingRegex = line.match(/Host (?<host>.*)/);
            if (!capturingRegex) {
                return false;
            }
            const host = capturingRegex.groups.host;
            return {
                name: host,
                remote: 'ssh -F ' + sshconfig + ' ' + host,
                id: host
            };
        }).filter(i=>i);
    }
    return [];
};