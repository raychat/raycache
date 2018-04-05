const Cache = require('./cache');

module.exports = async function (db, options) {



    let cacheIntance = new Cache(db, options)

    cacheIntance.on('ready', async () => {



        let redisKey = 'ID_123'
        let obj = {
            username: 'hamet',
            meta: {
                active: true,
                avatar: '123',
                array: [{
                    field: 1,
                    field2: 2,
                }]

            },
            arr: [
                123
            ]

        }

        console.time('set')
        // await cacheIntance.set('agents', redisKey, obj)

        let fetchedObject = await cacheIntance.get('agents', redisKey, ['meta'])
        // // let fetchedObject = await cacheIntance.get('agents', redisKey)
        console.log(fetchedObject)
        // console.timeEnd('set')

       

        
       
        process.exit(1)




    })
}
