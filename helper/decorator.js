

module.exports = function Decorator(first, ...children) {
    const composite = {};
    Object.entries(first).map(function([prop]){
        composite[prop] = function() {
            first[prop].apply(first, arguments);
            children.map((c)=>c[prop].apply(c, arguments))
        }
    });
    return composite;
}