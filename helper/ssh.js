
const exec = require('child_process').execSync
const fs = require('fs');

module.exports = {
    getPublicKey: ()=>{
        const key = process.env.HOME + '/.ssh/id_rsa';
        if (!fs.existsSync(key)){
            exec("ssh-keygen -b 2048 -t rsa -f " + key + " -q -N ''");
        }
        
        return fs.readFileSync(key + '.pub');
    }
};