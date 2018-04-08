
'use strict';

const redis = require('redis');
const { EventEmitter } = require('events')
const {
    getKeysValues,
    arrayChanges,
    keyValToObj,
    clearObj,
    findExactFields,
    manageFields
} = require('../lib/func')
const bluebird = require('bluebird');
const _ = require('lodash')


bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

class Cache extends EventEmitter {


    constructor(db, options) {
        super();
        this._initialize(db, options)

    }



    /**
     * constructor with async await
     * @param {*database} db 
     */
    async _initialize(db, options) {


        this.collections = new Map();
        this.clients = new Map();

        this._validTypesArr = ['string', 'boolean', 'object', 'array', 'number']
        this._options = options;
        this._redisDatabaseCount = 15;
        this._postfix = this._options.postfixType || '_raycacheType'

        this.ttl = this._options.options.ttl || 3000
        this.defaultKeys = {
            mongoose: '_id'
        }
        this.stringify = this._options.stringify || false;

        this._setCollections(db)


        this.on('ray_task', (res) => {
            this._manageTasks(res);
        })
        this.on('ray_error', (err) => {
            console.error(err)
        })
        this.on('ray_command', (res) => {
            console.log(`command ${res.commandName} called`)
        })

    }



    // manage event listener
    _manageTasks(entity) {
        console.log('event task fired => ', entity.task)

        switch (entity.task) {

            case "setCollections":
                this._setClients();
                break;

            case "setClients":
                this.emit('ready')
                break;


            default:
            // do nothing :)
        }
    }



    /**
     * define which collection should be cached
     * @param {Object} connection 
     */
    _setCollections(connection) {

        let collections = []

        connection.connection.on('open', ref => {
            connection.connection.db.listCollections().toArray((err, names) => {
                if (err) {
                    this.emit('ray_error', { message: err, errorNumber: 1002 })
                    return;
                }

                if (names.length) {
                    names.forEach(key => {
                        collections.push(key.name)
                    })
                    // get all current database collections

                    if (!this._options.autoCollections || typeof this._options.autoCollections == 'boolean') {
                        let db = 0;
                        for (const collection of collections) {
                            this.collections.set(collection, db);
                            db++;
                            if (db > this._redisDatabaseCount) {
                                db = 0;
                            }
                        }
                    }
                    else {
                        const collectionsList = Object.keys(this._options.autoCollections)
                        for (const [index, collection] of collections.entries()) {
                            for (const collectionName of collectionsList) {
                                if (collectionName == collection) {

                                    if (this._options.autoCollections[collectionName] >= 0 && this._options.autoCollections[collectionName] <= this._redisDatabaseCount) {
                                        this.collections.set(collectionName, this._options.autoCollections[collectionName])
                                    }
                                    else {
                                        this.emit('ray_error', { message: "invalid database number", errorNumber: 1000 })
                                        return false;
                                    }
                                }
                            }
                        }
                    }

                    this.emit('ray_task', { task: 'setCollections' })
                }


            });
        })








    }



    /**
     * create redis client 
     */
    async _setClients() {



        for (const [key, value] of this.collections) {
            this.clients.set(key, redis.createClient({
                db: value
            }))
        }


        this.emit('ray_task', { task: 'setClients' })

    }





    set(collection, redisKey, ent) {
        return new Promise(async (resolve, reject) => {

            let arr = [];
            let thisFieldType;

            let entity = ent.toJSON()


            for (const key of Object.keys(entity)) {

                thisFieldType = typeof entity[key] // type of this field 
                // if field data type is undefined
                if (this._validTypesArr.indexOf(thisFieldType) == -1) {
                    this.emit('ray_error', { message: 'invalid field data type', errorNumber: 1001 })
                    reject(err)
                }
            }

            arr.push(...getKeysValues(entity, this._postfix))
            try {
                this.emit('ray_command', { commandName: 'hmset' })
                resolve(await this.clients.get(collection).hmsetAsync(redisKey, ...arr))
            } catch (err) {
                reject(err)
            }


        })
    }


    get(collection, redisKey, fields) {
        return new Promise(async (resolve, reject) => {

            let obj = {}
            const notFounds = []


            // if needed fields is defined
            if (fields && Array.isArray(fields) && fields.length > 0) {


                // concat posfix for keys
                let arr = arrayChanges(fields);


                console.log(collection)
                /**
                 * TODO :  for best performance redesign this part
                 * inested of fetch all keys with hkeys Command then
                 * loop for finding fields which match pattern
                 * use LUA Script for finding fields or directrly finding value
                 */
                let foundedKeys = await this.clients
                    .get(collection)
                    .hkeysAsync(redisKey);





                // not founds keys
                fields.forEach(key => {
                    if (foundedKeys.indexOf(key) == -1) {
                        notFounds.push(key)
                    }
                })





                // e.x fields => meta return meta.name, meta.ex, meta.*
                arr = findExactFields(foundedKeys, fields, this._postfix)

                // split and concat: [meta.avatar] =>  [meta, meta_postFix, meta.avatar, meta.avatar_postFix]
                arr = manageFields(arr, this._postfix)



                this.emit('ray_command', { commandName: 'hmget' })

                if (arr.length > 0) {

                    // get values from redis with given key and fileds
                    let foundedFieldsArr = await this.clients
                        .get(collection)
                        .hmgetAsync(redisKey, arr)
                    obj = keyValToObj(arr, foundedFieldsArr)

                }


            } else {

                this.emit('ray_command', { commandName: 'hgetall' })

                // get all values with given key
                obj = await this.clients
                    .get(collection)
                    .hgetallAsync(redisKey)

            }

            if (_.isEmpty(obj) || obj == "undefined") {
                return resolve({ obj: {}, notFounds })

            }


            obj = clearObj(obj, this._postfix, this._validTypesArr)


            resolve({ obj, notFounds })


        })

    }



    getTtl() {
        return this.ttl;
    }





}

module.exports = Cache;