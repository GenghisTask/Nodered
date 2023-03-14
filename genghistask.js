const Context = require('./helper/context');
const Workspace = require('./helper/workspace');
const Ornament = require('./helper/decorator')(
    require('./helper/decorator/status'),
    require('./helper/decorator/logger')
);

module.exports = function(RED) {

    const context = new Context(RED);
    RED.nodes.registerType("genghistask", function(config) {
        RED.nodes.createNode(this,config);
        
        const workspace = new Workspace(context, RED.nodes.getNode(config.workspace));

        this.on("input", (msg, nodeSend, nodeDone) => {
	    
	        msg = Object.assign(workspace.getDirectory(), msg);

            if (this.activeProcesses) {
                this.activeProcesses.kill();
                Ornament.kill(this, workspace, msg);
                return nodeDone();
            }
            workspace.getEnvironementById(config.environment).then((e)=>{
                this.activeProcesses = workspace.launch(e.remote, config.script, msg, this.id);
                Ornament.running(this, workspace, msg, config.script);
                this.activeProcesses.stdin.on('error', ( err )=> {
                    this.error(err.code, RED.util.cloneMessage(err));
                });
                this.activeProcesses.stdout.on('error', ( err ) =>{
                    this.error(err.code, RED.util.cloneMessage(err));
                });
                this.activeProcesses.on('close',  (code, signal) => {
                    this.activeProcesses = false;
                    Ornament.close(this, workspace, msg, code);
                    if (code == 0) {
                        nodeSend([{code, ...msg}]);
                    }
                    nodeDone();
                });
                this.activeProcesses.on('error',  (code) => {
                    this.activeProcesses = false;
                    this.error(code, RED.util.cloneMessage(msg));
                });
                
            });
        })
        
        this.on('close', () => {
            if (this.activeProcesses) {
                this.activeProcesses.kill();
            }
            this.activeProcesses = false;
            Ornament.reset(this, workspace);
        });
    });
    RED.httpAdmin.get("/genghistask-environment", RED.auth.needsPermission('genghistask'), function(req,res) {
        const workspace = new Workspace(context, req.query);
        workspace.getEnvironementCollection().then(
            (result) => {
                res.json(result.map((environment)=>environment.name));
            },
            err => {
                console.error(err);
                res.json([RED._("genghistask.errors.list")]);
            }
        )
    });
    RED.httpAdmin.get("/genghistask-script", RED.auth.needsPermission('genghistask'), function(req,res) {
        const workspace = new Workspace(context, req.query);
        workspace.getScriptCollection().then(
            (result) => {
                res.json(result);
            },
            err => {
                console.error(err);
                res.json([RED._("genghistask.errors.list")]);
            }
        )
    });
    RED.httpAdmin.post("/genghistask-workspace", RED.auth.needsPermission('genghistask'), function(req,res) {
        const workspace = new Workspace(context, req.query);
        workspace.clone().then(
            () => {
                res.end();
            },
            err => {
                console.error(err);
                res.json([RED._("genghistask.errors.list")]);
            }
        )
    });
    RED.httpAdmin.get("/genghistask-tab", RED.auth.needsPermission('genghistask'), function(req,res) {
        const workspace = new Workspace(context, req.query);
        if (req.query.tab_id == "shell") {
            res.setHeader('content-type', 'text/plain');
            return workspace.getScriptStream(req.query.script, workspace.getDirectory()).pipe(res);
        }
        res.send(workspace.getLogFile(req.query.nodeId, req.query.tab_id));
    });
}
