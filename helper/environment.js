const fs = require('fs');
const split = require('split');
const YAML = require('yaml');

const Environment = function() {
    this.result = [{id:'', name:'Local', remote:''}];
    this.promises = [Promise.resolve(true)];
}

Environment.prototype.parseSshEnvironment = function(sshconfig) {
    if (fs.existsSync(sshconfig)) {
        const configStream = fs
            .createReadStream(
                sshconfig,
                'utf8'
            )
            .pipe(split())
            .on('data', (line) => {
                let capturingRegex;
                if ((capturingRegex = line.match(/Host (?<host>.*)/))) {
                    const host = capturingRegex.groups.host;
                    if (!host.includes('*') && !host.includes('?')) {
                        this.result.push({
                            name: host,
                            remote: 'ssh -F ' + sshconfig + ' ' + host,
                            id: host
                        });
                    }
                }
            });
        this.promises.push(
            new Promise((resolve) => configStream.on('close', () => resolve(true)))
        );
    }
};

Environment.prototype.parseDockerEnvironment = function (composeFile) {
    if (
        fs.existsSync(
            composeFile
        )
    ) {
        const detectDockerEnvs = new Promise((resolve) =>
            fs.readFile(
                composeFile,
                'utf8',
                (err, data) => {
                    Object.keys(YAML.parse(data).services).forEach((service) =>
                        this.result.push({
                            name: service,
                            remote:
                                'docker-compose   -f '+composeFile+' run --rm ' +
                                service,
                            id: service
                        })
                    );
                    resolve(true);
                }
                //@TODO docker exec
                //@TODO ssh + docker run/exec combinaison
            )
        );
        this.promises.push(detectDockerEnvs);
    }
};

module.exports = Environment;