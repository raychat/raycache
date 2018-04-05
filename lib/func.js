

/**
 * convert object to array with custom format
 * @param {Object} object 
 */
module.exports.getKeysValues = (object, postfix) => {
    function iter(o, p) {
        Object.keys(o).forEach(function (k) {
            let path = (p.concat(k)).join('.'),
                type = Array.isArray(o[k]) && 'array' || typeof o[k];;
            if (o[k] && typeof o[k] === 'object') {
                result.push(path, type, path + postfix, type);
                return iter(o[k], p.concat(k));
            }
            result.push(path, o[k], path + postfix, type);
        });
    }

    let result = [];
    iter(object, [])
    return result;
}

/**
 * some changes for array
 * @param {Array} fields 
 */
module.exports.arrayChanges = (fields) => {

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
                } else {
                    nestedFieldsSet.add(`${field}`)
                    tmpStr += `${field}`
                }
            }

        }
    })


    // convert Set to Array
    let nestedFieldsArr = Array.from(nestedFieldsSet)

    // concat two arrays and remove duplicate items
    fieldsArr = arrayUnique(fieldsArr.concat(nestedFieldsArr));

    // sort array
    fieldsArr.sort((a, b) => {
        return a.split('.').length > b.split('.').length
    })


    return fieldsArr
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
 * get pure object which collected from redis 
 * then convert it to user friendly object
 * @param {Object} entity 
 */
module.exports.clearObj = (entity, postfix, validFormats) => {
    const data = entity;
    const result = {}
    const create = { 'string': String, 'number': Number, 'boolean': Boolean, 'array': Array, 'object': Object }
    const findType = (key, obj) => obj[key]



    Object.keys(data).forEach(key => {
        if (!key.includes(postfix)) {

            key.split('.').reduce((r, e, i, arr) => {
                let type = findType(key + postfix, data);
                let value;

                if (type) {
                    value = create[data[key]] || arr[i + 1] ? new create[type] : new create[type](data[key]).valueOf();
                }
                if (data[key] == 'false') {
                    value = false;
                }


                r[e] = r[e] || value;



                return r[e]
            }, result)

        }
    })




    return result
}


/**
 * find fields nested keys 
 * @param {Array} foundedKeys 
 * @param {Array} fields 
 */
module.exports.findExactFields = (foundedKeys, fields) => {
    let result = []

    foundedKeys.filter(function (field) {
        for (const x of fields) {


            if (field.startsWith(`${x}.`) || field == x || field == `${x}${postfix}`) {
                result.push(field)
            }
        }
    });

    return result
}


/**
 * manage elements and concat postFix
 * E.x [meta.avatar] =>  [meta, meta_postFix, meta.avatar, meta.avatar_postFix]
 * @param {Array} arr 
 * @param {String} postfix 
 */
module.exports.manageFields = (arr, postfix) => {
    let lastArr = new Set();
    arr.map((part, index, thisArr) => {


        let res = part.split('.').reduce((r, e, i) => {

            if (i === 0)
                r.push(e)
            else
                r.push(`${r[i - 1]}.${e}`)

            return r

        }, [])
        res.forEach(key => {
            lastArr.add(key)
        })



    })


    arr = Array.from(lastArr)

    let result = []
    arr.forEach(key => {

        if (!key.includes(postfix)) {
            result.push(key)
            result.push(`${key}${postfix}`)
        }
    })

    return result
}


/**
 * remove dumplicate items in array
 * @param {Array} array 
 */
function arrayUnique(array) {
    let a = array.concat();
    for (let i = 0; i < a.length; ++i) {
        for (let j = i + 1; j < a.length; ++j) {
            if (a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
}