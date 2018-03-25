
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
        this.options = options;
        this.redisDatabaseCount = 15;


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

            case "_setClients":
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
        db.collections({}).then(collections => {
            if (!this.options.autoCollections || typeof this.options.autoCollections == 'boolean') {
                let db = 0;
                for (const collection of collections) {
                    this.collections.set(collection.s.namespace.split('.')[1], db);
                    db++;
                    if (db > this.redisDatabaseCount) {
                        db = 0;
                    }
                }
            }
            else {
                const collectionsList = Object.keys(this.options.autoCollections)
                for (const [index, collection] of collections.entries()) {
                    for (const collectionName of collectionsList) {
                        if (collectionName == collection.s.namespace.split('.')[1]) {

                            if (this.options.autoCollections[collectionName] >= 0 && this.options.autoCollections[collectionName] <= this.redisDatabaseCount) {
                                this.collections.set(collectionName, this.options.autoCollections[collectionName])
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


        console.log(this.collections)
        for (const [key, value] of this.collections) {
            this.clients.set(key, redis.createClient({
                db: value
            }))
        }

        console.log(this.clients.get('chats'))
        this.emit('task', { task: 'setClients' })

    }


    set(collection, key, value) {
        return new Promise((resolve, reject) => {

            // console.log(collection)
            // console.log(key)
            // console.log(value)
        })
    }


    get(key, value) {

    }


}

module.exports = Cache;