const { promisify } = require('util');
const { resolve, basename } = require('path');
const fs = require('fs');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

async function getFiles(dir) {
    const subdirs = await readdir(dir);
    const files = await Promise.all(subdirs.filter(item => !(/(^|\/)\.[^\/\.]/g.test(item))).map(async (subdir) => {
        const res = resolve(dir, subdir);
        return (await stat(res)).isDirectory() ? getFiles(res) : {value:res, label:basename(res)};
    }));
    return {value:dir, label:basename(dir), children: files.reduce((a, f) => a.concat(f), [])};
}

const parsers = [
    async function (dir) {
        if (!fs.existsSync(dir + "/shell")) {
            return [];
        }
        return (await getFiles(dir + "/shell")).children;
    }
];

module.exports = {
    parse: async (dir) => {return {value:dir, label:basename(dir), children:  [].concat.apply([], await Promise.all(parsers.map(async (parser) => {
        const children = await parser(dir);
        return children;
    })))}}
};