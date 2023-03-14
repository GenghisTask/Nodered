const parsers = [
    require('./environment/docker'),
    require('./environment/ssh'),
];

module.exports = {
    parse: function(basePath) {
        const defaultResult = [{id:'', name:'Local', remote:''}];
        return parsers.reduce((result, parser) => {
            return result.concat(parser(basePath));
        }, defaultResult);
    }
};