/**
 * convert object to array with custom format
 * @param {Object} object 
 */
module.exports.getKeysValues = (object, postfix) => {
    function iter(o, p) {
        Object.keys(o).forEach(function (k) {
            var path = (p.concat(k)).join('.'),
                type = Array.isArray(o[k]) && 'array' || typeof o[k];;
            if (o[k] && typeof o[k] === 'object') {
                result.push(path, type, path + postfix, type);
                return iter(o[k], p.concat(k));
            }
            result.push(path, o[k], path + postfix, type);
        });
    }

    var result = [];
    iter(object, [])
    return result;
}