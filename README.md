### Raycache 
raycache is a simple module which make you able to cache mongodb documents without **stringifying** whole document.
```
important: raycache compatible with mongoose 4.1 or higher version
```
### How it works
When you trying to cache a document which contain ```id```, ```name```, ```active``` fields, it immediately save this docuement into redis in-memory database using [hmset](https://redis.io/commands/hmset) command like this: 

```main key: 123```

Hash key | value
------------ | -------------
id | 123
id_type | number
name | Hamet
name_type | string
active | false
active_type | boolean

so when you trying to fetch this document it will return object with exact fields and types

### Usage
simply install raycache via 
```npm install raycache --save``` then initialize it like this
```javascript
const mongoose = require('mongoose');
const raycache = require('raycache')
mongoose.connect('mongodb://127.0.0.1/test');

raycache(mongoose, {
  options: {
    host: '127.0.0.1',
    port: 6379,
    ttl: 50
  },
  collections: ['agents'],
  alwaysReturnedField: '_id'
})
```

### api
#### raycache(mongoose, [, opts],..)
* ```mongoose```: a mongoose object ```required```
* ```options```:  redis in-memroy database options [redis.createClient()](https://github.com/NodeRedis/node_redis#options-object-properties) ```required```
* ```collections```: list of your database collections which need to be caching   ```required```
* ```alwaysReturnedField``` field name which raycache will always returned in all kind of querys ```optional```

all you need after initializing raycache is
```javascript  
Users.findOne({ _id: "123" })
  .raycache()
  .exec((err, res) => {
    // do some stuff 
  })
  
// OR pass options
Users.findOne({ _id: "123" })
  .raycache({
    ttl: 1000, // Second
    key: '_id', // which field value should be used for redis Main key (it should defined in query condition)
    // or use custom key, key: {name: 'some-value', custom: true}
  })
  .exec((err, res) => {
    // do some stuff 
  })
```
#### supported methods 
raycache is available for particular methods:
* **for find**: ```findOne```, ```findById```
* **for update** ```updateOne```
* **for remove** ```deleteOne```, ```findByIdAndRemove```, ```findOneAndRemove```