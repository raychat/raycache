

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

/**
 * concat postfix to each element of array
 * @param {Array} fields 
 * @param {String} postfix 
 */
module.exports.concatPostFix = (fields, postfix) => {
    let fieldsArr = fields;


    let nestedFieldsSet = new Set();


    fieldsArr.map((keyName, index, thisArr) => {

        let splitedKey = keyName.split('.');
        if (splitedKey.length - 1) {

            let tmpStr = ``;
            for (let field of splitedKey) {
                if (tmpStr) {
                    nestedFieldsSet.add(`${tmpStr}.${field}`)
                    tmpStr += `.${field}`
                }
                else {
                    nestedFieldsSet.add(field)
                    tmpStr += `${field}`
                }
            }

        }
    })

    // convert Set to Array
    let nestedFieldsArr = Array.from(nestedFieldsSet)

    // concat two arrays and remove duplicate items
    fieldsArr = arrayUnique(fieldsArr.concat(nestedFieldsArr));

    // concat postfix then return it
    return fieldsArr.reduce((r, a) => r.concat(a, a + postfix), []);
}


/**
 * convert keys array and values array to Obj
 * @param {Array} keys 
 * @param {Array} values 
 */
module.exports.keyValToObj = (keys, values) => {
    let obj = {}
    keys.map((keyName, index, thisArr) => {
        obj[keyName] = values[index]
    })
    return obj
}


/**
 * remove dumplicate items in array
 * @param {Array} array 
 */
function arrayUnique(array) {
    var a = array.concat();
    for (var i = 0; i < a.length; ++i) {
        for (var j = i + 1; j < a.length; ++j) {
            if (a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
}