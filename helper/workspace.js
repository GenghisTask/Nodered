const path = require('path');
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const spawn = require('child_process').spawn;
const execSync = require('child_process').execSync;
const fsp = fs.promises;
const Script = require('./script');
const Environment = require('./environment');
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
    if (!fs.existsSync(parentDir + "/" + this.workspace.id)){
        await exec(`git clone ${this.workspace.workspace} ${this.workspace.id}`, { cwd: parentDir});
    } else {
        await exec("git pull", { cwd: parentDir + "/" + this.workspace.id});
        /* prune log */
        exec(`find ${path.join(parentDir, this.workspace.id, 'log')}  -type f -exec  sed -ne':a;$p;N;11,$D;ba' -i {} \\;`).catch(e=>{});
    }
}

Workspace.prototype.getCommandLine = function() {
    return this.context.getFilenameInUserDir("genghistaskdata/"+this.workspace.id+"/shell");
}

Workspace.prototype.getScriptCollection = function() {
    return Script.getFiles(this.context.getFilenameInUserDir("genghistaskdata/"+this.workspace.id+"/shell"));
}

Workspace.prototype.getEnvironementCollection = function () {
    const sshconfig = this.context.getFilenameInUserDir("genghistaskdata/"+this.workspace.id+"/environment/ssh/config");
    const composeFile = this.context.getFilenameInUserDir("genghistaskdata/"+this.workspace.id+"/environment/docker/docker-compose.yml");
    const e = new Environment();
    e.parseSshEnvironment(sshconfig);
    e.parseDockerEnvironment(composeFile);
    //@TODO ansible ?
    //@TODO act ?
    //@TODO gitlab ?
    //@TODO parse psh yaml ?
    //@TODO Markefile target

    return Promise.all(e.promises).then(() => e.result);
}

Workspace.prototype.getEnvironementById = async function (id) {
    const environements = await this.getEnvironementCollection();
    return environements.filter(e=>e.id == id)[0] || {remote:" "};
}

Workspace.prototype.getUnixShebang = function(relativeScriptPath) {
    const filename = this.context.getFilenameInUserDir("genghistaskdata/"+this.workspace.id+"/shell/"+relativeScriptPath);
    if (!fs.existsSync(filename)) {
        return '/bin/bash';
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
    const declaredEnv = execSync('export -p', { env: env });
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

Workspace.prototype.launch = function(remote, script, payload, logname) {
    //@TODO implement log.log to trace last execution date
    const logfile = this.context.getFilenameInUserDir("genghistaskdata/"+this.workspace.id+"/log/");
    fs.mkdirSync(logfile + logname, { recursive: true });
    const child = spawn("sh",["-c" , remote + this.getUnixShebang(script)], payload);
    if (!child) {
        return false;
    }
    this.getScriptStream(script, payload).pipe(child.stdin);
    child.stdout.pipe(fs.createWriteStream(logfile + logname + '/out.log', {flags: 'w'}));
    child.stderr.pipe(fs.createWriteStream(logfile + logname + '/err.log', {flags: 'w'}));
    return child;
}

module.exports = Workspace;