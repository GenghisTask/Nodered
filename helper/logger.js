const fs = require('fs')

module.exports = {
    write: function(node, workspace, event) {
        const logfile = workspace.context.getFilenameInUserDir("genghistaskdata/"+workspace.workspace.id+"/log/") + node.id + "/log.log";

        fs.writeFileSync(logfile,  JSON.stringify({
            timestamp: new Date().toISOString(),
            ...event
        }) + '\n', {flag:"a"});
    },

    kill: function(node, workspace, msg) {
        this.write(node, workspace, {id: msg._msgid, msg:"kill"});
    },
    
    close: function(node, workspace, msg, code) {
        this.write(node, workspace, {id: msg._msgid, msg:"close"});
    },
    
    reset: function(node, workspace, msg) {
    },
    
    running: function(node, workspace, msg, script) {
        try {
            this.write(node, workspace, {id: msg._msgid, msg:"running", pid:node.activeProcesses.pid, environment:node.activeProcesses.spawnargs[2], command: script});
        } catch (e) {
            console.error(e)
        }
    }
};