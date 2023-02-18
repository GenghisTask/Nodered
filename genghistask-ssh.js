const Ssh = require('./helper/ssh');

module.exports = function(RED) {
    RED.httpAdmin.get("/genghistask-ssh", RED.auth.needsPermission('genghistask'), function(req,res) {
        res.send(Ssh.getPublicKey());
    });
}