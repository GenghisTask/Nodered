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
        exec(`git clone ${this.workspace.workspace} ${this.workspace.id}`, { cwd: parentDir});
    } else {
        exec("git pull", { cwd: parentDir + "/" + this.workspace.id});
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

    return Promise.all(e.promises).then(() => e.result);
}

Workspace.prototype.getEnvironementById = async function (id) {
    const environements = await this.getEnvironementCollection();
    return environements.filter(e=>e.id == id)[0] || {remote:" "};
}

Workspace.prototype.getUnixShebang = function(relativeScriptPath) {
    const filename = this.context.getFilenameInUserDir("genghistaskdata/"+this.workspace.id+"/shell/"+relativeScriptPath);
    return (
        (new String(fs.readFileSync(filename)).match(/(^#!.*)/) || [])[1] || ''
    ).replace('#!', ' ');
}


Workspace.prototype.getScriptStream = function(relativeScriptPath, env) {
    const filename = this.context.getFilenameInUserDir("genghistaskdata/"+this.workspace.id+"/shell/"+relativeScriptPath);
    const declaredEnv = execSync('export -p', { env: env });
    return Readable.from(declaredEnv + fs.readFileSync(filename));
}

Workspace.prototype.getLogFile = function(script, suffix) {
    const logdir = this.context.getFilenameInUserDir("genghistaskdata/"+this.workspace.id+"/log/");
    const logfile = logdir + script + "/" + suffix + ".log";
    if (!fs.existsSync(logfile)) {
        return false;
    }
    return fs.readFileSync(logfile);
}

Workspace.prototype.launch = function(remote, script, payload) {
    const logfile = this.context.getFilenameInUserDir("genghistaskdata/"+this.workspace.id+"/log/");
    fs.mkdirSync(logfile + script, { recursive: true });
    const child = spawn("sh",["-c" , remote + this.getUnixShebang(script)], payload);
    if (!child) {
        return false;
    }
    this.getScriptStream(script, payload).pipe(child.stdin);
    child.stdout.pipe(fs.createWriteStream(logfile + script + '/out.log', {flags: 'w'}));
    child.stderr.pipe(fs.createWriteStream(logfile + script + '/err.log', {flags: 'w'}));
    return child;
}

module.exports = Workspace;