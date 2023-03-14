const fs = require('fs');
const YAML = require('yaml');

module.exports = function (basePath) {
    const composeFile = basePath + "/environment/docker/docker-compose.yml";
    if (
        fs.existsSync(
            composeFile
        )
    ) {
        const data = fs.readFileSync(composeFile, 'utf8');
        return Object.keys(YAML.parse(data).services).map((service) => {
            return {
                name: service,
                remote:
                    'docker-compose   -f '+composeFile+' run --rm ' +
                    service,
                id: service
            };
        });
        //@TODO docker exec
        //@TODO ssh + docker run/exec combinaison

    }
    return [];
};