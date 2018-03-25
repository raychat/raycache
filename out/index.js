const Cache = require('./cache');

module.exports = async function (db, options) {



    let cacheIntance = new Cache(db, options)

    cacheIntance.on('ready', async () => {



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
        await cacheIntance.set('agents', 'ID_123', obj)


    })
}
