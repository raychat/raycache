
'use strict';

const redis = require('redis');
const { EventEmitter } = require('events')
const { getKeysValues } = require('../lib/func')
const bluebird = require('bluebird');


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

        this._validTypesArr = { 'string': 1, 'boolean': 2, 'object': 3, 'array': 4, 'number': 5 }
        this._options = options;
        this._redisDatabaseCount = 15;


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
     * @param {*databse} db 
     */
    _setCollections(db) {




        // get all current database collections
        db.collections({})
            .then(collections => {
                if (!this._options.autoCollections || typeof this._options.autoCollections == 'boolean') {
                    let db = 0;
                    for (const collection of collections) {
                        this.collections.set(collection.s.namespace.split('.')[1], db);
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
                            if (collectionName == collection.s.namespace.split('.')[1]) {

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





    set(collection, redisKey, entity) {
        return new Promise(async (resolve, reject) => {

            let arr = [];
            let thisFieldType;

            for (const key of Object.keys(entity)) {

                thisFieldType = typeof entity[key] // type of this field 
                // if field data type is undefined
                if (!this._validTypesArr[thisFieldType]) {
                    this.emit('ray_error', { message: 'invalid field data type', errorNumber: 1001 })
                    reject(err)
                }
            }

            arr.push(...getKeysValues(entity))
            try {
                this.emit('ray_command', { commandName: 'hmset' })
                await this.clients.get(collection).hmset(redisKey, ...arr)
                resolve(redisKey)
            } catch (err) {
                reject(err)
            }


        })
    }


    get(collection, redisKey, entity) {
        return new Promise(async (resolve, reject) => {
            this.emit('ray_command', { commandName: 'hmget' })

            // const s = promisify(this.clients.get(collection).hgetall).bind(this.clients.get(collection));

            // s()

            this.clients.get(collection).hgetallAsync(redisKey).then((s, ss) => {

                console.log(s)
                console.log(ss)
            })


        })

    }


}

module.exports = Cache;