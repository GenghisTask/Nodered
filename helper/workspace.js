const path = require('path');
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const spawn = require('child_process').spawn;
const execSync = require('child_process').execSync;
const fsp = fs.promises;
const script = require('./script');
const environment = require('./environment');
const stream = require("stream");
const Readable = stream.Readable; 

const Workspace = function(context, data) {
    this.workspace = data;
    this.context = context;
    this.activeProcesses = false;
};

Workspace.prototype.clone = async function() {
    const parentDir = this.context.getFilenameInUserDir("genghistaskdata");
    if (!fs.existsSync(parentDir)){
        fs.mkdirSync(parentDir, { recursive: true });
    }
    if (!this.workspace.workspace || this.workspace.workspace == "undefined") {
        return
    }
    if (fs.existsSync(parentDir + "/" + this.workspace.id)){
        /* cleanup if workspace url change for same id : delete workspace */
        const currentRemote = execSync("git remote get-url origin", { cwd: parentDir + "/" + this.workspace.id}).toString().trim();
        if (currentRemote != this.workspace.workspace) {
            try {
                /* check access to the futur remote before deleting the workspace of the old one */
                execSync(`git remote set-url origin ${this.workspace.workspace}`, { cwd: parentDir + "/" + this.workspace.id});
                execSync(`git ls-remote`, { cwd: parentDir + "/" + this.workspace.id});
                /* delete workspace */
                fs.rmSync(parentDir + "/" + this.workspace.id, {recursive: true});
            } catch (e) {
                /* rollback cleanup */
                execSync(`git remote set-url origin ${currentRemote}`, { cwd: parentDir + "/" + this.workspace.id});
            }
        }
    }
    if (!fs.existsSync(parentDir + "/" + this.workspace.id)){
        execSync(`git clone ${this.workspace.workspace} ${this.workspace.id}`, { cwd: parentDir});
    } else {
        /* update workspace */
        execSync("git pull", { cwd: parentDir + "/" + this.workspace.id});
        /* prune log */
        exec(`find ${path.join(parentDir, this.workspace.id, 'log')}  -type f -exec  sed -ne':a;$p;N;11,$D;ba' -i {} \\;`).catch(e=>{});
    }
}

Workspace.prototype.getCommandLine = function() {
    return this.context.getFilenameInUserDir("genghistaskdata/"+this.workspace.id+"/shell");
}

Workspace.prototype.getScriptCollection = function() {
    return script.parse(this.context.getFilenameInUserDir("genghistaskdata/"+this.workspace.id));
}

Workspace.prototype.getEnvironementCollection = function () {

    //@TODO ansible ?
    //@TODO act ?
    //@TODO gitlab ?
    //@TODO parse psh yaml ?
    //@TODO Markefile target

    return Promise.resolve(environment.parse(this.context.getFilenameInUserDir("genghistaskdata/"+this.workspace.id)));
}

Workspace.prototype.getEnvironementById = async function (id) {
    const environements = await this.getEnvironementCollection();
    return environements.filter(e=>e.id == id)[0] || {remote:" "};
}

Workspace.prototype.getUnixShebang = function(relativeScriptPath) {
    const filename = this.context.getFilenameInUserDir("genghistaskdata/"+this.workspace.id+"/shell/"+relativeScriptPath);
    if (!fs.existsSync(filename)) {
        return ' /bin/bash';
    }
    return (
        (new String(fs.readFileSync(filename)).match(/(^#!.*)/) || [])[1] || ''
    ).replace('#!', ' ');
}


Workspace.prototype.getScriptStream = function(relativeScriptPath, env) {
    const filename = this.context.getFilenameInUserDir("genghistaskdata/"+this.workspace.id+"/shell/"+relativeScriptPath);
    var script = relativeScriptPath;
    if (fs.existsSync(filename)) {
        script = fs.readFileSync(filename)
    }
    const declaredEnv = execSync('export -p', { env: env, cwd: env.WORKSPACE });
    return Readable.from(declaredEnv + script);
}

Workspace.prototype.getLogFile = function(logname, suffix) {
    const logdir = this.context.getFilenameInUserDir("genghistaskdata/"+this.workspace.id+"/log/");
    const logfile = logdir + logname + "/" + suffix + ".log";
    if (!fs.existsSync(logfile)) {
        return false;
    }
    return fs.readFileSync(logfile);
}
Workspace.prototype.getDirectory = function() {
    return {
        WORKSPACE : this.context.getFilenameInUserDir("genghistaskdata/"+this.workspace.id),
        HOSTDIR: process.env.HOSTDIR
    }
}

Workspace.prototype.launch = function(remote, script, payload, logname) {
    //@TODO implement log.log to trace last execution date
    const logfile = this.context.getFilenameInUserDir("genghistaskdata/"+this.workspace.id+"/log/");
    fs.mkdirSync(logfile + logname, { recursive: true });
    const child = spawn("sh",["-c" , remote + this.getUnixShebang(script)], {env:payload, cwd:payload.WORKSPACE});
    if (!child) {
        return false;
    }
    this.getScriptStream(script, payload).pipe(child.stdin);
    child.stdout.pipe(fs.createWriteStream(logfile + logname + '/out.log', {flags: 'w'}));
    child.stderr.pipe(fs.createWriteStream(logfile + logname + '/err.log', {flags: 'w'}));
    return child;
}

module.exports = Workspace;