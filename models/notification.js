const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
    text: String,
    event: {
        type: mongoose.Schema.Types.ObjectID,
        ref: 'Event'
    },
    group: {
        type: mongoose.Schema.Types.ObjectID,
        ref: 'Group'
    },
    date: Date
})

module.exports = mongoose.model("Notification", notificationSchema)