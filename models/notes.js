const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
    },
    body: {
        type: String,
        required: true
    },
    editDate: {
        type: Number
    },
    createDate: {
        type:Number,
        required: true
    },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sharedUsers: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]

});

module.exports = mongoose.model('Note', noteSchema)

