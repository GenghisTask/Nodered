const path = require('path');

const Context = function(RED) {
    this.RED = RED;
};

Context.prototype.getFilenameInUserDir = function (name) {
    const userDir = this.RED.settings.userDir || "";
    return path.join(userDir, name);
};
Context.prototype.getFilenameInModule = function (name) {
    return path.dirname(__filename) + "/../" + name;
}

module.exports = Context;