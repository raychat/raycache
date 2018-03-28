const Cache = require('./cache');

module.exports = async function (db, options) {



    let cacheIntance = new Cache(db, options)

    cacheIntance.on('ready', async () => {



        let redisKey = 'ID_123'
        let obj = {
            username: 'hamet',
            email: 'hamet.gh@gmail.com',
            wieght: 75,
            blueEyes: false,
            meta: {
                avatar: '/avatar.png',
                age: 19,
                active: false,
                interestedIn: ['internet', 'ping pong']
            }
        }
        
            await cacheIntance.set('agents', redisKey, obj)
            let fetchedObject = await cacheIntance.get('agents', redisKey, 
            
            ['username', 'meta.avatar', 'meta.age', 'meta.account.type', 'meta.account.test.hi']
        
        )
        
        


    })
}
