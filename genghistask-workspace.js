module.exports = function(RED) {
    function GenghistaskWorkspace(config) {
        RED.nodes.createNode(this,config);
        this.workspace = config.workspace;
    }
    RED.nodes.registerType("genghistask-workspace", GenghistaskWorkspace);
}