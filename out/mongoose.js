const _ = require('lodash')


module.exports = (mongoose, cache) => {

    mongoose.Query.prototype.raycache = function (entity) {
        let ent = entity

        this.raycache = {
            enabled: true,
            postFix: cache._postfix
        }


        if (!ent) {
            this.raycache = {
                ttl: cache.ttl,
                key: cache.defaultKeys.mongoose,
                stringify: cache.stringify
            }
        }
        if (ent.ttl) {
            this.raycache._ttl = Number(ent.ttl) || cache.ttl
        }
        else {
            this.raycache._ttl = cache.ttl
        }

        if (ent.key) {
            if (_.isObject(ent.key) && ent.key.custom) {
                this.raycache.redisKey = ent.key.name || cache.defaultKeys.mongoose
            } else {
                if (this._conditions[ent.key]) {
                    this.raycache.redisKey = this._conditions[ent.key]
                } else {
                    this.raycache.enabled = false;
                }
            }

        }

        if (_.isBoolean(ent.stringify)) {
            this.raycache.stringify = ent.stringify
        } else {
            this.raycache.stringify = cache.stringify
        }


        if (this._fields) {
            this.raycache.allFields = false;
            const keys = Object.keys(this._fields);
            this.raycache.fields = []
            for (let k of keys) {
                if (keys.length === 1 && this._fields[k] === 0) {
                    // when want to fetch all fields exept specefic field
                    this.raycache.enabled = false;
                }
                if (this._fields[k] !== 0) {
                    this.raycache.fields.push(k)
                }
            }

        } else {
            this.raycache.allFields = true;
        }



        return this;
    };



    const exec = mongoose.Query.prototype.exec;
    mongoose.Query.prototype.exec = function (op, callback = function () { }) {
        console.time('readed in ')

        if (!this.raycache.enabled) return exec.apply(this, arguments);

        if (typeof op === 'function') {
            callback = op;
            op = null;
        } else if (typeof op === 'string') {
            this.op = op;
        }


        const model = this.model.modelName;
        return new Promise(async (resolve, reject) => {

            const found = await cache.get(model, this.raycache.redisKey, this.raycache.fields)






            // if document does not exists in cache or not complete
            if (
                _.isEmpty(found.obj) || // 

                !_.isEmpty(found.notFounds) ||

                (
                    this.raycache.allFields &&
                    !found.obj.hasOwnProperty(`isAllFields_${this.raycache._postfix}`)
                )
            ) {

                // run exec
                exec
                    .call(this)
                    .then(async (results) => {

                        if (_.isNull(results)) {
                            callback(null, results)
                            return resolve(results);
                        }

                        console.timeEnd('readed in ')

                        cache.set(model, this.raycache.redisKey, results, this.raycache.allFields)
                        callback(null, results);
                        return resolve(results);


                    })
                    .catch((err) => {
                        callback(err);
                        reject(err);
                    });
            } else {
                console.timeEnd('readed in ')
                callback(null, found.obj);
                return resolve(found.obj);

            }



            // if (cachedResults) {
            //     if (isCount) {
            //         callback(null, cachedResults);
            //         return resolve(cachedResults);
            //     }

            //     if (!isLean) {
            //         const constructor = mongoose.model(model);
            //         cachedResults = Array.isArray(cachedResults) ?
            //             cachedResults.map(inflateModel(constructor)) :
            //             inflateModel(constructor)(cachedResults);
            //     }

            //     callback(null, cachedResults);
            //     return resolve(cachedResults);
            // }

            // exec
            //     .call(this)
            //     .then((results) => {
            //         cache.set(key, results, ttl, () => {
            //             callback(null, results);
            //             return resolve(results);
            //         });
            //     })
            //     .catch((err) => {
            //         callback(err);
            //         reject(err);
            //     });

        });
    };
}