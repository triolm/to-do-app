const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
    },
    date: {
        type: String
    },
    author: { type: Schema.Types.ObjectId, ref: 'User' }

});

module.exports = mongoose.model('Note', noteSchema)