const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const mongod = new MongoMemoryServer()
const fs = require('fs')
const dir = "public/uploads"
const path = require('path');

module.exports.connect = async () => {
    const uri = await mongod.getUri()
    const mongooseOptions = 
    {
        useNewUrlParser: true,
        useUnifiedTopology:true
    }
    await mongoose.connect(uri, mongooseOptions)
}

module.exports.closeDatabase = async () => {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
    await mongod.stop()
}

module.exports.clearDatabase = async () => {
    const collections = mongoose.connection.collections
    for (const key in collections) {
        const collection = collections[key]
        await collection.deleteMany()
    }
}

module.exports.clearUploads = () => {
    fs.readdir(dir, (err, files) => {
        if (err) throw err
        for (const file of files) {
            fs.unlinkSync(path.join(dir, file))
        }
    })
}
