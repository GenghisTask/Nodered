

module.exports = {
    kill: function(node, workspace, msg) {
        node.status({fill:"red",shape:"dot",text:"killed"});
    },
    
    close: function(node, workspace, msg, code) {
        if (code === 0) { node.status({}); }
        if (code === null) { this.kill(node); }
        else if (code < 0) { node.status({fill:"red",shape:"dot",text:"rc:"+code}); }
        else { node.status({fill:"yellow",shape:"dot",text:"rc:"+code}); }
    },
    
    reset: function(node, workspace) {
        node.status({});
    },
    
    running: function(node, workspace, msg, script) {
        node.status({fill:"blue",shape:"dot",text:"pid:"+node.activeProcesses.pid});
    }
};