
'use strict';

const redis = require('redis');
const { EventEmitter } = require('events')

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


        this.on('task', (res) => {
            this._manageTasks(res);
        })
        this.on('error', (err) => {
            console.error(err)
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
                                    this.emit('error', { message: "invalid database number", errorNumber: 1000 })
                                    return false;
                                }
                            }
                        }
                    }
                }

                this.emit('task', { task: 'setCollections' })
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


        this.emit('task', { task: 'setClients' })

    }





    set(collection, redisKey, entity) {
        return new Promise(async (resolve, reject) => {

            // console.log(collection)
            // console.log(key)


            let arr = [];
            let thisFieldType;
            for (const key of Object.keys(entity)) {

                thisFieldType = typeof entity[key] // type of this field 


                console.log(thisFieldType)
                // if field data type is undefined
                if (!this._validTypesArr[thisFieldType]) {
                    this.emit('error', { message: 'invalid field data type', errorNumber: 1001 })
                    return false;
                }


                switch (thisFieldType) {
                    case "string":
                        arr.push(...[key, entity[key], `${key}_raycache_type`, `${this._validTypesArr[thisFieldType]}`])
                        break
                    case "boolean":
                        arr.push(...[key, JSON.stringify(entity[key]), `${key}_raycache_type`, `${this._validTypesArr[thisFieldType]}`])
                        break
                    case "number":
                        arr.push(...[key, entity[key].toString(), `${key}_raycache_type`, `${this._validTypesArr[thisFieldType]}`])
                        break
                }
            }

            console.log(arr)

            await this.clients.get(collection).hmset(redisKey, ...arr)

        })
    }


    get(key, value) {

    }


}

module.exports = Cache;