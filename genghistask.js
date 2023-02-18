const Context = require('./helper/context');
const Workspace = require('./helper/workspace');
const Ornament = require('./helper/ornament');

module.exports = function(RED) {

    const context = new Context(RED);
    RED.nodes.registerType("genghistask", function(config) {
        RED.nodes.createNode(this,config);
        
        const workspace = new Workspace(context, RED.nodes.getNode(config.workspace));

        this.on("input", (msg, nodeSend, nodeDone) => {
            if (this.activeProcesses) {
                this.activeProcesses.kill();
                Ornament.kill(this);
                return nodeDone();
            }
            workspace.getEnvironementById(config.environment).then((e)=>{
                this.activeProcesses = workspace.launch(e.remote, config.script, msg);
                Ornament.running(this);
                if (!this.activeProcesses) {
                    this.activeProcesses.kill();
                }
                this.activeProcesses.stdin.on('error', ( err )=> {
                    this.error(err.code, RED.util.cloneMessage(err));
                });
                this.activeProcesses.stdout.on('error', ( err ) =>{
                    this.error(err.code, RED.util.cloneMessage(err));
                });
                this.activeProcesses.on('close',  (code, signal) => {
                    this.activeProcesses = false;
                    Ornament.close(this, code);
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
            Ornament.reset(this);
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
        res.send(workspace.getLogFile(req.query.script, req.query.tab_id));
    });
}