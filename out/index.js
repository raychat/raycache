const Cache = require('./cache');

module.exports = async function (db, options) {

    let cacheIntance = new Cache(db, options)
    require('./mongoose')(db, cacheIntance)

}
